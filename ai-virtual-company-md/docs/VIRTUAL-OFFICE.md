# Virtual Office

The virtual office is a visual representation of the agent organization.

## Scene model

Departments map to rooms or zones.

Agents map to characters.

Tasks map to activities.

Events map to animations and notifications.

## Agent states

``` text
idle
thinking
working
waiting
reviewing
blocked
error
```

Example mappings:

``` text
idle      -> seated / idle animation
working   -> working animation
reviewing -> document/review animation
blocked   -> attention indicator
error     -> error indicator
```

## Handoffs

When a task moves between agents:

``` text
Backend
  -> QA
```

the UI may animate the character moving toward the QA area.

## Meetings

A meeting is a real workflow event, not just an animation.

Participants, agenda, task IDs, and outputs must exist in the backend.

## Technology

PixiJS is the initial rendering layer.

The office should be responsive enough to support:

- desktop,
- tablet,
- reduced-motion mode.

## Source of truth

Backend task and agent state is authoritative. The office must be able
to reconstruct the current scene after reconnecting.
