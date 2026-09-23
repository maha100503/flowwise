import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Copy, Check, ChevronDown, ChevronRight, Table, BarChart3, FileJson, Info, Layers } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { cn } from './ui';

interface NodeDetailModalProps {
  node: any;
  onClose: () => void;
}

type Tab = 'summary' | 'table' | 'json';

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, onClose }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [copied, setCopied] = useState(false);

  const data = node?.data || {};
  const result = data.executionResult;
  const output = result?.output || result || {};
  const nodeLabel = data.label || node?.id || 'Node';
  const nodeType = data.type || node?.type || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Detect what kind of data we have
  const rows = output.rows || [];
  const columns: string[] = output.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);
  const hasTableData = rows.length > 0 && columns.length > 0;
  const hasMetrics = output.accuracy != null || output.score != null || output.predictions;
  const hasConfusionMatrix = output.confusion_matrix != null;

  const tabs: { id: Tab; label: string; icon: any; show: boolean }[] = [
    { id: 'summary', label: 'Summary', icon: Info, show: true },
    { id: 'table', label: 'Data Preview', icon: Table, show: hasTableData },
    { id: 'json', label: 'Raw JSON', icon: FileJson, show: true },
  ];

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        'w-[90vw] max-w-[900px] max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden',
        theme.nodeBg, theme.nodeBorder
      )}>
        {/* Header */}
        <div className={cn('flex items-center gap-3 px-5 py-4 border-b shrink-0', theme.nodeHeaderBorder)}>
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-inner">
            <Layers size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={cn('font-bold text-base truncate', theme.nodeText)}>{nodeLabel}</h2>
            <span className={cn('text-[10px] uppercase tracking-wider', theme.textMuted)}>
              {nodeType}{data.subType ? ` · ${data.subType}` : ''}
              {result?.error ? ' · Error' : result ? ' · Completed' : ' · No output'}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={cn('p-2 rounded-lg transition-colors', theme.btnHover, theme.textMuted)}
            title="Copy raw JSON"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
          <button
            onClick={onClose}
            className={cn('p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors', theme.textMuted)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className={cn('flex gap-1 px-5 pt-3 pb-0 border-b shrink-0', theme.nodeHeaderBorder)}>
          {tabs.filter(t => t.show).map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-[1px]',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : cn('border-transparent', theme.textMuted, theme.btnHover)
                )}
              >
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'summary' && <SummaryTab output={output} result={result} nodeType={nodeType} data={data} />}
          {activeTab === 'table' && <DataTableTab rows={rows} columns={columns} />}
          {activeTab === 'json' && <JsonTab result={result} />}
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Summary Tab ── */
const SummaryTab: React.FC<{ output: any; result: any; nodeType: string; data: any }> = ({ output, result, nodeType, data }) => {
  const { theme } = useTheme();

  if (result?.error) {
    return (
      <div className="space-y-4">
        <MetricCard label="Error" value={result.error} variant="error" />
      </div>
    );
  }

  const cards: { label: string; value: string; variant?: 'default' | 'highlight' | 'success' | 'error' }[] = [];

  // File info
  if (output.filename) cards.push({ label: 'File', value: output.filename });
  if (output.format) cards.push({ label: 'Format', value: output.format });
  if (output.row_count != null) cards.push({ label: 'Rows', value: output.row_count.toLocaleString() });
  if (output._rows_total != null) cards.push({ label: 'Total Rows', value: output._rows_total.toLocaleString() });
  if (output.columns?.length) cards.push({ label: 'Columns', value: String(output.columns.length) });

  // Data cleaning
  if (output.original_count != null && output.row_count != null && output.original_count !== output.row_count) {
    cards.push({ label: 'Cleaned', value: `${output.original_count.toLocaleString()} → ${output.row_count.toLocaleString()} rows` });
  }

  // Encoding
  if (output.target_column) cards.push({ label: 'Target Column', value: output.target_column, variant: 'highlight' });
  if (output.classes && typeof output.classes === 'object' && !Array.isArray(output.classes)) {
    cards.push({ label: 'Encoded Columns', value: `${Object.keys(output.classes).length} columns` });
  }

  // Train/Test
  if (output.X_train) cards.push({ label: 'Train Samples', value: Array.isArray(output.X_train) ? output.X_train.length.toLocaleString() : '' });
  if (output.X_test) cards.push({ label: 'Test Samples', value: Array.isArray(output.X_test) ? output.X_test.length.toLocaleString() : '' });

  // ML metrics
  if (output.algorithm) cards.push({ label: 'Algorithm', value: output.algorithm, variant: 'highlight' });
  if (output.task) cards.push({ label: 'Task', value: output.task });
  if (output.samples != null) cards.push({ label: 'Samples', value: output.samples.toLocaleString() });
  if (output.features != null) cards.push({ label: 'Features', value: String(output.features) });
  if (output.score != null) cards.push({ label: 'Score', value: (output.score * 100).toFixed(1) + '%', variant: 'success' });

  // Evaluate metrics
  if (output.accuracy != null) cards.push({ label: 'Accuracy', value: (output.accuracy * 100).toFixed(1) + '%', variant: 'success' });
  if (output.precision != null) cards.push({ label: 'Precision', value: (output.precision * 100).toFixed(1) + '%', variant: 'success' });
  if (output.recall != null) cards.push({ label: 'Recall', value: (output.recall * 100).toFixed(1) + '%', variant: 'success' });
  if (output.f1_score != null) cards.push({ label: 'F1 Score', value: (output.f1_score * 100).toFixed(1) + '%', variant: 'success' });

  // Predictions
  if (output.predictions && Array.isArray(output.predictions)) {
    const unique = new Set(output.predictions);
    cards.push({ label: 'Predictions', value: `${output.predictions.length.toLocaleString()} values (${unique.size} unique)` });
  }

  // Feature importances
  const featureImportances = output.feature_importances;

  // Confusion matrix
  const confMatrix = output.confusion_matrix;

  if (cards.length === 0) {
    const keys = Object.keys(output).filter(k => !k.startsWith('_'));
    cards.push({ label: 'Output Keys', value: keys.join(', ') || 'Empty' });
  }

  return (
    <div className="space-y-5">
      {/* Metric cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <MetricCard key={i} {...card} />
        ))}
      </div>

      {/* Feature Importances bar chart */}
      {featureImportances && Array.isArray(featureImportances) && (
        <div>
          <h3 className={cn('text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2', theme.textMuted)}>
            <BarChart3 size={14} />
            Feature Importances
          </h3>
          <div className={cn('rounded-xl border p-4 space-y-2', theme.inputBg, theme.inputBorder)}>
            {featureImportances
              .map((val: number, idx: number) => ({ idx, val }))
              .sort((a: { val: number }, b: { val: number }) => b.val - a.val)
              .slice(0, 15)
              .map(({ idx, val }: { idx: number; val: number }) => {
                const maxVal = Math.max(...featureImportances);
                const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const colName = output.columns?.[idx] || `Feature ${idx}`;
                return (
                  <div key={idx} className="flex items-center gap-2 text-[11px]">
                    <span className={cn('w-24 truncate text-right font-mono', theme.textMuted)} title={colName}>{colName}</span>
                    <div className="flex-1 h-5 rounded-full bg-slate-700/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={cn('w-12 text-right font-mono', theme.inputText)}>{(val * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Confusion Matrix */}
      {confMatrix && Array.isArray(confMatrix) && (
        <div>
          <h3 className={cn('text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2', theme.textMuted)}>
            <Table size={14} />
            Confusion Matrix
          </h3>
          <div className={cn('rounded-xl border p-4 overflow-x-auto', theme.inputBg, theme.inputBorder)}>
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className={cn('p-2 text-[10px] font-semibold', theme.textMuted)}>Actual ↓ / Pred →</th>
                  {confMatrix[0]?.map((_: number, i: number) => (
                    <th key={i} className={cn('p-2 text-[10px] font-mono text-center', theme.textMuted)}>Class {i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confMatrix.map((row: number[], ri: number) => {
                  const rowMax = Math.max(...confMatrix.flat());
                  return (
                    <tr key={ri}>
                      <td className={cn('p-2 text-[10px] font-mono font-semibold', theme.textMuted)}>Class {ri}</td>
                      {row.map((val: number, ci: number) => {
                        const intensity = rowMax > 0 ? val / rowMax : 0;
                        const isDiag = ri === ci;
                        return (
                          <td
                            key={ci}
                            className={cn('p-2 text-center text-xs font-mono font-bold min-w-[50px] rounded-lg m-0.5')}
                            style={{
                              backgroundColor: isDiag
                                ? `rgba(16, 185, 129, ${0.15 + intensity * 0.6})`
                                : `rgba(239, 68, 68, ${intensity * 0.4})`,
                              color: isDiag ? '#6ee7b7' : intensity > 0.3 ? '#fca5a5' : undefined,
                            }}
                          >
                            {val.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Column list */}
      {output.columns && Array.isArray(output.columns) && output.columns.length > 0 && (
        <ExpandableSection title="Columns" count={output.columns.length}>
          <div className="flex flex-wrap gap-1.5">
            {output.columns.map((col: string, i: number) => (
              <span
                key={i}
                className={cn('px-2 py-1 rounded-lg text-[10px] font-mono border', theme.inputBg, theme.inputBorder, theme.inputText,
                  col === output.target_column && 'ring-1 ring-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                )}
              >
                {col}{col === output.target_column ? ' ★' : ''}
              </span>
            ))}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
};

/* ── Data Table Tab ── */
const DataTableTab: React.FC<{ rows: any[]; columns: string[] }> = ({ rows, columns }) => {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const totalPages = Math.ceil(rows.length / pageSize);
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-3">
      <div className={cn('flex items-center justify-between text-[11px]', theme.textMuted)}>
        <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} of {rows.length.toLocaleString()} rows</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={cn('px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-30', theme.inputBg, theme.inputBorder, theme.btnHover)}
          >
            ← Prev
          </button>
          <span className="font-mono">{page + 1}/{totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className={cn('px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-30', theme.inputBg, theme.inputBorder, theme.btnHover)}
          >
            Next →
          </button>
        </div>
      </div>

      <div className={cn('rounded-xl border overflow-x-auto', theme.inputBorder)}>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className={cn('border-b', theme.nodeHeaderBorder)}>
              <th className={cn('px-3 py-2 text-left font-semibold sticky left-0', theme.inputBg, theme.textMuted)}>#</th>
              {columns.map((col, i) => (
                <th key={i} className={cn('px-3 py-2 text-left font-semibold whitespace-nowrap', theme.textMuted)}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri} className={cn('border-b transition-colors', theme.nodeHeaderBorder, 'hover:bg-blue-500/5')}>
                <td className={cn('px-3 py-1.5 font-mono sticky left-0', theme.inputBg, theme.textMuted)}>
                  {page * pageSize + ri + 1}
                </td>
                {columns.map((col, ci) => {
                  const val = row[col];
                  const display = val === '' || val == null ? '—' : String(val);
                  const isNum = typeof val === 'number';
                  return (
                    <td key={ci} className={cn('px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate', theme.inputText, isNum && 'font-mono text-right')}>
                      {display.length > 40 ? display.slice(0, 40) + '…' : display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── JSON Tab ── */
const JsonTab: React.FC<{ result: any }> = ({ result }) => {
  const { theme } = useTheme();
  const json = JSON.stringify(result, null, 2);
  // Limit display for very large JSON
  const maxLen = 50000;
  const truncated = json.length > maxLen;

  return (
    <div className="relative">
      <pre className={cn('p-4 rounded-xl border text-[11px] font-mono whitespace-pre-wrap break-words overflow-y-auto max-h-[60vh]', theme.inputBg, theme.inputBorder, theme.inputText)}>
        {truncated ? json.slice(0, maxLen) + '\n\n... (truncated)' : json}
      </pre>
      {truncated && (
        <div className={cn('mt-2 text-[10px] text-center', theme.textMuted)}>
          JSON output is {(json.length / 1024).toFixed(0)}KB — showing first {(maxLen / 1024).toFixed(0)}KB
        </div>
      )}
    </div>
  );
};

/* ── Reusable components ── */
const MetricCard: React.FC<{ label: string; value: string; variant?: 'default' | 'highlight' | 'success' | 'error' }> = ({ label, value, variant = 'default' }) => {
  const { theme } = useTheme();
  const colors = {
    default: { border: theme.inputBorder, text: theme.inputText },
    highlight: { border: 'border-blue-500/30', text: 'text-blue-400' },
    success: { border: 'border-emerald-500/30', text: 'text-emerald-400' },
    error: { border: 'border-red-500/30', text: 'text-red-400' },
  };

  return (
    <div className={cn('rounded-xl border p-3 flex flex-col gap-1', theme.inputBg, colors[variant].border)}>
      <span className={cn('text-[9px] font-semibold uppercase tracking-wider', theme.textMuted)}>{label}</span>
      <span className={cn('text-sm font-bold font-mono break-all', colors[variant].text)}>{value}</span>
    </div>
  );
};

const ExpandableSection: React.FC<{ title: string; count?: number; children: React.ReactNode }> = ({ title, count, children }) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(!open)} className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wider w-full', theme.textMuted, 'hover:text-blue-400 transition-colors')}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
        {count != null && <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', theme.btnBg)}>{count}</span>}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
};
