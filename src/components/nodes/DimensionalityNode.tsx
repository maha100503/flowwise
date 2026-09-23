import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Shrink } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const ALGORITHMS = [
    { value: 'PCA', label: 'PCA' },
    { value: 'KernelPCA', label: 'Kernel PCA' },
    { value: 'LDA', label: 'LDA' },
    { value: 'tSNE', label: 't-SNE' },
    { value: 'ICA', label: 'ICA' },
    { value: 'FactorAnalysis', label: 'Factor Analysis' },
];

export const DimensionalityNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const algorithm = data.subType || config.algorithm || 'PCA';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Shrink}
            selected={selected}
            accentColor="from-indigo-400 to-blue-500"
            glowColor="bg-indigo-500/20"
            className="border-indigo-500/20"
            outputColor="bg-indigo-400"
            inputColor="bg-indigo-400"
            badge="DIM"
        >
            <div>
                <Label>Algorithm</Label>
                <Select
                    value={algorithm}
                    onChange={(e) => updateNodeData(id, { subType: e.target.value, config: { ...config, algorithm: e.target.value } })}
                >
                    {ALGORITHMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </Select>
            </div>

            <div>
                <Label>Components</Label>
                <Input type="number" min="1" value={config.n_components || 2} onChange={(e) => updateConfig('n_components', e.target.value)} />
            </div>

            {algorithm === 'KernelPCA' && (
                <div>
                    <Label>Kernel</Label>
                    <Select value={config.kernel || 'rbf'} onChange={(e) => updateConfig('kernel', e.target.value)}>
                        {['rbf', 'linear', 'poly', 'sigmoid', 'cosine'].map(k => <option key={k} value={k}>{k}</option>)}
                    </Select>
                </div>
            )}

            {algorithm === 'tSNE' && (
                <div>
                    <Label>Perplexity</Label>
                    <Input type="number" step="5" value={config.perplexity || 30} onChange={(e) => updateConfig('perplexity', e.target.value)} />
                </div>
            )}

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">sklearn.decomposition</span>
                <span className="text-indigo-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
