import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const OPERATIONS = [
  { value: 'hash', label: 'Hash (MD5/SHA)' },
  { value: 'hmac', label: 'HMAC Signature' },
  { value: 'base64_encode', label: 'Base64 Encode' },
  { value: 'base64_decode', label: 'Base64 Decode' },
  { value: 'url_encode', label: 'URL Encode' },
  { value: 'url_decode', label: 'URL Decode' },
  { value: 'jwt_decode', label: 'JWT Decode (no verify)' },
  { value: 'uuid', label: 'Generate UUID' },
];

const HASH_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'];

export const CryptoNode: React.FC<NodeProps<CustomNode>> = (props) => {
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
      icon={ShieldCheck}
      accentColor="from-emerald-400 to-green-600"
      glowColor="bg-emerald-500/20"
      badge="CRYPTO"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Operation</Label>
          <Select
            value={config.operation || 'hash'}
            onChange={(e) => updateConfig('operation', e.target.value)}
          >
            {OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Select>
        </div>

        {(config.operation === 'hash' || config.operation === 'hmac') && (
          <div>
            <Label className={theme.textMuted}>Algorithm</Label>
            <Select
              value={config.algorithm || 'sha256'}
              onChange={(e) => updateConfig('algorithm', e.target.value)}
            >
              {HASH_ALGORITHMS.map((a) => (
                <option key={a} value={a}>{a.toUpperCase()}</option>
              ))}
            </Select>
          </div>
        )}

        {config.operation !== 'uuid' && (
          <div>
            <Label className={theme.textMuted}>Input Data</Label>
            <Textarea
              value={config.input || ''}
              onChange={(e) => updateConfig('input', e.target.value)}
              placeholder="Data to process or {{input}}"
              rows={3}
            />
          </div>
        )}

        {config.operation === 'hmac' && (
          <div>
            <Label className={theme.textMuted}>Secret Key</Label>
            <Input
              value={config.secret || ''}
              onChange={(e) => updateConfig('secret', e.target.value)}
              placeholder="HMAC secret key"
              type="password"
            />
          </div>
        )}

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>Operations:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>Hash: one-way digest of data</div>
            <div>HMAC: keyed hash for signatures</div>
            <div>JWT Decode: parse token payload</div>
            <div>UUID: generate random v4 identifier</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
