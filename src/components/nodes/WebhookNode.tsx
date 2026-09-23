import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Webhook } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Toggle, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const WebhookNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();

    const config = data.config || {};
    const method = config.method || 'POST';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Webhook}
            selected={selected}
            accentColor="from-pink-400 to-fuchsia-500"
            glowColor="bg-pink-500/20"
            className="border-pink-500/20"
            outputColor="bg-pink-400"
            inputs={false}
            badge="TRIGGER"
        >
            <div>
                <Label>Method</Label>
                <div className="flex gap-1.5">
                    {['GET', 'POST', 'PUT'].map((m) => (
                        <button
                            key={m}
                            onClick={() => updateConfig('method', m)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all ${m === method
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <Label>Endpoint</Label>
                <Input
                    placeholder="/api/webhook/incoming"
                    value={config.endpoint || ''}
                    onChange={(e) => updateConfig('endpoint', e.target.value)}
                    className="font-mono text-xs"
                />
            </div>

            <div className="flex items-center justify-between">
                <Label className="mb-0">Authentication</Label>
                <Toggle
                    checked={config.authentication !== false}
                    onChange={(checked) => updateConfig('authentication', checked)}
                />
            </div>
        </BaseNode>
    );
};
