# Technology Stack

## Frontend

### Next.js

Used for the main web application, routing, server rendering where
useful, and dashboard structure.

### TypeScript

Required for frontend domain models and API contracts.

### Tailwind CSS

Used for dashboard styling.

### PixiJS

Used for the virtual office scene. It is a presentation layer and must
consume state from the application API.

## Backend

### Go

Primary backend language.

Reasons:

- strong concurrency model,
- small deployment footprint,
- good fit for workers and orchestration,
- good operational tooling.

### Gin

HTTP API framework for the MVP.

## Persistence

### PostgreSQL

Primary durable database.

Core tables:

- organizations
- projects
- agents
- tasks
- task_dependencies
- agent_runs
- tool_calls
- artifacts
- reviews
- events
- memories
- approvals

### Redis

Used for queues, pub/sub, ephemeral state, locks, and realtime event
fan-out.

## AI

### Ollama

Local model runtime for development and self-hosted execution.

### Model family

Start with a small Qwen-family model for lightweight tasks. Add a
stronger model only for tasks whose complexity justifies it.

## Execution

### Docker

Sandbox for agent code execution.

### Playwright

Browser automation for approved browser workflows.

### Git

Version control tool available to engineering agents through the tool
gateway.

## Observability

- Prometheus for metrics.
- Grafana for dashboards.
- Structured JSON logs.
- Correlation IDs across project, task, agent run, and tool call.

## Deployment

Docker Compose for MVP.

Kubernetes is explicitly deferred until operational requirements justify
it.
