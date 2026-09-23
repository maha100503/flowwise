import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Phone, MessageCircle, Image, FileText, Zap } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const WA_COLORS = {
  accent: 'from-[#25D366] to-[#128C7E]',
  glow: 'bg-[#25D366]/20',
  border: 'border-[#25D366]/30',
  handle: 'bg-[#25D366]',
};

const ACTIONS = [
  { value: 'send_text', label: 'Send Text Message', icon: MessageCircle },
  { value: 'send_template', label: 'Send Template', icon: FileText },
  { value: 'send_media', label: 'Send Media', icon: Image },
  { value: 'send_interactive', label: 'Send Interactive', icon: Zap },
];

export const WhatsAppNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  const config = data.config || {};

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { ...data, config: { ...config, [key]: value } });
  };

  const action = config.action || 'send_text';

  return (
    <BaseNode
      {...props}
      icon={Phone}
      accentColor={WA_COLORS.accent}
      glowColor={WA_COLORS.glow}
      borderColor={WA_COLORS.border}
      handleColor={WA_COLORS.handle}
      badge="WhatsApp"
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

        {/* Phone Number */}
        <div>
          <Label className={theme.textMuted}>Recipient Phone</Label>
          <div className="relative">
            <Phone size={14} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', theme.textMuted)} />
            <Input
              value={config.toNumber || ''}
              onChange={(e) => updateConfig('toNumber', e.target.value)}
              placeholder="+1234567890"
              className="pl-8"
            />
          </div>
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Include country code (e.g. +1 for US)
          </p>
        </div>

        {/* Text Message */}
        {action === 'send_text' && (
          <div>
            <Label className={theme.textMuted}>Message</Label>
            <Textarea
              value={config.message || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder="Hello from FlowCraft! 🚀&#10;&#10;{{output}}"
              rows={3}
            />
            <div className="flex items-center gap-2 mt-1">
              <label className={cn('text-[9px] flex items-center gap-1 cursor-pointer', theme.textMuted)}>
                <input
                  type="checkbox"
                  checked={config.previewUrl || false}
                  onChange={(e) => updateConfig('previewUrl', e.target.checked)}
                  className="w-3 h-3 rounded"
                />
                Enable URL preview
              </label>
            </div>
          </div>
        )}

        {/* Template fields */}
        {action === 'send_template' && (
          <>
            <div>
              <Label className={theme.textMuted}>Template Name</Label>
              <Input
                value={config.templateName || ''}
                onChange={(e) => updateConfig('templateName', e.target.value)}
                placeholder="hello_world"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Language</Label>
              <Input
                value={config.languageCode || 'en_US'}
                onChange={(e) => updateConfig('languageCode', e.target.value)}
                placeholder="en_US"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Parameters (comma-separated)</Label>
              <Input
                value={config.templateParams || ''}
                onChange={(e) => updateConfig('templateParams', e.target.value)}
                placeholder="John, Order #1234"
              />
            </div>
          </>
        )}

        {/* Media fields */}
        {action === 'send_media' && (
          <>
            <div>
              <Label className={theme.textMuted}>Media Type</Label>
              <select
                value={config.mediaType || 'image'}
                onChange={(e) => updateConfig('mediaType', e.target.value)}
                className={cn('w-full rounded-lg px-3 py-2 text-xs border', theme.inputBg, theme.inputText, theme.inputBorder)}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div>
              <Label className={theme.textMuted}>Media URL</Label>
              <Input
                value={config.mediaUrl || ''}
                onChange={(e) => updateConfig('mediaUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Caption (optional)</Label>
              <Input
                value={config.caption || ''}
                onChange={(e) => updateConfig('caption', e.target.value)}
                placeholder="Check this out!"
              />
            </div>
          </>
        )}

        {/* Interactive fields */}
        {action === 'send_interactive' && (
          <>
            <div>
              <Label className={theme.textMuted}>Body Text</Label>
              <Textarea
                value={config.bodyText || ''}
                onChange={(e) => updateConfig('bodyText', e.target.value)}
                placeholder="Choose an option below:"
                rows={2}
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Buttons (comma-separated)</Label>
              <Input
                value={config.buttons || ''}
                onChange={(e) => updateConfig('buttons', e.target.value)}
                placeholder="Yes, No, Maybe"
              />
              <p className={cn('text-[9px] mt-1', theme.textMuted)}>
                Max 3 buttons for reply buttons
              </p>
            </div>
          </>
        )}

        {/* Phone Number ID */}
        <div>
          <Label className={theme.textMuted}>Phone Number ID</Label>
          <Input
            value={config.phoneNumberId || ''}
            onChange={(e) => updateConfig('phoneNumberId', e.target.value)}
            placeholder="From Meta Business dashboard"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Or set WHATSAPP_PHONE_NUMBER_ID in .env
          </p>
        </div>

        {/* Access Token */}
        <div>
          <Label className={theme.textMuted}>Access Token</Label>
          <Input
            value={config.accessToken || ''}
            onChange={(e) => updateConfig('accessToken', e.target.value)}
            placeholder="WhatsApp Business API token"
            type="password"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Or set WHATSAPP_ACCESS_TOKEN in .env
          </p>
        </div>

        {/* Info */}
        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>WhatsApp Business:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>• Uses Meta Cloud API v19.0</div>
            <div>• Requires verified business number</div>
            <div>• Templates must be pre-approved</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
