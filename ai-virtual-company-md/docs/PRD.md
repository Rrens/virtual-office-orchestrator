# Product Requirements Document

## 1. Product overview

AI Virtual Company is a multi-agent orchestration platform with a
virtual office interface. Users create projects or operational goals.
The system generates a workflow, creates tasks, assigns agents, executes
approved tools, evaluates outputs, and reports progress.

## 2. Target users

- Solo developers building products with AI assistance.
- Small teams that want autonomous internal operations.
- Engineering teams experimenting with agentic development.
- Founders who want AI-assisted product and business operations.

## 3. Core user journey

``` text
Create goal
  -> Clarify constraints
  -> Plan
  -> Review plan
  -> Execute
  -> Monitor
  -> Review
  -> Approve sensitive actions
  -> Deliver
  -> Learn
```

## 4. Functional requirements

### Project management

- Create project.
- Define objective, constraints, deadline, budget, and environment.
- Pause, resume, cancel, or archive projects.
- Track project state.

### Planning

- Analyze goal.
- Select departments.
- Generate workflow.
- Generate task DAG.
- Identify dependencies.
- Estimate complexity.
- Ask for clarification when required.

### Agent execution

- Assign task to role.
- Load relevant context.
- Select model.
- Select permitted tools.
- Execute task.
- Produce structured output and artifacts.
- Request review where required.

### Review

- Human review.
- Agent review.
- Automated validation.
- Reject and retry.
- Escalate after configurable retry limits.

### Business operations

Support workflows for:

- Product development.
- Marketing.
- Sales.
- Customer support.
- Analytics.
- Operations.
- Incident response.

### Virtual office

- Show departments.
- Show agent state.
- Show current task.
- Show handoffs.
- Show meetings.
- Show important events.
- Allow clicking an agent to inspect its work.

## 5. Non-functional requirements

- Every tool call is auditable.
- Production access is deny-by-default.
- Agent permissions are explicit.
- Tasks are idempotent where practical.
- Event delivery is resilient.
- UI should recover from reconnects.
- Long-running tasks must survive process restarts.
- Secrets must not be exposed to model context unless explicitly
  required.

## 6. MVP

MVP includes:

- Project creation.
- Orchestrator.
- Workflow engine.
- Task DAG.
- PM, Analyst, Backend, Frontend, QA, DevOps agents.
- PostgreSQL.
- Redis.
- Ollama.
- Tool gateway.
- Human approval.
- WebSocket/SSE events.
- Basic virtual office.

## 7. Post-MVP

- Full business departments.
- Browser agent.
- GitHub pull-request lifecycle.
- Customer support integrations.
- CRM integrations.
- Marketing analytics.
- Multi-project organization memory.
- Advanced model routing.
- Cost optimization.
