# IncidentIQ

IncidentIQ reconstructs an incident from fragmented logs, monitoring exports, support tickets, and engineer notes. The dashboard shows sourced events, impact, candidate causes, conflicting evidence, unknowns, and recommended actions. An offline demo is included so the main flow works without an LLM key.

## Features

- FastAPI endpoints for health, evidence upload, and built-in demo analysis.
- TXT, LOG, CSV, and PDF text extraction with source filenames preserved.
- Evidence-focused incident reconstruction with source-linked timeline and findings.
- Optional OpenAI-compatible analysis configured through environment variables.
- Responsive white enterprise dashboard with working navigation, filters, status control, action checkboxes, report export, and summary copy.
- Overview, Timeline, Evidence, Root Cause, Conflicts, and Actions sections.
- Local demo fallback that requires no credentials.

## Architecture

The React/Vite frontend sends files to FastAPI. `file_processor.py` extracts text while preserving each filename. `incident_analyzer.py` calls the optional LLM service, then uses the deterministic demo analyzer when no key is configured. The API returns structured JSON used by the dashboard. No database is required for this MVP.

## Tech stack

Python, FastAPI, Pydantic, pandas, pypdf, OpenAI Python SDK, React, Vite, and lucide-react.

## Folder structure

```text
backend/
  main.py
  requirements.txt
  services/       # extraction and analysis
  models/         # API data models
  sample_data/    # demo incident evidence
frontend/
  src/            # React dashboard and API client
  package.json
README.md
```

## Requirements

Install Python 3.10+ and Node.js 18+ on Windows 11. Open PowerShell in the project directory.

## Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`; interactive docs are at `http://localhost:8000/docs`.

### LLM configuration

Edit `backend\.env` and set `LLM_API_KEY` to your provider key and `LLM_MODEL` to a model supported by the OpenAI-compatible chat completions API. The key stays on the backend. Restart Uvicorn after changing the environment. If the key is absent, the deterministic reconstruction keeps the demo available.

## Frontend setup

Open a second PowerShell window in the project directory:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend must be running in the other window.

## Run the demo

Click **Run demo incident** in the dashboard. It analyzes the included monitoring, engineer chat, support ticket, and deployment evidence. No manual files or LLM credentials are needed.

## API endpoints

- `GET /` — API welcome message.
- `GET /health` — health status.
- `POST /api/analyze` — multipart upload using one or more `files` fields.
- `POST /api/demo` — analyze the bundled sample incident.
- `GET /api/sample` — return the bundled sample reconstruction.

## Future improvements

Persist analysis history, improve timestamp and entity extraction, add richer PDF/table handling, support additional LLM providers, and add user-managed incident workspaces.
