CX AGENT STUDIO
AI-Powered Testing Platform
Comprehensive Solution Architecture & Implementation Plan
Version: 1.0
Date: February 24, 2026
Author: Yash Kavaiya
Status: Draft – For Review
LLM Engine: Google Gemini API
API Target: CES v1beta (ces.googleapis.com)
 
1. Executive Summary
This document presents a comprehensive plan to build an AI-powered testing platform for Google CX Agent Studio. The platform leverages Google’s Customer Engagement Suite (CES) v1beta APIs and the Gemini API to automate the creation, execution, and evaluation of test cases for conversational AI agents.
The platform enables Quality Assurance teams, developers, and business analysts to test their CX agents by simply providing test scenarios in natural language text or Word documents. AI processes these inputs into structured test cases, executes them against the CES Evaluation APIs, and presents results with full approval workflows where users can approve, retry, or deny each AI-generated artifact.
Key Platform Capabilities
• AI-powered test case generation from natural language and Word documents using Gemini API
• Full integration with CES v1beta Evaluation APIs (Goldens, Scenarios, Datasets, Runs)
• Human-in-the-loop approval workflow: Approve / Retry / Deny for every AI-generated output
• Automated evaluation execution with real-time progress tracking and latency reports
• Scheduled evaluation runs for continuous regression testing
• Comprehensive dashboards with pass/fail metrics, p50/p90/p99 latencies, and trend analysis

2. System Architecture Overview
The platform follows a modular microservices architecture with clear separation of concerns across five primary layers: Ingestion, AI Processing, API Integration, Execution Engine, and Reporting/Dashboard.
2.1 High-Level Architecture Layers
Layer	Responsibility	Key Technologies
Ingestion Layer	Accept test inputs (text, .docx files), parse and normalize content	Python-docx, FastAPI, File Upload Service
AI Processing Layer	Generate structured test cases, scenarios, golden conversations using Gemini	Gemini 2.5 Pro API, Structured Output, Function Calling
Approval Workflow Layer	Present AI outputs for human review – Approve / Retry / Deny	React UI, WebSocket notifications, State Machine
CES API Integration Layer	Map approved test cases to CES API resources and manage CRUD operations	CES v1beta REST API, Google Auth, gRPC client
Execution Engine	Run evaluations, track progress, collect results	CES runEvaluation, EvaluationRuns, Operations API
Reporting & Dashboard	Visualize results, metrics, latency data, historical trends	React + Recharts, BigQuery (optional), PDF/CSV export

2.2 Technology Stack
Component	Technology	Rationale
Frontend	React + TypeScript + Tailwind CSS	Modern SPA with fast iteration; Tailwind for consistent UI
Backend API	Python FastAPI	Async support, auto-docs, strong typing with Pydantic
LLM Engine	Google Gemini 2.5 Pro API	Best structured output, function calling, long context for doc analysis
Document Parsing	python-docx + mammoth	Native .docx reading with formatting preservation
CES Integration	google-cloud-ces Python SDK / REST	Official v1beta API client for all CES operations
Database	PostgreSQL + Redis	Relational store for test data; Redis for caching and job queues
Job Queue	Celery + Redis	Async evaluation execution and progress tracking
Authentication	Google OAuth 2.0 + IAM	Unified auth with GCP project permissions
Deployment	Cloud Run + Cloud SQL	Serverless scaling with managed database
CI/CD	Cloud Build + Artifact Registry	Automated testing and deployment pipeline

3. CES v1beta API Integration Map
The platform integrates deeply with the CES v1beta REST API (endpoint: ces.googleapis.com). Below is the complete mapping of platform features to API resources and methods.
3.1 Core API Resources Used
API Resource	Methods Used	Platform Feature
Apps	get, list, exportApp, importApp	Load target app config, clone apps for testing
Agents	get, list, create, patch	Retrieve agent definitions for test context
Evaluations	create, get, list, patch, delete	Create golden and scenario test cases
EvaluationDatasets	create, get, list, patch, delete	Group evaluations into test suites
Apps.runEvaluation	POST (async Operation)	Execute test runs with configurable parameters
EvaluationRuns	get, list, delete	Monitor run state, fetch results and metrics
EvaluationRuns.Results	get, list, delete	Retrieve per-evaluation pass/fail results
importEvaluations	POST (CSV, GCS, conversations)	Bulk import AI-generated test cases
Conversations	get, list, generateEvaluation	Convert real conversations into golden tests
ScheduledEvaluationRuns	create, get, list, patch, delete	Set up recurring regression test schedules
Sessions.runSession	POST	Live agent testing with programmatic conversations
Tools / Toolsets	get, list, create	Validate tool configurations in test context
Versions	get, list, create, restore	Test against specific app versions
Operations	get, list, cancel	Track async operation progress

