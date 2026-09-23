import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Eraser } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'DropNulls', label: 'Drop Nulls' },
  { value: 'ParseDates', label: 'Parse Dates' },
  { value: 'CoerceTypes', label: 'Coerce Types' },
  { value: 'NormalizeText', label: 'Normalize Text' },
  { value: 'DropDuplicates', label: 'Drop Duplicates' },
  { value: 'RenameColumns', label: 'Rename Columns' },
  { value: 'FilterRows', label: 'Filter Rows' },
];

export const DataCleanerNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const config = data.config || {};
  const operation = config.operation || 'DropNulls';

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { config: { ...config, [key]: value } });
  };

  return (
    <BaseNode
      id={id}
      label={data.label}
      icon={Eraser}
      selected={selected}
      accentColor="from-yellow-400 to-amber-500"
      glowColor="bg-yellow-500/20"
      className="border-yellow-500/20"
      outputColor="bg-yellow-400"
      inputColor="bg-yellow-400"
      badge="CLEAN"
    >
      <div>
        <Label>Operation</Label>
        <Select value={operation} onChange={(e) => updateConfig('operation', e.target.value)}>
          {OPERATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      {['DropNulls', 'ParseDates', 'NormalizeText', 'DropDuplicates'].includes(operation) && (
        <div>
          <Label>Columns (comma-sep, blank=all)</Label>
          <Input
            value={config.columns || ''}
            onChange={(e) => updateConfig('columns', e.target.value)}
            placeholder="col1, col2"
          />
        </div>
      )}

      {operation === 'ParseDates' && (
        <div>
          <Label>Date Format (blank=auto)</Label>
          <Input
            value={config.date_format || ''}
            onChange={(e) => updateConfig('date_format', e.target.value)}
            placeholder="%Y-%m-%d"
          />
        </div>
      )}

      {operation === 'NormalizeText' && (
        <div>
          <Label>Mode</Label>
          <Select value={config.mode || 'lowercase'} onChange={(e) => updateConfig('mode', e.target.value)}>
            <option value="lowercase">Lowercase</option>
            <option value="uppercase">Uppercase</option>
            <option value="title">Title Case</option>
            <option value="strip">Strip Only</option>
          </Select>
        </div>
      )}

      {operation === 'CoerceTypes' && (
        <div>
          <Label>Type Map (blank=auto numeric)</Label>
          <Input
            value={config.type_map || ''}
            onChange={(e) => updateConfig('type_map', e.target.value)}
            placeholder="col1:float, col2:int"
          />
        </div>
      )}

      {operation === 'RenameColumns' && (
        <div>
          <Label>Rename Map</Label>
          <Input
            value={config.rename_map || ''}
            onChange={(e) => updateConfig('rename_map', e.target.value)}
            placeholder="old_name:new_name, ..."
          />
        </div>
      )}

      {operation === 'FilterRows' && (
        <>
          <div>
            <Label>Column</Label>
            <Input value={config.filter_column || ''} onChange={(e) => updateConfig('filter_column', e.target.value)} placeholder="column_name" />
          </div>
          <div>
            <Label>Operator</Label>
            <Select value={config.filter_op || 'equals'} onChange={(e) => updateConfig('filter_op', e.target.value)}>
              {['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'not_null'].map(o => (
                <option key={o} value={o}>{o.replace('_', ' ')}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Value</Label>
            <Input value={config.filter_value || ''} onChange={(e) => updateConfig('filter_value', e.target.value)} placeholder="value" />
          </div>
        </>
      )}

      <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
        <span className="font-mono">data cleaning</span>
        <span className="text-yellow-400 font-bold">● Ready</span>
      </div>
    </BaseNode>
  );
};
