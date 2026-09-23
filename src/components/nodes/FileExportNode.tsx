import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Download } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const FileExportNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
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
      icon={Download}
      selected={selected}
      accentColor="from-teal-400 to-emerald-500"
      glowColor="bg-teal-500/20"
      className="border-teal-500/20"
      outputColor="bg-teal-400"
      inputColor="bg-teal-400"
      badge="SAVE"
    >
      <div>
        <Label>Filename</Label>
        <Input
          value={config.filename || 'output'}
          onChange={(e) => updateConfig('filename', e.target.value)}
          placeholder="output"
        />
      </div>

      <div>
        <Label>Format</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { v: 'csv', l: 'CSV' },
            { v: 'excel', l: 'Excel' },
            { v: 'json', l: 'JSON' },
            { v: 'joblib', l: 'Joblib' },
          ].map(t => (
            <button
              key={t.v}
              onClick={() => updateConfig('format', t.v)}
              className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                t.v === (config.format || 'csv')
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('rounded-lg p-2 text-[10px] space-y-1', 'bg-teal-500/5 border border-teal-500/10')}>
        <div className="text-teal-300 font-bold">
          {config.format === 'joblib' ? 'Saves trained model' : 'Saves data rows'}
        </div>
        <div className={theme.textMuted}>
          → server/exports/{config.filename || 'output'}.{config.format || 'csv'}
        </div>
      </div>

      <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
        <span className="font-mono">file export</span>
        <span className="text-teal-400 font-bold">● Ready</span>
      </div>
    </BaseNode>
  );
};
