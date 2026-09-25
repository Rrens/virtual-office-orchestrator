# Event System

The event system is the backbone connecting orchestration,
observability, and the virtual office.

## Event envelope

``` json
{
  "id": "evt_123",
  "type": "task.started",
  "project_id": "project_123",
  "task_id": "task_123",
  "agent_id": "backend-engineer",
  "timestamp": "2026-09-25T10:00:00Z",
  "payload": {}
}
```

## Event categories

### Agent

- agent.created
- agent.status.changed
- agent.tool.started
- agent.tool.completed

### Task

- task.created
- task.assigned
- task.started
- task.blocked
- task.review.requested
- task.completed
- task.failed

### Workflow

- workflow.started
- workflow.stage.started
- workflow.stage.completed
- workflow.completed

### Deployment

- deployment.started
- deployment.failed
- deployment.completed

### Approval

- approval.requested
- approval.granted
- approval.rejected

## Virtual office

The office subscribes to events and maps them to presentation states.

Example:

``` text
task.started
 -> agent.status = working
 -> agent walks to desk
 -> task bubble appears
```

The animation itself is never persisted as business state.

## Reliability

- Events have unique IDs.
- Consumers must be idempotent.
- Critical events are persisted durably.
- Reconnect clients receive state snapshots before live events.
