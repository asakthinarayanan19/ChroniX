# IncidentIQ

IncidentIQ is an AI-powered incident reconstruction platform that analyzes fragmented incident evidence such as server logs, monitoring data, support tickets, deployment records, and engineer conversations.

Instead of only generating a simple incident summary, IncidentIQ reconstructs the incident timeline and separates **facts, inferences, conflicts, and unknowns**. It also identifies possible root causes, shows supporting evidence, and recommends actions.

## Features

* Evidence-driven incident reconstruction.
* Upload and process TXT, LOG, CSV, and PDF files.
* Automatic extraction of incident evidence.
* Source-linked incident timeline.
* Incident severity and impact analysis.
* Root-cause candidates with confidence levels.
* FACT, INFERENCE, CONFLICT, and UNKNOWN classification.
* Conflict detection between different evidence sources.
* Recommended actions for incident investigation.
* Built-in demo mode that works without an LLM API key.
* Optional LLM-powered analysis.
* Responsive white enterprise-style dashboard.
* Overview, Timeline, Evidence, Root Cause, Conflicts, and Actions sections.
* Working evidence search and filtering.
* Incident status management.
* Action checkboxes and completion tracking.
* Copy incident summary.
* Export incident report.
* New Incident and Clear All functionality.

## Architecture

```text
User
  |
  v
React + Vite Frontend
  |
  | HTTP / REST API
  v
Python FastAPI Backend
  |
  +--> File Upload
  |
  +--> PDF / CSV / TXT / LOG Processing
  |
  +--> Evidence Extraction
  |
  v
LLM Analysis
  |
  +--> Incident Summary
  +--> Timeline
  +--> Evidence Classification
  +--> Root Cause Candidates
  +--> Conflicts
  +--> Unknowns
  +--> Recommended Actions
  |
  v
Structured JSON
  |
  v
React Incident Dashboard
```

## How It Works

1. The user uploads incident evidence such as logs, monitoring files, support tickets, deployment records, or engineer conversations.
2. The React frontend sends the uploaded files to the FastAPI backend.
3. FastAPI validates and processes the files.
4. CSV files are processed as structured monitoring data.
5. TXT and LOG files are extracted as text.
6. PDF files are processed to extract their text content.
7. The extracted evidence is combined while preserving the original source filenames.
8. The evidence is sent to the optional LLM service for analysis.
9. The AI reconstructs the incident chronologically.
10. Important findings are classified as FACT, INFERENCE, CONFLICT, or UNKNOWN.
11. Possible root causes are identified without falsely confirming unsupported causes.
12. The backend returns structured JSON to the React frontend.
13. The dashboard displays the reconstructed incident through different sections.
14. If an LLM API key is not available, IncidentIQ automatically uses its deterministic demo analysis so the main workflow still works.

## Evidence Classification

### FACT

Information directly supported by the uploaded evidence.

Example:

```text
Monitoring data shows CPU usage reached 94%.
```

### INFERENCE

A conclusion suggested by the available evidence but not directly confirmed.

Example:

```text
High resource usage may have contributed to the service degradation.
```

### CONFLICT

Two or more evidence sources provide different or contradictory information.

Example:

```text
An engineer suspected a database failure, but the available
monitoring evidence does not directly confirm a database failure.
```

### UNKNOWN

Information that cannot be confirmed using the available evidence.

Example:

```text
The exact root cause of the incident is unknown.
```

## Example Incident

IncidentIQ includes a sample payment-service incident.

The example contains:

* Monitoring metrics.
* Engineer communication.
* Customer support tickets.
* Deployment records.

Example timeline:

```text
09:45  Deployment completed successfully.
10:02  CPU usage increased.
10:03  Payment API errors increased.
10:05  Customer payment failures reported.
10:05  Engineer suspected database connection issues.
10:09  Payment service restart initiated.
10:11  Payment service restart completed.
10:18  Health checks passed.
10:20  Service appeared stable.
```

The system does not automatically claim that the database caused the incident.

Instead, it can report:

```text
Possible Root Cause:
Database connection issue

Confidence:
62%

Status:
NOT CONFIRMED
```

This keeps the analysis evidence-driven.

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* Lucide React

### Backend

* Python
* FastAPI
* Pydantic
* Uvicorn

### Data Processing

* pandas
* pypdf
* python-multipart

### AI

