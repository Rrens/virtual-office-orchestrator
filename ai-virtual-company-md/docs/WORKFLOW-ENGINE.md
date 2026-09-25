# Workflow Engine

The workflow engine represents business processes as directed graphs.

## Workflow definition

A workflow contains:

- metadata,
- stages,
- task templates,
- dependencies,
- conditions,
- review gates,
- approval gates,
- completion rules.

## Example

``` yaml
name: software-product
stages:
  - id: analysis
    role: business-analyst
  - id: ux
    role: ux-researcher
    depends_on: [analysis]
  - id: design
    role: ui-ux-designer
    depends_on: [ux]
  - id: backend
    role: backend-engineer
    depends_on: [analysis, design]
  - id: frontend
    role: frontend-engineer
    depends_on: [design]
  - id: qa
    role: qa-engineer
    depends_on: [backend, frontend]
  - id: pentest
    role: penetration-tester
    depends_on: [qa]
  - id: devops
    role: devops
    depends_on: [pentest]
```

## Parallelism

Independent tasks may execute concurrently.

``` text
             Analysis
             /      \
           UX       Data Model
            \      /
             Design
```

## Conditional branches

Example:

``` text
QA
 |
 +-- PASS -> Security
 |
 +-- FAIL -> Developer -> QA
```

## Human gates

A workflow can stop before high-impact actions:

``` text
Build
 -> Tests
 -> Staging
 -> Human Approval
 -> Production
```

## Reusable workflows

Workflows are versioned and referenced by project execution. Updating a
workflow must not silently mutate an already-running execution.

## Workflow state

The engine stores:

- workflow version,
- execution ID,
- current stages,
- task states,
- dependency results,
- approvals,
- errors,
- timestamps.
