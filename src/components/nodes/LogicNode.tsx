import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Repeat, Clock, ShieldAlert } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea } from '../ui';
import { CustomNode } from '../../types';

export const LogicNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const { updateNodeData } = useReactFlow();
  const isWait = data.subType === 'Wait';
  const isLoop = data.subType === 'Loop';
  const isTry = data.subType?.includes('Try');

  const Icon = isWait ? Clock : isLoop ? Repeat : ShieldAlert;

  const config = data.config || {};
  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { config: { ...config, [key]: value } });
  };

  return (
    <BaseNode
      id={id}
      label={data.label}
      icon={Icon}
      selected={selected}
      accentColor="from-blue-400 to-indigo-500"
      glowColor="bg-blue-500/20"
      className="border-blue-500/20"
      outputColor="bg-blue-400"
      inputColor="bg-blue-400"
      badge="FLOW"
    >
      {isWait && (
        <div>
          <Label>Duration (ms)</Label>
          <Input
            type="number"
            value={config.duration || '1000'}
            onChange={(e) => updateConfig('duration', e.target.value)}
          />
        </div>
      )}

      {isLoop && (
        <div>
          <Label>Max Iterations</Label>
          <Input
            type="number"
            value={config.maxIterations || '10'}
            onChange={(e) => updateConfig('maxIterations', e.target.value)}
          />
        </div>
      )}

      {isTry && (
        <div>
          <Label>Error Criteria</Label>
          <Textarea
            placeholder="e.g. status === 500"
            className="min-h-[60px]"
            value={config.errorCriteria || ''}
            onChange={(e) => updateConfig('errorCriteria', e.target.value)}
          />
        </div>
      )}
    </BaseNode>
  );
};
