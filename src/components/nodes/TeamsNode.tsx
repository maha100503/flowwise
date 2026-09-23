import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Users, Hash, MessageCircle, List } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const TEAMS_COLORS = {
  accent: 'from-[#6264A7] to-[#464EB8]',
  glow: 'bg-[#6264A7]/20',
  border: 'border-[#6264A7]/30',
  handle: 'bg-[#6264A7]',
};

const ACTIONS = [
  { value: 'send_channel', label: 'Send Channel Message', icon: Hash },
  { value: 'send_chat', label: 'Send Chat Message', icon: MessageCircle },
  { value: 'read_channel', label: 'Read Channel Messages', icon: List },
  { value: 'list_teams', label: 'List Teams', icon: Users },
  { value: 'list_channels', label: 'List Channels', icon: Hash },
];

export const TeamsNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  const config = data.config || {};

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { ...data, config: { ...config, [key]: value } });
  };

  const action = config.action || 'send_channel';

  return (
    <BaseNode
      {...props}
      icon={Users}
      accentColor={TEAMS_COLORS.accent}
      glowColor={TEAMS_COLORS.glow}
      borderColor={TEAMS_COLORS.border}
      handleColor={TEAMS_COLORS.handle}
      badge="Teams"
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

        {/* Team ID - for channel actions */}
        {['send_channel', 'read_channel', 'list_channels'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>Team ID</Label>
            <Input
              value={config.teamId || ''}
              onChange={(e) => updateConfig('teamId', e.target.value)}
              placeholder="team-guid-here"
            />
          </div>
        )}

        {/* Channel ID - for channel actions */}
        {['send_channel', 'read_channel'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>Channel ID</Label>
            <Input
              value={config.channelId || ''}
              onChange={(e) => updateConfig('channelId', e.target.value)}
              placeholder="19:channel-id@thread.tacv2"
            />
          </div>
        )}

        {/* Chat ID - for chat action */}
        {action === 'send_chat' && (
          <div>
            <Label className={theme.textMuted}>Recipient Email</Label>
            <Input
              value={config.recipientEmail || ''}
              onChange={(e) => updateConfig('recipientEmail', e.target.value)}
              placeholder="user@company.com"
              type="email"
              autoComplete="off"
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              Creates a 1:1 chat if none exists
            </p>
          </div>
        )}

        {/* Message - for send actions */}
        {['send_channel', 'send_chat'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>Message</Label>
            <Textarea
              value={config.message || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder="Hello from FlowCraft! 🚀&#10;&#10;Result: {{output}}"
              rows={3}
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              Supports {'{{variables}}'} from previous nodes
            </p>
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
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Or set MICROSOFT_CLIENT_ID/SECRET in .env for OAuth
          </p>
        </div>

        {/* Info box */}
        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Microsoft Teams:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>• Uses Microsoft Graph API v1.0</div>
            <div>• Requires Azure AD app registration</div>
            <div>• Scopes: ChannelMessage.Send, Chat.ReadWrite</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