3.2 Evaluation Types Explained
Golden Conversations (Deterministic Testing)
• Pre-defined turn-by-turn sequences with expected agent behaviors
• Each turn contains user input (text/DTMF/audio/events) and expected agent response
• Supports evaluationExpectations for precise assertion matching
• Best for regression testing – verifying exact known-good conversation flows
• goldenRunMethod: STABLE (default) or LATEST for version comparison

Scenarios (Behavioral Testing)
• AI-simulated user interactions based on task descriptions and rubrics
• Defines userGoalBehavior: SATISFIED, REJECTED, or IGNORED
• Supports userFacts and variableOverrides for personalized test personas
• Uses rubrics for flexible scoring instead of exact match assertions
• maxTurns limit controls conversation length; default runCount is 5 per scenario

4. Gemini API Integration Strategy
The Gemini API powers all AI capabilities in the platform. We use Gemini 2.5 Pro for its superior structured output, function calling, and long-context document understanding capabilities.
4.1 AI-Powered Features
Feature	Gemini Capability Used	Input → Output
Test Case Generation from Text	Structured Output (JSON schema)	Natural language → CES Evaluation JSON
Test Case Generation from .docx	Long context + Document understanding	.docx content → Parsed scenarios → CES Evaluation JSON
Golden Conversation Creation	Multi-turn generation + Schema enforcement	User intent description → Turn-by-turn golden with expectations
Scenario & Rubric Generation	Reasoning + Structured Output	Test requirement → Scenario with rubrics and persona config
Test Result Analysis	Summarization + Reasoning	EvaluationRun results → Human-readable analysis with recommendations
Failure Root Cause Analysis	Chain-of-thought reasoning	Failed evaluation + diagnosticInfo → Root cause + fix suggestions
Test Suite Optimization	Function calling + Analysis	Historical results → Optimized test ordering and deduplication
Natural Language Queries	Conversational + Function calling	User question about results → API calls → Answer

4.2 Gemini Structured Output for Test Case Generation
The core of the platform is Gemini’s ability to generate structured JSON that maps directly to CES Evaluation schemas. Below is the generation pipeline:
Test Case Generation Pipeline
• Step 1: Parse input (text or .docx) into normalized test intent descriptions
• Step 2: Classify each intent as Golden or Scenario type using Gemini classification
• Step 3: For Goldens – Generate multi-turn conversation with user inputs, expected agent actions, and expectations
• Step 4: For Scenarios – Generate task description, rubrics, userFacts, and userGoalBehavior
• Step 5: Validate generated JSON against CES API schema using Pydantic models
• Step 6: Present to user for Approve / Retry (with feedback) / Deny
• Step 7: On Approve – Create via CES evaluations.create API; On Retry – Re-prompt Gemini with feedback

4.3 Gemini Prompt Architecture
Each AI feature uses a carefully engineered system prompt combined with the CES API schema as context. The prompt architecture follows this pattern:
Prompt Component	Purpose	Example Content
System Instruction	Define Gemini’s role and output format	You are a QA engineer generating CES evaluation test cases...
Schema Context	CES Evaluation JSON schema for structured output	Full Evaluation resource schema from v1beta API docs
Agent Context	Target agent’s playbook, tools, and configuration	Fetched via agents.get and tools.list APIs
User Input	Raw test requirement (text or extracted .docx content)	User’s natural language test description
Few-shot Examples	2–3 example input→output pairs	Sample golden and scenario evaluations
Retry Feedback	User’s correction notes (on retry only)	Make the rubric stricter for tone checking...

5. Human-in-the-Loop Approval Workflow
Every AI-generated artifact in the platform goes through a mandatory approval workflow. This ensures quality, accuracy, and user control over what gets pushed to the CES APIs.
5.1 Approval States
State	Description	Next Actions
DRAFT	AI has generated the artifact; awaiting review	User reviews → Approve, Retry, or Deny
PENDING_REVIEW	Queued for team review (multi-user mode)	Reviewer → Approve, Request Changes, Deny
APPROVED	User approved; ready for CES API submission	System auto-creates via CES API
RETRY	User rejected with feedback; AI regenerating	Gemini re-generates → returns to DRAFT
DENIED	User permanently rejected this artifact	Archived; no CES API call made
SUBMITTED	Successfully created in CES via API	Available for evaluation runs
ERROR	CES API returned an error on submission	User can retry submission or edit manually

