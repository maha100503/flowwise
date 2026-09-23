import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Loader2, RefreshCw, Play, Trash2, Copy, Check, ExternalLink, Clock, GitBranch } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { cn } from './ui';

interface WorkflowItem {
  id: string;
  name: string;
  node_count: number;
  edge_count: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadWorkflow: (workflowId: string) => void;
  currentWorkflowId: string | null;
}

export const WorkflowsPanel: React.FC<WorkflowsPanelProps> = ({ 
  isOpen, 
  onClose, 
  onLoadWorkflow,
  currentWorkflowId
}) => {
  const { theme } = useTheme();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8088/api';

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/workflows`);
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWorkflows();
    }
  }, [isOpen]);

  const handleDelete = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this workflow? This cannot be undone.')) return;
    
    setDeleting(workflowId);
    try {
      const res = await fetch(`${API_BASE}/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWorkflows(wfs => wfs.filter(w => w.id !== workflowId));
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    } finally {
      setDeleting(null);
    }
  };

  const copyEndpoint = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const endpoint = `${API_BASE}/execute/${workflowId}`;
    await navigator.clipboard.writeText(endpoint);
    setCopiedId(workflowId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <FolderOpen size={16} className="text-white" />
            </div>
            <div>
              <h2 className={cn('font-bold', theme.textPrimary)}>My Workflows</h2>
              <p className={cn('text-[10px]', theme.textMuted)}>
                {workflows.length} saved agent{workflows.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchWorkflows}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-400" />
            </div>
          ) : workflows.length === 0 ? (
            <div className={cn('text-center py-12', theme.textMuted)}>
              <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No workflows saved yet</p>
              <p className="text-xs mt-1">Create and save a workflow to see it here</p>
            </div>
          ) : (
            workflows.map(workflow => {
              const isCurrent = workflow.id === currentWorkflowId;
              const endpoint = `/api/execute/${workflow.id}`;
              
              return (
                <div 
                  key={workflow.id}
                  className={cn(
                    'rounded-xl border overflow-hidden transition-all group',
                    theme.nodeBg, theme.nodeBorder,
                    isCurrent && 'ring-2 ring-blue-500/50 border-blue-500/30'
                  )}
                >
                  {/* Workflow header */}
                  <div className={cn('p-4', isCurrent && 'bg-blue-500/5')}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                        <GitBranch size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-semibold text-sm truncate', theme.textPrimary)}>
                            {workflow.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Current
                            </span>
                          )}
                        </div>
                        <div className={cn('text-[10px] mt-1 flex items-center gap-2', theme.textMuted)}>
                          <span>{workflow.node_count} nodes</span>
                          <span>•</span>
                          <span>{workflow.edge_count} edges</span>
                          <span>•</span>
                          <span>{getTimeAgo(workflow.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Endpoint display */}
                    <div className={cn('mt-3 p-2 rounded-lg border text-[10px] font-mono flex items-center gap-2', theme.inputBg, theme.inputBorder)}>
                      <span className="text-emerald-400">POST</span>
                      <span className={cn('flex-1 truncate', theme.textSecondary)}>{endpoint}</span>
                      <button
                        onClick={(e) => copyEndpoint(workflow.id, e)}
                        className={cn('p-1 rounded transition-colors', theme.btnHover)}
                        title="Copy endpoint"
                      >
                        {copiedId === workflow.id ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} className={theme.textMuted} />
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          onLoadWorkflow(workflow.id);
                          onClose();
                        }}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                          isCurrent 
                            ? cn(theme.btnBg, theme.textMuted, 'cursor-default')
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                        )}
                        disabled={isCurrent}
                      >
                        <ExternalLink size={12} />
                        {isCurrent ? 'Currently Open' : 'Load Workflow'}
                      </button>
                      <button
                        onClick={(e) => handleDelete(workflow.id, e)}
                        disabled={deleting === workflow.id}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                          'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        )}
                        title="Delete workflow"
                      >
                        {deleting === workflow.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className={cn('p-4 border-t', theme.nodeHeaderBorder)}>
          <div className={cn('text-[10px] text-center', theme.textMuted)}>
            <p>Call any workflow via API:</p>
            <code className={cn('block mt-1 p-2 rounded-lg font-mono', theme.inputBg)}>
              POST http://localhost:8088/api/execute/{'<id>'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
