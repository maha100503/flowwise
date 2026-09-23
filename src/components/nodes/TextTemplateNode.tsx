import React, { useMemo } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const TextTemplateNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { updateNodeData } = useReactFlow();
    const { theme } = useTheme();

    const config = data.config || {};
    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    // Dynamically detect variables from template
    const detectedVariables = useMemo(() => {
        const template = config.template || '';
        const matches = template.match(/\{\{(.+?)\}\}/g) || [];
        const vars = matches.map((m: string) => m.replace(/\{\{|\}\}/g, '').trim());
        return [...new Set(vars)]; // Remove duplicates
    }, [config.template]);

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={FileText}
            selected={selected}
            accentColor="from-violet-400 to-purple-500"
            glowColor="bg-violet-500/20"
            className="border-violet-500/20"
            outputColor="bg-violet-400"
            inputColor="bg-violet-400"
            badge="TMPL"
        >
            <div>
                <Label>Template</Label>
                <Textarea
                    placeholder={"Hello {{name}},\n\nYour order #{{orderId}} is ready."}
                    className="min-h-[90px] font-mono text-[11px]"
                    value={config.template || ''}
                    onChange={(e) => updateConfig('template', e.target.value)}
                />
            </div>

            <div>
                <Label>Detected Variables</Label>
                <div className="flex flex-wrap gap-1.5">
                    {detectedVariables.length > 0 ? (
                        detectedVariables.map((v) => (
                            <span
                                key={v}
                                className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 text-[10px] font-mono font-bold border border-violet-500/20"
                            >
                                {`{{${v}}}`}
                            </span>
                        ))
                    ) : (
                        <span className={cn('text-[10px] italic', theme.textMuted)}>
                            No variables detected
                        </span>
                    )}
                </div>
            </div>
        </BaseNode>
    );
};
