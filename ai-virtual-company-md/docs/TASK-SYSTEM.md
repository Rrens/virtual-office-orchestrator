# Task System

Tasks are the smallest durable units of work.

## Task schema

``` yaml
id: TASK-001
project_id: PROJECT-001
title: Implement authentication API
type: development
assigned_agent: backend-engineer
status: pending
priority: high
dependencies:
  - TASK-000
acceptance_criteria:
  - Login endpoint works
  - Invalid credentials return 401
outputs: []
```

## States

``` text
pending
queued
assigned
running
blocked
review
failed
completed
cancelled
```

## State rules

- `pending -> queued` when dependencies are satisfied.
- `queued -> assigned` when an agent is selected.
- `assigned -> running` when execution starts.
- `running -> review` when output is ready.
- `review -> completed` when review passes.
- `review -> failed` when review rejects output.
- `failed -> queued` when retrying.
- Any task may become `blocked` when a dependency or external condition
  prevents progress.

## Acceptance criteria

Every meaningful task should have objective acceptance criteria.

Bad:

> Make the API good.

Good:

> POST /orders returns 201 with an order ID for valid input and 422 for
> invalid service IDs.

## Idempotency

Task execution should use an execution ID and idempotency key so retries
do not accidentally duplicate side effects.

## Artifacts

Tasks may produce:

- source files,
- documents,
- test results,
- reports,
- screenshots,
- deployment records,
- structured JSON.

Artifacts are linked to the task and persisted.
