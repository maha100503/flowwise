import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Bell } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const NotificationNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();

    const config = data.config || {};
    const channel = config.channel || 'Email';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Bell}
            selected={selected}
            accentColor="from-rose-400 to-red-500"
            glowColor="bg-rose-500/20"
            className="border-rose-500/20"
            inputColor="bg-rose-400"
            outputs={false}
            badge="NOTIFY"
        >
            <div>
                <Label>Channel</Label>
                <div className="flex gap-1.5">
                    {[
                        { label: 'Email', emoji: '📧' },
                        { label: 'Slack', emoji: '💬' },
                        { label: 'Discord', emoji: '🎮' },
                    ].map((ch) => (
                        <button
                            key={ch.label}
                            onClick={() => updateConfig('channel', ch.label)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1 ${ch.label === channel
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
                                }`}
                        >
                            <span>{ch.emoji}</span>
                            {ch.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <Label>Recipient</Label>
                <Input
                    placeholder="team@company.com"
                    value={config.recipient || ''}
                    onChange={(e) => updateConfig('recipient', e.target.value)}
                />
            </div>

            <div>
                <Label>Message</Label>
                <Textarea
                    placeholder="Workflow completed successfully!"
                    className="min-h-[60px]"
                    value={config.message || ''}
                    onChange={(e) => updateConfig('message', e.target.value)}
                />
            </div>
        </BaseNode>
    );
};