5.2 What Gets Approved
Artifacts Requiring Approval Before CES API Submission
• Generated Test Cases (Golden conversations and Scenarios) – via evaluations.create
• Generated Evaluation Datasets (test suite groupings) – via evaluationDatasets.create
• AI-suggested rubrics and scoring criteria for scenarios
• AI-generated evaluation expectations and assertions
• Bulk import payloads – before calling importEvaluations
• Scheduled evaluation run configurations – before scheduledEvaluationRuns.create
• AI-generated test result analysis and root cause reports

5.3 Retry with Feedback Loop
When a user clicks Retry, they can provide specific feedback that gets appended to the Gemini prompt. This creates an iterative refinement loop:
Step	Action	Details
1	User clicks Retry on a DRAFT artifact	UI presents a feedback text area
2	User provides correction notes	e.g., Add more edge cases for payment failures
3	Backend appends feedback to original prompt	Original context + schema + new feedback instructions
4	Gemini regenerates with feedback	New structured output reflecting corrections
5	New DRAFT presented for review	Shows diff from previous version; user can compare
6	Cycle repeats until Approved or Denied	All versions stored for audit trail

6. Detailed Feature Modules
6.1 Module 1: Test Input Ingestion
This module handles accepting test inputs from users in multiple formats and normalizing them for AI processing.
Feature	Implementation	API/Library
Text Input	Rich text editor with markdown support	React + TipTap editor
.docx Upload	File upload with drag-and-drop	python-docx extraction + mammoth
Batch Upload	Multiple .docx files as a test suite	Celery async processing per file
Template Support	Pre-built test case templates	Stored templates with variable placeholders
Context Injection	Auto-fetch agent config for AI context	CES agents.get + tools.list APIs
Input Validation	Verify content is testable and complete	Gemini classification + rule engine

6.2 Module 2: AI Test Case Generator
The core AI engine that transforms natural language inputs into structured CES-compatible test cases.
Capability	Gemini Configuration	CES API Output
Golden Generation	Structured output with Evaluation.GoldenTurn schema	evaluations.create with golden field
Scenario Generation	Task + rubrics schema with enum constraints	evaluations.create with scenario field
Multi-turn Flows	Sequential turn generation with context carry	SessionInput sequences with text/DTMF/events
Expectation Generation	evaluationExpectations JSON schema enforcement	Assertion rules for automated pass/fail
Persona Configuration	Generate userFacts and variableOverrides	EvaluationPersona for scenario runs
Edge Case Expansion	Prompt to generate boundary conditions	Additional evaluations for error paths

6.3 Module 3: Evaluation Execution Engine
This module orchestrates the actual test execution against CES APIs and tracks progress in real-time.
Feature	CES API Used	Details
Run Single Evaluation	apps.runEvaluation	Execute selected evaluations with config
Run Dataset	apps.runEvaluation (evaluationDataset)	Execute entire test suite
Version Testing	apps.runEvaluation (appVersion)	Test against specific app versions
Configurable Run Count	runCount parameter	1 for goldens (default), 5 for scenarios
Latency Reporting	generateLatencyReport: true	Tool/callback/guardrail/LLM latencies
Progress Tracking	operations.get polling	Real-time RUNNING/COMPLETED/ERROR state
Result Collection	evaluationRuns.get + results.list	Per-evaluation pass/fail with metrics
Scheduled Runs	scheduledEvaluationRuns.create	Recurring regression test schedules
Conversation-to-Golden	conversations.generateEvaluation	Convert real conversations to test cases
Bulk Import	apps.importEvaluations (CSV/GCS)	Import AI-generated test suites at scale

