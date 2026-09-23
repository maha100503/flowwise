import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Wand2 } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'DateDiff', label: 'Date Difference' },
  { value: 'Ratio', label: 'Ratio / Division' },
  { value: 'Aggregate', label: 'Group Aggregate' },
  { value: 'BinNumeric', label: 'Bin Numeric' },
  { value: 'Interaction', label: 'Column Interaction' },
  { value: 'Formula', label: 'Custom Formula' },
  { value: 'AutoFeatures', label: 'Auto Features' },
];

export const FeatureEngineerNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const config = data.config || {};
  const operation = config.operation || 'AutoFeatures';

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { config: { ...config, [key]: value } });
  };

  return (
    <BaseNode
      id={id}
      label={data.label}
      icon={Wand2}
      selected={selected}
      accentColor="from-violet-400 to-fuchsia-500"
      glowColor="bg-violet-500/20"
      className="border-violet-500/20"
      outputColor="bg-violet-400"
      inputColor="bg-violet-400"
      badge="FEAT"
    >
      <div>
        <Label>Operation</Label>
        <Select value={operation} onChange={(e) => updateConfig('operation', e.target.value)}>
          {OPERATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      {['DateDiff', 'Interaction'].includes(operation) && (
        <>
          <div>
            <Label>Column A</Label>
            <Input value={config.col_a || ''} onChange={(e) => updateConfig('col_a', e.target.value)} placeholder="col_a" />
          </div>
          <div>
            <Label>Column B</Label>
            <Input value={config.col_b || ''} onChange={(e) => updateConfig('col_b', e.target.value)} placeholder="col_b" />
          </div>
        </>
      )}

      {operation === 'DateDiff' && (
        <div>
          <Label>Unit</Label>
          <Select value={config.unit || 'days'} onChange={(e) => updateConfig('unit', e.target.value)}>
            <option value="days">Days</option>
            <option value="hours">Hours</option>
            <option value="seconds">Seconds</option>
          </Select>
        </div>
      )}

      {operation === 'Ratio' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Numerator</Label>
            <Input value={config.numerator || ''} onChange={(e) => updateConfig('numerator', e.target.value)} placeholder="col" />
          </div>
          <div className="flex-1">
            <Label>Denominator</Label>
            <Input value={config.denominator || ''} onChange={(e) => updateConfig('denominator', e.target.value)} placeholder="col" />
          </div>
        </div>
      )}

      {operation === 'Aggregate' && (
        <>
          <div>
            <Label>Group By</Label>
            <Input value={config.group_by || ''} onChange={(e) => updateConfig('group_by', e.target.value)} placeholder="column" />
          </div>
          <div>
            <Label>Aggregate Column</Label>
            <Input value={config.agg_column || ''} onChange={(e) => updateConfig('agg_column', e.target.value)} placeholder="column" />
          </div>
          <div>
            <Label>Function</Label>
            <Select value={config.agg_func || 'mean'} onChange={(e) => updateConfig('agg_func', e.target.value)}>
              {['mean', 'sum', 'count', 'min', 'max'].map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
        </>
      )}

      {operation === 'BinNumeric' && (
        <>
          <div>
            <Label>Column</Label>
            <Input value={config.column || ''} onChange={(e) => updateConfig('column', e.target.value)} placeholder="column" />
          </div>
          <div>
            <Label>Bins</Label>
            <Input type="number" value={config.bins || 5} onChange={(e) => updateConfig('bins', e.target.value)} />
          </div>
          <div>
            <Label>Labels (comma-sep, optional)</Label>
            <Input value={config.labels || ''} onChange={(e) => updateConfig('labels', e.target.value)} placeholder="low,med,high" />
          </div>
        </>
      )}

      {operation === 'Interaction' && (
        <div>
          <Label>Mode</Label>
          <Select value={config.mode || 'multiply'} onChange={(e) => updateConfig('mode', e.target.value)}>
            <option value="multiply">Multiply</option>
            <option value="add">Add</option>
            <option value="concat">Concatenate</option>
          </Select>
        </div>
      )}

      {operation === 'Formula' && (
        <div>
          <Label>Formula</Label>
          <Input value={config.formula || ''} onChange={(e) => updateConfig('formula', e.target.value)} placeholder="col_a * col_b + col_c" />
        </div>
      )}

      {['DateDiff', 'Ratio', 'BinNumeric', 'Interaction', 'Formula'].includes(operation) && (
        <div>
          <Label>New Column Name</Label>
          <Input value={config.new_column || ''} onChange={(e) => updateConfig('new_column', e.target.value)} placeholder="new_feature" />
        </div>
      )}

      <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
        <span className="font-mono">feature engineering</span>
        <span className="text-violet-400 font-bold">● Ready</span>
      </div>
    </BaseNode>
  );
};
