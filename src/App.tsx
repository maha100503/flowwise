import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowInstance,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Sidebar } from './components/Sidebar';
import { AINode } from './components/nodes/AINode';
import { LogicNode } from './components/nodes/LogicNode';
import { ServerNode } from './components/nodes/ServerNode';
import { IONode } from './components/nodes/IONode';
import { DataNode } from './components/nodes/DataNode';
import { IntegrationNode } from './components/nodes/IntegrationNode';
import { TimerNode } from './components/nodes/TimerNode';
import { WebhookNode } from './components/nodes/WebhookNode';
import { ConditionalNode } from './components/nodes/ConditionalNode';
import { TextTemplateNode } from './components/nodes/TextTemplateNode';
import { CodeNode } from './components/nodes/CodeNode';
import { NotificationNode } from './components/nodes/NotificationNode';
import { HTTPNode } from './components/nodes/HTTPNode';
import { DatabaseNode } from './components/nodes/DatabaseNode';
import { EmailNode } from './components/nodes/EmailNode';
import { SlackNode } from './components/nodes/SlackNode';
import { RegexNode } from './components/nodes/RegexNode';
import { CacheNode } from './components/nodes/CacheNode';
import { CryptoNode } from './components/nodes/CryptoNode';
import { JsonTransformNode } from './components/nodes/JsonTransformNode';
import { ValidatorNode } from './components/nodes/ValidatorNode';
import { AggregatorNode } from './components/nodes/AggregatorNode';
import { RSSNode } from './components/nodes/RSSNode';
import { QRCodeNode } from './components/nodes/QRCodeNode';
import { MarkdownNode } from './components/nodes/MarkdownNode';
import { WebSocketNode } from './components/nodes/WebSocketNode';
import { TeamsNode } from './components/nodes/TeamsNode';
import { OutlookNode } from './components/nodes/OutlookNode';
import { WhatsAppNode } from './components/nodes/WhatsAppNode';
import { TelegramNode } from './components/nodes/TelegramNode';
import { InstagramNode } from './components/nodes/InstagramNode';
import { MLNode } from './components/nodes/MLNode';
import { TimeSeriesNode } from './components/nodes/TimeSeriesNode';
import { DataPrepNode } from './components/nodes/DataPrepNode';
import { EvaluateNode } from './components/nodes/EvaluateNode';
import { ClusteringNode } from './components/nodes/ClusteringNode';
import { DimensionalityNode } from './components/nodes/DimensionalityNode';
import { AnomalyNode } from './components/nodes/AnomalyNode';
import { EnsembleNode } from './components/nodes/EnsembleNode';
import { NeuralNetworkNode } from './components/nodes/NeuralNetworkNode';
import { FileUploadNode } from './components/nodes/FileUploadNode';
import { DataCleanerNode } from './components/nodes/DataCleanerNode';
import { MergeNode } from './components/nodes/MergeNode';
import { FeatureEngineerNode } from './components/nodes/FeatureEngineerNode';
import { ModelSelectorNode } from './components/nodes/ModelSelectorNode';
import { PredictNode } from './components/nodes/PredictNode';
import { FileExportNode } from './components/nodes/FileExportNode';
import { CopilotPanel } from './components/CopilotPanel';
import { NodeDetailModal } from './components/NodeDetailModal';
import { StatusEdge } from './components/StatusEdge';
import type { EdgeStatus } from './components/StatusEdge';
import { TemplatesModal } from './components/TemplatesModal';
import { ExecutionHistoryPanel } from './components/ExecutionHistoryPanel';
import { WorkflowsPanel } from './components/WorkflowsPanel';
import { CustomNode, NodeType } from './types';
import { ThemeProvider, useTheme, themes, ThemeId } from './ThemeContext';
import { cn } from './components/ui';
import { Palette, Save, Rocket, Loader2, LayoutTemplate, Download, Upload, Clock, Copy, Keyboard, FolderOpen, Sparkles } from 'lucide-react';

