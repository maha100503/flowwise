import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { QrCode } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const QR_TYPES = [
  { value: 'text', label: 'Plain Text' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'wifi', label: 'WiFi Network' },
  { value: 'vcard', label: 'vCard Contact' },
];

export const QRCodeNode: React.FC<NodeProps<CustomNode>> = (props) => {
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

  const qrType = config.qrType || 'text';

  return (
    <BaseNode
      {...props}
      icon={QrCode}
      accentColor="from-slate-400 to-zinc-500"
      glowColor="bg-slate-500/20"
      badge="QR"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>QR Type</Label>
          <Select
            value={qrType}
            onChange={(e) => updateConfig('qrType', e.target.value)}
          >
            {QR_TYPES.map((qt) => (
              <option key={qt.value} value={qt.value}>{qt.label}</option>
            ))}
          </Select>
        </div>

        {['text', 'url'].includes(qrType) && (
          <div>
            <Label className={theme.textMuted}>Content</Label>
            <Input
              value={config.content || ''}
              onChange={(e) => updateConfig('content', e.target.value)}
              placeholder={qrType === 'url' ? 'https://example.com' : 'Your text here or {{input}}'}
            />
          </div>
        )}

        {qrType === 'email' && (
          <div>
            <Label className={theme.textMuted}>Email</Label>
            <Input
              value={config.email || ''}
              onChange={(e) => updateConfig('email', e.target.value)}
              placeholder="user@example.com"
            />
          </div>
        )}

        {qrType === 'phone' && (
          <div>
            <Label className={theme.textMuted}>Phone</Label>
            <Input
              value={config.phone || ''}
              onChange={(e) => updateConfig('phone', e.target.value)}
              placeholder="+1234567890"
            />
          </div>
        )}

        {qrType === 'wifi' && (
          <>
            <div>
              <Label className={theme.textMuted}>SSID</Label>
              <Input
                value={config.ssid || ''}
                onChange={(e) => updateConfig('ssid', e.target.value)}
                placeholder="Network name"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Password</Label>
              <Input
                type="password"
                value={config.wifiPassword || ''}
                onChange={(e) => updateConfig('wifiPassword', e.target.value)}
                placeholder="WiFi password"
              />
            </div>
            <div>
              <Label className={theme.textMuted}>Encryption</Label>
              <Select
                value={config.encryption || 'WPA'}
                onChange={(e) => updateConfig('encryption', e.target.value)}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </Select>
            </div>
          </>
        )}

        <div>
          <Label className={theme.textMuted}>Size (px)</Label>
          <Input
            type="number"
            value={config.size || 256}
            onChange={(e) => updateConfig('size', parseInt(e.target.value) || 256)}
            min={64}
            max={1024}
          />
        </div>

        <div>
          <Label className={theme.textMuted}>Output Format</Label>
          <Select
            value={config.outputFormat || 'base64'}
            onChange={(e) => updateConfig('outputFormat', e.target.value)}
          >
            <option value="base64">Base64 Image</option>
            <option value="svg">SVG String</option>
          </Select>
        </div>
      </div>
    </BaseNode>
  );
};
