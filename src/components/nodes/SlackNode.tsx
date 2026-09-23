import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { MessageSquare, Hash } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

// Slack brand colors
const SLACK_COLORS = {
  accent: 'from-[#4A154B] to-[#611f69]',
  glow: 'bg-[#4A154B]/20',
  border: 'border-[#4A154B]/30',
  handle: 'bg-[#4A154B]',
};

export const SlackNode: React.FC<NodeProps<CustomNode>> = (props) => {
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
      icon={MessageSquare}
      accentColor={SLACK_COLORS.accent}
      glowColor={SLACK_COLORS.glow}
      borderColor={SLACK_COLORS.border}
      handleColor={SLACK_COLORS.handle}
      badge="Slack"
    >
      <div className="space-y-3">
        {/* Channel */}
        <div>
          <Label className={theme.textMuted}>Channel</Label>
          <div className="relative">
            <Hash size={14} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', theme.textMuted)} />
            <Input
              value={config.channel || ''}
              onChange={(e) => updateConfig('channel', e.target.value)}
              placeholder="general"
              className="pl-8"
            />
          </div>
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Channel name without # or channel ID
          </p>
        </div>

        {/* Message */}
        <div>
          <Label className={theme.textMuted}>Message</Label>
          <Textarea
            value={config.message || ''}
            onChange={(e) => updateConfig('message', e.target.value)}
            placeholder="Hello from FlowCraft! 🚀&#10;&#10;Result: {{output}}"
            rows={4}
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Supports Slack markdown and {'{{variables}}'}
          </p>
        </div>

        {/* Webhook URL */}
        <div>
          <Label className={theme.textMuted}>Webhook URL (Option 1)</Label>
          <Input
            value={config.webhookUrl || ''}
            onChange={(e) => updateConfig('webhookUrl', e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            type="url"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Create at: Slack App → Incoming Webhooks
          </p>
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-2 py-1">
          <div className={cn('flex-1 h-px', theme.btnBorder)} />
          <span className={cn('text-[9px] font-medium', theme.textMuted)}>OR</span>
          <div className={cn('flex-1 h-px', theme.btnBorder)} />
        </div>

        {/* Bot Token */}
        <div>
          <Label className={theme.textMuted}>Bot Token (Option 2)</Label>
          <Input
            value={config.botToken || ''}
            onChange={(e) => updateConfig('botToken', e.target.value)}
            placeholder="xoxb-..."
            type="password"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Requires chat:write scope. Set SLACK_BOT_TOKEN in .env
          </p>
        </div>

        {/* Preview */}
        {config.message && (
          <div className={cn('p-2.5 rounded-lg border', theme.btnBg, theme.btnBorder)}>
            <div className={cn('text-[9px] font-medium mb-1.5 flex items-center gap-1', theme.textMuted)}>
              <MessageSquare size={10} />
              Preview
            </div>
            <div className={cn('text-[10px] whitespace-pre-wrap', theme.textSecondary)}>
              {config.message.slice(0, 150)}{config.message.length > 150 ? '...' : ''}
            </div>
          </div>
        )}

        {/* Slack Formatting Help */}
        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Slack formatting:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>*bold* → <strong>bold</strong></div>
            <div>_italic_ → <em>italic</em></div>
            <div>~strike~ → <s>strike</s></div>
            <div>`code` → <code>code</code></div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
