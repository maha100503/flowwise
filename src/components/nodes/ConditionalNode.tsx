import React from 'react';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Textarea } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const ConditionalNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
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
            icon={GitBranch}
            selected={selected}
            accentColor="from-yellow-400 to-orange-500"
            glowColor="bg-yellow-500/20"
            className="border-yellow-500/20"
            inputColor="bg-yellow-400"
            outputs={false}
            badge="IF/ELSE"
            extraHandles={
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="true"
                        className={`!w-2.5 !h-2.5 !border-[1.5px] ${theme.handleBorder} !shadow-lg !bg-emerald-400 !-right-[5px]`}
                        style={{ top: '35%' }}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="false"
                        className={`!w-2.5 !h-2.5 !border-[1.5px] ${theme.handleBorder} !shadow-lg !bg-red-400 !-right-[5px]`}
                        style={{ top: '65%' }}
                    />
                </>
            }
        >
            <div>
                <Label>Condition</Label>
                <Textarea
                    placeholder="data.score >= 0.8"
                    className="min-h-[60px]"
                    value={config.condition || ''}
                    onChange={(e) => updateConfig('condition', e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">True</span>
                </div>
                <div className="h-3 w-px bg-slate-700" />
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">False</span>
                </div>
            </div>
        </BaseNode>
    );
};
