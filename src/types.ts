import { Node } from '@xyflow/react';

export type NodeType =
  | 'ai'
  | 'logic'
  | 'data'
  | 'io'
  | 'server'
  | 'integration'
  | 'timer'
  | 'webhook'
  | 'conditional'
  | 'template'
  | 'code'
  | 'notification'
  | 'http'
  | 'database'
  | 'email'
  | 'slack'
  | 'regex'
  | 'cache'
  | 'crypto'
  | 'json_transform'
  | 'validator'
  | 'aggregator'
  | 'rss'
  | 'qrcode'
  | 'markdown'
  | 'websocket'
  | 'teams'
  | 'outlook'
  | 'whatsapp'
  | 'telegram'
  | 'instagram'
  | 'ml'
  | 'timeseries'
  | 'data_prep'
  | 'evaluate'
  | 'clustering'
  | 'dimensionality'
  | 'anomaly'
  | 'ensemble'
  | 'neural_network'
  | 'file_upload'
  | 'data_cleaner'
  | 'merge'
  | 'feature_engineer'
  | 'model_selector'
  | 'predict'
  | 'file_export';

export interface NodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  subType?: string;
  config: any;
}

export type CustomNode = Node<NodeData>;
