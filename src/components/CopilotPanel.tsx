import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Loader2,
  Wand2,
  MessageSquare,
  Lightbulb,
  Zap,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { cn } from './ui';

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowGenerated: (workflow: any) => void;
  currentNodes?: any[];
}

const EXAMPLE_PROMPTS = [
  "Create a chatbot that uses OpenAI to respond to user questions",
  "Build a workflow that fetches data from an API and sends it to Slack",
  "Create an email notification workflow triggered by a webhook",
  "Build a data pipeline that processes input through AI and saves to database",
  "Build an ML pipeline: upload CSV, clean data, train Random Forest, evaluate and save model",
  "Create a sentiment analysis workflow that classifies text and routes positive/negative to different channels",
];

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  isOpen,
  onClose,
  onWorkflowGenerated,
  currentNodes = [],
}) => {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'Gemini' | 'OpenAI'>('Gemini');
  const [history, setHistory] = useState<Array<{ prompt: string; success: boolean; nodes?: number }>>([]);
  const [copied, setCopied] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const generateWorkflow = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8088/api/copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, image: imageBase64 }),
      });

      const data = await response.json();

      if (data.success && data.workflow) {
        onWorkflowGenerated(data.workflow);
        setHistory(prev => [...prev, { prompt, success: true, nodes: data.workflow.nodes?.length }]);
        setPrompt('');
        setImageBase64(null);
        setImagePreview(null);
      } else {
        setError(data.error || 'Failed to generate workflow');
        setHistory(prev => [...prev, { prompt, success: false }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      generateWorkflow();
    }
  };

  const useExamplePrompt = (example: string) => {
    setPrompt(example);
    textareaRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'absolute right-0 top-0 h-full w-[400px] border-l shadow-2xl z-50 flex flex-col',
      theme.sidebarBg, theme.sidebarBorder
    )}>
      {/* Header */}
      <div className={cn('flex items-center justify-between p-4 border-b', theme.sidebarBorder)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className={cn('font-bold text-sm', theme.textPrimary)}>AI Copilot</h3>
            <p className={cn('text-[10px]', theme.textMuted)}>Generate workflows with AI</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={cn('p-2 rounded-lg transition-colors', theme.btnHover)}
        >
          <X size={18} className={theme.textMuted} />
        </button>
      </div>

      {/* Provider Selector */}
      <div className={cn('px-4 py-3 border-b', theme.sidebarBorder)}>
        <label className={cn('text-[10px] font-medium mb-2 block', theme.textMuted)}>AI Provider</label>
        <div className="flex gap-2">
          {(['Gemini', 'OpenAI'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all',
                provider === p
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                  : cn(theme.btnBg, theme.textSecondary, theme.btnHover)
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Prompt Input */}
        <div>
          <label className={cn('text-[10px] font-medium mb-2 block', theme.textMuted)}>
            Describe your workflow
          </label>
          <div className={cn('rounded-xl border overflow-hidden', theme.inputBorder)}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Create a chatbot that responds to user questions using GPT-4..."
              className={cn(
                'w-full p-3 resize-none outline-none text-sm',
                theme.inputBg, theme.inputText, theme.inputPlaceholder
              )}
              rows={4}
            />
            {/* Image Preview */}
            {imagePreview && (
              <div className={cn('px-3 py-2 border-t flex items-center gap-2', theme.inputBorder)}>
                <img src={imagePreview} alt="Upload preview" className="h-16 w-16 object-cover rounded-lg border border-violet-500/30" />
                <button
                  onClick={removeImage}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  title="Remove image"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className={cn('flex items-center justify-between px-3 py-2 border-t', theme.inputBorder, theme.btnBg)}>
              <span className={cn('text-[10px]', theme.textMuted)}>
                {prompt.length > 0 ? `${prompt.length} chars` : 'Ctrl+Enter to generate'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                    theme.btnBg, theme.textMuted, theme.btnHover
                  )}
                  title="Upload image"
                >
                  <ImagePlus size={14} />
                </button>
                <button
                  onClick={generateWorkflow}
                  disabled={!prompt.trim() || isLoading}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    prompt.trim() && !isLoading
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700'
                      : cn(theme.btnBg, theme.textMuted, 'cursor-not-allowed')
                  )}
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Wand2 size={14} />
                  )}
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Example Prompts */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className={theme.textMuted} />
            <span className={cn('text-[10px] font-medium', theme.textMuted)}>Example prompts</span>
          </div>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((example, idx) => (
              <button
                key={idx}
                onClick={() => useExamplePrompt(example)}
                className={cn(
                  'w-full text-left p-2.5 rounded-lg text-xs transition-all border',
                  theme.btnBg, theme.btnBorder, theme.btnHover, theme.textSecondary
                )}
              >
                <span className="line-clamp-2">{example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className={theme.textMuted} />
              <span className={cn('text-[10px] font-medium', theme.textMuted)}>Recent generations</span>
            </div>
            <div className="space-y-2">
              {history.slice(-5).reverse().map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-2.5 rounded-lg text-xs border',
                    item.success
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('line-clamp-2', item.success ? 'text-green-400' : 'text-red-400')}>
                      {item.prompt}
                    </span>
                    {item.success && (
                      <span className="text-[10px] text-green-400 whitespace-nowrap">
                        {item.nodes} nodes
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn('p-4 border-t', theme.sidebarBorder)}>
        <div className={cn('flex items-center gap-2 text-[10px]', theme.textMuted)}>
          <Zap size={12} />
          <span>Powered by {provider} AI</span>
        </div>
      </div>
    </div>
  );
};
