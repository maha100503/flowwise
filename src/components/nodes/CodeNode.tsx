import React, { useState } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Code2 } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const CodeNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();

    const config = data.config || {};
    const language = config.language || 'JavaScript';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };
    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Code2}
            selected={selected}
            accentColor="from-lime-400 to-green-500"
            glowColor="bg-lime-500/20"
            className="border-lime-500/20"
            outputColor="bg-lime-400"
            inputColor="bg-lime-400"
            badge="CODE"
        >
            <div>
                <Label>Language</Label>
                <div className="flex gap-1.5">
                    {['JavaScript', 'Python', 'TypeScript'].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => updateConfig('language', lang)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${lang === language
                                ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30'
                                : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
                                }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <Label>Code</Label>
                <Textarea
                    placeholder={"// Transform the input data\nreturn {\n  result: input.data.map(x => x * 2)\n}"}
                    className={cn('min-h-[100px] font-mono text-[11px] leading-relaxed')}
                    value={config.code || ''}
                    onChange={(e) => updateConfig('code', e.target.value)}
                />
            </div>

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">async enabled</span>
                <span className="text-lime-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
