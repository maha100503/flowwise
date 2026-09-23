import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Regex } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'match', label: 'Match' },
  { value: 'match_all', label: 'Match All' },
  { value: 'replace', label: 'Replace' },
  { value: 'split', label: 'Split' },
  { value: 'extract', label: 'Extract Groups' },
  { value: 'test', label: 'Test (Boolean)' },
];

export const RegexNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;

  const config = data.config || {};

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, {
      ...data,
      config: { ...config, [key]: value },
    });
  };

  return (
    <BaseNode
      {...props}
      icon={Regex}
      accentColor="from-teal-400 to-cyan-500"
      glowColor="bg-teal-500/20"
      badge="REGEX"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Operation</Label>
          <Select
            value={config.operation || 'match'}
            onChange={(e) => updateConfig('operation', e.target.value)}
          >
            {OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label className={theme.textMuted}>Pattern</Label>
          <Input
            value={config.pattern || ''}
            onChange={(e) => updateConfig('pattern', e.target.value)}
            placeholder="\\d{3}-\\d{3}-\\d{4}"
            className="font-mono text-[11px]"
          />
        </div>

        <div className="flex gap-2">
          {['i', 'g', 'm', 's'].map((flag) => (
            <label key={flag} className={cn('flex items-center gap-1 text-[10px] cursor-pointer', theme.textSecondary)}>
              <input
                type="checkbox"
                checked={(config.flags || '').includes(flag)}
                onChange={(e) => {
                  const flags = config.flags || '';
                  updateConfig('flags', e.target.checked ? flags + flag : flags.replace(flag, ''));
                }}
                className="w-3 h-3 rounded accent-teal-500"
              />
              {flag.toUpperCase()}
            </label>
          ))}
        </div>

        <div>
          <Label className={theme.textMuted}>Input Text</Label>
          <Textarea
            value={config.text || ''}
            onChange={(e) => updateConfig('text', e.target.value)}
            placeholder="Text to process or use {{input}}"
            rows={3}
          />
        </div>

        {config.operation === 'replace' && (
          <div>
            <Label className={theme.textMuted}>Replacement</Label>
            <Input
              value={config.replacement || ''}
              onChange={(e) => updateConfig('replacement', e.target.value)}
              placeholder="Replacement text (supports \\1 groups)"
              className="font-mono text-[11px]"
            />
          </div>
        )}

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Tips:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>Use {'{{input}}'} for upstream data</div>
            <div>Extract Groups captures named groups</div>
            <div>Test returns true/false match result</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
