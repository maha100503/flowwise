# FlowCraft: Visual Workflow Engine
### No-Code AI, Machine Learning & Communication Automation Platform

**Date:** April 21, 2026
**Prepared by:** Mahalakshmi Kamalakannan

---

## 1. Executive Summary

FlowCraft is a no-code visual workflow platform that enables teams to build end-to-end AI/ML pipelines and multi-channel communication workflows through drag-and-drop. Users design workflows by connecting visual nodes on a canvas—covering the full ML lifecycle from data upload through model training and evaluation, alongside automated messaging across 7 communication platforms. An integrated AI Copilot generates complete workflows from plain English descriptions.

**Key Numbers:** 24+ ML algorithms | 6 LLM providers | 7 messaging platforms | 100+ node types | 40+ backend executors

---

## 2. Core Capabilities

### AI & Large Language Models

FlowCraft integrates **6 AI providers** as drag-and-drop nodes, each configurable with system prompt, temperature, max tokens, and model selection:

| Provider | Default Model | Status |
|---|---|---|
| Google Gemini | gemini-2.5-flash-lite | Fully Implemented |
| OpenAI | gpt-4o | Fully Implemented |
| Anthropic Claude | claude-3-sonnet | API Ready |
| Meta (Llama) | llama-3-70b | API Ready |
| Mistral | mistral-large | API Ready |
| Groq | llama-3.3-70b-versatile | API Ready |

The **AI Copilot** can generate entire workflows from natural language (e.g., *"Build a pipeline that uploads CSV, cleans data, trains Random Forest, and evaluates accuracy"*). It supports multimodal input—users can upload a sketch or diagram and the AI will interpret it into a working workflow. The Copilot also suggests next nodes and auto-fixes broken workflows.

### Machine Learning — Full Lifecycle

FlowCraft covers every stage of the ML pipeline as visual nodes, backed by scikit-learn, XGBoost, and LightGBM:

**Data Pipeline:** File Upload (CSV, Excel, JSON, PDF, TXT) → Data Cleaning (7 operations: drop nulls, parse dates, coerce types, normalize text, drop duplicates, filter rows, rename columns) → Feature Engineering (7 operations: date diff, ratio, aggregate, bin numeric, interaction, formula, auto-features) → Data Preparation (train/test split, normalize, standardize, label encode, fill missing, feature selection)

**Training — 24+ Algorithms:**

| Category | Algorithms |
|---|---|
| Regression (8) | Linear, Polynomial, Ridge, Lasso, ElasticNet, Bayesian Ridge, Quantile, SVR |
| Classification (10) | Logistic Regression, SVM, KNN, Gaussian/Multinomial/Bernoulli NB, SGD, Perceptron, Passive Aggressive |
| Ensemble/Boosting (6) | Decision Tree, Random Forest, Gradient Boosting, AdaBoost, XGBoost, LightGBM |

**Neural Networks:** Configurable MLP with custom hidden layers (e.g., 100→50→25), activation functions (relu, tanh, sigmoid), solvers (adam, sgd, lbfgs), and training parameters. Outputs loss curve, convergence info, and architecture visualization.

**Ensemble Methods:** Bagging, Voting (soft/hard), Stacking, AdaBoost, Gradient Boosting — each supporting both classification and regression.

**Post-Training:** Evaluate node (accuracy, precision, recall, F1, confusion matrix for classification; MSE, RMSE, MAE, R² for regression) → Model Selector (compares multiple models, picks best by chosen metric) → Predict node (applies trained model to new data with probability scores).

### Advanced Analytics

| Domain | Methods |
|---|---|
| Clustering (10) | K-Means, DBSCAN, HDBSCAN, Hierarchical, GMM, Spectral, Mean Shift, Mini-Batch K-Means, Affinity Propagation, Birch |
| Dimensionality Reduction (6) | PCA, Kernel PCA, t-SNE, LDA, ICA, Factor Analysis |
| Anomaly Detection (4) | Isolation Forest, One-Class SVM, Local Outlier Factor, Elliptic Envelope |
| Time Series (6) | ARIMA, SARIMA, SARIMAX, Exponential Smoothing, Moving Average, Decomposition |

### Communication & Messaging — 7 Platforms

FlowCraft enables workflows to send automated notifications, alerts, and data-driven messages:

| Platform | Capabilities |
|---|---|
| **Email** | 3 providers (SMTP, SendGrid, Mailgun). HTML support, template variables |
| **Slack** | Webhook and Bot Token methods. Markdown, Block Kit rich messages |
| **Microsoft Teams** | Send to channels/DMs, read messages, list teams/channels (Graph API) |
| **Outlook** | Send, read inbox, search, reply, create drafts (Graph API) |
| **Telegram** | Send messages/photos/documents, forward, poll updates (Bot API) |
| **WhatsApp** | Text, templates, media (image/video/doc), interactive buttons/lists (Business Cloud API) |
| **Instagram** | DMs, comments, get media/comments, publish posts (Graph API) |

All messaging nodes support `{{variable}}` template substitution, pulling dynamic data from upstream pipeline results.

---

## 3. Technical Architecture

| Component | Technology |
|---|---|
| Frontend | React 19, TypeScript, ReactFlow v12, Tailwind CSS v4, Vite 6 |
| Backend | FastAPI (Python), Uvicorn, async execution |
| Database | SQLite + aiosqlite (WAL mode) |
| ML Stack | scikit-learn, XGBoost, LightGBM, pandas, numpy |
| AI SDKs | google-generativeai, openai |
| Auth | Microsoft OAuth 2.0 |

**Execution Engine:** Topological sort (Kahn's algorithm) determines node execution order. Supports conditional branching, per-node retry, and real-time WebSocket streaming — the browser receives live progress updates, training output, and per-node timing as workflows execute. Large result arrays are auto-truncated to 100 rows for safe browser display.

**Security:** Python code nodes run in a sandbox with 28 whitelisted builtins and only 4 allowed imports (datetime, math, json, re). No file system or network access. All expressions validated via AST parsing.

---

## 4. Pre-built Templates

| Template | Pipeline |
|---|---|
| Random Forest Pipeline | Upload → Clean → Encode → Normalize → Split → Train → Evaluate → Output |
| Model Comparison | Upload → Clean → Encode → Split → RF / XGBoost / SVM (parallel) → 3× Evaluate |
| Multi-Model AI Ensemble | Input → Gemini + Claude + GPT-4 (parallel) → Combine → Output |
| AI Chatbot | Chat Input → Gemini → Output |
| Webhook → Slack | Webhook POST → Gemini → Slack Notification |

---

## 5. Roadmap

- **Deep Learning** — PyTorch/TensorFlow nodes for CNN, RNN, LSTM, Transformer architectures
- **AutoML** — Automated hyperparameter tuning (grid search, Bayesian optimization)
- **Model Registry** — Persistent model versioning and deployment tracking
- **RAG** — Vector database integration for knowledge-grounded AI
- **Scheduled Execution** — Cron-based automated pipeline reruns
- **Cloud Deployment** — PostgreSQL + Azure/AWS container orchestration

---

## 6. Conclusion

FlowCraft provides a complete no-code environment for building ML/AI pipelines and communication workflows. With 24+ ML algorithms, configurable neural networks, 6 LLM providers, an AI Copilot, and 7 messaging platform integrations, teams can go from raw data to trained model to automated notification—entirely through visual drag-and-drop.

---

*For questions or a live demo, please reach out directly.*
