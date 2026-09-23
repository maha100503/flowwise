import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Cpu } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const NeuralNetworkNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
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
            icon={Cpu}
            selected={selected}
            accentColor="from-sky-400 to-indigo-500"
            glowColor="bg-sky-500/20"
            className="border-sky-500/20"
            outputColor="bg-sky-400"
            inputColor="bg-sky-400"
            badge="NN"
        >
            <div>
                <Label>Task</Label>
                <div className="flex gap-1.5">
                    {['classification', 'regression'].map(t => (
                        <button
                            key={t}
                            onClick={() => updateConfig('task', t)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all capitalize ${t === (config.task || 'classification')
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <Label>Hidden Layers (comma-sep)</Label>
                <Input
                    value={config.hidden_layers || '100'}
                    onChange={(e) => updateConfig('hidden_layers', e.target.value)}
                    placeholder="100,50,25"
                />
            </div>

            <div>
                <Label>Activation</Label>
                <Select value={config.activation || 'relu'} onChange={(e) => updateConfig('activation', e.target.value)}>
                    <option value="relu">ReLU</option>
                    <option value="tanh">Tanh</option>
                    <option value="logistic">Sigmoid</option>
                    <option value="identity">Identity</option>
                </Select>
            </div>

            <div>
                <Label>Solver</Label>
                <Select value={config.solver || 'adam'} onChange={(e) => updateConfig('solver', e.target.value)}>
                    <option value="adam">Adam</option>
                    <option value="sgd">SGD</option>
                    <option value="lbfgs">L-BFGS</option>
                </Select>
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <Label>Learning Rate</Label>
                    <Input type="number" step="0.001" value={config.learning_rate_init || 0.001} onChange={(e) => updateConfig('learning_rate_init', e.target.value)} />
                </div>
                <div className="flex-1">
                    <Label>Max Iter</Label>
                    <Input type="number" value={config.max_iter || 500} onChange={(e) => updateConfig('max_iter', e.target.value)} />
                </div>
            </div>

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">sklearn.neural_network</span>
                <span className="text-sky-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
