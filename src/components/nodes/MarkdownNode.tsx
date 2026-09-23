import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { FileType } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Textarea, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'to_html', label: 'Markdown → HTML' },
  { value: 'to_plain', label: 'Markdown → Plain Text' },
  { value: 'extract_headings', label: 'Extract Headings (TOC)' },
  { value: 'extract_links', label: 'Extract Links' },
  { value: 'extract_code', label: 'Extract Code Blocks' },
  { value: 'word_count', label: 'Word / Char Count' },
];

export const MarkdownNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;

  const config = data.config || {};

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, {
      ...data,
      config: { ...config, [key]: value },
    });
  };

  return (
    <BaseNode
      {...props}
      icon={FileType}
      accentColor="from-sky-400 to-blue-500"
      glowColor="bg-sky-500/20"
      badge="MD"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Operation</Label>
          <Select
            value={config.operation || 'to_html'}
            onChange={(e) => updateConfig('operation', e.target.value)}
          >
            {OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label className={theme.textMuted}>Markdown Content</Label>
          <Textarea
            value={config.content || ''}
            onChange={(e) => updateConfig('content', e.target.value)}
            placeholder={'# Heading\n\nSome **bold** and *italic* text.\n\n- List item\n- {{dynamic_item}}'}
            rows={6}
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Use {'{{input}}'} to process incoming markdown
          </p>
        </div>

        {config.operation === 'to_html' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.sanitize !== false}
              onChange={(e) => updateConfig('sanitize', e.target.checked)}
              className="w-3 h-3 rounded accent-sky-500"
            />
            <span className={cn('text-[10px]', theme.textSecondary)}>
              Sanitize HTML output
            </span>
          </div>
        )}

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Supported syntax:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div># Headings, **bold**, *italic*</div>
            <div>[links](url), ![images](url)</div>
            <div>```code blocks```, &gt; quotes</div>
            <div>Tables, task lists, footnotes</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
