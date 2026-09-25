# Agent Permissions

Security is deny-by-default.

## Permission model

``` text
Agent
  -> Role
  -> Allowed tools
  -> Allowed resources
  -> Allowed operations
  -> Approval policy
```

## Example

### Product Manager

Allowed:

- create tasks,
- update task metadata,
- read project documents,
- request reviews.

Denied:

- terminal,
- arbitrary filesystem writes,
- production deployment.

### Backend Engineer

Allowed:

- read/write project workspace,
- run tests in sandbox,
- git operations,
- development database.

Denied:

- production deployment,
- reading unrelated secrets,
- arbitrary external network access.

### DevOps

Allowed:

- CI configuration,
- container operations,
- staging deployment,
- infrastructure inspection.

Production deployment requires approval unless an explicit autonomous
policy grants it.

## High-risk actions

Human approval should normally be required for:

- production deployment,
- deleting production data,
- sending external communications,
- financial transactions,
- changing authentication/security policy,
- destructive infrastructure operations,
- actions outside the declared project scope.

## Audit

Every permission-sensitive action must record:

- agent,
- tool,
- resource,
- action,
- timestamp,
- approval ID when applicable,
- result.
