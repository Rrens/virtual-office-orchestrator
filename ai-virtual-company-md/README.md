# AI Virtual Company

AI Virtual Company is an event-driven multi-agent platform that
simulates a complete digital company.

The system accepts business goals, decomposes them into workflows and
tasks, assigns specialized agents, executes tools, evaluates outputs,
and exposes the activity through a virtual office.

## Core principle

The virtual office is a visualization layer. The real product is the
orchestration engine underneath it.

``` text
User Goal
  -> Orchestrator
  -> Workflow Engine
  -> Task Graph
  -> Specialized Agents
  -> Tools
  -> Artifacts
  -> Reviews
  -> Release / Business Outcome
```

## Primary goals

- Coordinate many specialized AI agents.
- Support both product-development and business-operation workflows.
- Keep agent permissions explicit and auditable.
- Allow parallel work where dependencies permit it.
- Make failures, reviews, handoffs, and approvals visible.
- Keep the model layer replaceable.
- Make the system useful without requiring 30 simultaneously running
  LLMs.

## Initial technology direction

- Frontend: Next.js, React, TypeScript, Tailwind CSS, PixiJS.
- Backend: Go, Gin.
- Persistence: PostgreSQL.
- Event/state layer: Redis.
- Local inference: Ollama.
- Execution: Docker sandbox.
- Browser automation: Playwright.
- Observability: Prometheus and Grafana.
- Deployment: Docker Compose for MVP.

## Repository map

- `docs/` contains architecture and product contracts.
- `workflows/` contains reusable business workflows.
- `agents/` contains role contracts for specialized agents.

## Non-goals

- Building a general-purpose AGI.
- Giving LLMs unrestricted shell or production access.
- Running one dedicated model for every role.
- Making the 2D/3D office the source of truth.
