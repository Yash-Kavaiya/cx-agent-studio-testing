---
name: add-new-backend-model-with-tests
description: Workflow command scaffold for add-new-backend-model-with-tests in cx-agent-studio-testing.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-backend-model-with-tests

Use this workflow when working on **add-new-backend-model-with-tests** in `cx-agent-studio-testing`.

## Goal

Adds a new SQLAlchemy model to the backend, updates model init, and creates corresponding tests.

## Common Files

- `backend/app/models/*.py`
- `backend/app/models/__init__.py`
- `backend/tests/models/test_*.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update model file in backend/app/models/
- Update backend/app/models/__init__.py to include the new model
- Add or update test file in backend/tests/models/ for the new model

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.