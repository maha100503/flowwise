import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { ShieldAlert } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const ALGORITHMS = [
    { value: 'IsolationForest', label: 'Isolation Forest' },
    { value: 'OneClassSVM', label: 'One-Class SVM' },
    { value: 'LOF', label: 'Local Outlier Factor' },
    { value: 'EllipticEnvelope', label: 'Elliptic Envelope' },
];

export const AnomalyNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const algorithm = data.subType || config.algorithm || 'IsolationForest';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={ShieldAlert}
            selected={selected}
            accentColor="from-red-400 to-orange-500"
            glowColor="bg-red-500/20"
            className="border-red-500/20"
            outputColor="bg-red-400"
            inputColor="bg-red-400"
            badge="ANOMALY"
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
                <Label>Contamination</Label>
                <Input type="number" step="0.01" min="0.01" max="0.5" value={config.contamination || 0.1} onChange={(e) => updateConfig('contamination', e.target.value)} />
            </div>

            {algorithm === 'IsolationForest' && (
                <div>
                    <Label>Trees (n_estimators)</Label>
                    <Input type="number" value={config.n_estimators || 100} onChange={(e) => updateConfig('n_estimators', e.target.value)} />
                </div>
            )}

            {algorithm === 'OneClassSVM' && (
                <>
                    <div>
                        <Label>Kernel</Label>
                        <Select value={config.kernel || 'rbf'} onChange={(e) => updateConfig('kernel', e.target.value)}>
                            {['rbf', 'linear', 'poly', 'sigmoid'].map(k => <option key={k} value={k}>{k}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label>Nu</Label>
                        <Input type="number" step="0.01" value={config.nu || 0.1} onChange={(e) => updateConfig('nu', e.target.value)} />
                    </div>
                </>
            )}

            {algorithm === 'LOF' && (
                <div>
                    <Label>Neighbors</Label>
                    <Input type="number" value={config.n_neighbors || 20} onChange={(e) => updateConfig('n_neighbors', e.target.value)} />
                </div>
            )}

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">outlier detection</span>
                <span className="text-red-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
