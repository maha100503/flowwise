import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Timer, Play } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const TimerNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const isManual = data.subType === 'Manual';
    const Icon = isManual ? Play : Timer;
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
            icon={Icon}
            selected={selected}
            accentColor={isManual ? 'from-emerald-400 to-green-500' : 'from-cyan-400 to-teal-500'}
            glowColor={isManual ? 'bg-emerald-500/20' : 'bg-cyan-500/20'}
            className={isManual ? 'border-emerald-500/20' : 'border-cyan-500/20'}
            outputColor={isManual ? 'bg-emerald-400' : 'bg-cyan-400'}
            inputs={false}
            badge="TRIGGER"
        >
            {isManual ? (
                <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                            <Play size={18} className="text-white ml-0.5" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-emerald-300 block">Ready to run</span>
                            <span className={cn('text-[10px]', theme.textMuted)}>Click Execute or trigger manually</span>
                        </div>
                    </div>

                    <div>
                        <Label>Trigger Name</Label>
                        <Input
                            placeholder="My Workflow Trigger"
                            value={config.triggerName || ''}
                            onChange={(e) => updateConfig('triggerName', e.target.value)}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <Label>Schedule</Label>
                        <Input
                            placeholder="*/5 * * * *"
                            className="font-mono text-xs"
                            value={config.schedule || ''}
                            onChange={(e) => updateConfig('schedule', e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label>Timezone</Label>
                            <Select
                                value={config.timezone || 'UTC'}
                                onChange={(e) => updateConfig('timezone', e.target.value)}
                            >
                                <option>UTC</option>
                                <option>America/New_York</option>
                                <option>Europe/London</option>
                                <option>Asia/Kolkata</option>
                                <option>Asia/Tokyo</option>
                            </Select>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <div className={cn('flex items-center gap-2 h-9 px-3 rounded-lg border', theme.inputBg, theme.inputBorder)}>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-glow" />
                                <span className="text-xs text-emerald-400 font-medium">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className={cn('text-[10px] rounded-lg px-3 py-2 border font-mono', theme.textMuted, theme.inputBg, theme.inputBorder)}>
                        Next run: in 4m 32s
                    </div>
                </>
            )}
        </BaseNode>
    );
};
