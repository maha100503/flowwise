import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Network } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const ALGORITHMS = [
    { value: 'KMeans', label: 'K-Means' },
    { value: 'MiniBatchKMeans', label: 'Mini-Batch K-Means' },
    { value: 'DBSCAN', label: 'DBSCAN' },
    { value: 'HDBSCAN', label: 'HDBSCAN' },
    { value: 'Hierarchical', label: 'Hierarchical (Agglomerative)' },
    { value: 'GMM', label: 'Gaussian Mixture' },
    { value: 'SpectralClustering', label: 'Spectral Clustering' },
    { value: 'MeanShift', label: 'Mean Shift' },
    { value: 'AffinityPropagation', label: 'Affinity Propagation' },
    { value: 'Birch', label: 'BIRCH' },
];

const NEEDS_K = ['KMeans', 'MiniBatchKMeans', 'Hierarchical', 'GMM', 'SpectralClustering', 'Birch'];

export const ClusteringNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const algorithm = data.subType || config.algorithm || 'KMeans';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Network}
            selected={selected}
            accentColor="from-pink-400 to-rose-500"
            glowColor="bg-pink-500/20"
            className="border-pink-500/20"
            outputColor="bg-pink-400"
            inputColor="bg-pink-400"
            badge="CLUSTER"
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

            {NEEDS_K.includes(algorithm) && (
                <div>
                    <Label>Clusters (k)</Label>
                    <Input type="number" min="2" value={config.n_clusters || 3} onChange={(e) => updateConfig('n_clusters', e.target.value)} />
                </div>
            )}

            {algorithm === 'DBSCAN' && (
                <>
                    <div>
                        <Label>Epsilon (eps)</Label>
                        <Input type="number" step="0.1" value={config.eps || 0.5} onChange={(e) => updateConfig('eps', e.target.value)} />
                    </div>
                    <div>
                        <Label>Min Samples</Label>
                        <Input type="number" value={config.min_samples || 5} onChange={(e) => updateConfig('min_samples', e.target.value)} />
                    </div>
                </>
            )}

            {algorithm === 'Hierarchical' && (
                <div>
                    <Label>Linkage</Label>
                    <Select value={config.linkage || 'ward'} onChange={(e) => updateConfig('linkage', e.target.value)}>
                        {['ward', 'complete', 'average', 'single'].map(l => <option key={l} value={l}>{l}</option>)}
                    </Select>
                </div>
            )}

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">unsupervised</span>
                <span className="text-pink-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
