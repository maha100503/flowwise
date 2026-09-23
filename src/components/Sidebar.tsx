import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Brain,
  Repeat,
  Clock,
  Server,
  MessageSquare,
  Send,
  Filter,
  Table,
  Cloud,
  Plus,
  Timer,
  Webhook,
  GitBranch,
  FileText,
  Code2,
  Bell,
  Zap,
  Search,
  Sparkles,
  Cpu,
  Flame,
  Wind,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Globe,
  Database,
  Mail,
  Hash,
  Regex,
  HardDrive,
  Shield,
  Braces,
  CheckCircle,
  BarChart3,
  Rss,
  QrCode,
  FileType,
  Radio,
  Users,
  Phone,
  Camera,
  TrendingUp,
  Scissors,
  Activity,
  Network,
  Shrink,
  ShieldAlert,
  Layers,
  Upload,
  Eraser,
  Merge,
  Wand2,
  Trophy,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { NodeType } from '../types';
import { useTheme } from '../ThemeContext';
import { cn } from './ui';

interface NodeItemProps {
  type: NodeType;
  subType?: string;
  label: string;
  icon: any;
  color: string;
  glowColor: string;
  searchMatch?: boolean;
}

const NodeItem: React.FC<NodeItemProps> = ({ type, subType, label, icon: Icon, color, glowColor, searchMatch }) => {
  const { theme } = useTheme();

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeSubType?: string, nodeLabel?: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, subType: nodeSubType, label: nodeLabel }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-200 group hover:shadow-lg',
        theme.nodeBg, theme.nodeBorder, glowColor,
        searchMatch && 'ring-2 ring-blue-500/50 bg-blue-500/5'
      )}
      draggable
      onDragStart={(e) => onDragStart(e, type, subType, label)}
    >
      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color} shadow-inner group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={14} className="text-white" />
      </div>
      <span className={cn('text-xs font-medium transition-colors', theme.textSecondary)}>{label}</span>
      <Plus size={12} className={cn('ml-auto transition-colors', theme.textMuted)} />
    </div>
  );
};

