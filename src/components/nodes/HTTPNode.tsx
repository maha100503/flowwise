import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Globe, ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2 } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

interface HTTPMethodConfig {
  name: string;
  color: string;
  icon: typeof ArrowUpRight;
}

const HTTP_METHODS: Record<string, HTTPMethodConfig> = {
  GET: { name: 'GET', color: 'from-green-400 to-emerald-500', icon: ArrowDownLeft },
  POST: { name: 'POST', color: 'from-blue-400 to-indigo-500', icon: ArrowUpRight },
  PUT: { name: 'PUT', color: 'from-amber-400 to-orange-500', icon: RefreshCw },
  DELETE: { name: 'DELETE', color: 'from-red-400 to-rose-500', icon: Trash2 },
  PATCH: { name: 'PATCH', color: 'from-purple-400 to-violet-500', icon: RefreshCw },
};

export const HTTPNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  
  const method = data.subType || 'GET';
  const config = data.config || {};
  const methodConfig = HTTP_METHODS[method] || HTTP_METHODS.GET;

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, {
      ...data,
      config: { ...config, [key]: value },
    });
  };

  const updateMethod = (newMethod: string) => {
    updateNodeData(id, {
      ...data,
      subType: newMethod,
      label: `HTTP ${newMethod}`,
    });
  };

  const MethodIcon = methodConfig.icon;

  return (
    <BaseNode
      {...props}
      icon={Globe}
      accentColor={methodConfig.color}
      glowColor="bg-blue-500/20"
      borderColor="border-blue-500/20"
      handleColor="bg-blue-400"
      badge={method}
    >
      <div className="space-y-3">
        {/* Method Select */}
        <div>
          <Label className={theme.textMuted}>Method</Label>
          <Select
            value={method}
            onChange={(e) => updateMethod(e.target.value)}
          >
            {Object.keys(HTTP_METHODS).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>

        {/* URL Input */}
        <div>
          <Label className={theme.textMuted}>URL</Label>
          <Input
            value={config.url || ''}
            onChange={(e) => updateConfig('url', e.target.value)}
            placeholder="https://api.example.com/endpoint"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Use {'{{variable}}'} for dynamic values
          </p>
        </div>

        {/* Headers */}
        <div>
          <Label className={theme.textMuted}>Headers (JSON)</Label>
          <Textarea
            value={typeof config.headers === 'object' ? JSON.stringify(config.headers, null, 2) : config.headers || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateConfig('headers', parsed);
              } catch {
                updateConfig('headers', e.target.value);
              }
            }}
            placeholder='{"Authorization": "Bearer {{token}}"}'
            rows={2}
            className="font-mono text-[10px]"
          />
        </div>

        {/* Body (for POST, PUT, PATCH) */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div>
            <Label className={theme.textMuted}>Body (JSON)</Label>
            <Textarea
              value={typeof config.body === 'object' ? JSON.stringify(config.body, null, 2) : config.body || ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateConfig('body', parsed);
                } catch {
                  updateConfig('body', e.target.value);
                }
              }}
              placeholder='{"key": "{{value}}"}'
              rows={3}
              className="font-mono text-[10px]"
            />
          </div>
        )}

        {/* Timeout */}
        <div>
          <Label className={theme.textMuted}>Timeout (seconds)</Label>
          <Input
            type="number"
            value={config.timeout || 30}
            onChange={(e) => updateConfig('timeout', parseInt(e.target.value) || 30)}
            min={1}
            max={300}
          />
        </div>
      </div>
    </BaseNode>
  );
};
