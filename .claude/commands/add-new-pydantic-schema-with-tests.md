---
name: add-new-pydantic-schema-with-tests
description: Workflow command scaffold for add-new-pydantic-schema-with-tests in cx-agent-studio-testing.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-pydantic-schema-with-tests

Use this workflow when working on **add-new-pydantic-schema-with-tests** in `cx-agent-studio-testing`.

## Goal

Adds new Pydantic schemas for API/data validation and creates corresponding schema tests.

## Common Files

- `backend/app/schemas/schemas.py`
- `backend/tests/schemas/test_*.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update schema(s) in backend/app/schemas/schemas.py
- Add or update test file in backend/tests/schemas/ for the new schema(s)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.