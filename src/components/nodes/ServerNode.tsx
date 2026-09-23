import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Server } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Input, Select } from '../ui';
import { CustomNode } from '../../types';

export const ServerNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const { updateNodeData } = useReactFlow();

  const config = data.config || {};
  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, { config: { ...config, [key]: value } });
  };

  return (
    <BaseNode
      id={id}
      label={data.label}
      icon={Server}
      selected={selected}
      accentColor="from-purple-400 to-fuchsia-500"
      glowColor="bg-purple-500/20"
      className="border-purple-500/20"
      outputColor="bg-purple-400"
      inputColor="bg-purple-400"
      badge="MCP"
    >
      <div>
        <Label>Server Name</Label>
        <Input
          placeholder="My MCP Server"
          value={config.serverName || ''}
          onChange={(e) => updateConfig('serverName', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Port</Label>
          <Select
            value={config.port || '3000'}
            onChange={(e) => updateConfig('port', e.target.value)}
          >
            <option>3000</option>
            <option>8080</option>
            <option>4000</option>
          </Select>
        </div>
        <div>
          <Label>Auth</Label>
          <Select
            value={config.auth || 'None'}
            onChange={(e) => updateConfig('auth', e.target.value)}
          >
            <option>None</option>
            <option>API Key</option>
            <option>OAuth</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>Persistence</Label>
        <Select
          value={config.persistence || 'In-Memory'}
          onChange={(e) => updateConfig('persistence', e.target.value)}
        >
          <option>In-Memory</option>
          <option>SQLite</option>
          <option>PostgreSQL</option>
        </Select>
      </div>
    </BaseNode>
  );
};
