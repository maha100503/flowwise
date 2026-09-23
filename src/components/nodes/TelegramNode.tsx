import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Send, MessageCircle, Image, FileText, Forward } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const TG_COLORS = {
  accent: 'from-[#0088cc] to-[#229ED9]',
  glow: 'bg-[#0088cc]/20',
  border: 'border-[#0088cc]/30',
  handle: 'bg-[#0088cc]',
};

const ACTIONS = [
  { value: 'send_message', label: 'Send Message', icon: MessageCircle },
  { value: 'send_photo', label: 'Send Photo', icon: Image },
  { value: 'send_document', label: 'Send Document', icon: FileText },
  { value: 'forward_message', label: 'Forward Message', icon: Forward },
  { value: 'get_updates', label: 'Get Updates', icon: Send },
];

export const TelegramNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  const config = data.config || {};

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { ...data, config: { ...config, [key]: value } });
  };

  const action = config.action || 'send_message';

  return (
    <BaseNode
      {...props}
      icon={Send}
      accentColor={TG_COLORS.accent}
      glowColor={TG_COLORS.glow}
      borderColor={TG_COLORS.border}
      handleColor={TG_COLORS.handle}
      badge="Telegram"
    >
      <div className="space-y-3">
        {/* Action */}
        <div>
          <Label className={theme.textMuted}>Action</Label>
          <select
            value={action}
            onChange={(e) => updateConfig('action', e.target.value)}
            className={cn('w-full rounded-lg px-3 py-2 text-xs border', theme.inputBg, theme.inputText, theme.inputBorder)}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Chat ID */}
        {['send_message', 'send_photo', 'send_document', 'forward_message'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>Chat ID</Label>
            <Input
              value={config.chatId || ''}
              onChange={(e) => updateConfig('chatId', e.target.value)}
              placeholder="123456789 or @channel_name"
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              User ID, group ID, or @username
            </p>
          </div>
        )}

        {/* Message - for send_message */}
        {action === 'send_message' && (
          <>
            <div>
              <Label className={theme.textMuted}>Message</Label>
              <Textarea
                value={config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Hello from FlowCraft! 🚀&#10;&#10;{{output}}"
                rows={3}
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Parse Mode</Label>
              <select
                value={config.parseMode || ''}
                onChange={(e) => updateConfig('parseMode', e.target.value)}
                className={cn('w-full rounded-lg px-3 py-2 text-xs border', theme.inputBg, theme.inputText, theme.inputBorder)}
              >
                <option value="">None</option>
                <option value="HTML">HTML</option>
                <option value="Markdown">Markdown</option>
                <option value="MarkdownV2">MarkdownV2</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className={cn('text-[9px] flex items-center gap-1 cursor-pointer', theme.textMuted)}>
                <input
                  type="checkbox"
                  checked={config.disablePreview || false}
                  onChange={(e) => updateConfig('disablePreview', e.target.checked)}
                  className="w-3 h-3 rounded"
                />
                Disable link preview
              </label>
              <label className={cn('text-[9px] flex items-center gap-1 cursor-pointer', theme.textMuted)}>
                <input
                  type="checkbox"
                  checked={config.disableNotification || false}
                  onChange={(e) => updateConfig('disableNotification', e.target.checked)}
                  className="w-3 h-3 rounded"
                />
                Silent
              </label>
            </div>
          </>
        )}

        {/* Photo URL */}
        {action === 'send_photo' && (
          <>
            <div>
              <Label className={theme.textMuted}>Photo URL</Label>
              <Input
                value={config.photoUrl || ''}
                onChange={(e) => updateConfig('photoUrl', e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Caption (optional)</Label>
              <Input
                value={config.caption || ''}
                onChange={(e) => updateConfig('caption', e.target.value)}
                placeholder="Check out this image!"
              />
            </div>
          </>
        )}

        {/* Document URL */}
        {action === 'send_document' && (
          <>
            <div>
              <Label className={theme.textMuted}>Document URL</Label>
              <Input
                value={config.documentUrl || ''}
                onChange={(e) => updateConfig('documentUrl', e.target.value)}
                placeholder="https://example.com/report.pdf"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Caption (optional)</Label>
              <Input
                value={config.caption || ''}
                onChange={(e) => updateConfig('caption', e.target.value)}
                placeholder="Here's the document"
              />
            </div>
          </>
        )}

        {/* Forward fields */}
        {action === 'forward_message' && (
          <>
            <div>
              <Label className={theme.textMuted}>From Chat ID</Label>
              <Input
                value={config.fromChatId || ''}
                onChange={(e) => updateConfig('fromChatId', e.target.value)}
                placeholder="Source chat ID"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Message ID</Label>
              <Input
                value={config.messageId || ''}
                onChange={(e) => updateConfig('messageId', e.target.value)}
                placeholder="12345"
                type="number"
              />
            </div>
          </>
        )}

        {/* Get Updates limit */}
        {action === 'get_updates' && (
          <div>
            <Label className={theme.textMuted}>Limit</Label>
            <Input
              value={config.limit || '10'}
              onChange={(e) => updateConfig('limit', e.target.value)}
              placeholder="10"
              type="number"
            />
          </div>
        )}

        {/* Bot Token */}
        <div>
          <Label className={theme.textMuted}>Bot Token</Label>
          <Input
            value={config.botToken || ''}
            onChange={(e) => updateConfig('botToken', e.target.value)}
            placeholder="123456:ABC-DEF1234abcdef"
            type="password"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Get from @BotFather. Or set TELEGRAM_BOT_TOKEN in .env
          </p>
        </div>

        {/* Info */}
        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Telegram Bot API:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>• Create bot via @BotFather</div>
            <div>• Supports text, photos, documents</div>
            <div>• HTML & Markdown formatting</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
