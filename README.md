# FlowCraft

FlowCraft is a no-code visual workflow builder for AI, machine learning, data processing, and communication automation. It provides a React Flow canvas where users can drag, configure, connect, save, import, export, and execute workflows made of reusable nodes.

The project includes a Vite/React frontend and a FastAPI backend. Workflows are saved in SQLite, executed on the backend, and streamed back to the browser through WebSockets so each node can show live progress and results.

## Features

- Drag-and-drop workflow editor built with React, TypeScript, React Flow, and Tailwind CSS.
- Persistent workflow storage with create, update, load, delete, and execution history support.
- Real-time workflow execution over WebSockets.
- AI Copilot that generates workflow graphs from natural-language prompts.
- Import and export workflows as JSON.
- Built-in workflow templates for common AI, ML, and automation pipelines.
- Node detail modal, execution status edges, minimap, themes, keyboard shortcuts, and workflow browser.
- Backend executors for AI, files, data cleaning, ML, neural networks, clustering, anomaly detection, messaging, APIs, databases, and utility transformations.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, React Flow, Tailwind CSS, lucide-react |
| Backend | Python, FastAPI, Uvicorn, WebSockets |
| Database | SQLite through async database helpers |
| AI | Google Gemini and OpenAI integrations |
| Workflow Runtime | Backend executor modules with live browser updates |

## Project Structure

```text
.
+-- src/
|   +-- App.tsx                    # Main visual workflow editor
|   +-- components/                # Panels, modals, edges, and node UI
|   +-- components/nodes/          # Frontend node definitions
|   +-- ThemeContext.tsx           # Theme configuration
|   +-- types.ts                   # Shared frontend types
+-- server/
|   +-- main.py                    # FastAPI app entry point
|   +-- database.py                # SQLite initialization and helpers
|   +-- models.py                  # Backend data models
|   +-- routes/                    # API, upload, websocket, auth, execution routes
|   +-- executors/                 # Node execution implementations
|   +-- requirements.txt           # Python backend dependencies
|   +-- flowcraft.db               # Local SQLite database
+-- package.json                   # Frontend dependencies and scripts
+-- vite.config.ts                 # Vite configuration
+-- README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- Python 3.10 or newer
- A Gemini API key for Gemini-powered AI features
- Optional API keys for OpenAI, Microsoft Graph, SendGrid, Mailgun, and messaging integrations

## Environment Variables

Create a `.env` file in the project root. The backend loads this file automatically from `server/main.py`, and Vite also reads it for frontend build-time variables.

```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:8088/auth/microsoft/callback

SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=sender@example.com
MAILGUN_API_KEY=your_mailgun_api_key
```

Only `GEMINI_API_KEY` is required for the Gemini Copilot and Gemini AI nodes. Other variables are needed only when you use the related provider or integration.

## Installation

Install frontend dependencies:

```bash
npm install
```

Create and activate a Python virtual environment for the backend:

```bash
cd server
python -m venv venv
```

On Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

## Running Locally

Start the FastAPI backend from the `server` directory:

```bash
uvicorn main:app --host 0.0.0.0 --port 8088 --reload
```

The API will be available at:

- `http://localhost:8088`
- `http://localhost:8088/docs`
- `http://localhost:8088/health`

In a second terminal, start the frontend from the project root:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

The frontend is currently configured to call the backend at `http://localhost:8088/api` and to execute workflows through `ws://localhost:8088/ws/execute/{workflow_id}`.

## Common Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production frontend build |
| `npm run lint` | Run TypeScript checking with `tsc --noEmit` |
| `uvicorn main:app --host 0.0.0.0 --port 8088 --reload` | Start the backend API |

## How to Use the App

1. Start the backend and frontend.
2. Drag nodes from the sidebar onto the canvas.
3. Connect node handles to define execution order.
4. Double-click nodes to view or edit details.
5. Use **Save** to persist a workflow to SQLite.
6. Use **Deploy** to execute the workflow.
7. Watch node and edge statuses update in real time.
8. Open **Execution history** to review previous runs.
9. Use **Templates** to load a ready-made workflow.
10. Use **AI Copilot** to generate a workflow from a prompt.

## Main Node Categories

- AI and LLM nodes
- Logic, condition, and template nodes
- HTTP, webhook, WebSocket, RSS, and API integration nodes
- File upload and export nodes
- Data cleaning, preparation, merge, and feature engineering nodes
- Machine learning, neural network, ensemble, evaluation, prediction, clustering, dimensionality reduction, anomaly, and time-series nodes
- Email, Slack, Teams, Outlook, Telegram, WhatsApp, and Instagram nodes
- Database, cache, crypto, regex, JSON transform, validator, QR code, Markdown, and code utility nodes

## API Overview

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Backend health check |
| `GET /docs` | FastAPI Swagger documentation |
| `GET /api/workflows` | List saved workflows |
| `POST /api/workflows` | Save a new workflow |
| `GET /api/workflows/{id}` | Load one workflow |
| `PUT /api/workflows/{id}` | Update a workflow |
| `DELETE /api/workflows/{id}` | Delete a workflow |
| `POST /api/execute/{workflow_id}` | Execute a workflow through REST |
| `WS /ws/execute/{workflow_id}` | Execute a workflow with real-time updates |
| `GET /api/executions/{workflow_id}` | Get execution history |
| `POST /api/copilot/generate` | Generate a workflow using AI Copilot |
| `POST /api/upload` | Upload files for workflow nodes |

## Example Workflow Ideas

- Upload a CSV, clean missing values, train a Random Forest model, evaluate the result, and export predictions.
- Fetch data from an HTTP endpoint, transform JSON, validate fields, and send a Slack notification.
- Read RSS articles, summarize them with Gemini, convert the summary to HTML, and email a digest.
- Classify Outlook messages with AI and route urgent messages to Microsoft Teams.
- Compare multiple ML models and select the best model by accuracy, F1, RMSE, or another metric.

## Troubleshooting

If the frontend cannot load workflows or execute runs, make sure the backend is running on port `8088`.

If AI Copilot fails, confirm that `GEMINI_API_KEY` is present in the root `.env` file and restart the backend.

If Microsoft integrations fail, verify the Microsoft OAuth variables and make sure the redirect URI matches the app registration.

If PowerShell blocks virtual environment activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate the virtual environment again.

If TypeScript checks fail, run:

```bash
npm run lint
```

and fix the reported files before building.

## Notes

- The local SQLite database and uploaded files are development artifacts. Avoid committing private workflow data, uploads, API keys, or generated cache files.
- The frontend currently uses hard-coded local backend URLs. Update the API base URLs before deploying to a hosted environment.
- Keep secrets in `.env`; do not place them directly in source files.
