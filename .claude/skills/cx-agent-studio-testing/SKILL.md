---
name: cx-agent-studio-testing-conventions
description: Development conventions and patterns for cx-agent-studio-testing. Python project with conventional commits.
---

# Cx Agent Studio Testing Conventions

> Generated from [Yash-Kavaiya/cx-agent-studio-testing](https://github.com/Yash-Kavaiya/cx-agent-studio-testing) on 2026-03-22

## Overview

This skill teaches Claude the development patterns and conventions used in cx-agent-studio-testing.

## Tech Stack

- **Primary Language**: Python
- **Architecture**: type-based module organization
- **Test Location**: separate

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 18 analyzed commits.

### Commit Style: Conventional Commits

### Prefixes Used

- `feat`
- `docs`

### Message Guidelines

- Average message length: ~66 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat(security): add Pydantic schemas for security testing
```

*Commit message example*

```text
docs: add Security Testing implementation plan
```

*Commit message example*

```text
feat(security): add keyword-based attack success detector
```

*Commit message example*

```text
feat(security): add SecurityTestRun and SecurityTestResult models
```

*Commit message example*

```text
feat(security): add UserSettings model for HF token storage
```

*Commit message example*

```text
feat(security): add Fernet encryption utilities for HF token storage
```

*Commit message example*

```text
docs: Fix remaining spec review issues
```

*Commit message example*

```text
docs: Fix issues in security testing spec
```

## Architecture

### Project Structure: Single Package

This project uses **type-based** module organization.

### Configuration Files

- `.github/workflows/ci.yml`
- `backend/Dockerfile`
- `docker-compose.yml`
- `frontend/Dockerfile`
- `frontend/package.json`
- `frontend/tailwind.config.js`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`

### Guidelines

- Group code by type (components, services, utils)
- Keep related functionality in the same type folder
- Avoid circular dependencies between type folders

## Code Style

### Language: Python

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | snake_case |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Relative Imports

### Export Style: Default Exports


*Preferred import style*

```typescript
// Use relative imports
import { Button } from '../components/Button'
import { useAuth } from './hooks/useAuth'
```

*Preferred export style*

```typescript
// Use default exports for main component/function
export default function UserProfile() { ... }
```

## Common Workflows

These workflows were detected from analyzing commit patterns.

### Feature Development

Standard feature implementation workflow

**Frequency**: ~27 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `frontend/src/*`
- `frontend/src/components/*`
- `frontend/src/pages/*`
- `**/*.test.*`
- `**/api/**`

**Example commit sequence**:
```
Initial commit: Add README
feat: Add project config, Docker, CI/CD, Alembic, and backend entry point
feat: Add backend core, models, routes (auth/projects/sessions/dashboard), and services
```

### Add New Backend Model With Tests

Adds a new SQLAlchemy model to the backend, updates model init, and creates corresponding tests.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update model file in backend/app/models/
2. Update backend/app/models/__init__.py to include the new model
3. Add or update test file in backend/tests/models/ for the new model

**Files typically involved**:
- `backend/app/models/*.py`
- `backend/app/models/__init__.py`
- `backend/tests/models/test_*.py`

**Example commit sequence**:
```
Create or update model file in backend/app/models/
Update backend/app/models/__init__.py to include the new model
Add or update test file in backend/tests/models/ for the new model
```

### Add New Pydantic Schema With Tests

Adds new Pydantic schemas for API/data validation and creates corresponding schema tests.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update schema(s) in backend/app/schemas/schemas.py
2. Add or update test file in backend/tests/schemas/ for the new schema(s)

**Files typically involved**:
- `backend/app/schemas/schemas.py`
- `backend/tests/schemas/test_*.py`

**Example commit sequence**:
```
Add or update schema(s) in backend/app/schemas/schemas.py
Add or update test file in backend/tests/schemas/ for the new schema(s)
```

### Add New Backend Service With Tests

Implements a new backend service/utility and adds corresponding unit tests.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update service file in backend/app/services/ or backend/app/core/
2. Add or update test file in backend/tests/services/ or backend/tests/core/ for the new service

**Files typically involved**:
- `backend/app/services/*.py`
- `backend/app/core/*.py`
- `backend/tests/services/test_*.py`
- `backend/tests/core/test_*.py`

**Example commit sequence**:
```
Create or update service file in backend/app/services/ or backend/app/core/
Add or update test file in backend/tests/services/ or backend/tests/core/ for the new service
```

### Update Design Spec Or Docs

Updates or adds design specs or documentation in response to new features or review feedback.

**Frequency**: ~2 times per month

**Steps**:
1. Edit or add markdown file in docs/superpowers/specs/ or docs/superpowers/plans/
2. Commit with a message referencing the spec or plan

**Files typically involved**:
- `docs/superpowers/specs/*.md`
- `docs/superpowers/plans/*.md`

**Example commit sequence**:
```
Edit or add markdown file in docs/superpowers/specs/ or docs/superpowers/plans/
Commit with a message referencing the spec or plan
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Use snake_case for file names
- Prefer default exports

### Don't

- Don't write vague commit messages
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
