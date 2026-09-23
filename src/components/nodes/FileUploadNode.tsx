import React, { useRef, useState } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Upload, FileSpreadsheet, FileText, File, CheckCircle2, Loader2, X } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const FORMAT_ICONS: Record<string, any> = {
  csv: FileSpreadsheet,
  excel: FileSpreadsheet,
  json: FileText,
  text: FileText,
  pdf: File,
};

const ACCEPT = '.csv,.xlsx,.xls,.txt,.tsv,.json,.pdf';

export const FileUploadNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
  const { theme } = useTheme();
  const { updateNodeData } = useReactFlow();
  const config = data.config || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: globalThis.File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8088/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      const summary = await res.json();
      updateNodeData(id, {
        config: {
          ...config,
          file_id: summary.file_id,
          filename: summary.filename,
          format: summary.format,
          row_count: summary.row_count,
          columns: summary.columns,
          line_count: summary.line_count,
          page_count: summary.page_count,
        },
      });
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const clearFile = () => {
    updateNodeData(id, {
      config: { ...config, file_id: undefined, filename: undefined, format: undefined, row_count: undefined, columns: undefined, line_count: undefined, page_count: undefined },
    });
    setError(null);
  };

  const hasFile = !!config.file_id;
  const FormatIcon = FORMAT_ICONS[config.format] || File;

  return (
    <BaseNode
      id={id}
      label={data.label}
      icon={Upload}
      selected={selected}
      accentColor="from-emerald-400 to-teal-500"
      glowColor="bg-emerald-500/20"
      className="border-emerald-500/20"
      outputColor="bg-emerald-400"
      inputColor="bg-emerald-400"
      badge="FILE"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileSelect}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
      />

      {!hasFile ? (
        <div
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all',
            dragOver
              ? 'border-emerald-400 bg-emerald-500/10'
              : cn('border-white/10 hover:border-emerald-400/50', theme.inputBg),
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className={cn('text-[11px]', theme.textMuted)}>Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className={cn('w-6 h-6', dragOver ? 'text-emerald-400' : theme.textMuted)} />
              <span className={cn('text-[11px] font-medium', theme.textMuted)}>
                Drop file or <span className="text-emerald-400 underline">browse</span>
              </span>
              <span className={cn('text-[9px]', theme.textMuted)}>CSV, Excel, TXT, JSON, PDF</span>
            </div>
          )}
        </div>
      ) : (
        <div className={cn('rounded-xl p-3 space-y-2', theme.inputBg, 'border', theme.inputBorder)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FormatIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] font-medium text-white truncate">{config.filename}</span>
            </div>
            <button onClick={clearFile} className={cn('p-0.5 rounded hover:bg-white/10', theme.textMuted)}>
              <X className="w-3 h-3" />
            </button>
          </div>

          {config.columns && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-300 font-semibold">{config.row_count} rows · {config.columns.length} columns</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {config.columns.slice(0, 6).map((col: string) => (
                  <span key={col} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/60 font-mono">{col}</span>
                ))}
                {config.columns.length > 6 && (
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/40">+{config.columns.length - 6}</span>
                )}
              </div>
            </div>
          )}

          {config.format === 'pdf' && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-300">{config.page_count} pages</span>
            </div>
          )}

          {config.format === 'text' && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-300">{config.line_count} lines</span>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full py-1.5 rounded-lg text-[10px] font-bold tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
          >
            REPLACE FILE
          </button>
        </div>
      )}

      {error && (
        <div className="text-[10px] text-red-400 px-1 mt-1">{error}</div>
      )}

      <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
        <span className="font-mono">{config.format || 'no file'}</span>
        <span className={cn('font-bold', hasFile ? 'text-emerald-400' : 'text-white/30')}>● {hasFile ? 'Ready' : 'Waiting'}</span>
      </div>
    </BaseNode>
  );
};
