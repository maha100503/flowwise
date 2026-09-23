import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Mail, Send, Inbox, Search, Reply, FileEdit } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OUTLOOK_COLORS = {
  accent: 'from-[#0078D4] to-[#005A9E]',
  glow: 'bg-[#0078D4]/20',
  border: 'border-[#0078D4]/30',
  handle: 'bg-[#0078D4]',
};

const ACTIONS = [
  { value: 'send', label: 'Send Email', icon: Send },
  { value: 'read_inbox', label: 'Read Inbox', icon: Inbox },
  { value: 'search', label: 'Search Emails', icon: Search },
  { value: 'reply', label: 'Reply to Email', icon: Reply },
  { value: 'create_draft', label: 'Create Draft', icon: FileEdit },
];

export const OutlookNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  const config = data.config || {};

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { ...data, config: { ...config, [key]: value } });
  };

  const action = config.action || 'send';

  return (
    <BaseNode
      {...props}
      icon={Mail}
      accentColor={OUTLOOK_COLORS.accent}
      glowColor={OUTLOOK_COLORS.glow}
      borderColor={OUTLOOK_COLORS.border}
      handleColor={OUTLOOK_COLORS.handle}
      badge="Outlook"
    >
      <div className="space-y-3">
        {/* Action Selector */}
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

        {/* To - for send, reply, draft */}
        {['send', 'reply', 'create_draft'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>To</Label>
            <Input
              value={config.to || ''}
              onChange={(e) => updateConfig('to', e.target.value)}
              placeholder="recipient@example.com"
              type="email"
              autoComplete="off"
            />
          </div>
        )}

        {/* CC - for send, draft */}
        {['send', 'create_draft'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>CC (optional)</Label>
            <Input
              value={config.cc || ''}
              onChange={(e) => updateConfig('cc', e.target.value)}
              placeholder="cc@example.com"
              type="email"
              autoComplete="off"
            />
          </div>
        )}

        {/* Subject - for send, draft */}
        {['send', 'create_draft'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>Subject</Label>
            <Input
              value={config.subject || ''}
              onChange={(e) => updateConfig('subject', e.target.value)}
              placeholder="Email subject line"
              autoComplete="off"
            />
          </div>
        )}

        {/* Body - for send, reply, draft */}
        {['send', 'reply', 'create_draft'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>Body</Label>
            <Textarea
              value={config.body || ''}
              onChange={(e) => updateConfig('body', e.target.value)}
              placeholder="Email body text...&#10;&#10;Use {{output}} for previous node data"
              rows={4}
            />
            <div className="flex items-center gap-2 mt-1">
              <label className={cn('text-[9px] flex items-center gap-1 cursor-pointer', theme.textMuted)}>
                <input
                  type="checkbox"
                  checked={config.isHtml || false}
                  onChange={(e) => updateConfig('isHtml', e.target.checked)}
                  className="w-3 h-3 rounded"
                  autoComplete="off"
                />
                HTML body
              </label>
            </div>
          </div>
        )}

        {/* Message ID for reply */}
        {action === 'reply' && (
          <div>
            <Label className={theme.textMuted}>Message ID</Label>
            <Input
              value={config.messageId || ''}
              onChange={(e) => updateConfig('messageId', e.target.value)}
              placeholder="AAMkAD..."
              autoComplete="off"
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              ID from a previous Read Inbox or Search action
            </p>
          </div>
        )}

        {/* Search Query */}
        {action === 'search' && (
          <div>
            <Label className={theme.textMuted}>Search Query</Label>
            <Input
              value={config.searchQuery || ''}
              onChange={(e) => updateConfig('searchQuery', e.target.value)}
              placeholder='subject:"weekly report" OR from:boss@company.com'
              autoComplete="off"
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              Uses OData $search syntax
            </p>
          </div>
        )}

        {/* Limit for read/search */}
        {['read_inbox', 'search'].includes(action) && (
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

        {/* Unread only toggle for read_inbox */}
        {action === 'read_inbox' && (
          <div className="flex items-center gap-2">
            <label className={cn('text-[9px] flex items-center gap-1 cursor-pointer', theme.textMuted)}>
              <input
                type="checkbox"
                checked={config.unreadOnly || false}
                onChange={(e) => updateConfig('unreadOnly', e.target.checked)}
                className="w-3 h-3 rounded"
              />
              Unread only
            </label>
          </div>
        )}

        {/* Access Token */}
        <div>
          <Label className={theme.textMuted}>Access Token</Label>
          <Input
            value={config.accessToken || ''}
            onChange={(e) => updateConfig('accessToken', e.target.value)}
            placeholder="Microsoft Graph API token"
            type="password"
            autoComplete="off"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Or set MICROSOFT_CLIENT_ID/SECRET in .env
          </p>
        </div>

        {/* Info */}
        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Microsoft Outlook:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>• Uses Microsoft Graph API v1.0</div>
            <div>• Requires Mail.Send, Mail.Read scopes</div>
            <div>• Supports HTML and plain text emails</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
