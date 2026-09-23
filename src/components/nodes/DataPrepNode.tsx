import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Scissors } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
    'TrainTestSplit',
    'Normalize',
    'Standardize',
    'Encode',
    'FillMissing',
    'FeatureSelect',
];

export const DataPrepNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const operation = data.subType || config.operation || 'TrainTestSplit';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Scissors}
            selected={selected}
            accentColor="from-amber-400 to-orange-500"
            glowColor="bg-amber-500/20"
            className="border-amber-500/20"
            outputColor="bg-amber-400"
            inputColor="bg-amber-400"
            badge="PREP"
        >
            <div>
                <Label>Operation</Label>
                <Select
                    value={operation}
                    onChange={(e) => updateNodeData(id, { subType: e.target.value, config: { ...config, operation: e.target.value } })}
                >
                    {OPERATIONS.map(op => (
                        <option key={op} value={op}>{op.replace(/([A-Z])/g, ' $1').trim()}</option>
                    ))}
                </Select>
            </div>

            {operation === 'TrainTestSplit' && (
                <div>
                    <Label>Test Size</Label>
                    <Input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="0.95"
                        value={config.test_size || 0.2}
                        onChange={(e) => updateConfig('test_size', e.target.value)}
                        placeholder="0.2"
                    />
                </div>
            )}

            {operation === 'FillMissing' && (
                <div>
                    <Label>Strategy</Label>
                    <Select value={config.strategy || 'mean'} onChange={(e) => updateConfig('strategy', e.target.value)}>
                        <option value="mean">Mean</option>
                        <option value="median">Median</option>
                        <option value="zero">Zero</option>
                        <option value="ffill">Forward Fill</option>
                    </Select>
                </div>
            )}

            {operation === 'FeatureSelect' && (
                <div>
                    <Label>Top K Features</Label>
                    <Input
                        type="number"
                        value={config.k || 5}
                        onChange={(e) => updateConfig('k', e.target.value)}
                        placeholder="5"
                    />
                </div>
            )}

            {operation === 'Encode' && (
                <div>
                    <Label>Target Column (for ML)</Label>
                    <Input
                        type="text"
                        value={config.target_column || ''}
                        onChange={(e) => updateConfig('target_column', e.target.value)}
                        placeholder="e.g. DOCUMENT_TYPE"
                    />
                </div>
            )}

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">sklearn.preprocessing</span>
                <span className="text-amber-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
