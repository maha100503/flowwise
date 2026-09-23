import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Braces } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Textarea, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'query', label: 'Query (JSONPath)' },
  { value: 'flatten', label: 'Flatten Object' },
  { value: 'unflatten', label: 'Unflatten Object' },
  { value: 'merge', label: 'Deep Merge' },
  { value: 'diff', label: 'Compare / Diff' },
  { value: 'pick', label: 'Pick Keys' },
  { value: 'omit', label: 'Omit Keys' },
  { value: 'sort_keys', label: 'Sort Keys' },
  { value: 'to_csv', label: 'JSON → CSV' },
  { value: 'from_csv', label: 'CSV → JSON' },
];

export const JsonTransformNode: React.FC<NodeProps<CustomNode>> = (props) => {
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
      icon={Braces}
      accentColor="from-violet-400 to-indigo-500"
      glowColor="bg-violet-500/20"
      badge="JSON"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Operation</Label>
          <Select
            value={config.operation || 'query'}
            onChange={(e) => updateConfig('operation', e.target.value)}
          >
            {OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Select>
        </div>

        {config.operation === 'query' && (
          <div>
            <Label className={theme.textMuted}>JSONPath Expression</Label>
            <Input
              value={config.expression || ''}
              onChange={(e) => updateConfig('expression', e.target.value)}
              placeholder="$.store.book[0].title"
              className="font-mono text-[11px]"
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              Use $ for root, .key for props, [n] for arrays
            </p>
          </div>
        )}

        {(config.operation === 'pick' || config.operation === 'omit') && (
          <div>
            <Label className={theme.textMuted}>Keys (comma-separated)</Label>
            <Input
              value={config.keys || ''}
              onChange={(e) => updateConfig('keys', e.target.value)}
              placeholder="name, email, age"
            />
          </div>
        )}

        <div>
          <Label className={theme.textMuted}>Input Data (JSON)</Label>
          <Textarea
            value={config.input || ''}
            onChange={(e) => updateConfig('input', e.target.value)}
            placeholder='Leave empty to use upstream data, or paste JSON here'
            rows={4}
            className="font-mono text-[10px]"
          />
        </div>

        {(config.operation === 'merge' || config.operation === 'diff') && (
          <div>
            <Label className={theme.textMuted}>Second Object (JSON)</Label>
            <Textarea
              value={config.secondInput || ''}
              onChange={(e) => updateConfig('secondInput', e.target.value)}
              placeholder='{"key": "value"}'
              rows={3}
              className="font-mono text-[10px]"
            />
          </div>
        )}

        {config.operation === 'flatten' && (
          <div>
            <Label className={theme.textMuted}>Separator</Label>
            <Input
              value={config.separator || '.'}
              onChange={(e) => updateConfig('separator', e.target.value)}
              placeholder="."
            />
          </div>
        )}

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Examples:</div>
          <div className={cn('space-y-0.5 font-mono', theme.textSecondary)}>
            <div>$.users[*].name → all user names</div>
            <div>Flatten: {'{a:{b:1}}'} → {'{a.b: 1}'}</div>
            <div>Pick: select only specific keys</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