const nodeTypes = {
  ai: AINode,
  logic: LogicNode,
  server: ServerNode,
  io: IONode,
  data: DataNode,
  integration: IntegrationNode,
  timer: TimerNode,
  webhook: WebhookNode,
  conditional: ConditionalNode,
  template: TextTemplateNode,
  code: CodeNode,
  notification: NotificationNode,
  http: HTTPNode,
  database: DatabaseNode,
  email: EmailNode,
  slack: SlackNode,
  regex: RegexNode,
  cache: CacheNode,
  crypto: CryptoNode,
  json_transform: JsonTransformNode,
  validator: ValidatorNode,
  aggregator: AggregatorNode,
  rss: RSSNode,
  qrcode: QRCodeNode,
  markdown: MarkdownNode,
  websocket: WebSocketNode,
  teams: TeamsNode,
  outlook: OutlookNode,
  whatsapp: WhatsAppNode,
  telegram: TelegramNode,
  instagram: InstagramNode,
  ml: MLNode,
  timeseries: TimeSeriesNode,
  data_prep: DataPrepNode,
  evaluate: EvaluateNode,
  clustering: ClusteringNode,
  dimensionality: DimensionalityNode,
  anomaly: AnomalyNode,
  ensemble: EnsembleNode,
  neural_network: NeuralNetworkNode,
  file_upload: FileUploadNode,
  data_cleaner: DataCleanerNode,
  merge: MergeNode,
  feature_engineer: FeatureEngineerNode,
  model_selector: ModelSelectorNode,
  predict: PredictNode,
  file_export: FileExportNode,
};

const edgeTypes = { status: StatusEdge };

const initialNodes: CustomNode[] = [];
const initialEdges: Edge[] = [];