6.4 Module 4: Results Dashboard & AI Analysis
Comprehensive visualization and AI-powered analysis of test results.
Feature	Data Source	Visualization
Run Summary	evaluationRuns (totalCount, passedCount, failedCount)	Donut chart + summary cards
Per-Evaluation Results	evaluationRuns.results.list	Sortable table with pass/fail status
Latency Analysis	LatencyReport (p50, p90, p99)	Box plots per tool/callback/LLM
Historical Trends	Stored run results over time	Line charts for pass rate trends
Failure Drill-down	diagnosticInfo from SessionOutput	Expandable trace spans with details
AI Root Cause Analysis	Failed results → Gemini analysis	Natural language failure explanation
AI Recommendations	Result patterns → Gemini reasoning	Suggested fixes and improvements
Export Reports	Aggregated metrics + analysis	PDF/CSV download with charts

6.5 Module 5: Live Agent Testing
Interactive testing where users can have real-time conversations with agents and convert them to test cases.
Feature	CES API Used	Details
Interactive Chat	sessions.runSession	Send inputs, receive agent outputs in real-time
Audio Testing	SessionInput audio + outputAudioConfig	Test voice agents with audio I/O
Tool Call Inspection	SessionOutput.toolCalls	View and validate tool invocations
Agent Transfer Testing	entryAgent configuration	Test multi-agent routing flows
Convert to Golden	conversations.generateEvaluation	Save successful chats as golden test cases
Session Replay	historicalContexts	Replay conversations with modified inputs

7. Platform Data Model
The platform maintains its own database to track test artifacts, approval states, and historical results alongside the CES API resources.
Entity	Key Fields	Relationships
Project	gcp_project_id, app_resource_name, settings	Has many TestSuites, Users
TestSuite	name, description, ces_dataset_id, tags	Has many TestCases, belongs to Project
TestCase	type (golden/scenario), status, ces_evaluation_id	Belongs to TestSuite; has ApprovalHistory
TestCaseVersion	version_num, generated_json, gemini_prompt, feedback	Belongs to TestCase; tracks iterations
ApprovalRecord	action (approve/retry/deny), user, timestamp, feedback	Belongs to TestCaseVersion
EvaluationRun	ces_run_id, state, metrics, started_at, completed_at	Belongs to TestSuite; has RunResults
RunResult	ces_result_id, evaluation_id, passed, diagnostics	Belongs to EvaluationRun and TestCase
ScheduledRun	ces_scheduled_id, cron_expression, last_run	Belongs to TestSuite
User	email, role (admin/tester/viewer), gcp_identity	Has many ApprovalRecords
AuditLog	action, entity, user, timestamp, details	Cross-cutting; tracks all operations

8. Security & Authentication
8.1 Authentication Flow
The platform uses Google OAuth 2.0 for user authentication and GCP IAM for CES API authorization. Users authenticate with their Google Workspace accounts, and the platform requests the ces and cloud-platform OAuth scopes.
Aspect	Implementation	Scope
User Auth	Google OAuth 2.0 + JWT tokens	Platform login and session management
CES API Auth	Service Account or User Credentials	ces.googleapis.com/auth/ces scope
Gemini API Auth	API Key or Service Account	generativelanguage.googleapis.com
RBAC	Admin / Tester / Viewer roles	Approve rights, run permissions, view-only
Audit Trail	All actions logged with user identity	Compliance and traceability
Secret Management	Google Secret Manager	API keys, service account keys

9. Implementation Phases & Timeline
Phase 1: Foundation (Weeks 1–4)
Task	Deliverables	APIs Used
Project Setup	FastAPI backend, React frontend, DB schema, CI/CD	None (infrastructure)
GCP Auth Integration	OAuth flow, service account setup, IAM roles	Google OAuth 2.0, IAM
CES API Client	Python SDK wrapper for all CES v1beta endpoints	All CES REST endpoints
App & Agent Loader	Fetch and display app configs, agents, tools	apps.get, agents.list, tools.list
Basic Dashboard	App selector, agent viewer, navigation shell	Frontend only

Phase 2: AI Test Generation (Weeks 5–8)
Task	Deliverables	APIs Used
Gemini Integration	Gemini 2.5 Pro client with structured output	Gemini API (generateContent)
Text Input Parser	Rich text editor + normalization pipeline	Frontend + backend processing
.docx Parser	Document upload + content extraction	python-docx + mammoth
Golden Generator	AI generates golden conversations from text	Gemini → evaluations.create
Scenario Generator	AI generates scenarios with rubrics	Gemini → evaluations.create
Approval Workflow UI	Approve / Retry / Deny interface with diff view	Frontend state machine
Retry Feedback Loop	Gemini re-generation with user feedback	Gemini API with appended context

