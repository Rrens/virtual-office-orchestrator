# Model Routing

Agents are logical roles. Models are execution resources.

## Routing principle

Do not assign a dedicated model to every role.

Instead:

``` text
Task
 -> Complexity
 -> Risk
 -> Required capability
 -> Model Router
 -> Selected model
```

## Model tiers

### Small

Use for:

- classification,
- extraction,
- routing,
- simple summaries,
- status updates,
- lightweight customer support.

### Medium

Use for:

- planning,
- business analysis,
- coding,
- QA,
- marketing,
- sales research.

### Strong

Use for:

- complex architecture,
- difficult debugging,
- security review,
- high-impact synthesis,
- final review.

## Routing signals

- token budget,
- context size,
- tool complexity,
- failure history,
- task risk,
- latency target,
- cost target.

## Local-first policy

Use the local Ollama model by default when capability is sufficient.

Escalate to a stronger model only when:

- the task exceeds local capability,
- repeated attempts fail,
- the task has high complexity,
- a project policy explicitly allows escalation.

## Model output

Agents must request structured output where possible.

Example:

``` json
{
  "status": "completed",
  "summary": "Implemented login endpoint",
  "artifacts": ["src/auth/login.go"],
  "tests": {"passed": 18, "failed": 0},
  "next_action": "request_qa_review"
}
```
