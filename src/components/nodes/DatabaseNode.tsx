import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Database, Server } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, Textarea, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

interface DBConfig {
  name: string;
  color: string;
  placeholder: string;
}

const DATABASE_TYPES: Record<string, DBConfig> = {
  SQLite: { 
    name: 'SQLite', 
    color: 'from-sky-400 to-blue-500',
    placeholder: './database.db or :memory:',
  },
  PostgreSQL: { 
    name: 'PostgreSQL', 
    color: 'from-blue-400 to-indigo-500',
    placeholder: 'postgresql://user:pass@host:5432/db',
  },
  MySQL: { 
    name: 'MySQL', 
    color: 'from-orange-400 to-amber-500',
    placeholder: 'mysql://user:pass@host:3306/db',
  },
};

export const DatabaseNode: React.FC<NodeProps<CustomNode>> = (props) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const { id, data } = props;
  
  const dbType = data.subType || 'SQLite';
  const config = data.config || {};
  const dbConfig = DATABASE_TYPES[dbType] || DATABASE_TYPES.SQLite;

  const updateConfig = (key: string, value: any) => {
    updateNodeData(id, {
      ...data,
      config: { ...config, [key]: value },
    });
  };

  const updateDBType = (newType: string) => {
    updateNodeData(id, {
      ...data,
      subType: newType,
      label: newType,
    });
  };

  return (
    <BaseNode
      {...props}
      icon={Database}
      accentColor={dbConfig.color}
      glowColor="bg-blue-500/20"
      borderColor="border-blue-500/20"
      handleColor="bg-blue-400"
      badge={dbType}
    >
      <div className="space-y-3">
        {/* Database Type */}
        <div>
          <Label className={theme.textMuted}>Database Type</Label>
          <Select
            value={dbType}
            onChange={(e) => updateDBType(e.target.value)}
          >
            {Object.keys(DATABASE_TYPES).map((db) => (
              <option key={db} value={db}>{db}</option>
            ))}
          </Select>
        </div>

        {/* Connection String */}
        <div>
          <Label className={theme.textMuted}>Connection String</Label>
          <Input
            value={config.connectionString || ''}
            onChange={(e) => updateConfig('connectionString', e.target.value)}
            placeholder={dbConfig.placeholder}
            type={dbType !== 'SQLite' ? 'password' : 'text'}
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            {dbType === 'SQLite' ? 'File path or :memory: for in-memory DB' : 'Full connection URI'}
          </p>
        </div>

        {/* SQL Query */}
        <div>
          <Label className={theme.textMuted}>SQL Query</Label>
          <Textarea
            value={config.query || ''}
            onChange={(e) => updateConfig('query', e.target.value)}
            placeholder="SELECT * FROM users WHERE id = {{userId}}"
            rows={4}
            className="font-mono text-[10px]"
          />
          <p className={cn('text-[9px] mt-1', theme.textMuted)}>
            Use {'{{variable}}'} for parameterized queries
          </p>
        </div>

        {/* Query Preview */}
        {config.query && (
          <div className={cn('p-2 rounded-lg text-[9px] font-mono', theme.btnBg)}>
            <div className={cn('font-medium mb-1', theme.textMuted)}>Query Preview</div>
            <div className={cn('whitespace-pre-wrap break-all', theme.textSecondary)}>
              {config.query.slice(0, 100)}{config.query.length > 100 ? '...' : ''}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
};
