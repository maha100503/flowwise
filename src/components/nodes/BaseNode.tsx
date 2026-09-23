import React, { useState } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
import { LucideIcon, X, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn, Label } from '../ui';
import { useTheme } from '../../ThemeContext';

interface BaseNodeProps {
  id?: string;
  selected?: boolean;
  label: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  glowColor?: string;
  accentColor?: string;
  inputs?: boolean;
  outputs?: boolean;
  inputColor?: string;
  outputColor?: string;
  badge?: string;
  extraHandles?: React.ReactNode;
}

/** Summarize execution result into compact key-value pairs */
function summarizeResult(result: any): { summary: Record<string, string>; hasError: boolean } {
  if (!result || typeof result !== 'object') {
    return { summary: { result: String(result) }, hasError: false };
  }

  const summary: Record<string, string> = {};
  const hasError = !!result.error;

  if (result.error) {
    summary['Error'] = String(result.error);
  }

  const data = result.output || result;

  // ML / Evaluate metrics
  if (data.accuracy != null) summary['Accuracy'] = (data.accuracy * 100).toFixed(1) + '%';
  if (data.precision != null) summary['Precision'] = (data.precision * 100).toFixed(1) + '%';
  if (data.recall != null) summary['Recall'] = (data.recall * 100).toFixed(1) + '%';
  if (data.f1_score != null) summary['F1 Score'] = (data.f1_score * 100).toFixed(1) + '%';
  if (data.score != null && !data.accuracy) summary['Score'] = (data.score * 100).toFixed(1) + '%';
  if (data.algorithm) summary['Algorithm'] = data.algorithm;
  if (data.task) summary['Task'] = data.task;
  if (data.samples != null) summary['Samples'] = data.samples.toLocaleString();
  if (data.features != null) summary['Features'] = String(data.features);

  // Data shape
  if (data.row_count != null) summary['Rows'] = data.row_count.toLocaleString();
  if (data._rows_total != null) summary['Total Rows'] = data._rows_total.toLocaleString();
  if (data.columns?.length != null) summary['Columns'] = String(data.columns.length);
  if (data.original_count != null && data.row_count != null && data.original_count !== data.row_count) {
    summary['Filtered'] = `${data.original_count.toLocaleString()} → ${data.row_count.toLocaleString()}`;
  }

  // Train/Test split
  if (data.X_train) summary['Train'] = Array.isArray(data.X_train) ? data.X_train.length.toLocaleString() + ' samples' : '';
  if (data.X_test) summary['Test'] = Array.isArray(data.X_test) ? data.X_test.length.toLocaleString() + ' samples' : '';

  // Predictions summary
  if (data.predictions && Array.isArray(data.predictions)) {
    const unique = new Set(data.predictions);
    summary['Predictions'] = `${data.predictions.length.toLocaleString()} values (${unique.size} unique)`;
  }

  // Confusion matrix
  if (data.confusion_matrix) summary['Confusion Matrix'] = `${data.confusion_matrix.length}x${data.confusion_matrix.length}`;

  // File info
  if (data.filename) summary['File'] = data.filename;
  if (data.format) summary['Format'] = data.format;
  if (data.target_column) summary['Target'] = data.target_column;

  // Encoding classes
  if (data.classes && typeof data.classes === 'object' && !Array.isArray(data.classes)) {
    const classCount = Object.keys(data.classes).length;
    summary['Encoded Cols'] = `${classCount} columns`;
  }

  // If nothing was summarized and no error, show a generic
  if (Object.keys(summary).length === 0) {
    const keys = Object.keys(data).filter(k => !k.startsWith('_'));
    summary['Output Keys'] = keys.slice(0, 5).join(', ') + (keys.length > 5 ? '...' : '');
  }

  return { summary, hasError };
}

