import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const ALGORITHMS = [
    { value: 'Bagging', label: 'Bagging' },
    { value: 'AdaBoost', label: 'AdaBoost' },
    { value: 'GradientBoosting', label: 'Gradient Boosting' },
    { value: 'Stacking', label: 'Stacking' },
    { value: 'Voting', label: 'Voting' },
];

export const EnsembleNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const algorithm = data.subType || config.algorithm || 'Bagging';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Layers}
            selected={selected}
            accentColor="from-fuchsia-400 to-pink-500"
            glowColor="bg-fuchsia-500/20"
            className="border-fuchsia-500/20"
            outputColor="bg-fuchsia-400"
            inputColor="bg-fuchsia-400"
            badge="ENSEMBLE"
        >
            <div>
                <Label>Method</Label>
                <Select
                    value={algorithm}
                    onChange={(e) => updateNodeData(id, { subType: e.target.value, config: { ...config, algorithm: e.target.value } })}
                >
                    {ALGORITHMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </Select>
            </div>

            <div>
                <Label>Task</Label>
                <div className="flex gap-1.5">
                    {['classification', 'regression'].map(t => (
                        <button
                            key={t}
                            onClick={() => updateConfig('task', t)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all capitalize ${t === (config.task || 'classification')
                                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                                : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {['Bagging', 'AdaBoost', 'GradientBoosting'].includes(algorithm) && (
                <div>
                    <Label>Estimators</Label>
                    <Input type="number" value={config.n_estimators || 10} onChange={(e) => updateConfig('n_estimators', e.target.value)} />
                </div>
            )}

            {['AdaBoost', 'GradientBoosting'].includes(algorithm) && (
                <div>
                    <Label>Learning Rate</Label>
                    <Input type="number" step="0.01" value={config.learning_rate || 0.1} onChange={(e) => updateConfig('learning_rate', e.target.value)} />
                </div>
            )}

            {algorithm === 'Voting' && (
                <div>
                    <Label>Voting</Label>
                    <Select value={config.voting || 'soft'} onChange={(e) => updateConfig('voting', e.target.value)}>
                        <option value="soft">Soft</option>
                        <option value="hard">Hard</option>
                    </Select>
                </div>
            )}

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">sklearn.ensemble</span>
                <span className="text-fuchsia-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
