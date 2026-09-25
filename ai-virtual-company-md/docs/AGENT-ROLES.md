# Agent Role Contract

Every agent follows this contract.

## Mission

A concise statement describing why the role exists.

## Responsibilities

Explicit tasks the role owns.

## Inputs

Artifacts, tasks, requirements, events, or data the role may consume.

## Outputs

Artifacts or structured results the role must produce.

## Tools

Explicit tool identifiers available to the role.

## Constraints

Actions the role must not perform.

## Escalation

Conditions requiring another agent or human.

## Review

Defines whether output requires:

- no review,
- peer review,
- specialist review,
- human approval.

## Completion

A task is complete only when the role’s acceptance criteria are
satisfied and required artifacts are persisted.

## Example

``` yaml
role: backend-engineer
mission: Implement reliable backend services from approved requirements.
inputs:
  - requirements
  - api-contract
  - data-model
outputs:
  - source-code
  - tests
  - technical-notes
tools:
  - filesystem
  - git
  - terminal
  - database
constraints:
  - no-production-deploy
review:
  required: true
  reviewer: qa-engineer
```
