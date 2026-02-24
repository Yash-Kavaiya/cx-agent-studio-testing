# 🧪 CX Agent Studio Testing Platform

> AI-Powered Testing Platform for Google CX Agent Studio — Generate, execute, and analyze test cases using Gemini API and CES v1beta APIs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18+-61DAFB.svg)
![GCP](https://img.shields.io/badge/GCP-CES%20v1beta-4285F4.svg)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ Test Case │ │ Approval  │ │ Dashboard │ │  Live Agent    │  │
│  │ Input    │ │ Workflow  │ │ & Reports │ │  Chat          │  │
│  └──────────┘ └───────────┘ └───────────┘ └────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API
┌─────────────────────────┴───────────────────────────────────────┐
│                     FastAPI Backend                              │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ Ingestion│ │ AI Engine │ │ CES Client│ │  Execution     │  │
│  │ Service  │ │ (Gemini)  │ │ (v1beta)  │ │  Engine        │  │
│  └──────────┘ └───────────┘ └───────────┘ └────────────────┘  │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
  ┌────┴────┐  ┌──────┴──────┐ ┌────┴────┐  ┌─────┴─────┐
  │PostgreSQL│  │ Gemini API  │ │CES API  │  │  Redis    │
  │         │  │ (2.5 Pro)   │ │(v1beta) │  │  (Cache)  │
  └─────────┘  └─────────────┘ └─────────┘  └───────────┘
```

## Features

- **AI Test Generation**: Upload text or `.docx` files → Gemini generates structured CES test cases
- **Approval Workflow**: Every AI output goes through **Approve / Retry / Deny** with feedback loop
- **Golden Conversations**: Deterministic turn-by-turn tests with expected behaviors
- **Scenario Testing**: AI-simulated user interactions with rubric-based scoring
- **Evaluation Execution**: Full CES v1beta evaluation pipeline with real-time tracking
- **Results Dashboard**: Pass/fail metrics, latency reports (p50/p90/p99), trend analysis
- **Live Agent Chat**: Interactive testing with `sessions.runSession` API
- **Scheduled Runs**: Automated regression testing with `scheduledEvaluationRuns`
- **AI Analysis**: Gemini-powered failure root cause analysis and recommendations

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- GCP Project with CES API and Gemini API enabled
- PostgreSQL 15+ and Redis 7+

### Docker Compose (Recommended)

```bash
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000

## API Documentation

- Backend API Docs: http://localhost:8000/docs (Swagger UI)
- Backend ReDoc: http://localhost:8000/redoc

## License

MIT License
