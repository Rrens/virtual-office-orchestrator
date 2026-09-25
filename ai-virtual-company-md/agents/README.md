# Agent Contracts

Each file in this directory defines one agent role.

These files are contracts for both humans and coding agents. They should
describe what an agent owns without embedding implementation-specific
code.

## Adding a role

A new role must define:

- department,
- mission,
- inputs,
- outputs,
- tools,
- constraints,
- review policy,
- completion criteria.

A role should not be created only because a new prompt is needed. Create
a new role when responsibilities, permissions, or evaluation criteria
are meaningfully different.
