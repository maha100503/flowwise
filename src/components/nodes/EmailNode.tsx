import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Mail, Send } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

interface ProviderConfig {
  name: string;
  color: string;
  requiresConfig: string[];
}

const EMAIL_PROVIDERS: Record<string, ProviderConfig> = {
  SMTP: { 
    name: 'SMTP', 
    color: 'from-gray-400 to-slate-500',
    requiresConfig: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword'],
  },
  SendGrid: { 
    name: 'SendGrid', 
    color: 'from-blue-400 to-cyan-500',
    requiresConfig: [],
  },
  Mailgun: { 
    name: 'Mailgun', 
    color: 'from-red-400 to-rose-500',
    requiresConfig: ['mailgunDomain'],
  },
};

export const EmailNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  
  const provider = data.subType || 'SMTP';
  const config = data.config || {};
  const providerConfig = EMAIL_PROVIDERS[provider] || EMAIL_PROVIDERS.SMTP;

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, {
      ...data,
      config: { ...config, [key]: value },
    });
  };

  const updateProvider = (newProvider: string) => {
    updateNodeData(id, {
      ...data,
      subType: newProvider,
      label: `Email (${newProvider})`,
    });
  };

  return (
    <BaseNode
      {...props}
      icon={Mail}
      accentColor={providerConfig.color}
      glowColor="bg-rose-500/20"
      borderColor="border-rose-500/20"
      handleColor="bg-rose-400"
      badge={provider}
    >
      <div className="space-y-3">
        {/* Provider Select */}
        <div>
          <Label className={theme.textMuted}>Provider</Label>
          <Select
            value={provider}
            onChange={(e) => updateProvider(e.target.value)}
          >
            {Object.keys(EMAIL_PROVIDERS).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>

        {/* To Email */}
        <div>
          <Label className={theme.textMuted}>To</Label>
          <Input
            value={config.to || ''}
            onChange={(e) => updateConfig('to', e.target.value)}
            placeholder="recipient@example.com"
            type="email"
          />
        </div>

        {/* From Email */}
        <div>
          <Label className={theme.textMuted}>From</Label>
          <Input
            value={config.from || ''}
            onChange={(e) => updateConfig('from', e.target.value)}
            placeholder="sender@example.com"
            type="email"
          />
        </div>

        {/* Subject */}
        <div>
          <Label className={theme.textMuted}>Subject</Label>
          <Input
            value={config.subject || ''}
            onChange={(e) => updateConfig('subject', e.target.value)}
            placeholder="Email Subject"
          />
        </div>

        {/* Body */}
        <div>
          <Label className={theme.textMuted}>Body</Label>
          <Textarea
            value={config.body || ''}
            onChange={(e) => updateConfig('body', e.target.value)}
            placeholder="Hello {{name}},&#10;&#10;Your message here..."
            rows={4}
          />
          <div className="flex items-center gap-2 mt-1">
            <label className={cn('flex items-center gap-1.5 text-[9px] cursor-pointer', theme.textMuted)}>
              <input
                type="checkbox"
                checked={config.isHtml || false}
                onChange={(e) => updateConfig('isHtml', e.target.checked)}
                className="w-3 h-3 rounded"
              />
              Send as HTML
            </label>
          </div>
        </div>

        {/* SMTP Settings */}
        {provider === 'SMTP' && (
          <div className={cn('p-2.5 rounded-lg border space-y-2', theme.btnBg, theme.btnBorder)}>
            <div className={cn('text-[10px] font-medium', theme.textMuted)}>SMTP Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className={cn('text-[9px]', theme.textMuted)}>Host</Label>
                <Input
                  value={config.smtpHost || ''}
                  onChange={(e) => updateConfig('smtpHost', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="text-[10px] py-1"
                />
              </div>
              <div>
                <Label className={cn('text-[9px]', theme.textMuted)}>Port</Label>
                <Input
                  value={config.smtpPort || ''}
                  onChange={(e) => updateConfig('smtpPort', e.target.value)}
                  placeholder="587"
                  type="number"
                  className="text-[10px] py-1"
                />
              </div>
            </div>
            <div>
              <Label className={cn('text-[9px]', theme.textMuted)}>Username (Full Email)</Label>
              <Input
                value={config.smtpUser || ''}
                onChange={(e) => updateConfig('smtpUser', e.target.value)}
                placeholder="yourname@gmail.com"
                type="email"
                className="text-[10px] py-1"
              />
            </div>
            <div>
              <Label className={cn('text-[9px]', theme.textMuted)}>App Password</Label>
              <Input
                value={config.smtpPassword || ''}
                onChange={(e) => updateConfig('smtpPassword', e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                type="password"
                className="text-[10px] py-1"
              />
            </div>
            <p className={cn('text-[8px] text-amber-400', theme.textMuted)}>
              ⚠️ Gmail requires App Password (not regular password).
              <br />Get it at: myaccount.google.com/apppasswords
            </p>
          </div>
        )}

        {/* Mailgun Domain */}
        {provider === 'Mailgun' && (
          <div>
            <Label className={theme.textMuted}>Mailgun Domain</Label>
            <Input
              value={config.mailgunDomain || ''}
              onChange={(e) => updateConfig('mailgunDomain', e.target.value)}
              placeholder="mg.yourdomain.com"
            />
            <p className={cn('text-[9px] mt-1', theme.textMuted)}>
              Set MAILGUN_API_KEY in .env
            </p>
          </div>
        )}

        {/* SendGrid note */}
        {provider === 'SendGrid' && (
          <p className={cn('text-[9px] p-2 rounded-lg', theme.btnBg, theme.textMuted)}>
            Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in .env
          </p>
        )}
      </div>
    </BaseNode>
  );
};