// Theme Picker Component
const ThemePicker = () => {
  const { themeId, setThemeId, theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'p-2 rounded-xl backdrop-blur-xl border transition-all',
          theme.panelBg, theme.panelBorder,
          'hover:scale-105 active:scale-95'
        )}
        title="Change theme"
      >
        <Palette size={16} className={theme.panelText} />
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 top-full mt-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl min-w-[160px] z-50',
          theme.panelBg, theme.panelBorder
        )}>
          <div className="space-y-1">
            {(Object.keys(themes) as ThemeId[]).map((id) => {
              const t = themes[id];
              const active = id === themeId;
              return (
                <button
                  key={id}
                  onClick={() => { setThemeId(id); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left',
                    active ? 'bg-blue-500/20 border border-blue-500/30' : cn(theme.btnHover, 'border border-transparent')
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/20 shadow-inner"
                    style={{ backgroundColor: t.preview }}
                  />
                  <span className={cn('text-xs font-semibold', active ? 'text-blue-400' : theme.textSecondary)}>
                    {t.name}
                  </span>
                  {active && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function FlowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { theme, themeId } = useTheme();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [streamingOutputs, setStreamingOutputs] = useState<Record<string, string>>({});
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  
  // New feature states
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [detailNode, setDetailNode] = useState<any>(null);

  const API_BASE = 'http://localhost:8088/api';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl/Cmd + E = Execute
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleDeploy();
      }
      // Ctrl/Cmd + T = Templates
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setTemplatesOpen(true);
      }
      // Ctrl/Cmd + H = History
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setHistoryOpen(true);
      }
      // Ctrl/Cmd + G = AI Copilot
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setCopilotOpen(true);
      }
      // Ctrl/Cmd + D = Duplicate selected nodes
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelectedNodes();
      }
      // Ctrl/Cmd + B = Browse workflows
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setWorkflowsOpen(true);
      }
      // Escape = Close modals
      if (e.key === 'Escape') {
        setTemplatesOpen(false);
        setHistoryOpen(false);
        setWorkflowsOpen(false);
        setShowShortcuts(false);
        setCopilotOpen(false);
      }
      // ? = Show shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(s => !s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, workflowId, workflowName]);

  // Duplicate selected nodes
  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      setStatusMsg('Select nodes to duplicate');
      setTimeout(() => setStatusMsg(null), 2000);
      return;
    }
    
    const newNodes = selectedNodes.map(node => ({
      ...node,
      id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      selected: false,
      data: { ...node.data },
    }));
    
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
    setStatusMsg(`Duplicated ${newNodes.length} node(s)`);
    setTimeout(() => setStatusMsg(null), 2000);
  }, [nodes, setNodes]);

  // Export workflow as JSON
  const handleExport = useCallback(() => {
    const workflow = {
      name: workflowName,
      version: '1.0',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, animated: e.animated })),
    };
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_')}_workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setStatusMsg('Workflow exported ✓');
    setTimeout(() => setStatusMsg(null), 2000);
  }, [nodes, edges, workflowName]);

  // Import workflow from JSON
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        if (workflow.nodes && workflow.edges) {
          setNodes(workflow.nodes);
          setEdges(workflow.edges.map((e: Edge) => ({ ...e, type: 'status', animated: false, data: { status: 'idle' } })));
          if (workflow.name) setWorkflowName(workflow.name);
          setWorkflowId(null); // Reset ID since it's a new import
          setStatusMsg('Workflow imported ✓');
          setTimeout(() => setStatusMsg(null), 2000);
        } else {
          throw new Error('Invalid workflow format');
        }
      } catch (err) {
        setStatusMsg('Error: Invalid workflow file');
        setTimeout(() => setStatusMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be imported again
    event.target.value = '';
  }, [setNodes, setEdges]);

  // Load template
  const handleLoadTemplate = useCallback((templateNodes: CustomNode[], templateEdges: Edge[], name: string) => {
    setNodes(templateNodes);
    setEdges(templateEdges.map(e => ({ ...e, type: 'status', animated: false, data: { status: 'idle' } })));
    setWorkflowName(name);
    setWorkflowId(null);
    setStatusMsg(`Loaded template: ${name}`);
    setTimeout(() => setStatusMsg(null), 2000);
  }, [setNodes, setEdges]);

  // Load a saved workflow by ID
  const handleLoadWorkflow = useCallback(async (workflowIdToLoad: string) => {
    try {
      const res = await fetch(`${API_BASE}/workflows/${workflowIdToLoad}`);
      if (!res.ok) throw new Error('Workflow not found');
      const data = await res.json();
      setNodes(data.nodes);
      setEdges(data.edges.map((e: Edge) => ({ ...e, type: 'status', animated: false, data: { status: 'idle' } })));
      setWorkflowName(data.name);
      setWorkflowId(data.id);
      setStatusMsg(`Loaded: ${data.name}`);
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  }, [setNodes, setEdges]);

  // Handle AI Copilot workflow generation
  const handleWorkflowGenerated = useCallback((workflow: any) => {
    if (!workflow.nodes || !workflow.edges) return;
    
    // Convert Copilot-generated nodes to proper format
    const newNodes: CustomNode[] = workflow.nodes.map((node: any) => ({
      id: node.id,
      type: node.data?.type || node.type || 'data',
      position: node.position,
      data: {
        label: node.data?.label || 'Node',
        type: node.data?.type || 'data',
        subType: node.data?.subType,
        config: node.data?.config || {},
      },
    }));
    
    const newEdges: Edge[] = workflow.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: 'status',
      data: { status: 'idle' },
    }));
    
    setNodes(newNodes);
    setEdges(newEdges);
    if (workflow.name) setWorkflowName(workflow.name);
    setWorkflowId(null);
    setCopilotOpen(false);
    setStatusMsg(`Generated workflow: ${workflow.name || 'New Workflow'}`);
    setTimeout(() => setStatusMsg(null), 3000);
  }, [setNodes, setEdges]);

  // Load execution results to nodes
  const handleLoadResults = useCallback((nodeResults: Record<string, any>) => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        executionResult: nodeResults[node.id]
      }
    })));
    setHistoryOpen(false);
    setStatusMsg('Results loaded to canvas');
    setTimeout(() => setStatusMsg(null), 2000);
  }, [setNodes]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        name: workflowName,
        nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, animated: e.animated })),
      };

      let res;
      if (workflowId) {
        res = await fetch(`${API_BASE}/workflows/${workflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const data = await res.json();
      setWorkflowId(data.id);
      setStatusMsg('Saved ✓');
      setTimeout(() => setStatusMsg(null), 3000);
      return data.id;
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, workflowId, workflowName]);

  const handleDeploy = useCallback(async () => {
    let currentWorkflowId = workflowId;
    if (!currentWorkflowId) {
      currentWorkflowId = await handleSave();
    }
    if (!currentWorkflowId && !saving) {
      setStatusMsg('Save first before deploying');
      return;
    }
    setDeploying(true);
    setStatusMsg('Running workflow...');
    setStreamingOutputs({});
    setActiveNodeId(null);

    // Clear previous execution results
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, executionResult: undefined, streamingOutput: undefined, nodeStatus: undefined }
    })));
    // Reset all edge statuses
    setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, status: 'idle' } })));

    const WS_URL = `ws://localhost:8088/ws/execute/${currentWorkflowId}`;
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'execute', input_data: {} }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'execution_started':
          setStatusMsg(`Executing… (${msg.total_nodes} nodes)`);
          break;

        case 'node_started':
          setActiveNodeId(msg.node_id);
          setStatusMsg(`Running: ${msg.node_label} (${Math.round((msg.progress ?? 0) * 100)}%)`);
          // Mark node as running
          setNodes(nds => nds.map(n =>
            n.id === msg.node_id
              ? { ...n, data: { ...n.data, nodeStatus: 'running' } }
              : n
          ));
          // Mark incoming edges as running
          setEdges(eds => eds.map(e =>
            e.target === msg.node_id
              ? { ...e, data: { ...e.data, status: 'running' } }
              : e
          ));
          break;

        case 'node_output_stream':
          // Append streaming output chunk for this node
          setStreamingOutputs(prev => ({
            ...prev,
            [msg.node_id]: (prev[msg.node_id] || '') + msg.chunk,
          }));
          // Also push into node data so BaseNode can display it live
          setNodes(nds => nds.map(n =>
            n.id === msg.node_id
              ? { ...n, data: { ...n.data, streamingOutput: (n.data.streamingOutput as string || '') + msg.chunk } }
              : n
          ));
          break;

        case 'node_completed':
          setNodes(nds => nds.map(n =>
            n.id === msg.node_id
              ? { ...n, data: { ...n.data, executionResult: msg.result, nodeStatus: 'completed', streamingOutput: undefined } }
              : n
          ));
          // Mark incoming edges as success
          setEdges(eds => eds.map(e =>
            e.target === msg.node_id
              ? { ...e, data: { ...e.data, status: 'success' } }
              : e
          ));
          break;

        case 'node_error':
          setNodes(nds => nds.map(n =>
            n.id === msg.node_id
              ? { ...n, data: { ...n.data, executionResult: { error: msg.error }, nodeStatus: 'error' } }
              : n
          ));
          // Mark incoming edges as error
          setEdges(eds => eds.map(e =>
            e.target === msg.node_id
              ? { ...e, data: { ...e.data, status: 'error' } }
              : e
          ));
          break;

        case 'execution_completed':
          setStatusMsg('Completed ✓');
          setDeploying(false);
          setActiveNodeId(null);
          setTimeout(() => setStatusMsg(null), 5000);
          ws.close();
          break;

        case 'execution_failed':
          setStatusMsg(`Error: ${msg.error}`);
          setDeploying(false);
          setActiveNodeId(null);
          ws.close();
          break;

        default:
          break;
      }
    };

    ws.onerror = () => {
      setStatusMsg('WebSocket connection error — falling back to REST');
      setDeploying(false);
      ws.close();
    };

    ws.onclose = () => {
      setDeploying(false);
    };
  }, [workflowId, handleSave, saving]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'status', animated: false, data: { status: 'idle' } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;
      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;
      const { type, subType, label } = JSON.parse(dataStr);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: CustomNode = {
        id: `${type}-${Date.now()}`,
        type: type as NodeType,
        position,
        data: { label, type: type as NodeType, subType, config: {} },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: any) => {
    setDetailNode(node);
  }, []);

  return (
    <div data-theme={themeId} className={cn('flex h-screen w-screen overflow-hidden font-sans', theme.canvasBg, theme.textSecondary)}>
      <Sidebar onExecute={handleDeploy} />

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as any}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.2 }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className={theme.canvasBg}
          colorMode={theme.colorMode}
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{ type: 'status', animated: false, data: { status: 'idle' } }}
        >
          <Background color={theme.dotColor} variant={BackgroundVariant.Dots} gap={24} size={1.5} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const colorMap: Record<string, string> = {
                ai: '#10b981',
                logic: '#3b82f6',
                server: '#a855f7',
                data: '#f59e0b',
                io: '#64748b',
                integration: '#0ea5e9',
                timer: '#06b6d4',
                webhook: '#ec4899',
                conditional: '#eab308',
                template: '#8b5cf6',
                code: '#84cc16',
                notification: '#f43f5e',
                http: '#3b82f6',
                database: '#0ea5e9',
                email: '#f43f5e',
                slack: '#4A154B',
              };
              return colorMap[n.type || ''] || '#64748b';
            }}
            maskColor="rgba(2, 6, 23, 0.75)"
          />

          {/* Top-left toolbar - Templates & Import/Export */}
          <Panel position="top-left" className="flex gap-2 items-start">
            <div className={cn('backdrop-blur-xl border p-1 rounded-2xl flex gap-1 shadow-2xl', theme.panelBg, theme.panelBorder)}>
              <button
                onClick={() => setTemplatesOpen(true)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5', theme.btnBg, theme.btnHover, theme.textSecondary)}
                title="Templates (Ctrl+T)"
              >
                <LayoutTemplate size={12} />
                Templates
              </button>
              <button
                onClick={handleExport}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5', theme.btnBg, theme.btnHover, theme.textSecondary)}
                title="Export workflow"
              >
                <Download size={12} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5', theme.btnBg, theme.btnHover, theme.textSecondary)}
                title="Import workflow"
              >
                <Upload size={12} />
              </button>
            </div>
          </Panel>

          {/* Top-right toolbar */}
          <Panel position="top-right" className="flex gap-2 items-start">
            <button
              onClick={() => setCopilotOpen(true)}
              className={cn(
                'p-2 rounded-xl backdrop-blur-xl border transition-all bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30',
                'hover:scale-105 active:scale-95 hover:from-violet-500/30 hover:to-purple-500/30'
              )}
              title="AI Copilot (Ctrl+G)"
            >
              <Sparkles size={16} className="text-violet-400" />
            </button>
            <button
              onClick={() => setShowShortcuts(s => !s)}
              className={cn(
                'p-2 rounded-xl backdrop-blur-xl border transition-all',
                theme.panelBg, theme.panelBorder,
                'hover:scale-105 active:scale-95'
              )}
              title="Keyboard shortcuts (?)"
            >
              <Keyboard size={16} className={theme.panelText} />
            </button>
            <button
              onClick={() => setWorkflowsOpen(true)}
              className={cn(
                'p-2 rounded-xl backdrop-blur-xl border transition-all',
                theme.panelBg, theme.panelBorder,
                'hover:scale-105 active:scale-95'
              )}
              title="My Workflows (Ctrl+B)"
            >
              <FolderOpen size={16} className={theme.panelText} />
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              className={cn(
                'p-2 rounded-xl backdrop-blur-xl border transition-all',
                theme.panelBg, theme.panelBorder,
                'hover:scale-105 active:scale-95'
              )}
              title="Execution history (Ctrl+H)"
            >
              <Clock size={16} className={theme.panelText} />
            </button>
            <ThemePicker />
            <div className={cn('backdrop-blur-xl border p-1 rounded-2xl flex gap-1 shadow-2xl', theme.panelBg, theme.panelBorder)}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn('px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5', theme.btnBg, theme.btnHover, theme.textSecondary, saving && 'opacity-50')}
                title="Save (Ctrl+S)"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className={cn('px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-1.5', deploying && 'opacity-50')}
                title="Execute (Ctrl+E)"
              >
                {deploying ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                {deploying ? 'Running...' : 'Deploy'}
              </button>
            </div>
          </Panel>

          {/* Status bar */}
          <Panel position="bottom-center">
            <div className={cn('backdrop-blur-xl border px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6', theme.panelBg, theme.panelBorder)}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-glow shadow-sm shadow-emerald-400/50" />
                <span className={cn('text-xs font-medium', theme.panelText)}>
                  Status: {statusMsg ? (
                    <span className={statusMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}>{statusMsg}</span>
                  ) : (
                    <span className="text-emerald-400">Ready</span>
                  )}
                </span>
              </div>
              <div className={cn('h-4 w-px', theme.divider)} />
              <div className="flex items-center gap-4">
                <span className={cn('text-xs font-medium', theme.textMuted)}>
                  Nodes <span className={cn('font-mono', theme.textSecondary)}>{nodes.length}</span>
                </span>
                <span className={cn('text-xs font-medium', theme.textMuted)}>
                  Edges <span className={cn('font-mono', theme.textSecondary)}>{edges.length}</span>
                </span>
              </div>
              <div className={cn('h-4 w-px', theme.divider)} />
              <button
                onClick={() => duplicateSelectedNodes()}
                className={cn('text-xs font-medium flex items-center gap-1.5 transition-colors', theme.textMuted, 'hover:text-blue-400')}
                title="Duplicate selected (Ctrl+D)"
              >
                <Copy size={12} />
                Duplicate
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={handleLoadTemplate}
      />

      {/* Execution History Panel */}
      <ExecutionHistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        workflowId={workflowId}
        onLoadResults={handleLoadResults}
      />

      {/* Workflows Panel */}
      <WorkflowsPanel
        isOpen={workflowsOpen}
        onClose={() => setWorkflowsOpen(false)}
        onLoadWorkflow={handleLoadWorkflow}
        currentWorkflowId={workflowId}
      />

      {/* AI Copilot Panel */}
      <CopilotPanel
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        onWorkflowGenerated={handleWorkflowGenerated}
        currentNodes={nodes}
      />

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className={cn('relative w-[400px] rounded-2xl border shadow-2xl p-6', theme.panelBg, theme.panelBorder)}>
            <h3 className={cn('text-lg font-bold mb-4 flex items-center gap-2', theme.textPrimary)}>
              <Keyboard size={20} />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-3">
              {[
                { keys: 'Ctrl + S', action: 'Save workflow' },
                { keys: 'Ctrl + E', action: 'Execute workflow' },
                { keys: 'Ctrl + G', action: 'AI Copilot' },
                { keys: 'Ctrl + T', action: 'Open templates' },
                { keys: 'Ctrl + B', action: 'My Workflows' },
                { keys: 'Ctrl + H', action: 'Execution history' },
                { keys: 'Ctrl + D', action: 'Duplicate selected' },
                { keys: 'Delete', action: 'Delete selected' },
                { keys: 'Escape', action: 'Close modals' },
                { keys: '?', action: 'Toggle shortcuts' },
              ].map(({ keys, action }) => (
                <div key={keys} className="flex items-center justify-between">
                  <span className={cn('text-sm', theme.textSecondary)}>{action}</span>
                  <kbd className={cn('px-2 py-1 rounded-lg text-xs font-mono', theme.btnBg, theme.textMuted)}>
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Node Detail Modal */}
      {detailNode && (
        <NodeDetailModal node={detailNode} onClose={() => setDetailNode(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FlowEditor />
    </ThemeProvider>
  );
}
