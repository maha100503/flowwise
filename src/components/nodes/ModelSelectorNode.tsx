import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Trophy } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const METRICS = [
  { value: 'accuracy', label: 'Accuracy' },
  { value: 'f1', label: 'F1 Score' },
  { value: 'precision', label: 'Precision' },
  { value: 'recall', label: 'Recall' },
  { value: 'r2', label: 'R²' },
  { value: 'mse', label: 'MSE' },
  { value: 'rmse', label: 'RMSE' },
  { value: 'mae', label: 'MAE' },
];

export const ModelSelectorNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
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
      icon={Trophy}
      selected={selected}
      accentColor="from-amber-400 to-yellow-500"
      glowColor="bg-amber-500/20"
      className="border-amber-500/20"
      outputColor="bg-amber-400"
      inputColor="bg-amber-400"
      badge="BEST"
    >
      <div>
        <Label>Compare By</Label>
        <Select value={config.metric || 'accuracy'} onChange={(e) => updateConfig('metric', e.target.value)}>
          {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </div>

      <div>
        <Label>Direction</Label>
        <div className="flex gap-1.5">
          {[{ v: 'max', l: '↑ Higher Better' }, { v: 'min', l: '↓ Lower Better' }].map(t => (
            <button
              key={t.v}
              onClick={() => updateConfig('mode', t.v)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                t.v === (config.mode || 'max')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('rounded-lg p-2 text-[10px] space-y-1', 'bg-amber-500/5 border border-amber-500/10')}>
        <div className="text-amber-300 font-bold">Outputs:</div>
        <div className={theme.textMuted}>Best model + comparison table</div>
      </div>

      <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
        <span className="font-mono">model comparison</span>
        <span className="text-amber-400 font-bold">● Ready</span>
      </div>
    </BaseNode>
  );
};
