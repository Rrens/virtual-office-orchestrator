# Orchestrator

The Orchestrator coordinates the company. It does not replace specialist
agents.

## Responsibilities

1.  Understand the user’s goal.
2.  Identify missing information.
3.  Select relevant departments.
4.  Select a workflow.
5.  Build the task graph.
6.  Assign roles.
7.  Monitor execution.
8.  Handle failures and dependencies.
9.  Trigger reviews.
10. Request human approval where required.
11. Determine project completion.

## Planning lifecycle

``` text
Goal
 -> Context
 -> Constraints
 -> Departments
 -> Workflow
 -> Tasks
 -> Dependencies
 -> Risk analysis
 -> Approval
 -> Execution
```

## Dynamic workflow selection

The Orchestrator must not assume every project needs every department.

For a software project:

``` text
Strategy -> Analysis -> Design -> Engineering -> QA -> Security -> DevOps
```

For a marketing campaign:

``` text
Research -> Strategy -> Content -> Campaign -> Analytics
```

For a customer issue:

``` text
CS -> Diagnosis -> Specialist -> Verification -> CS
```

## Assignment

Agent selection considers:

- role compatibility,
- required capability,
- current workload,
- permissions,
- dependencies,
- model capability,
- project context.

## Failure handling

- Retry transient failures.
- Switch model when appropriate.
- Reassign when an agent is unavailable.
- Escalate after retry threshold.
- Stop downstream tasks when a critical dependency fails.

## Completion

A project is complete when:

- all required tasks meet acceptance criteria,
- required reviews pass,
- required approvals are obtained,
- deliverables are persisted,
- final status is emitted.
