import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { BarChart3 } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'group_by', label: 'Group By' },
  { value: 'unique', label: 'Unique Values' },
  { value: 'sort', label: 'Sort' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'first_n', label: 'First N Items' },
  { value: 'last_n', label: 'Last N Items' },
  { value: 'stats', label: 'Full Statistics' },
];

export const AggregatorNode: React.FC<NodeProps<CustomNode>> = (props) => {
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
      icon={BarChart3}
      accentColor="from-pink-400 to-rose-500"
      glowColor="bg-pink-500/20"
      badge="AGGREGATE"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Operation</Label>
          <Select
            value={config.operation || 'count'}
            onChange={(e) => updateConfig('operation', e.target.value)}
          >
            {OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Select>
        </div>

        {['sum', 'average', 'min', 'max', 'group_by', 'unique', 'sort'].includes(config.operation) && (
          <div>
            <Label className={theme.textMuted}>Field / Key Path</Label>
            <Input
              value={config.field || ''}
              onChange={(e) => updateConfig('field', e.target.value)}
              placeholder="price, user.age, items[].cost"
              className="font-mono text-[11px]"
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              Dot notation for nested fields
            </p>
          </div>
        )}

        {(config.operation === 'first_n' || config.operation === 'last_n') && (
          <div>
            <Label className={theme.textMuted}>Count (N)</Label>
            <Input
              type="number"
              value={config.count || 5}
              onChange={(e) => updateConfig('count', parseInt(e.target.value) || 5)}
              min={1}
            />
          </div>
        )}

        {config.operation === 'sort' && (
          <div>
            <Label className={theme.textMuted}>Sort Order</Label>
            <Select
              value={config.order || 'asc'}
              onChange={(e) => updateConfig('order', e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </div>
        )}

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Expects:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>Input: array of objects or values</div>
            <div>Stats: count, sum, avg, min, max, median</div>
            <div>Group By: groups items by field value</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