Phase 3: Execution Engine (Weeks 9–12)
Task	Deliverables	APIs Used
Dataset Management	Create/manage evaluation datasets	evaluationDatasets CRUD
Run Evaluations	Execute evaluations with full configuration	apps.runEvaluation
Progress Tracking	Real-time run state polling and notifications	operations.get, evaluationRuns.get
Result Collection	Fetch and store all evaluation results	evaluationRuns.results.list
Bulk Import	Import AI-generated test suites	apps.importEvaluations (CSV/GCS)
Version Testing	Test against specific app versions	versions.list, runEvaluation.appVersion
Conversation-to-Test	Convert real conversations to goldens	conversations.generateEvaluation

Phase 4: Dashboard & Analysis (Weeks 13–16)
Task	Deliverables	APIs Used
Results Dashboard	Charts, tables, summary cards for run results	evaluationRuns.get, results.list
Latency Reports	P50/P90/P99 visualizations per component	LatencyReport from EvaluationRun
Historical Trends	Pass rate over time, regression detection	Stored results in PostgreSQL
AI Analysis	Gemini-powered failure analysis and recommendations	Gemini API + results data
Export Reports	PDF and CSV report generation	Backend report builder
Live Agent Testing	Interactive chat with agents	sessions.runSession

Phase 5: Advanced Features (Weeks 17–20)
Task	Deliverables	APIs Used
Scheduled Runs	Recurring regression test schedules	scheduledEvaluationRuns CRUD
Multi-Agent Testing	Test agent transfer flows	agents.list, sessions.runSession
Audio Testing	Voice agent test support	SessionInput.audio, outputAudioConfig
Tool Validation	Verify tool configurations in tests	tools.get, executeTool, retrieveToolSchema
Optimization	AI-suggested test improvements	Gemini + runEvaluation.optimizationConfig
API Integration	REST API for external CI/CD integration	Platform’s own REST API

10. Key API Flow Sequences
10.1 Test Case Generation Flow
Flow: User Input → AI Generation → Approval → CES API
• 1. User uploads .docx or enters text → Backend extracts content
• 2. Backend fetches agent context: GET /v1beta/.../agents/{id} + GET /v1beta/.../tools
• 3. Backend sends to Gemini API: generateContent with schema + agent context + user input
• 4. Gemini returns structured JSON matching CES Evaluation schema
• 5. Backend validates JSON against Pydantic model of CES Evaluation resource
• 6. Frontend displays generated test case with APPROVE / RETRY / DENY buttons
• 7. On APPROVE: POST /v1beta/.../evaluations (create golden or scenario)
• 8. On RETRY: User feedback appended → Gemini re-generates → back to step 6
• 9. On DENY: Archived in local DB, no CES API call

10.2 Evaluation Execution Flow
Flow: Run Evaluation → Track Progress → Collect Results
• 1. User selects evaluations or dataset and clicks Run
• 2. Backend calls POST /v1beta/{app}:runEvaluation with config
• 3. API returns Operation resource with operation ID
• 4. Backend polls GET /v1beta/.../operations/{id} for status
• 5. On completion: GET /v1beta/.../evaluationRuns/{id} for run summary
• 6. Fetch results: GET /v1beta/.../evaluationRuns/{id}/results for per-evaluation outcomes
• 7. Extract LatencyReport: p50/p90/p99 for tools, callbacks, guardrails, LLM calls
• 8. Store all results in PostgreSQL for historical analysis
• 9. Optionally send results to Gemini for AI failure analysis

10.3 Scheduled Regression Testing Flow
Flow: Schedule → Auto-Run → Alert on Failure
• 1. User creates schedule: POST /v1beta/.../scheduledEvaluationRuns
• 2. CES automatically triggers runs per schedule
• 3. Platform polls GET /v1beta/.../evaluationRuns for new runs
• 4. On new completed run: Fetch results and compare to baseline
• 5. If pass rate drops below threshold: Send alert notification
• 6. Gemini analyzes regressions and suggests which agent changes caused failures
• 7. Dashboard highlights regression trends with historical comparison

11. Gemini Prompt Design Examples
11.1 Golden Conversation Generation Prompt
System Prompt for Golden Generation
• Role: You are a QA engineer specializing in conversational AI testing for Google CX Agent Studio.
• Task: Generate a golden evaluation test case in CES v1beta Evaluation JSON format.
• Context: You will receive the agent’s playbook instructions, available tools, and the user’s test requirement.
• Output: Return a JSON object matching the CES Evaluation schema with the golden field containing GoldenTurn objects.
• Rules: Each turn must have a realistic userInput and the expected agent behavior as expectations.
• Rules: Include edge cases, error handling paths, and multi-turn context preservation tests.
• Format: Use responseSchema parameter for Gemini structured output enforcement.

