import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { HardDrive } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'get', label: 'Get Value' },
  { value: 'set', label: 'Set Value' },
  { value: 'delete', label: 'Delete Key' },
  { value: 'clear', label: 'Clear All' },
  { value: 'has', label: 'Has Key (Boolean)' },
  { value: 'keys', label: 'List All Keys' },
];

export const CacheNode: React.FC<NodeProps<CustomNode>> = (props) => {
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
      icon={HardDrive}
      accentColor="from-amber-400 to-yellow-500"
      glowColor="bg-amber-500/20"
      badge="CACHE"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Operation</Label>
          <Select
            value={config.operation || 'get'}
            onChange={(e) => updateConfig('operation', e.target.value)}
          >
            {OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Select>
        </div>

        {config.operation !== 'clear' && config.operation !== 'keys' && (
          <div>
            <Label className={theme.textMuted}>Key</Label>
            <Input
              value={config.key || ''}
              onChange={(e) => updateConfig('key', e.target.value)}
              placeholder="cache_key or {{dynamic_key}}"
              className="font-mono text-[11px]"
            />
          </div>
        )}

        {config.operation === 'set' && (
          <>
            <div>
              <Label className={theme.textMuted}>Value</Label>
              <Input
                value={config.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                placeholder="Value or {{input}} for upstream data"
              />
              <p className={cn('text-[9px] mt-1', theme.textMuted)}>
                Leave empty to cache upstream input data
              </p>
            </div>

            <div>
              <Label className={theme.textMuted}>TTL (seconds)</Label>
              <Input
                type="number"
                value={config.ttl || ''}
                onChange={(e) => updateConfig('ttl', parseInt(e.target.value) || '')}
                placeholder="0 = no expiry"
                min={0}
              />
            </div>
          </>
        )}

        <div>
          <Label className={theme.textMuted}>Namespace</Label>
          <Input
            value={config.namespace || ''}
            onChange={(e) => updateConfig('namespace', e.target.value)}
            placeholder="default"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Isolate cache entries by namespace
          </p>
        </div>

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Cache Info:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>In-memory cache per server instance</div>
            <div>TTL = 0 means no auto-expiry</div>
            <div>Survives across workflow executions</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
