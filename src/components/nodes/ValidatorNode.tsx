import React from 'react';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Textarea, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const VALIDATION_TYPES = [
  { value: 'json_schema', label: 'JSON Schema' },
  { value: 'type_check', label: 'Type Check' },
  { value: 'required_fields', label: 'Required Fields' },
  { value: 'range_check', label: 'Range Check' },
  { value: 'pattern_match', label: 'Pattern Match' },
  { value: 'email', label: 'Email Validation' },
  { value: 'url', label: 'URL Validation' },
  { value: 'custom', label: 'Custom Expression' },
];

export const ValidatorNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data, selected } = props;

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
      icon={CheckCircle}
      accentColor="from-green-400 to-emerald-600"
      glowColor="bg-green-500/20"
      badge="VALIDATE"
      outputs={false}
      extraHandles={
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="valid"
            className="!w-3 !h-3 !border-2 !bg-emerald-400 !border-slate-900 !shadow-lg"
            style={{ top: '40%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="invalid"
            className="!w-3 !h-3 !border-2 !bg-red-400 !border-slate-900 !shadow-lg"
            style={{ top: '60%' }}
          />
          <div className="absolute right-[-60px] text-[8px] font-bold" style={{ top: '37%' }}>
            <span className="text-emerald-400">✓ Valid</span>
          </div>
          <div className="absolute right-[-66px] text-[8px] font-bold" style={{ top: '57%' }}>
            <span className="text-red-400">✗ Invalid</span>
          </div>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Validation Type</Label>
          <Select
            value={config.validationType || 'json_schema'}
            onChange={(e) => updateConfig('validationType', e.target.value)}
          >
            {VALIDATION_TYPES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </Select>
        </div>

        {config.validationType === 'json_schema' && (
          <div>
            <Label className={theme.textMuted}>JSON Schema</Label>
            <Textarea
              value={config.schema || ''}
              onChange={(e) => updateConfig('schema', e.target.value)}
              placeholder={'{\n  "type": "object",\n  "required": ["name", "email"],\n  "properties": {\n    "name": {"type": "string"},\n    "email": {"type": "string", "format": "email"}\n  }\n}'}
              rows={6}
              className="font-mono text-[10px]"
            />
          </div>
        )}

        {config.validationType === 'required_fields' && (
          <div>
            <Label className={theme.textMuted}>Required Fields (comma-separated)</Label>
            <Input
              value={config.requiredFields || ''}
              onChange={(e) => updateConfig('requiredFields', e.target.value)}
              placeholder="name, email, age"
            />
          </div>
        )}

        {config.validationType === 'type_check' && (
          <div>
            <Label className={theme.textMuted}>Expected Type</Label>
            <Select
              value={config.expectedType || 'object'}
              onChange={(e) => updateConfig('expectedType', e.target.value)}
            >
              {['string', 'number', 'boolean', 'object', 'array', 'null'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        )}

        {config.validationType === 'range_check' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className={theme.textMuted}>Min</Label>
              <Input
                type="number"
                value={config.min ?? ''}
                onChange={(e) => updateConfig('min', e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label className={theme.textMuted}>Max</Label>
              <Input
                type="number"
                value={config.max ?? ''}
                onChange={(e) => updateConfig('max', e.target.value ? Number(e.target.value) : '')}
                placeholder="100"
              />
            </div>
          </div>
        )}

        {config.validationType === 'pattern_match' && (
          <div>
            <Label className={theme.textMuted}>Regex Pattern</Label>
            <Input
              value={config.pattern || ''}
              onChange={(e) => updateConfig('pattern', e.target.value)}
              placeholder="^[A-Z]{2}\\d{6}$"
              className="font-mono text-[11px]"
            />
          </div>
        )}

        {config.validationType === 'custom' && (
          <div>
            <Label className={theme.textMuted}>Expression</Label>
            <Textarea
              value={config.expression || ''}
              onChange={(e) => updateConfig('expression', e.target.value)}
              placeholder="len(data.get('items', [])) > 0 and data.get('total') >= 0"
              rows={3}
              className="font-mono text-[10px]"
            />
          </div>
        )}

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Branching:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div className="text-emerald-400">✓ Valid → right-top handle</div>
            <div className="text-red-400">✗ Invalid → right-bottom handle</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
