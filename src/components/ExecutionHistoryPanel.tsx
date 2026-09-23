import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, XCircle, Loader2, RefreshCw, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { cn } from './ui';

interface ExecutionResult {
  id: string;
  workflow_id: string;
  status: 'completed' | 'failed' | 'running' | 'pending';
  result: {
    execution_order?: string[];
    node_results?: Record<string, any>;
  } | null;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

interface ExecutionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string | null;
  onLoadResults: (nodeResults: Record<string, any>) => void;
}

export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({ 
  isOpen, 
  onClose, 
  workflowId,
  onLoadResults 
}) => {
  const { theme } = useTheme();
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8088/api';

  const fetchExecutions = async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/executions/${workflowId}`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data);
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workflowId) {
      fetchExecutions();
    }
  }, [isOpen, workflowId]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress...';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
    return `${(diff / 60000).toFixed(1)}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'failed':
        return <XCircle size={16} className="text-red-400" />;
      case 'running':
        return <Loader2 size={16} className="text-blue-400 animate-spin" />;
      default:
        return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'running':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 z-40 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        style={{ left: '-100vw', width: '100vw' }}
      />
      
      {/* Panel */}
      <div className={cn(
        'relative w-[420px] h-full border-l shadow-2xl flex flex-col',
        theme.panelBg, theme.panelBorder
      )}>
        {/* Header */}
        <div className={cn('flex items-center justify-between p-4 border-b', theme.nodeHeaderBorder)}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
              <Clock size={16} className="text-white" />
            </div>
            <div>
              <h2 className={cn('font-bold', theme.textPrimary)}>Execution History</h2>
              <p className={cn('text-[10px]', theme.textMuted)}>
                {executions.length} execution{executions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchExecutions}
              disabled={loading}
              className={cn('p-2 rounded-xl transition-colors', theme.btnHover, theme.textMuted)}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={onClose}
              className={cn('p-2 rounded-xl transition-colors', theme.btnHover, theme.textMuted)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {!workflowId ? (
            <div className={cn('text-center py-12', theme.textMuted)}>
              <Clock size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">Save your workflow first to see execution history</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-400" />
            </div>
          ) : executions.length === 0 ? (
            <div className={cn('text-center py-12', theme.textMuted)}>
              <Clock size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No executions yet</p>
              <p className="text-xs mt-1">Run your workflow to see results here</p>
            </div>
          ) : (
            executions.map(exec => {
              const isExpanded = expandedId === exec.id;
              
              return (
                <div 
                  key={exec.id}
                  className={cn(
                    'rounded-xl border overflow-hidden transition-all',
                    theme.nodeBg, theme.nodeBorder
                  )}
                >
                  {/* Execution header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                    className={cn(
                      'w-full p-4 flex items-center gap-3 text-left transition-colors',
                      theme.btnHover
                    )}
                  >
                    {getStatusIcon(exec.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-semibold text-sm', theme.textPrimary)}>
                          {formatTime(exec.started_at)}
                        </span>
                        <span className={cn(
                          'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          getStatusColor(exec.status)
                        )}>
                          {exec.status}
                        </span>
                      </div>
                      <div className={cn('text-[10px] mt-0.5', theme.textMuted)}>
                        Duration: {getDuration(exec.started_at, exec.completed_at)}
                        {exec.result?.execution_order && (
                          <span className="ml-2">
                            • {exec.result.execution_order.length} nodes executed
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className={theme.textMuted} />
                    ) : (
                      <ChevronRight size={16} className={theme.textMuted} />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className={cn('border-t p-4', theme.nodeHeaderBorder)}>
                      {exec.error ? (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                          {exec.error}
                        </div>
                      ) : exec.result?.node_results ? (
                        <div className="space-y-3">
                          {/* Load results button */}
                          <button
                            onClick={() => {
                              if (exec.result?.node_results) {
                                onLoadResults(exec.result.node_results);
                              }
                            }}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white text-xs font-semibold transition-all"
                          >
                            Load Results to Canvas
                          </button>

                          {/* Node results */}
                          <div className="space-y-2">
                            <span className={cn('text-[10px] font-bold uppercase tracking-widest', theme.textMuted)}>
                              Node Results
                            </span>
                            {Object.entries(exec.result.node_results).map(([nodeId, result]) => (
                              <div 
                                key={nodeId}
                                className={cn('p-3 rounded-lg border', theme.inputBg, theme.inputBorder)}
                              >
                                <div className={cn('text-[10px] font-bold mb-1', theme.textSecondary)}>
                                  {nodeId}
                                </div>
                                <pre className={cn(
                                  'text-[10px] font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto',
                                  theme.textMuted
                                )}>
                                  {JSON.stringify(result, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className={cn('text-xs', theme.textMuted)}>No result data available</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