* OpenAI-compatible LLM API
* Structured JSON incident analysis

## Project Structure

```text
ChroniX/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── uploads/
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── file_processor.py
│   │   ├── llm_service.py
│   │   └── incident_analyzer.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── incident_models.py
│   │
│   └── sample_data/
│       ├── monitoring.csv
│       ├── engineer_chat.txt
│       ├── support_tickets.csv
│       └── deployment.log
│
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       └── services/
│
├── .gitignore
├── README.md
└── docs/
```

## Requirements

Install the following before running the project:

* Python 3.10 or higher.
* Node.js 18 or higher.
* npm.
* Git.

The project is designed to run on Windows 11.

## Backend Setup

Open PowerShell in the project directory.

```powershell
cd backend
```

Create a Python virtual environment:

```powershell
python -m venv venv
```

Activate the environment:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the required Python packages:

```powershell
pip install -r requirements.txt
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Start the FastAPI server:

```powershell
uvicorn main:app --reload
```

The backend will run at:

```text
http://localhost:8000
```

FastAPI Swagger documentation:

```text
http://localhost:8000/docs
```

## LLM Configuration

The LLM API key must remain on the backend.

Open:

```text
backend/.env
```

Configure the required environment variables:

```env
LLM_API_KEY=your_api_key_here
LLM_MODEL=your_model_name
```

Never place the API key directly inside the React frontend.

The `.env` file is excluded from Git using `.gitignore`.

If the API key is not configured, IncidentIQ uses its deterministic demo analysis.

## Frontend Setup

Open a second PowerShell window.

Move to the frontend directory:

```powershell
cd frontend
```

Install the frontend dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

## Running the Application

Start the backend first:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Then start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open the website:

```text
http://localhost:5173
```

## Demo Mode

IncidentIQ includes a built-in demo mode.

Click:

```text
Run Demo Incident
```

The demo uses the bundled sample incident evidence and does not require:

* Manual file uploads.
* An LLM API key.
* An external database.

This allows the complete incident reconstruction workflow to be demonstrated even when the LLM service is unavailable.

## API Endpoints

### GET /

Checks whether the IncidentIQ API is running.

```text
GET /
```

### GET /health

Returns backend health information.

```text
GET /health
```

### POST /api/analyze

Accepts one or more incident evidence files.

Supported formats:

```text
TXT
LOG
CSV
PDF
```

```text
POST /api/analyze
```

### POST /api/demo

Runs the built-in demonstration incident.

```text
POST /api/demo
```

### GET /api/sample

Returns sample incident information.

```text
GET /api/sample
```

## Dashboard Sections

### Overview

Displays:

* Incident title.
* Severity.
* Current status.
* Incident summary.
* Impact.

### Timeline

Displays the reconstructed chronological sequence of events.

Each event can include:

* Time.
* Event description.
* Source file.
* Evidence classification.

### Evidence

Displays important evidence extracted from the uploaded sources.

Users can search and filter the evidence.

### Root Cause

Displays possible root-cause candidates with:

* Cause description.
* Confidence level.
* Supporting evidence.
* Confirmation status.

### Conflicts

Displays disagreements between evidence sources.

### Actions

Displays recommended investigation and recovery actions.

Users can:

* Mark individual actions as complete.
* Mark all actions as complete.
* Reset actions.

## Security

* API keys are stored only in backend environment variables.
* `.env` files are excluded from Git.
* Frontend code does not contain LLM credentials.
* Uploaded files are validated by the backend.
* Generated dependencies and virtual environments are excluded from Git.

## Future Improvements

* Persistent incident history.
* User-managed incident workspaces.
* Improved timestamp and entity extraction.
* Advanced PDF and table processing.
* Additional LLM provider support.
* Retrieval-Augmented Generation (RAG).
* Embedding-based evidence search.
* Cloud deployment.
* Team collaboration.
* Incident comparison across multiple events.
* Advanced monitoring integrations.

## Project Goal

The goal of IncidentIQ is to make incident investigation faster and more reliable by combining fragmented evidence into a structured incident reconstruction.

Instead of simply asking:

```text
"What happened?"
```

IncidentIQ also answers:

```text
What do we know?
What is inferred?
What evidence supports it?
Where do sources conflict?
What remains unknown?
What should investigators do next?
```

## License

This project is developed as a hackathon and academic project.
