# Tool System

Agents never receive unrestricted access to infrastructure.

## Architecture

``` text
Agent
  -> Tool Request
  -> Permission Check
  -> Policy Check
  -> Sandbox / Approval
  -> Tool Execution
  -> Result Validation
  -> Audit Event
```

## Tool categories

- filesystem
- terminal
- git
- github
- browser
- database
- docker
- cloud
- monitoring
- email
- CRM
- analytics

## Tool contract

Every tool defines:

- name,
- version,
- input schema,
- output schema,
- permissions,
- timeout,
- retry policy,
- network policy,
- audit policy.

## Tool result

The result should state:

- success/failure,
- structured output,
- stdout/stderr when relevant,
- artifacts,
- execution duration,
- error category.

## Security

Tools must enforce:

- project scope,
- workspace scope,
- network allowlists,
- command restrictions,
- credential isolation,
- resource limits.

## External actions

Sending messages, changing production infrastructure, deleting data, and
other consequential actions should pass through an approval policy.
