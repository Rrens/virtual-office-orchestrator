# Architecture

## System overview

``` text
                         +------------------+
                         |     Next.js      |
                         | Dashboard/Office |
                         +--------+---------+
                                  |
                           HTTPS / WebSocket
                                  |
                         +--------v---------+
                         |    Go API        |
                         |      Gin         |
                         +--------+---------+
                                  |
                         +--------v---------+
                         |  Orchestrator    |
                         +--------+---------+
                                  |
                +-----------------+------------------+
                |                                    |
        +-------v--------+                    +------v-------+
        | Workflow       |                    | Agent Runtime|
        | Engine         |                    | / Model      |
        +-------+--------+                    +------+-------+
                |                                    |
        +-------v--------+                    +------v-------+
        | Task Engine    |                    | Ollama       |
        +-------+--------+                    +-------------+
                |
        +-------v--------+
        | Tool Gateway   |
        +---+---+---+----+
            |   |   |
          Git  DB  Browser
```

## Components

### API

Owns authentication, project APIs, task APIs, agent inspection,
approvals, and event streaming.

### Orchestrator

Owns goal interpretation, workflow selection, task decomposition,
assignment, coordination, escalation, and completion checks.

### Workflow engine

Represents workflows as dependency graphs rather than hardcoded
sequential pipelines.

### Task engine

Persists task state and drives transitions.

### Agent runtime

Builds model context, loads role instructions, checks permissions,
invokes the selected model, validates structured output, and emits
events.

### Tool gateway

The only approved path for agents to access external systems or
execution environments.

### Event bus

Redis carries ephemeral events and coordination signals. PostgreSQL
stores durable event/audit records when required.

### Frontend

The dashboard is the operational UI. PixiJS renders the virtual office
from backend state.

## Data ownership

PostgreSQL is the durable source of truth.

Redis is for:

- queues,
- locks,
- ephemeral state,
- pub/sub,
- short-lived coordination.

The browser must never be the source of truth for agent state.

## Failure strategy

- Retry transient model/tool failures.
- Use idempotency keys for task execution.
- Mark tasks blocked when dependencies fail.
- Escalate repeated failures.
- Persist checkpoints for long-running work.
- Require human approval for high-risk actions.

## Deployment

MVP uses Docker Compose:

``` text
frontend
api
worker
postgres
redis
ollama
prometheus
grafana
```

The architecture should allow later separation into services without
requiring an immediate microservice migration.
