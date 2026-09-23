import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Rss } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

export const RSSNode: React.FC<NodeProps<CustomNode>> = (props) => {
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
      icon={Rss}
      accentColor="from-orange-400 to-amber-500"
      glowColor="bg-orange-500/20"
      badge="RSS"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Feed URL</Label>
          <Input
            value={config.url || ''}
            onChange={(e) => updateConfig('url', e.target.value)}
            placeholder="https://blog.example.com/feed.xml"
            type="url"
          />
        </div>

        <div>
          <Label className={theme.textMuted}>Max Items</Label>
          <Input
            type="number"
            value={config.maxItems || 10}
            onChange={(e) => updateConfig('maxItems', parseInt(e.target.value) || 10)}
            min={1}
            max={100}
          />
        </div>

        <div>
          <Label className={theme.textMuted}>Output Format</Label>
          <Select
            value={config.format || 'full'}
            onChange={(e) => updateConfig('format', e.target.value)}
          >
            <option value="full">Full (title, link, summary, date)</option>
            <option value="titles">Titles Only</option>
            <option value="links">Links Only</option>
            <option value="summary">Title + Summary</option>
          </Select>
        </div>

        <div>
          <Label className={theme.textMuted}>Filter Keyword (optional)</Label>
          <Input
            value={config.filter || ''}
            onChange={(e) => updateConfig('filter', e.target.value)}
            placeholder="Only items containing..."
          />
        </div>

        <div>
          <Label className={theme.textMuted}>Sort By</Label>
          <Select
            value={config.sortBy || 'newest'}
            onChange={(e) => updateConfig('sortBy', e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </Select>
        </div>

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Supported:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>RSS 2.0, Atom feeds</div>
            <div>Keyword filter on title + description</div>
            <div>Output as structured JSON array</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
