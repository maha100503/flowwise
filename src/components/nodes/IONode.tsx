import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { MessageSquare, Send } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select } from '../ui';
import { CustomNode } from '../../types';

export const IONode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const isInput = data.subType?.includes('Input');
  const Icon = isInput ? MessageSquare : Send;
  const { updateNodeData } = useReactFlow();

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
      accentColor={isInput ? 'from-emerald-400 to-green-500' : 'from-rose-400 to-pink-500'}
      glowColor={isInput ? 'bg-emerald-500/20' : 'bg-rose-500/20'}
      className={isInput ? 'border-emerald-500/20' : 'border-rose-500/20'}
      inputColor={isInput ? 'bg-emerald-400' : 'bg-rose-400'}
      outputColor={isInput ? 'bg-emerald-400' : 'bg-rose-400'}
      inputs={!isInput}
      outputs={isInput}
      badge={isInput ? 'IN' : 'OUT'}
    >
      <div>
        <Label>{isInput ? 'Placeholder' : 'Output Format'}</Label>
        {isInput ? (
          <Input
            placeholder="Type your message..."
            value={config.placeholder || ''}
            onChange={(e) => updateConfig('placeholder', e.target.value)}
          />
        ) : (
          <Select
            value={config.outputFormat || 'Plain Text'}
            onChange={(e) => updateConfig('outputFormat', e.target.value)}
          >
            <option>JSON</option>
            <option>Plain Text</option>
            <option>Markdown</option>
            <option>Raw</option>
          </Select>
        )}
      </div>

      {isInput && (
        <div>
          <Label>Default Value</Label>
          <Input
            placeholder="Hello world"
            value={config.defaultValue || config.text || ''}
            onChange={(e) => {
              // We'll store it as 'text' so the backend can use input_data.text directly if we send it
              updateConfig('text', e.target.value);
              updateConfig('defaultValue', e.target.value);
            }}
          />
        </div>
      )}
    </BaseNode>
  );
};