const ExecutionOutput: React.FC<{ result: any }> = ({ result }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { summary, hasError } = summarizeResult(result);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-2 pt-3 border-t border-slate-700/50 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className={cn('!text-[9px]', hasError ? 'text-red-400' : 'text-emerald-400')}>
          Execution Output
        </Label>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className={cn('p-0.5 rounded hover:bg-white/10 transition-colors', theme.textMuted)}
            title="Copy raw JSON"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn('p-0.5 rounded hover:bg-white/10 transition-colors', theme.textMuted)}
            title={expanded ? 'Show summary' : 'Show raw JSON'}
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        </div>
      </div>

      {!expanded ? (
        <div className={cn('p-2 rounded-lg space-y-1', theme.inputBg, theme.inputBorder, 'border')}>
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-[10px]">
              <span className={cn('font-semibold whitespace-nowrap', hasError && key === 'Error' ? 'text-red-400' : theme.textMuted)}>{key}:</span>
              <span className={cn('font-mono break-all', theme.inputText)}>{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('p-2 rounded-lg font-mono text-[10px] break-words whitespace-pre-wrap max-h-[200px] overflow-y-auto', theme.inputBg, theme.inputText, theme.inputBorder, 'border')}>
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
};

export const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  selected,
  label,
  icon: Icon,
  children,
  className,
  headerClassName,
  glowColor = 'bg-blue-500/20',
  accentColor = 'from-blue-500 to-cyan-500',
  inputs = true,
  outputs = true,
  inputColor = 'bg-slate-400',
  outputColor = 'bg-slate-400',
  badge,
  extraHandles,
}) => {
  const { deleteElements, getNode } = useReactFlow();
  const { theme } = useTheme();

  const nodeData = id ? getNode(id)?.data : null;
  const executionResult = nodeData?.executionResult as any;
  const streamingOutput = nodeData?.streamingOutput as string | undefined;
  const nodeStatus = nodeData?.nodeStatus as string | undefined;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteElements({ nodes: [{ id }] });
    }
  };

  return (
    <div className={cn('flow-node group', selected && 'selected')}>
      {/* Resize handles */}
      <NodeResizer
        isVisible={!!selected}
        minWidth={240}
        minHeight={120}
        lineClassName="!border-blue-500/40"
        handleClassName="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-slate-950 !rounded-md"
      />

      {/* Glow layer */}
      <div className={cn('flow-node-glow', glowColor)} />

      <div
        className={cn(
          'relative min-w-[260px] max-w-[280px] rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 h-full flex flex-col',
          theme.nodeBg,
          selected
            ? cn(theme.nodeBorderSelected, 'shadow-lg')
            : cn(theme.nodeBorder, 'hover:border-opacity-60'),
          className
        )}
      >
        {/* Left accent bar */}
        <div className={cn(
          'absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b opacity-60 transition-opacity duration-300',
          accentColor,
          selected && 'opacity-100'
        )} />

        {inputs && (
          <Handle
            type="target"
            position={Position.Left}
            className={cn('!w-2.5 !h-2.5 !border-[1.5px] !shadow-lg !-left-[5px]', theme.handleBorder, inputColor)}
          />
        )}

        {/* Header */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 border-b shrink-0',
          theme.nodeHeaderBorder,
          headerClassName
        )}>
          <div className={cn(
            'p-2 rounded-xl bg-gradient-to-br shadow-inner',
            accentColor,
            'opacity-90'
          )}>
            <Icon size={16} className="text-white drop-shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn('font-semibold text-sm tracking-tight block truncate', theme.nodeText)}>
              {label}
            </span>
          </div>
          {badge && (
            <span className={cn('text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full', theme.nodeTextMuted, theme.btnBg)}>
              {badge}
            </span>
          )}
          {/* Status dot */}
          <div className={cn(
            'w-2 h-2 rounded-full shadow-sm',
            nodeStatus === 'running' && 'bg-amber-400 animate-pulse shadow-amber-400/50',
            nodeStatus === 'completed' && 'bg-emerald-400 shadow-emerald-400/50',
            nodeStatus === 'error' && 'bg-red-400 shadow-red-400/50',
            !nodeStatus && 'bg-emerald-400 animate-glow shadow-emerald-400/50',
          )} />
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className={cn('opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 -mr-1', theme.nodeTextMuted)}
            title="Delete node"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body — scrollable when node is resized */}
        <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
          {children}

          {streamingOutput && (
            <div className="mt-2 pt-3 border-t border-slate-700/50 flex flex-col gap-1.5">
              <Label className="!text-[9px] text-amber-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Live Output
              </Label>
              <div className={cn('p-2 rounded-lg font-mono text-[10px] break-words whitespace-pre-wrap max-h-[120px] overflow-y-auto', theme.inputBg, theme.inputText, theme.inputBorder, 'border')}>
                {streamingOutput}
                <span className="inline-block w-1 h-3 bg-amber-400 animate-pulse ml-0.5 align-text-bottom" />
              </div>
            </div>
          )}

          {executionResult && (
            <ExecutionOutput result={executionResult} />
          )}
        </div>

        {outputs && (
          <Handle
            type="source"
            position={Position.Right}
            className={cn('!w-2.5 !h-2.5 !border-[1.5px] !shadow-lg !-right-[5px]', theme.handleBorder, outputColor)}
          />
        )}

        {extraHandles}
      </div>
    </div>
  );
};
