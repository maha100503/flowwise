import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Camera, MessageCircle, Heart, Image, Send } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const IG_COLORS = {
  accent: 'from-[#E1306C] to-[#833AB4]',
  glow: 'bg-[#E1306C]/20',
  border: 'border-[#E1306C]/30',
  handle: 'bg-[#E1306C]',
};

const ACTIONS = [
  { value: 'send_dm', label: 'Send Direct Message', icon: Send },
  { value: 'post_comment', label: 'Post Comment', icon: MessageCircle },
  { value: 'get_media', label: 'Get Media/Posts', icon: Image },
  { value: 'get_comments', label: 'Get Comments', icon: Heart },
  { value: 'publish_post', label: 'Publish Post', icon: Camera },
];

export const InstagramNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  const config = data.config || {};

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { ...data, config: { ...config, [key]: value } });
  };

  const action = config.action || 'get_media';

  return (
    <BaseNode
      {...props}
      icon={Camera}
      accentColor={IG_COLORS.accent}
      glowColor={IG_COLORS.glow}
      borderColor={IG_COLORS.border}
      handleColor={IG_COLORS.handle}
      badge="Instagram"
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

        {/* DM fields */}
        {action === 'send_dm' && (
          <>
            <div>
              <Label className={theme.textMuted}>Recipient ID</Label>
              <Input
                value={config.recipientId || ''}
                onChange={(e) => updateConfig('recipientId', e.target.value)}
                placeholder="Instagram-scoped user ID"
              />
              <p className={cn('text-[9px] mt-1', theme.textMuted)}>
                IGSID from webhook or conversations API
              </p>
            </div>
            <div>
              <Label className={theme.textMuted}>Message</Label>
              <Textarea
                value={config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Hello! 👋&#10;&#10;{{output}}"
                rows={3}
              />
            </div>
          </>
        )}

        {/* Comment fields */}
        {action === 'post_comment' && (
          <>
            <div>
              <Label className={theme.textMuted}>Media ID</Label>
              <Input
                value={config.mediaId || ''}
                onChange={(e) => updateConfig('mediaId', e.target.value)}
                placeholder="Media post ID"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Comment</Label>
              <Textarea
                value={config.commentText || ''}
                onChange={(e) => updateConfig('commentText', e.target.value)}
                placeholder="Great post! 🔥"
                rows={2}
              />
            </div>
          </>
        )}

        {/* Get media/comments fields */}
        {['get_media', 'get_comments'].includes(action) && (
          <>
            {action === 'get_comments' && (
              <div>
                <Label className={theme.textMuted}>Media ID</Label>
                <Input
                  value={config.mediaId || ''}
                  onChange={(e) => updateConfig('mediaId', e.target.value)}
                  placeholder="Media post ID"
                />
              </div>
            )}
            <div>
              <Label className={theme.textMuted}>Limit</Label>
              <Input
                value={config.limit || '10'}
                onChange={(e) => updateConfig('limit', e.target.value)}
                placeholder="10"
                type="number"
              />
            </div>
          </>
        )}

        {/* Publish post fields */}
        {action === 'publish_post' && (
          <>
            <div>
              <Label className={theme.textMuted}>Image URL</Label>
              <Input
                value={config.imageUrl || ''}
                onChange={(e) => updateConfig('imageUrl', e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              <p className={cn('text-[9px] mt-1', theme.textMuted)}>
                Must be a publicly accessible URL
              </p>
            </div>
            <div>
              <Label className={theme.textMuted}>Caption</Label>
              <Textarea
                value={config.caption || ''}
                onChange={(e) => updateConfig('caption', e.target.value)}
                placeholder="Check this out! 📸 #FlowCraft"
                rows={3}
              />
            </div>
          </>
        )}

        {/* Instagram User ID */}
        <div>
          <Label className={theme.textMuted}>Instagram User ID</Label>
          <Input
            value={config.igUserId || ''}
            onChange={(e) => updateConfig('igUserId', e.target.value)}
            placeholder="Instagram Business Account ID"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Or set INSTAGRAM_USER_ID in .env
          </p>
        </div>

        {/* Access Token */}
        <div>
          <Label className={theme.textMuted}>Access Token</Label>
          <Input
            value={config.accessToken || ''}
            onChange={(e) => updateConfig('accessToken', e.target.value)}
            placeholder="Instagram Graph API token"
            type="password"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Or set INSTAGRAM_ACCESS_TOKEN in .env
          </p>
        </div>

        {/* Info */}
        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Instagram Graph API:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>• Requires Instagram Business account</div>
            <div>• Connected to Facebook Page</div>
            <div>• DMs require Messaging API approval</div>
            <div>• Publish needs public image URLs</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
