import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Play } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const PredictNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
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
      icon={Play}
      selected={selected}
      accentColor="from-lime-400 to-green-500"
      glowColor="bg-lime-500/20"
      className="border-lime-500/20"
      outputColor="bg-lime-400"
      inputColor="bg-lime-400"
      badge="PRED"
    >
      <div>
        <Label>Output Column Name</Label>
        <Input
          value={config.output_column || 'prediction'}
          onChange={(e) => updateConfig('output_column', e.target.value)}
          placeholder="prediction"
        />
      </div>

      <div>
        <Label>Include Probabilities</Label>
        <div className="flex gap-1.5">
          {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(t => (
            <button
              key={String(t.v)}
              onClick={() => updateConfig('include_proba', t.v)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                t.v === (config.include_proba !== false)
                  ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30'
                  : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('rounded-lg p-2 text-[10px] space-y-1', 'bg-lime-500/5 border border-lime-500/10')}>
        <div className="text-lime-300 font-bold">Inputs needed:</div>
        <div className={theme.textMuted}>① Trained model ② New data rows</div>
      </div>

      <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
        <span className="font-mono">model.predict(X)</span>
        <span className="text-lime-400 font-bold">● Ready</span>
      </div>
    </BaseNode>
  );
};
