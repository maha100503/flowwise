import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Cloud, Lock } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const IntegrationNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
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
      icon={Cloud}
      selected={selected}
      accentColor="from-sky-400 to-blue-500"
      glowColor="bg-sky-500/20"
      className="border-sky-500/20"
      outputColor="bg-sky-400"
      inputColor="bg-sky-400"
      badge="API"
    >
      <div className={cn('flex items-center gap-1.5 p-2 rounded-lg border', theme.inputBg, theme.inputBorder)}>
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className={cn('text-[9px] font-bold uppercase tracking-widest ml-auto', theme.nodeTextMuted)}>Google</span>
      </div>

      <div>
        <Label>Service</Label>
        <Select
          value={config.service || 'Sheets'}
          onChange={(e) => updateConfig('service', e.target.value)}
        >
          <option>Sheets</option>
          <option>Drive</option>
          <option>Gmail</option>
        </Select>
      </div>

      <div>
        <Label>Credentials</Label>
        <div className="relative">
          <Input
            type="password"
            value={config.credentials || ''}
            onChange={(e) => updateConfig('credentials', e.target.value)}
            placeholder="Enter API credentials"
          />
          <Lock className={cn('absolute right-3 top-2.5', theme.textMuted)} size={14} />
        </div>
      </div>

      <div>
        <Label>Operation</Label>
        <Select
          value={config.operation || 'Read Rows'}
          onChange={(e) => updateConfig('operation', e.target.value)}
        >
          <option>Read Rows</option>
          <option>Append Row</option>
          <option>Update Cell</option>
        </Select>
      </div>
    </BaseNode>
  );
};
