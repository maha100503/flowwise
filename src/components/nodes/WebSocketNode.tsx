import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Radio } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Textarea, Select, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const ACTIONS = [
  { value: 'send', label: 'Send Message' },
  { value: 'listen', label: 'Listen for Messages' },
  { value: 'broadcast', label: 'Broadcast to Channel' },
];

export const WebSocketNode: React.FC<NodeProps<CustomNode>> = (props) => {
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

  const action = config.action || 'send';

  return (
    <BaseNode
      {...props}
      icon={Radio}
      accentColor="from-fuchsia-400 to-pink-500"
      glowColor="bg-fuchsia-500/20"
      badge="WS"
    >
      <div className="space-y-3">
        <div>
          <Label className={theme.textMuted}>Action</Label>
          <Select
            value={action}
            onChange={(e) => updateConfig('action', e.target.value)}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label className={theme.textMuted}>WebSocket URL</Label>
          <Input
            value={config.url || ''}
            onChange={(e) => updateConfig('url', e.target.value)}
            placeholder="wss://echo.websocket.org"
          />
        </div>

        {['send', 'broadcast'].includes(action) && (
          <div>
            <Label className={theme.textMuted}>Message</Label>
            <Textarea
              value={config.message || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder='{"event": "update", "data": {{input}}}'
              rows={3}
              className="font-mono text-[10px]"
            />
          </div>
        )}

        {action === 'broadcast' && (
          <div>
            <Label className={theme.textMuted}>Channel</Label>
            <Input
              value={config.channel || ''}
              onChange={(e) => updateConfig('channel', e.target.value)}
              placeholder="my-channel"
            />
          </div>
        )}

        {action === 'listen' && (
          <div>
            <Label className={theme.textMuted}>Timeout (seconds)</Label>
            <Input
              type="number"
              value={config.timeout || 30}
              onChange={(e) => updateConfig('timeout', parseInt(e.target.value) || 30)}
              min={1}
              max={300}
            />
          </div>
        )}

        <div>
          <Label className={theme.textMuted}>Headers (JSON)</Label>
          <Textarea
            value={typeof config.headers === 'object' ? JSON.stringify(config.headers, null, 2) : config.headers || ''}
            onChange={(e) => {
              try {
                updateConfig('headers', JSON.parse(e.target.value));
              } catch {
                updateConfig('headers', e.target.value);
              }
            }}
            placeholder='{"Authorization": "Bearer {{token}}"}'
            rows={2}
            className="font-mono text-[10px]"
          />
        </div>

        <div className={cn('p-2 rounded-lg text-[9px]', theme.btnBg)}>
          <div className={cn('font-medium mb-1', theme.textMuted)}>WebSocket info:</div>
          <div className={cn('space-y-0.5', theme.textSecondary)}>
            <div>Real-time bidirectional comms</div>
            <div>Supports wss:// (TLS) and ws://</div>
            <div>JSON auto-stringify for objects</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
