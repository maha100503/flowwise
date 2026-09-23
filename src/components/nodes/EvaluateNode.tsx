import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { BarChart3 } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const EvaluateNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const metric = data.subType || config.metric || 'Auto';

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={BarChart3}
            selected={selected}
            accentColor="from-emerald-400 to-teal-500"
            glowColor="bg-emerald-500/20"
            className="border-emerald-500/20"
            outputColor="bg-emerald-400"
            inputColor="bg-emerald-400"
            badge="EVAL"
        >
            <div>
                <Label>Metric Type</Label>
                <Select
                    value={metric}
                    onChange={(e) => updateNodeData(id, { subType: e.target.value, config: { ...config, metric: e.target.value } })}
                >
                    <option value="Auto">Auto Detect</option>
                    <option value="Classification">Classification</option>
                    <option value="Regression">Regression</option>
                </Select>
            </div>

            {(metric === 'Classification' || metric === 'Auto') && (
                <div>
                    <Label>Average Method</Label>
                    <Select
                        value={config.average || 'weighted'}
                        onChange={(e) => updateNodeData(id, { config: { ...config, average: e.target.value } })}
                    >
                        <option value="weighted">Weighted</option>
                        <option value="macro">Macro</option>
                        <option value="micro">Micro</option>
                    </Select>
                </div>
            )}

            <div className={cn('p-2 rounded-lg text-[10px] font-mono', theme.inputBg, theme.inputText, 'border', theme.inputBorder)}>
                <div className="font-bold text-emerald-400 mb-1">Outputs:</div>
                {metric === 'Regression' ? (
                    <span>MSE, RMSE, MAE, R²</span>
                ) : metric === 'Classification' ? (
                    <span>Accuracy, Precision, Recall, F1</span>
                ) : (
                    <span>Auto: detects task type</span>
                )}
            </div>

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">sklearn.metrics</span>
                <span className="text-emerald-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
