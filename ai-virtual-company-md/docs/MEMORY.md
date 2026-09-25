# Memory

Memory provides context without turning the entire conversation history
into every model prompt.

## Memory layers

### Working memory

Temporary context for the current task.

### Project memory

Durable information about the project:

- requirements,
- architecture,
- decisions,
- constraints,
- conventions,
- important discoveries.

### Agent memory

Role-specific learned context such as recurring preferences or
successful patterns. It must be scoped and reviewable.

### Organization memory

Company-wide knowledge:

- policies,
- brand guidelines,
- coding standards,
- support procedures,
- approved tools.

## Memory rules

1.  Retrieve only relevant memory.
2.  Prefer authoritative artifacts over old conversational claims.
3.  Store provenance.
4.  Store timestamps and scope.
5.  Allow invalidation.
6.  Never expose secrets as ordinary memory.
7.  Do not treat model-generated guesses as facts.

## Retrieval

A task should construct context from:

``` text
Task
+ Project requirements
+ Relevant artifacts
+ Relevant decisions
+ Role instructions
+ Minimal historical context
```

## Memory lifecycle

``` text
Observe
 -> Extract
 -> Validate
 -> Store
 -> Retrieve
 -> Apply
 -> Revalidate
```