11.2 Scenario Generation Prompt
System Prompt for Scenario Generation
• Role: You are a test scenario designer for CX Agent Studio evaluation system.
• Task: Generate a scenario evaluation with task, rubrics, userFacts, and userGoalBehavior.
• Input: User’s test requirement describing what to test and expected outcomes.
• Output: JSON matching CES Evaluation schema with scenario field, including 3–5 detailed rubrics.
• Rubrics: Each rubric should test a specific quality aspect (accuracy, tone, completeness, error handling).
• UserGoalBehavior: Choose SATISFIED (happy path), REJECTED (user pushback), or IGNORED (off-topic).
• MaxTurns: Set appropriate conversation length (typically 5–15 turns).

12. Non-Functional Requirements
Requirement	Target	Implementation
Response Time	< 2s for UI actions; < 30s for AI generation	Redis caching, async Gemini calls
Concurrent Users	50+ simultaneous users	Cloud Run auto-scaling, connection pooling
Evaluation Throughput	100+ evaluations per run	Async execution, parallel CES API calls
Data Retention	90 days for results; unlimited for test cases	PostgreSQL with archival to Cloud Storage
Availability	99.5% uptime	Cloud Run multi-region, health checks
Security	SOC2 compatible; encrypted at rest and in transit	Cloud SQL encryption, TLS, IAM
Audit Compliance	Full audit trail for all actions	AuditLog table with user/action/timestamp
API Rate Limits	Handle CES API quotas gracefully	Exponential backoff, request queuing

13. Cost Estimation
Component	Service	Estimated Monthly Cost
Compute (Backend)	Cloud Run (2 instances avg)	$50–$150
Database	Cloud SQL PostgreSQL (db-f1-micro)	$30–$80
Cache	Memorystore Redis (1 GB)	$30–$50
Gemini API	Gemini 2.5 Pro (~500K tokens/day)	$100–$300
CES API	Included with CCAI Platform license	Included
Storage	Cloud Storage (logs, reports)	$5–$20
CI/CD	Cloud Build (120 min/day)	$5–$15
Monitoring	Cloud Monitoring + Logging	$10–$30
Total Estimated		$230–$645/month

14. Success Metrics & KPIs
Metric	Target	Measurement
Test Case Generation Accuracy	> 80% first-pass approval rate	Approved / (Approved + Retry + Denied)
Average Retry Count	< 1.5 retries per test case	Total retries / total test cases
Evaluation Run Success Rate	> 95% runs complete without errors	Completed runs / total runs
Time to First Test	< 15 minutes from input to first run	Timestamp: upload to run completion
Dashboard Load Time	< 3 seconds for 1000+ results	P95 page load time
User Adoption	> 80% of QA team active weekly	Weekly active users / total QA users
Regression Detection Rate	> 90% regressions caught by scheduled runs	Detected / actual regressions
AI Analysis Usefulness	> 70% users rate analysis as helpful	In-app feedback ratings

15. Risks & Mitigations
Risk	Impact	Likelihood	Mitigation
CES v1beta API breaking changes	High	Medium	Version pinning, integration tests, API monitoring
Gemini hallucinating invalid test cases	Medium	Medium	Schema validation, approval workflow, few-shot examples
CES API rate limits during large runs	Medium	High	Request queuing, exponential backoff, batch operations
User adoption resistance	High	Low	Training, gradual rollout, feedback-driven iteration
Gemini API cost overruns	Medium	Medium	Token budgets, caching, model selection per task
.docx parsing failures (complex formats)	Low	Medium	Fallback to text extraction, manual input option

16. Recommended Next Steps
Immediate Actions (Week 0)
• Set up GCP project with CES API enabled and Gemini API access
• Create service accounts with ces.googleapis.com/auth/ces scope
• Provision Cloud SQL instance and Cloud Run services
• Initialize repository with FastAPI backend and React frontend scaffolding
• Implement CES API client wrapper and verify connectivity with apps.list
• Build Gemini API integration with first structured output test
• Design and review database schema with the team
• Schedule sprint planning for Phase 1 kickoff
