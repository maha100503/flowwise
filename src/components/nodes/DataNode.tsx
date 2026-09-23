import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Filter, Table } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const DataNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const isFilter = data.subType === 'Filter';
  const Icon = isFilter ? Filter : Table;
  const { updateNodeData } = useReactFlow();
  const { theme } = useTheme();

  const config = data.config || {};
  const fields = config.fields || [{ key: '', value: '' }];

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { config: { ...config, [key]: value } });
  };

  const updateField = (index: number, fieldKey: string, fieldValue: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [fieldKey]: fieldValue };
    updateConfig('fields', newFields);
  };

  const addField = () => {
    updateConfig('fields', [...fields, { key: '', value: '' }]);
  };

  return (
    <BaseNode
      id={id}
      label={data.label}
      icon={Icon}
      selected={selected}
      accentColor="from-orange-400 to-amber-500"
      glowColor="bg-orange-500/20"
      className="border-orange-500/20"
      outputColor="bg-orange-400"
      inputColor="bg-orange-400"
      badge="DATA"
    >
      <div>
        <Label>{isFilter ? 'Filter Condition' : 'Fields to Map'}</Label>
        {isFilter ? (
          <Textarea
            placeholder="item.price > 100"
            className="min-h-[60px]"
            value={config.filterCondition || ''}
            onChange={(e) => updateConfig('filterCondition', e.target.value)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {fields.map((field: { key: string; value: string }, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Key"
                  className="h-8 text-xs"
                  value={field.key}
                  onChange={(e) => updateField(index, 'key', e.target.value)}
                />
                <Input
                  placeholder="Value"
                  className="h-8 text-xs"
                  value={field.value}
                  onChange={(e) => updateField(index, 'value', e.target.value)}
                />
              </div>
            ))}
            <button
              onClick={addField}
              className={cn('text-[10px] text-orange-400 hover:text-orange-300 font-bold uppercase tracking-widest text-left transition-colors')}
            >
              + Add Field
            </button>
          </div>
        )}
      </div>
    </BaseNode>
  );
};
