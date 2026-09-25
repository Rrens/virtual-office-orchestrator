# Security

Security is a core architectural constraint because agents may operate
tools.

## Threats

- Prompt injection.
- Malicious repository content.
- Command injection.
- Credential leakage.
- Data exfiltration.
- Unauthorized deployment.
- Destructive commands.
- Cross-project data access.
- Tool abuse.
- Compromised dependencies.

## Security boundaries

``` text
Model
  -> Tool Gateway
  -> Policy
  -> Sandbox
  -> Target
```

The model must never bypass the gateway.

## Sandbox

Code execution should run in an isolated environment with:

- CPU limits,
- memory limits,
- filesystem scope,
- network policy,
- process limits,
- timeout.

## Secrets

- Secrets are stored outside model prompts where possible.
- Inject only required credentials.
- Use short-lived credentials for external systems.
- Redact secrets from logs and tool outputs.

## Production

Production actions are deny-by-default.

Use:

``` text
agent request
 -> policy
 -> approval
 -> execution
 -> verification
 -> audit
```

## Pentesting

The penetration-testing agent may operate only against explicitly
authorized targets defined by the project scope.

## Audit

Record security-sensitive:

- tool calls,
- approvals,
- permission decisions,
- deployment actions,
- authentication events.
