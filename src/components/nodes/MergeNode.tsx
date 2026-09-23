import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Merge } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const MergeNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
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
      icon={Merge}
      selected={selected}
      accentColor="from-cyan-400 to-blue-500"
      glowColor="bg-cyan-500/20"
      className="border-cyan-500/20"
      outputColor="bg-cyan-400"
      inputColor="bg-cyan-400"
      badge="JOIN"
    >
      <div>
        <Label>Join Type</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {['left', 'right', 'inner', 'outer'].map(t => (
            <button
              key={t}
              onClick={() => updateConfig('how', t)}
              className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all capitalize ${
                t === (config.how || 'left')
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Left Key Column</Label>
        <Input
          value={config.left_on || ''}
          onChange={(e) => updateConfig('left_on', e.target.value)}
          placeholder="e.g. customer_name"
        />
      </div>

      <div>
        <Label>Right Key Column (blank=same)</Label>
        <Input
          value={config.right_on || ''}
          onChange={(e) => updateConfig('right_on', e.target.value)}
          placeholder="same as left key"
        />
      </div>

      <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
        <span className="font-mono">2 inputs → 1 output</span>
        <span className="text-cyan-400 font-bold">● Ready</span>
      </div>
    </BaseNode>
  );
};
