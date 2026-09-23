import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Brain, Sparkles, Cpu, Flame, Wind, Bot } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Textarea, Slider, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

interface ProviderConfig {
  name: string;
  icon: any;
  accent: string;
  glow: string;
  border: string;
  handleColor: string;
  badgeColor: string;
  models: { value: string; label: string }[];
}

const PROVIDERS: Record<string, ProviderConfig> = {
  OpenAI: {
    name: 'OpenAI',
    icon: Sparkles,
    accent: 'from-green-400 to-emerald-500',
    glow: 'bg-green-500/20',
    border: 'border-green-500/20',
    handleColor: 'bg-green-400',
    badgeColor: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'o1', label: 'o1' },
      { value: 'o1-mini', label: 'o1 Mini' },
      { value: 'o1-preview', label: 'o1 Preview' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  Claude: {
    name: 'Anthropic',
    icon: Brain,
    accent: 'from-amber-400 to-orange-500',
    glow: 'bg-amber-500/20',
    border: 'border-amber-500/20',
    handleColor: 'bg-amber-400',
    badgeColor: 'Claude',
    models: [
      { value: 'claude-4-opus', label: 'Claude 4 Opus' },
      { value: 'claude-4-sonnet', label: 'Claude 4 Sonnet' },
      { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus', label: 'Claude 3 Opus' },
      { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    ],
  },
  Gemini: {
    name: 'Google',
    icon: Cpu,
    accent: 'from-blue-400 to-indigo-500',
    glow: 'bg-blue-500/20',
    border: 'border-blue-500/20',
    handleColor: 'bg-blue-400',
    badgeColor: 'Gemini',
    models: [
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
    ],
  },
  Meta: {
    name: 'Meta',
    icon: Flame,
    accent: 'from-sky-400 to-blue-500',
    glow: 'bg-sky-500/20',
    border: 'border-sky-500/20',
    handleColor: 'bg-sky-400',
    badgeColor: 'Llama',
    models: [
      { value: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
      { value: 'llama-3.1-405b', label: 'Llama 3.1 405B' },
      { value: 'llama-3.1-70b', label: 'Llama 3.1 70B' },
      { value: 'llama-3.1-8b', label: 'Llama 3.1 8B' },
      { value: 'llama-3-70b', label: 'Llama 3 70B' },
      { value: 'llama-3-8b', label: 'Llama 3 8B' },
    ],
  },
  Mistral: {
    name: 'Mistral AI',
    icon: Wind,
    accent: 'from-orange-400 to-red-500',
    glow: 'bg-orange-500/20',
    border: 'border-orange-500/20',
    handleColor: 'bg-orange-400',
    badgeColor: 'Mistral',
    models: [
      { value: 'mistral-large', label: 'Mistral Large' },
      { value: 'mistral-medium', label: 'Mistral Medium' },
      { value: 'mistral-small', label: 'Mistral Small' },
      { value: 'mixtral-8x22b', label: 'Mixtral 8x22B' },
      { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
      { value: 'codestral', label: 'Codestral' },
    ],
  },
  Groq: {
    name: 'Groq',
    icon: Bot,
    accent: 'from-fuchsia-400 to-purple-500',
    glow: 'bg-fuchsia-500/20',
    border: 'border-fuchsia-500/20',
    handleColor: 'bg-fuchsia-400',
    badgeColor: 'Groq',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
  },
};

export const AINode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const providerKey = data.subType || 'OpenAI';
  const provider = PROVIDERS[providerKey] || PROVIDERS['OpenAI'];
  const Icon = provider.icon;
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();

  const config = data.config || {};
  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { config: { ...config, [key]: value } });
  };

  return (
    <BaseNode
      id={id}
      label={data.label}
      icon={Icon}
      selected={selected}
      accentColor={provider.accent}
      glowColor={provider.glow}
      className={provider.border}
      outputColor={provider.handleColor}
      inputColor={provider.handleColor}
      badge={provider.badgeColor}
    >
      {/* Provider badge */}
      <div className={cn('flex items-center gap-2 p-2 rounded-lg border', theme.inputBg, theme.inputBorder)}>
        <Icon size={12} className={theme.nodeTextMuted} />
        <span className={cn('text-[10px] font-bold uppercase tracking-widest', theme.nodeTextMuted)}>{provider.name}</span>
        <span className={cn('ml-auto text-[9px] font-mono', theme.textMuted)}>{provider.models.length} models</span>
      </div>

      <div>
        <Label>Model</Label>
        <Select
          value={config.model || provider.models[0]?.value}
          onChange={(e) => updateConfig('model', e.target.value)}
        >
          {provider.models.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>System Prompt</Label>
        <Textarea
          placeholder="You are a helpful assistant..."
          className="min-h-[60px]"
          value={config.systemPrompt || ''}
          onChange={(e) => updateConfig('systemPrompt', e.target.value)}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <Label className="mb-0">Temperature</Label>
          <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', theme.btnBg, theme.nodeTextMuted)}>
            {config.temperature !== undefined ? config.temperature : 0.7}
          </span>
        </div>
        <Slider
          min="0" max="2" step="0.1"
          value={config.temperature !== undefined ? config.temperature : 0.7}
          onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Max Tokens</Label>
          <Select
            value={config.maxTokens || "4096"}
            onChange={(e) => updateConfig('maxTokens', e.target.value)}
          >
            <option value="1024">1,024</option>
            <option value="2048">2,048</option>
            <option value="4096">4,096</option>
            <option value="8192">8,192</option>
            <option value="16384">16,384</option>
          </Select>
        </div>
        <div>
          <Label>Top P</Label>
          <Select
            value={config.topP || "1"}
            onChange={(e) => updateConfig('topP', e.target.value)}
          >
            <option value="0.5">0.5</option>
            <option value="0.7">0.7</option>
            <option value="0.9">0.9</option>
            <option value="1">1.0</option>
          </Select>
        </div>
      </div>
    </BaseNode>
  );
};
