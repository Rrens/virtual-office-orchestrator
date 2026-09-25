# Observability

The system should expose both infrastructure and agent-level telemetry.

## Metrics

### System

- API latency
- request rate
- error rate
- worker utilization
- queue depth
- database latency
- Redis latency

### AI

- model latency
- input tokens
- output tokens
- model failures
- retries
- tool calls per run
- task completion time

### Business

- tasks completed
- workflow completion time
- blocked tasks
- review rejection rate
- approval wait time
- customer tickets
- lead conversion events when integrated

## Logs

Every log should include correlation IDs:

``` text
organization_id
project_id
workflow_id
task_id
agent_run_id
tool_call_id
```

## Tracing

A useful trace is:

``` text
User Request
 -> Plan
 -> Task
 -> Agent Run
 -> Model Call
 -> Tool Call
 -> Review
 -> Completion
```

## Dashboard

Grafana should provide:

- system health,
- queue health,
- agent activity,
- model usage,
- task throughput,
- errors,
- deployment health.
