# CX Agent Studio Testing Platform

An AI-powered testing platform for **Dialogflow CX** agents — generate, execute, and analyze test cases using **Gemini** and Google's **Conversation Evaluation Service (CES) v1beta** APIs.

![Python](https://img.shields.io/badge/python-3.11+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/react-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/fastapi-0.115-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│   Dashboard │ Projects │ Test Cases │ Evaluations │ LiveChat │
└──────────────────────┬───────────────────────────────────────┘
                       │  REST API (FastAPI)
┌──────────────────────┴───────────────────────────────────────┐
│                     FastAPI Backend                          │
│   Gemini AI Engine │ CES Client │ Auth │ Evaluation Runner   │
└────┬──────────────────────┬──────────────┬────────────────────┘
     │                      │              │
  SQLite/PostgreSQL     Gemini API       CES API
  (local/prod)          (2.5 Pro)       (v1beta)
```

---

## Features

| Feature | Description |
|---|---|
| **AI Test Generation** | Paste text or upload `.docx` files — Gemini generates structured CES test cases |
| **Approval Workflow** | Every AI output goes through Approve / Retry / Deny with a feedback loop |
| **Golden Conversations** | Deterministic turn-by-turn tests with expected behaviors |
| **Scenario Testing** | AI-simulated user interactions with rubric-based scoring |
| **Evaluation Runner** | Full CES v1beta pipeline with real-time progress tracking |
| **Results Dashboard** | Pass/fail metrics, p50/p90/p99 latency charts, trend analysis |
| **AI Failure Analysis** | Gemini-powered root-cause analysis and improvement recommendations |
| **Live Agent Chat** | Interactive manual testing via `sessions.runSession` |
| **Scheduled Runs** | Automated regression testing with `scheduledEvaluationRuns` |
| **CSV Export** | Download full evaluation results as CSV |
| **Activity Feed** | Per-project audit trail of all actions |
| **Test Case Diff** | Side-by-side version comparison for reviewed test cases |

---

## Quick Start (Local — no Docker required)

### Prerequisites
- Python 3.11+
- Node.js 18+
- A GCP project with **CES API** and **Gemini API** enabled

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # or create manually (see below)

# Start server — SQLite DB is created automatically on first run
uvicorn app.main:app --reload --port 8000
```

**`backend/.env`** (minimum required):

```env
GCP_PROJECT_ID=your-gcp-project-id
GEMINI_API_KEY=your-gemini-api-key

DATABASE_URL=sqlite+aiosqlite:///./cx_testing.db
DATABASE_URL_SYNC=sqlite:///./cx_testing.db
SECRET_KEY=change-me-in-production
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## Project Structure

```
cx-agent-studio-testing/
├── backend/
│   ├── app/
│   │   ├── api/routes/         # FastAPI route handlers
│   │   │   ├── auth.py         # JWT + Google OAuth2
│   │   │   ├── projects.py     # Project CRUD
│   │   │   ├── test_cases.py   # Test case generation & approval
│   │   │   ├── evaluations.py  # CES evaluation runs
│   │   │   ├── sessions.py     # Live chat sessions
│   │   │   ├── dashboard.py    # Analytics & summary
│   │   │   └── export.py       # CSV export
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic settings (reads .env)
│   │   │   ├── database.py     # SQLAlchemy async engine
│   │   │   └── auth.py         # Auth helpers
│   │   ├── models/             # SQLAlchemy ORM models
│   │   └── main.py             # App entrypoint
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx
        │   ├── Projects.tsx / ProjectDetail.tsx
        │   ├── TestCases.tsx
        │   ├── Evaluations.tsx / EvaluationRunDetail.tsx
        │   ├── ScheduledRuns.tsx
        │   ├── LiveChat.tsx
        │   └── Settings.tsx
        └── components/
            ├── Layout.tsx
            ├── TestCaseDrawer.tsx
            ├── TestCaseDiff.tsx
            ├── EvaluationProgress.tsx
            ├── LatencyCharts.tsx
            └── ActivityFeed.tsx
```

---

## Core Concepts

### Projects
Each project maps to a GCP project + Dialogflow CES app. Stores `gcp_project_id`, `gcp_location`, and `ces_app_name`.

### Test Suites
Groups of test cases within a project. Maps to a CES dataset (`ces_dataset_id`).

### Test Case Types

| Type | Description |
|---|---|
| **Golden** | Expected turn-by-turn conversation transcript used as ground truth |
| **Scenario** | Natural-language description that Gemini converts to a structured test |

### Approval Workflow

```
DRAFT → PENDING_REVIEW → APPROVED → SUBMITTED
                ↓
          RETRY / DENIED
```

AI-generated test cases start as `DRAFT`. Reviewers approve, request a retry with feedback, or deny. Only `APPROVED` cases get submitted to CES datasets.

### Evaluation Runs
Trigger a CES evaluation against a test suite. Results stream back with per-test-case pass/fail, scores, latency breakdowns, and optional Gemini AI analysis of failures.

---

## Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `GCP_PROJECT_ID` | Yes | Google Cloud project ID | — |
| `GCP_LOCATION` | No | GCP region | `us-central1` |
| `GEMINI_API_KEY` | Yes | Gemini API key | — |
| `GEMINI_MODEL` | No | Model name | `gemini-2.5-pro` |
| `DATABASE_URL` | Yes | Async DB connection string | SQLite |
| `SECRET_KEY` | Yes | JWT signing secret | — |
| `GOOGLE_CLIENT_ID` | No | OAuth2 client ID | — |
| `GOOGLE_CLIENT_SECRET` | No | OAuth2 client secret | — |
| `CES_SERVICE_ACCOUNT_KEY` | No | Path to GCP service account JSON | — |
| `CES_API_BASE_URL` | No | CES API base URL | `https://ces.googleapis.com/v1beta` |
| `REDIS_URL` | No | Redis URL (for Celery, production) | `redis://localhost:6379/0` |

---

## Production Setup

Swap SQLite for PostgreSQL and add Redis for background task processing:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/cx_testing
DATABASE_URL_SYNC=postgresql://user:password@host:5432/cx_testing
REDIS_URL=redis://localhost:6379/0
```

Run database migrations with Alembic:

```bash
alembic upgrade head
```

---

## License

MIT