interface SectionProps {
  title: string;
  count: number;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, count, icon: SectionIcon, iconColor, children, defaultOpen = false, forceOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const { theme } = useTheme();
  const isOpen = forceOpen || open;

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className={cn('w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all group cursor-pointer', theme.btnHover)}
      >
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${iconColor} opacity-80 group-hover:opacity-100 transition-opacity`}>
          <SectionIcon size={12} className="text-white" />
        </div>
        <span className={cn('text-xs font-semibold flex-1 text-left transition-colors', theme.textSecondary)}>
          {title}
        </span>
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center', theme.textMuted, theme.btnBg)}>
          {count}
        </span>
        <ChevronDown
          size={14}
          className={cn('transition-all duration-200', theme.textMuted, isOpen ? 'rotate-180' : '')}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100 mt-1.5' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-1.5 pl-2">{children}</div>
      </div>
    </section>
  );
};

// All nodes data for search
const ALL_NODES = [
  { type: 'timer' as NodeType, subType: 'Manual', label: 'Manual Trigger', icon: Play, color: 'from-emerald-400 to-green-500', glowColor: 'hover:shadow-emerald-500/10', category: 'Triggers' },
  { type: 'timer' as NodeType, label: 'Schedule / Cron', icon: Timer, color: 'from-cyan-400 to-teal-500', glowColor: 'hover:shadow-cyan-500/10', category: 'Triggers' },
  { type: 'webhook' as NodeType, label: 'Webhook', icon: Webhook, color: 'from-pink-400 to-fuchsia-500', glowColor: 'hover:shadow-pink-500/10', category: 'Triggers' },
  { type: 'ai' as NodeType, subType: 'OpenAI', label: 'OpenAI', icon: Sparkles, color: 'from-green-400 to-emerald-500', glowColor: 'hover:shadow-green-500/10', category: 'AI & Models' },
  { type: 'ai' as NodeType, subType: 'Claude', label: 'Claude', icon: Brain, color: 'from-amber-400 to-orange-500', glowColor: 'hover:shadow-amber-500/10', category: 'AI & Models' },
  { type: 'ai' as NodeType, subType: 'Gemini', label: 'Gemini', icon: Cpu, color: 'from-blue-400 to-indigo-500', glowColor: 'hover:shadow-blue-500/10', category: 'AI & Models' },
  { type: 'ai' as NodeType, subType: 'Meta', label: 'Llama (Meta)', icon: Flame, color: 'from-sky-400 to-blue-500', glowColor: 'hover:shadow-sky-500/10', category: 'AI & Models' },
  { type: 'ai' as NodeType, subType: 'Mistral', label: 'Mistral AI', icon: Wind, color: 'from-orange-400 to-red-500', glowColor: 'hover:shadow-orange-500/10', category: 'AI & Models' },
  { type: 'ai' as NodeType, subType: 'Groq', label: 'Groq', icon: Bot, color: 'from-fuchsia-400 to-purple-500', glowColor: 'hover:shadow-fuchsia-500/10', category: 'AI & Models' },
  { type: 'conditional' as NodeType, label: 'Conditional', icon: GitBranch, color: 'from-yellow-400 to-orange-500', glowColor: 'hover:shadow-yellow-500/10', category: 'Control Flow' },
  { type: 'logic' as NodeType, subType: 'Wait', label: 'Wait / Delay', icon: Clock, color: 'from-blue-400 to-indigo-500', glowColor: 'hover:shadow-blue-500/10', category: 'Control Flow' },
  { type: 'logic' as NodeType, subType: 'Loop', label: 'Loop', icon: Repeat, color: 'from-indigo-400 to-blue-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Control Flow' },
  { type: 'data' as NodeType, subType: 'Filter', label: 'Filter', icon: Filter, color: 'from-orange-400 to-amber-500', glowColor: 'hover:shadow-orange-500/10', category: 'Data Processing' },
  { type: 'data' as NodeType, subType: 'Map', label: 'Map / Transform', icon: Table, color: 'from-amber-400 to-yellow-500', glowColor: 'hover:shadow-amber-500/10', category: 'Data Processing' },
  { type: 'template' as NodeType, label: 'Text Template', icon: FileText, color: 'from-violet-400 to-purple-500', glowColor: 'hover:shadow-violet-500/10', category: 'Data Processing' },
  { type: 'code' as NodeType, label: 'Custom Code', icon: Code2, color: 'from-lime-400 to-green-500', glowColor: 'hover:shadow-lime-500/10', category: 'Data Processing' },
  { type: 'server' as NodeType, label: 'MCP Server', icon: Server, color: 'from-purple-400 to-fuchsia-500', glowColor: 'hover:shadow-purple-500/10', category: 'Infrastructure' },
  { type: 'io' as NodeType, subType: 'Chat Input', label: 'Chat Input', icon: MessageSquare, color: 'from-emerald-400 to-green-500', glowColor: 'hover:shadow-emerald-500/10', category: 'Input / Output' },
  { type: 'io' as NodeType, subType: 'Output', label: 'Output', icon: Send, color: 'from-rose-400 to-pink-500', glowColor: 'hover:shadow-rose-500/10', category: 'Input / Output' },
  { type: 'http' as NodeType, subType: 'GET', label: 'HTTP GET', icon: Globe, color: 'from-green-400 to-emerald-500', glowColor: 'hover:shadow-green-500/10', category: 'Network' },
  { type: 'http' as NodeType, subType: 'POST', label: 'HTTP POST', icon: Globe, color: 'from-blue-400 to-indigo-500', glowColor: 'hover:shadow-blue-500/10', category: 'Network' },
  { type: 'http' as NodeType, subType: 'PUT', label: 'HTTP PUT', icon: Globe, color: 'from-amber-400 to-orange-500', glowColor: 'hover:shadow-amber-500/10', category: 'Network' },
  { type: 'http' as NodeType, subType: 'DELETE', label: 'HTTP DELETE', icon: Globe, color: 'from-red-400 to-rose-500', glowColor: 'hover:shadow-red-500/10', category: 'Network' },
  { type: 'database' as NodeType, subType: 'SQLite', label: 'SQLite', icon: Database, color: 'from-sky-400 to-blue-500', glowColor: 'hover:shadow-sky-500/10', category: 'Network' },
  { type: 'database' as NodeType, subType: 'PostgreSQL', label: 'PostgreSQL', icon: Database, color: 'from-blue-400 to-indigo-500', glowColor: 'hover:shadow-blue-500/10', category: 'Network' },
  { type: 'database' as NodeType, subType: 'MySQL', label: 'MySQL', icon: Database, color: 'from-orange-400 to-amber-500', glowColor: 'hover:shadow-orange-500/10', category: 'Network' },
  { type: 'email' as NodeType, subType: 'SMTP', label: 'Email (SMTP)', icon: Mail, color: 'from-gray-400 to-slate-500', glowColor: 'hover:shadow-gray-500/10', category: 'Notifications' },
  { type: 'email' as NodeType, subType: 'SendGrid', label: 'SendGrid', icon: Mail, color: 'from-blue-400 to-cyan-500', glowColor: 'hover:shadow-blue-500/10', category: 'Notifications' },
  { type: 'slack' as NodeType, label: 'Slack', icon: Hash, color: 'from-purple-400 to-fuchsia-500', glowColor: 'hover:shadow-purple-500/10', category: 'Notifications' },
  { type: 'integration' as NodeType, subType: 'Google Services', label: 'Google Services', icon: Cloud, color: 'from-sky-400 to-blue-500', glowColor: 'hover:shadow-sky-500/10', category: 'Integrations' },
  { type: 'notification' as NodeType, label: 'Notification', icon: Bell, color: 'from-rose-400 to-red-500', glowColor: 'hover:shadow-rose-500/10', category: 'Integrations' },
  // — New: Transform & Validate —
  { type: 'json_transform' as NodeType, label: 'JSON Transform', icon: Braces, color: 'from-amber-400 to-yellow-500', glowColor: 'hover:shadow-amber-500/10', category: 'Transform & Validate' },
  { type: 'regex' as NodeType, label: 'Regex', icon: Regex, color: 'from-rose-400 to-pink-500', glowColor: 'hover:shadow-rose-500/10', category: 'Transform & Validate' },
  { type: 'aggregator' as NodeType, label: 'Aggregator', icon: BarChart3, color: 'from-indigo-400 to-violet-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Transform & Validate' },
  { type: 'validator' as NodeType, label: 'Validator', icon: CheckCircle, color: 'from-green-400 to-emerald-500', glowColor: 'hover:shadow-green-500/10', category: 'Transform & Validate' },
  { type: 'markdown' as NodeType, label: 'Markdown', icon: FileType, color: 'from-sky-400 to-blue-500', glowColor: 'hover:shadow-sky-500/10', category: 'Transform & Validate' },
  // — New: Utilities —
  { type: 'cache' as NodeType, label: 'Cache', icon: HardDrive, color: 'from-teal-400 to-cyan-500', glowColor: 'hover:shadow-teal-500/10', category: 'Utilities' },
  { type: 'crypto' as NodeType, label: 'Crypto / Hash', icon: Shield, color: 'from-emerald-400 to-teal-500', glowColor: 'hover:shadow-emerald-500/10', category: 'Utilities' },
  { type: 'qrcode' as NodeType, label: 'QR Code', icon: QrCode, color: 'from-slate-400 to-zinc-500', glowColor: 'hover:shadow-slate-500/10', category: 'Utilities' },
  { type: 'rss' as NodeType, label: 'RSS Feed', icon: Rss, color: 'from-orange-400 to-amber-500', glowColor: 'hover:shadow-orange-500/10', category: 'Utilities' },
  { type: 'websocket' as NodeType, label: 'WebSocket', icon: Radio, color: 'from-fuchsia-400 to-pink-500', glowColor: 'hover:shadow-fuchsia-500/10', category: 'Utilities' },
  // — New: Messaging —
  { type: 'teams' as NodeType, label: 'Microsoft Teams', icon: Users, color: 'from-[#6264A7] to-[#464EB8]', glowColor: 'hover:shadow-[#6264A7]/10', category: 'Messaging' },
  { type: 'outlook' as NodeType, label: 'Microsoft Outlook', icon: Mail, color: 'from-[#0078D4] to-[#005A9E]', glowColor: 'hover:shadow-[#0078D4]/10', category: 'Messaging' },
  { type: 'whatsapp' as NodeType, label: 'WhatsApp', icon: Phone, color: 'from-[#25D366] to-[#128C7E]', glowColor: 'hover:shadow-[#25D366]/10', category: 'Messaging' },
  { type: 'telegram' as NodeType, label: 'Telegram', icon: Send, color: 'from-[#0088cc] to-[#229ED9]', glowColor: 'hover:shadow-[#0088cc]/10', category: 'Messaging' },
  { type: 'instagram' as NodeType, label: 'Instagram', icon: Camera, color: 'from-[#E1306C] to-[#833AB4]', glowColor: 'hover:shadow-[#E1306C]/10', category: 'Messaging' },
  // — ML & Data Science —
  // Regression
  { type: 'ml' as NodeType, subType: 'LinearRegression', label: 'Linear Regression', icon: TrendingUp, color: 'from-violet-400 to-purple-500', glowColor: 'hover:shadow-violet-500/10', category: 'Regression' },
  { type: 'ml' as NodeType, subType: 'PolynomialRegression', label: 'Polynomial Regression', icon: TrendingUp, color: 'from-purple-400 to-violet-500', glowColor: 'hover:shadow-purple-500/10', category: 'Regression' },
  { type: 'ml' as NodeType, subType: 'Ridge', label: 'Ridge (L2)', icon: Activity, color: 'from-indigo-400 to-purple-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Regression' },
  { type: 'ml' as NodeType, subType: 'Lasso', label: 'Lasso (L1)', icon: Activity, color: 'from-blue-400 to-indigo-500', glowColor: 'hover:shadow-blue-500/10', category: 'Regression' },
  { type: 'ml' as NodeType, subType: 'ElasticNet', label: 'Elastic Net', icon: Activity, color: 'from-sky-400 to-blue-500', glowColor: 'hover:shadow-sky-500/10', category: 'Regression' },
  { type: 'ml' as NodeType, subType: 'BayesianRidge', label: 'Bayesian Ridge', icon: Brain, color: 'from-teal-400 to-cyan-500', glowColor: 'hover:shadow-teal-500/10', category: 'Regression' },
  { type: 'ml' as NodeType, subType: 'SVR', label: 'SVR', icon: Brain, color: 'from-rose-400 to-pink-500', glowColor: 'hover:shadow-rose-500/10', category: 'Regression' },
  // Classification
  { type: 'ml' as NodeType, subType: 'LogisticRegression', label: 'Logistic Regression', icon: Activity, color: 'from-violet-400 to-indigo-500', glowColor: 'hover:shadow-violet-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'SVM', label: 'SVM', icon: Brain, color: 'from-rose-400 to-pink-500', glowColor: 'hover:shadow-rose-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'DecisionTree', label: 'Decision Tree', icon: GitBranch, color: 'from-green-400 to-teal-500', glowColor: 'hover:shadow-green-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'RandomForest', label: 'Random Forest', icon: Brain, color: 'from-emerald-400 to-green-500', glowColor: 'hover:shadow-emerald-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'KNN', label: 'KNN', icon: Users, color: 'from-sky-400 to-blue-500', glowColor: 'hover:shadow-sky-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'GaussianNB', label: 'Gaussian NB', icon: BarChart3, color: 'from-cyan-400 to-teal-500', glowColor: 'hover:shadow-cyan-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'GradientBoosting', label: 'Gradient Boosting', icon: Flame, color: 'from-orange-400 to-red-500', glowColor: 'hover:shadow-orange-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'AdaBoost', label: 'AdaBoost', icon: Flame, color: 'from-amber-400 to-orange-500', glowColor: 'hover:shadow-amber-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'XGBoost', label: 'XGBoost', icon: Flame, color: 'from-blue-400 to-cyan-500', glowColor: 'hover:shadow-blue-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'LightGBM', label: 'LightGBM', icon: Flame, color: 'from-green-400 to-lime-500', glowColor: 'hover:shadow-green-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'SGDClassifier', label: 'SGD Classifier', icon: Activity, color: 'from-slate-400 to-gray-500', glowColor: 'hover:shadow-slate-500/10', category: 'Classification' },
  { type: 'ml' as NodeType, subType: 'Perceptron', label: 'Perceptron', icon: Cpu, color: 'from-pink-400 to-rose-500', glowColor: 'hover:shadow-pink-500/10', category: 'Classification' },
  // Clustering
  { type: 'clustering' as NodeType, subType: 'KMeans', label: 'K-Means', icon: Network, color: 'from-pink-400 to-rose-500', glowColor: 'hover:shadow-pink-500/10', category: 'Clustering' },
  { type: 'clustering' as NodeType, subType: 'DBSCAN', label: 'DBSCAN', icon: Network, color: 'from-fuchsia-400 to-pink-500', glowColor: 'hover:shadow-fuchsia-500/10', category: 'Clustering' },
  { type: 'clustering' as NodeType, subType: 'Hierarchical', label: 'Hierarchical', icon: GitBranch, color: 'from-rose-400 to-red-500', glowColor: 'hover:shadow-rose-500/10', category: 'Clustering' },
  { type: 'clustering' as NodeType, subType: 'GMM', label: 'Gaussian Mixture', icon: BarChart3, color: 'from-purple-400 to-fuchsia-500', glowColor: 'hover:shadow-purple-500/10', category: 'Clustering' },
  { type: 'clustering' as NodeType, subType: 'SpectralClustering', label: 'Spectral', icon: Network, color: 'from-indigo-400 to-purple-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Clustering' },
  { type: 'clustering' as NodeType, subType: 'MeanShift', label: 'Mean Shift', icon: Network, color: 'from-amber-400 to-orange-500', glowColor: 'hover:shadow-amber-500/10', category: 'Clustering' },
  // Dimensionality Reduction
  { type: 'dimensionality' as NodeType, subType: 'PCA', label: 'PCA', icon: Shrink, color: 'from-indigo-400 to-blue-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Dim. Reduction' },
  { type: 'dimensionality' as NodeType, subType: 'tSNE', label: 't-SNE', icon: Shrink, color: 'from-blue-400 to-cyan-500', glowColor: 'hover:shadow-blue-500/10', category: 'Dim. Reduction' },
  { type: 'dimensionality' as NodeType, subType: 'LDA', label: 'LDA', icon: Shrink, color: 'from-violet-400 to-indigo-500', glowColor: 'hover:shadow-violet-500/10', category: 'Dim. Reduction' },
  { type: 'dimensionality' as NodeType, subType: 'ICA', label: 'ICA', icon: Shrink, color: 'from-teal-400 to-blue-500', glowColor: 'hover:shadow-teal-500/10', category: 'Dim. Reduction' },
  // Anomaly Detection
  { type: 'anomaly' as NodeType, subType: 'IsolationForest', label: 'Isolation Forest', icon: ShieldAlert, color: 'from-red-400 to-orange-500', glowColor: 'hover:shadow-red-500/10', category: 'Anomaly Detection' },
  { type: 'anomaly' as NodeType, subType: 'OneClassSVM', label: 'One-Class SVM', icon: ShieldAlert, color: 'from-orange-400 to-amber-500', glowColor: 'hover:shadow-orange-500/10', category: 'Anomaly Detection' },
  { type: 'anomaly' as NodeType, subType: 'LOF', label: 'Local Outlier Factor', icon: ShieldAlert, color: 'from-amber-400 to-yellow-500', glowColor: 'hover:shadow-amber-500/10', category: 'Anomaly Detection' },
  { type: 'anomaly' as NodeType, subType: 'EllipticEnvelope', label: 'Elliptic Envelope', icon: ShieldAlert, color: 'from-rose-400 to-red-500', glowColor: 'hover:shadow-rose-500/10', category: 'Anomaly Detection' },
  // Ensemble Learning
  { type: 'ensemble' as NodeType, subType: 'Bagging', label: 'Bagging', icon: Layers, color: 'from-fuchsia-400 to-pink-500', glowColor: 'hover:shadow-fuchsia-500/10', category: 'Ensemble' },
  { type: 'ensemble' as NodeType, subType: 'Stacking', label: 'Stacking', icon: Layers, color: 'from-purple-400 to-fuchsia-500', glowColor: 'hover:shadow-purple-500/10', category: 'Ensemble' },
  { type: 'ensemble' as NodeType, subType: 'Voting', label: 'Voting', icon: Layers, color: 'from-pink-400 to-rose-500', glowColor: 'hover:shadow-pink-500/10', category: 'Ensemble' },
  // Neural Networks
  { type: 'neural_network' as NodeType, subType: 'ANN', label: 'ANN', icon: Cpu, color: 'from-sky-400 to-indigo-500', glowColor: 'hover:shadow-sky-500/10', category: 'Neural Networks' },
  { type: 'neural_network' as NodeType, subType: 'DNN', label: 'DNN (Deep)', icon: Cpu, color: 'from-indigo-400 to-violet-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Neural Networks' },
  // — Time Series —
  { type: 'timeseries' as NodeType, subType: 'ARIMA', label: 'ARIMA', icon: TrendingUp, color: 'from-cyan-400 to-blue-500', glowColor: 'hover:shadow-cyan-500/10', category: 'Time Series' },
  { type: 'timeseries' as NodeType, subType: 'SARIMA', label: 'SARIMA', icon: TrendingUp, color: 'from-teal-400 to-blue-500', glowColor: 'hover:shadow-teal-500/10', category: 'Time Series' },
  { type: 'timeseries' as NodeType, subType: 'SARIMAX', label: 'SARIMAX', icon: TrendingUp, color: 'from-blue-400 to-purple-500', glowColor: 'hover:shadow-blue-500/10', category: 'Time Series' },
  { type: 'timeseries' as NodeType, subType: 'ExponentialSmoothing', label: 'Exp. Smoothing', icon: Activity, color: 'from-teal-400 to-cyan-500', glowColor: 'hover:shadow-teal-500/10', category: 'Time Series' },
  { type: 'timeseries' as NodeType, subType: 'MovingAverage', label: 'Moving Average', icon: TrendingUp, color: 'from-blue-400 to-indigo-500', glowColor: 'hover:shadow-blue-500/10', category: 'Time Series' },
  { type: 'timeseries' as NodeType, subType: 'Decomposition', label: 'Decomposition', icon: Scissors, color: 'from-indigo-400 to-violet-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Time Series' },
  // — Data Input —
  { type: 'file_upload' as NodeType, label: 'File Upload', icon: Upload, color: 'from-emerald-400 to-teal-500', glowColor: 'hover:shadow-emerald-500/10', category: 'Data Input' },
  // — Data Cleaning —
  { type: 'data_cleaner' as NodeType, subType: 'DropNulls', label: 'Drop Nulls', icon: Eraser, color: 'from-yellow-400 to-amber-500', glowColor: 'hover:shadow-yellow-500/10', category: 'Data Cleaning' },
  { type: 'data_cleaner' as NodeType, subType: 'ParseDates', label: 'Parse Dates', icon: Eraser, color: 'from-amber-400 to-yellow-500', glowColor: 'hover:shadow-amber-500/10', category: 'Data Cleaning' },
  { type: 'data_cleaner' as NodeType, subType: 'CoerceTypes', label: 'Coerce Types', icon: Eraser, color: 'from-orange-400 to-amber-500', glowColor: 'hover:shadow-orange-500/10', category: 'Data Cleaning' },
  { type: 'data_cleaner' as NodeType, subType: 'NormalizeText', label: 'Normalize Text', icon: Eraser, color: 'from-lime-400 to-green-500', glowColor: 'hover:shadow-lime-500/10', category: 'Data Cleaning' },
  { type: 'data_cleaner' as NodeType, subType: 'DropDuplicates', label: 'Drop Duplicates', icon: Eraser, color: 'from-green-400 to-lime-500', glowColor: 'hover:shadow-green-500/10', category: 'Data Cleaning' },
  { type: 'data_cleaner' as NodeType, subType: 'FilterRows', label: 'Filter Rows', icon: Eraser, color: 'from-teal-400 to-cyan-500', glowColor: 'hover:shadow-teal-500/10', category: 'Data Cleaning' },
  { type: 'data_cleaner' as NodeType, subType: 'RenameColumns', label: 'Rename Columns', icon: Eraser, color: 'from-cyan-400 to-blue-500', glowColor: 'hover:shadow-cyan-500/10', category: 'Data Cleaning' },
  // — Merge/Join —
  { type: 'merge' as NodeType, label: 'Merge / Join', icon: Merge, color: 'from-cyan-400 to-blue-500', glowColor: 'hover:shadow-cyan-500/10', category: 'Data Cleaning' },
  // — Feature Engineering —
  { type: 'feature_engineer' as NodeType, subType: 'DateDiff', label: 'Date Difference', icon: Wand2, color: 'from-violet-400 to-fuchsia-500', glowColor: 'hover:shadow-violet-500/10', category: 'Feature Engineering' },
  { type: 'feature_engineer' as NodeType, subType: 'Ratio', label: 'Ratio / Division', icon: Wand2, color: 'from-fuchsia-400 to-pink-500', glowColor: 'hover:shadow-fuchsia-500/10', category: 'Feature Engineering' },
  { type: 'feature_engineer' as NodeType, subType: 'Aggregate', label: 'Group Aggregate', icon: Wand2, color: 'from-purple-400 to-violet-500', glowColor: 'hover:shadow-purple-500/10', category: 'Feature Engineering' },
  { type: 'feature_engineer' as NodeType, subType: 'BinNumeric', label: 'Bin Numeric', icon: Wand2, color: 'from-pink-400 to-rose-500', glowColor: 'hover:shadow-pink-500/10', category: 'Feature Engineering' },
  { type: 'feature_engineer' as NodeType, subType: 'Formula', label: 'Custom Formula', icon: Wand2, color: 'from-rose-400 to-red-500', glowColor: 'hover:shadow-rose-500/10', category: 'Feature Engineering' },
  { type: 'feature_engineer' as NodeType, subType: 'AutoFeatures', label: 'Auto Features', icon: Wand2, color: 'from-indigo-400 to-purple-500', glowColor: 'hover:shadow-indigo-500/10', category: 'Feature Engineering' },
  // — Data Prep —
  { type: 'data_prep' as NodeType, subType: 'TrainTestSplit', label: 'Train/Test Split', icon: Scissors, color: 'from-amber-400 to-orange-500', glowColor: 'hover:shadow-amber-500/10', category: 'Data Prep' },
  { type: 'data_prep' as NodeType, subType: 'Normalize', label: 'Normalize', icon: BarChart3, color: 'from-green-400 to-emerald-500', glowColor: 'hover:shadow-green-500/10', category: 'Data Prep' },
  { type: 'data_prep' as NodeType, subType: 'Standardize', label: 'Standardize', icon: BarChart3, color: 'from-teal-400 to-green-500', glowColor: 'hover:shadow-teal-500/10', category: 'Data Prep' },
  { type: 'data_prep' as NodeType, subType: 'Encode', label: 'Label Encode', icon: Hash, color: 'from-rose-400 to-pink-500', glowColor: 'hover:shadow-rose-500/10', category: 'Data Prep' },
  { type: 'data_prep' as NodeType, subType: 'FillMissing', label: 'Fill Missing', icon: CheckCircle, color: 'from-sky-400 to-blue-500', glowColor: 'hover:shadow-sky-500/10', category: 'Data Prep' },
  { type: 'data_prep' as NodeType, subType: 'FeatureSelect', label: 'Feature Selection', icon: Filter, color: 'from-violet-400 to-purple-500', glowColor: 'hover:shadow-violet-500/10', category: 'Data Prep' },
  // — Evaluation —
  { type: 'evaluate' as NodeType, subType: 'Auto', label: 'Auto Evaluate', icon: BarChart3, color: 'from-emerald-400 to-teal-500', glowColor: 'hover:shadow-emerald-500/10', category: 'Evaluation' },
  { type: 'evaluate' as NodeType, subType: 'Classification', label: 'Classification Metrics', icon: CheckCircle, color: 'from-blue-400 to-indigo-500', glowColor: 'hover:shadow-blue-500/10', category: 'Evaluation' },
  { type: 'evaluate' as NodeType, subType: 'Regression', label: 'Regression Metrics', icon: TrendingUp, color: 'from-orange-400 to-amber-500', glowColor: 'hover:shadow-orange-500/10', category: 'Evaluation' },
  // — Model Selection & Prediction —
  { type: 'model_selector' as NodeType, label: 'Model Selector', icon: Trophy, color: 'from-amber-400 to-yellow-500', glowColor: 'hover:shadow-amber-500/10', category: 'Model Ops' },
  { type: 'predict' as NodeType, label: 'Predict', icon: Play, color: 'from-lime-400 to-green-500', glowColor: 'hover:shadow-lime-500/10', category: 'Model Ops' },
  // — File Export —
  { type: 'file_export' as NodeType, subType: 'csv', label: 'Export CSV', icon: Download, color: 'from-teal-400 to-emerald-500', glowColor: 'hover:shadow-teal-500/10', category: 'Data Output' },
  { type: 'file_export' as NodeType, subType: 'excel', label: 'Export Excel', icon: Download, color: 'from-emerald-400 to-green-500', glowColor: 'hover:shadow-emerald-500/10', category: 'Data Output' },
  { type: 'file_export' as NodeType, subType: 'json', label: 'Export JSON', icon: Download, color: 'from-cyan-400 to-teal-500', glowColor: 'hover:shadow-cyan-500/10', category: 'Data Output' },
  { type: 'file_export' as NodeType, subType: 'joblib', label: 'Save Model', icon: Download, color: 'from-blue-400 to-cyan-500', glowColor: 'hover:shadow-blue-500/10', category: 'Data Output' },
];

// Category definitions with icons for collapsed view
const CATEGORIES = [
  { name: 'Triggers', icon: Zap, color: 'from-cyan-400 to-teal-500' },
  { name: 'AI & Models', icon: Brain, color: 'from-emerald-400 to-teal-500' },
  { name: 'Control Flow', icon: GitBranch, color: 'from-yellow-400 to-orange-500' },
  { name: 'Data Processing', icon: Filter, color: 'from-orange-400 to-amber-500' },
  { name: 'Infrastructure', icon: Server, color: 'from-purple-400 to-fuchsia-500' },
  { name: 'Input / Output', icon: MessageSquare, color: 'from-emerald-400 to-green-500' },
  { name: 'Network', icon: Globe, color: 'from-blue-400 to-indigo-500' },
  { name: 'Notifications', icon: Bell, color: 'from-rose-400 to-red-500' },
  { name: 'Integrations', icon: Cloud, color: 'from-sky-400 to-blue-500' },
  { name: 'Transform & Validate', icon: Braces, color: 'from-violet-400 to-indigo-500' },
  { name: 'Utilities', icon: Shield, color: 'from-teal-400 to-cyan-500' },
  { name: 'Messaging', icon: Phone, color: 'from-green-400 to-emerald-500' },
  { name: 'Data Input', icon: Upload, color: 'from-emerald-400 to-teal-500' },
  { name: 'Data Cleaning', icon: Eraser, color: 'from-yellow-400 to-amber-500' },
  { name: 'Feature Engineering', icon: Wand2, color: 'from-violet-400 to-fuchsia-500' },
  { name: 'Regression', icon: TrendingUp, color: 'from-violet-400 to-purple-500' },
  { name: 'Classification', icon: Brain, color: 'from-rose-400 to-pink-500' },
  { name: 'Clustering', icon: Network, color: 'from-pink-400 to-rose-500' },
  { name: 'Dim. Reduction', icon: Shrink, color: 'from-indigo-400 to-blue-500' },
  { name: 'Anomaly Detection', icon: ShieldAlert, color: 'from-red-400 to-orange-500' },
  { name: 'Ensemble', icon: Layers, color: 'from-fuchsia-400 to-pink-500' },
  { name: 'Neural Networks', icon: Cpu, color: 'from-sky-400 to-indigo-500' },
  { name: 'Time Series', icon: TrendingUp, color: 'from-cyan-400 to-blue-500' },
  { name: 'Data Prep', icon: Scissors, color: 'from-amber-400 to-orange-500' },
  { name: 'Evaluation', icon: BarChart3, color: 'from-emerald-400 to-teal-500' },
  { name: 'Model Ops', icon: Trophy, color: 'from-amber-400 to-yellow-500' },
  { name: 'Data Output', icon: Download, color: 'from-teal-400 to-emerald-500' },
];

interface SidebarProps {
  onExecute?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onExecute }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [popupCategory, setPopupCategory] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return ALL_NODES.filter(node => 
      node.label.toLowerCase().includes(query) ||
      node.type.toLowerCase().includes(query) ||
      node.subType?.toLowerCase().includes(query) ||
      node.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const matchingCategories = useMemo(() => {
    if (!filteredNodes) return new Set<string>();
    return new Set(filteredNodes.map(n => n.category));
  }, [filteredNodes]);

  const isSearching = searchQuery.trim().length > 0;

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupCategory(null);
      }
    };
    if (popupCategory) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [popupCategory]);

  const openCategoryPopup = (categoryName: string, buttonEl: HTMLElement) => {
    const rect = buttonEl.getBoundingClientRect();
    setPopupPosition({ top: rect.top });
    setPopupCategory(popupCategory === categoryName ? null : categoryName);
  };

  const renderNodesByCategory = (category: string) => {
    const nodes = isSearching 
      ? filteredNodes?.filter(n => n.category === category) || []
      : ALL_NODES.filter(n => n.category === category);
    
    return nodes.map((node, idx) => (
      <NodeItem 
        key={`${node.type}-${node.subType || idx}`}
        {...node}
        searchMatch={isSearching}
      />
    ));
  };

  // ── Collapsed sidebar: icon strip + popup ──
  if (collapsed) {
    return (
      <aside className={cn('w-16 h-full backdrop-blur-xl border-r flex flex-col items-center py-2 relative', theme.sidebarBg, theme.sidebarBorder)}>
        {/* Logo */}
        <div className={cn('p-2 mb-2 border-b w-full flex justify-center', theme.sidebarBorder)}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={16} className="text-white" />
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setCollapsed(false)}
          className={cn('p-1.5 rounded-lg mb-2 transition-colors', theme.btnHover, theme.textMuted)}
          title="Expand sidebar"
        >
          <PanelLeftOpen size={14} />
        </button>

        {/* Category icons */}
        <div className="flex-1 overflow-y-auto w-full px-1.5 space-y-0.5 custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const nodeCount = ALL_NODES.filter(n => n.category === cat.name).length;
            return (
              <button
                key={cat.name}
                onClick={(e) => openCategoryPopup(cat.name, e.currentTarget)}
                className={cn(
                  'w-full p-2 rounded-xl flex items-center justify-center transition-all group relative',
                  theme.btnHover,
                  popupCategory === cat.name && 'bg-blue-500/15 ring-1 ring-blue-500/30'
                )}
                title={`${cat.name} (${nodeCount})`}
              >
                <div className={cn('p-1.5 rounded-lg bg-gradient-to-br opacity-70 group-hover:opacity-100 transition-opacity', cat.color)}>
                  <CatIcon size={12} className="text-white" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Execute button */}
        <div className={cn('p-2 border-t w-full flex justify-center', theme.sidebarBorder)}>
          <button
            onClick={onExecute}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center active:scale-[0.95]"
            title="Execute Workflow"
          >
            <Zap size={16} />
          </button>
        </div>

        {/* Popup panel — rendered via portal so drag works across the whole page */}
        {popupCategory && ReactDOM.createPortal(
          <div
            ref={popupRef}
            className={cn('fixed z-50 w-64 max-h-[60vh] rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden', theme.sidebarBg, theme.sidebarBorder)}
            style={{ left: '72px', top: Math.max(8, Math.min(popupPosition.top - 20, window.innerHeight - 400)) }}
          >
            {/* Popup header */}
            <div className={cn('flex items-center justify-between px-3 py-2.5 border-b shrink-0', theme.sidebarBorder)}>
              <span className={cn('text-xs font-semibold', theme.textPrimary)}>{popupCategory}</span>
              <button onClick={() => setPopupCategory(null)} className={cn('p-0.5 rounded hover:bg-white/10', theme.textMuted)}>
                <X size={12} />
              </button>
            </div>
            {/* Popup nodes */}
            <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar">
              {ALL_NODES.filter(n => n.category === popupCategory).map((node, idx) => (
                <NodeItem
                  key={`${node.type}-${node.subType || idx}`}
                  {...node}
                />
              ))}
            </div>
          </div>,
          document.body
        )}
      </aside>
    );
  }

  // ── Expanded sidebar ──
  return (
    <aside className={cn('w-72 h-full backdrop-blur-xl border-r flex flex-col', theme.sidebarBg, theme.sidebarBorder)}>
      {/* Logo */}
      <div className={cn('p-5 border-b', theme.sidebarBorder)}>
        <h2 className={cn('text-lg font-bold tracking-tight flex items-center gap-2.5', theme.textPrimary)}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={16} className="text-white" />
          </div>
          FlowCraft
          <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">v2.0</span>
          <button
            onClick={() => { setCollapsed(true); setPopupCategory(null); }}
            className={cn('ml-auto p-1 rounded-lg transition-colors', theme.btnHover, theme.textMuted)}
            title="Collapse sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        </h2>
      </div>

      {/* Working Search */}
      <div className={cn('px-4 py-3 border-b', theme.sidebarBorder)}>
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border', theme.inputBg, theme.inputBorder)}>
          <Search size={14} className={theme.textMuted} />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn('flex-1 bg-transparent text-xs outline-none', theme.inputText, theme.inputPlaceholder)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={cn('p-0.5 rounded hover:bg-white/10', theme.textMuted)}>
              <X size={12} />
            </button>
          )}
        </div>
        {isSearching && (
          <p className={cn('text-[10px] mt-2 px-1', theme.textMuted)}>
            Found {filteredNodes?.length || 0} node{(filteredNodes?.length || 0) !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Node Library */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {isSearching && filteredNodes?.length === 0 ? (
          <div className={cn('text-center py-8', theme.textMuted)}>
            <Search size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No nodes found</p>
            <p className="text-[10px] mt-1">Try a different search term</p>
          </div>
        ) : (
          <>
            <Section 
              title="Triggers" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Triggers').length || 0) : 3} 
              icon={Zap} 
              iconColor="from-cyan-400 to-teal-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Triggers')}
            >
              {renderNodesByCategory('Triggers')}
            </Section>

            <Section 
              title="AI & Models" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'AI & Models').length || 0) : 6} 
              icon={Brain} 
              iconColor="from-emerald-400 to-teal-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('AI & Models')}
            >
              {renderNodesByCategory('AI & Models')}
            </Section>

            <Section 
              title="Control Flow" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Control Flow').length || 0) : 3} 
              icon={GitBranch} 
              iconColor="from-yellow-400 to-orange-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Control Flow')}
            >
              {renderNodesByCategory('Control Flow')}
            </Section>

            <Section 
              title="Data Processing" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Data Processing').length || 0) : 4} 
              icon={Filter} 
              iconColor="from-orange-400 to-amber-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Data Processing')}
            >
              {renderNodesByCategory('Data Processing')}
            </Section>

            <Section 
              title="Infrastructure" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Infrastructure').length || 0) : 1} 
              icon={Server} 
              iconColor="from-purple-400 to-fuchsia-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Infrastructure')}
            >
              {renderNodesByCategory('Infrastructure')}
            </Section>

            <Section 
              title="Input / Output" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Input / Output').length || 0) : 2} 
              icon={MessageSquare} 
              iconColor="from-emerald-400 to-green-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Input / Output')}
            >
              {renderNodesByCategory('Input / Output')}
            </Section>

            <Section 
              title="Network" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Network').length || 0) : 7} 
              icon={Globe} 
              iconColor="from-blue-400 to-indigo-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Network')}
            >
              {renderNodesByCategory('Network')}
            </Section>

            <Section 
              title="Notifications" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Notifications').length || 0) : 3} 
              icon={Bell} 
              iconColor="from-rose-400 to-red-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Notifications')}
            >
              {renderNodesByCategory('Notifications')}
            </Section>

            <Section 
              title="Integrations" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Integrations').length || 0) : 2} 
              icon={Cloud} 
              iconColor="from-sky-400 to-blue-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Integrations')}
            >
              {renderNodesByCategory('Integrations')}
            </Section>

            <Section 
              title="Transform & Validate" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Transform & Validate').length || 0) : 5} 
              icon={Braces} 
              iconColor="from-violet-400 to-indigo-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Transform & Validate')}
            >
              {renderNodesByCategory('Transform & Validate')}
            </Section>

            <Section 
              title="Utilities" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Utilities').length || 0) : 5} 
              icon={Shield} 
              iconColor="from-teal-400 to-cyan-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Utilities')}
            >
              {renderNodesByCategory('Utilities')}
            </Section>

            <Section 
              title="Messaging" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Messaging').length || 0) : 5} 
              icon={Phone} 
              iconColor="from-green-400 to-emerald-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Messaging')}
            >
              {renderNodesByCategory('Messaging')}
            </Section>

            <Section 
              title="Data Input" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Data Input').length || 0) : ALL_NODES.filter(n => n.category === 'Data Input').length} 
              icon={Upload} 
              iconColor="from-emerald-400 to-teal-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Data Input')}
            >
              {renderNodesByCategory('Data Input')}
            </Section>

            <Section 
              title="Data Cleaning" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Data Cleaning').length || 0) : ALL_NODES.filter(n => n.category === 'Data Cleaning').length} 
              icon={Eraser} 
              iconColor="from-yellow-400 to-amber-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Data Cleaning')}
            >
              {renderNodesByCategory('Data Cleaning')}
            </Section>

            <Section 
              title="Feature Engineering" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Feature Engineering').length || 0) : ALL_NODES.filter(n => n.category === 'Feature Engineering').length} 
              icon={Wand2} 
              iconColor="from-violet-400 to-fuchsia-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Feature Engineering')}
            >
              {renderNodesByCategory('Feature Engineering')}
            </Section>

            <Section 
              title="Regression" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Regression').length || 0) : ALL_NODES.filter(n => n.category === 'Regression').length} 
              icon={TrendingUp} 
              iconColor="from-violet-400 to-purple-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Regression')}
            >
              {renderNodesByCategory('Regression')}
            </Section>

            <Section 
              title="Classification" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Classification').length || 0) : ALL_NODES.filter(n => n.category === 'Classification').length} 
              icon={Brain} 
              iconColor="from-rose-400 to-pink-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Classification')}
            >
              {renderNodesByCategory('Classification')}
            </Section>

            <Section 
              title="Clustering" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Clustering').length || 0) : ALL_NODES.filter(n => n.category === 'Clustering').length} 
              icon={Network} 
              iconColor="from-pink-400 to-rose-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Clustering')}
            >
              {renderNodesByCategory('Clustering')}
            </Section>

            <Section 
              title="Dim. Reduction" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Dim. Reduction').length || 0) : ALL_NODES.filter(n => n.category === 'Dim. Reduction').length} 
              icon={Shrink} 
              iconColor="from-indigo-400 to-blue-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Dim. Reduction')}
            >
              {renderNodesByCategory('Dim. Reduction')}
            </Section>

            <Section 
              title="Anomaly Detection" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Anomaly Detection').length || 0) : ALL_NODES.filter(n => n.category === 'Anomaly Detection').length} 
              icon={ShieldAlert} 
              iconColor="from-red-400 to-orange-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Anomaly Detection')}
            >
              {renderNodesByCategory('Anomaly Detection')}
            </Section>

            <Section 
              title="Ensemble" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Ensemble').length || 0) : ALL_NODES.filter(n => n.category === 'Ensemble').length} 
              icon={Layers} 
              iconColor="from-fuchsia-400 to-pink-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Ensemble')}
            >
              {renderNodesByCategory('Ensemble')}
            </Section>

            <Section 
              title="Neural Networks" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Neural Networks').length || 0) : ALL_NODES.filter(n => n.category === 'Neural Networks').length} 
              icon={Cpu} 
              iconColor="from-sky-400 to-indigo-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Neural Networks')}
            >
              {renderNodesByCategory('Neural Networks')}
            </Section>

            <Section 
              title="Time Series" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Time Series').length || 0) : ALL_NODES.filter(n => n.category === 'Time Series').length} 
              icon={TrendingUp} 
              iconColor="from-cyan-400 to-blue-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Time Series')}
            >
              {renderNodesByCategory('Time Series')}
            </Section>

            <Section 
              title="Data Prep" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Data Prep').length || 0) : 6} 
              icon={Scissors} 
              iconColor="from-amber-400 to-orange-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Data Prep')}
            >
              {renderNodesByCategory('Data Prep')}
            </Section>

            <Section 
              title="Evaluation" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Evaluation').length || 0) : 3} 
              icon={BarChart3} 
              iconColor="from-emerald-400 to-teal-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Evaluation')}
            >
              {renderNodesByCategory('Evaluation')}
            </Section>

            <Section 
              title="Model Ops" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Model Ops').length || 0) : ALL_NODES.filter(n => n.category === 'Model Ops').length} 
              icon={Trophy} 
              iconColor="from-amber-400 to-yellow-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Model Ops')}
            >
              {renderNodesByCategory('Model Ops')}
            </Section>

            <Section 
              title="Data Output" 
              count={isSearching ? (filteredNodes?.filter(n => n.category === 'Data Output').length || 0) : ALL_NODES.filter(n => n.category === 'Data Output').length} 
              icon={Download} 
              iconColor="from-teal-400 to-emerald-500" 
              defaultOpen={false}
              forceOpen={isSearching && matchingCategories.has('Data Output')}
            >
              {renderNodesByCategory('Data Output')}
            </Section>
          </>
        )}
      </div>

      {/* Execute button */}
      <div className={cn('p-3 border-t', theme.sidebarBorder)}>
        <button 
          onClick={onExecute}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Zap size={16} />
          Execute Workflow
        </button>
      </div>
    </aside>
  );
};
