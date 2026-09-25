# Virtual Office UI Redesign PRD

## 1. Overview

Redesign the current Virtual Office interface into a premium AI company command center.

The current implementation looks like a generic SaaS dashboard with a small 3D game-like widget embedded inside a card.

The redesigned interface must make the Virtual Office feel like the primary operating environment of an autonomous AI company.

The goal is NOT to create a game.

The goal is to create a visual operating system for a company composed of AI employees.

---

# 2. Current UI Problems

The current UI has the following problems:

1. The 3D office is too small.
2. The office is visually buried inside multiple nested cards.
3. Too many borders and containers create visual clutter.
4. The office looks like a dashboard widget rather than the main application.
5. Agents are too small and difficult to identify.
6. Departments are not visually clear.
7. The interface feels like a developer prototype.
8. "MINIMAP / TELEPORT" looks like game/debug UI.
9. The 3D environment is too dark and lacks visual hierarchy.
10. Important operational information is disconnected from the office.
11. Agent activity is not visually integrated into the office.
12. The interface does not communicate that agents are actively working.
13. The overall design does not feel premium or polished.
14. The office does not feel alive.

---

# 3. Design Goal

Transform the interface from:

"Admin Dashboard + 3D Widget"

into:

"AI Company Command Center"

The user should immediately understand:

- This is a company.
- The company has departments.
- Departments contain AI employees.
- AI employees have tasks.
- AI employees are actively working.
- The orchestrator coordinates everyone.
- The user can observe and control the company.

---

# 4. Design Principles

## 4.1 Office First

The Virtual Office must be the primary visual element.

Do not place the office inside a small generic dashboard card.

The office should occupy most of the available viewport.

---

## 4.2 Information Should Float Over the Office

Operational information should be integrated into the environment instead of being represented by excessive nested cards.

Examples:

- Agent status
- Current task
- Department
- Activity
- System status
- Active workflow
- Progress

Use floating panels, overlays, badges, and contextual popovers.

---

## 4.3 The Office Is Not a Game

The interface can have game-like spatial interaction, but it must feel like a professional enterprise application.

Avoid:

- Game HUD aesthetics
- Teleport buttons
- Excessive neon
- Arcade-style controls
- Large decorative UI elements
- Unnecessary game terminology

---

# 5. Overall Layout

The application should use a three-layer architecture.

## Layer 1 — Application Navigation

A compact sidebar containing:

- Company
- Projects
- Workflows
- Agents
- Departments
- Tasks
- Activity
- Artifacts
- Approvals
- Settings

The sidebar must not dominate the screen.

---

## Layer 2 — Virtual Office

The office occupies approximately 70–85% of the main viewport.

The office should be visually dominant.

Example:

------------------------------------------------
| Sidebar |                                    |
|         |          VIRTUAL OFFICE             |
|         |                                    |
|         |      Product      Engineering       |
|         |                                    |
|         |         Meeting Room                |
|         |                                    |
|         |      Marketing       Design          |
|         |                                    |
------------------------------------------------

---

## Layer 3 — Contextual UI

Contextual UI should appear only when necessary.

Examples:

- Agent information
- Current task
- Workflow progress
- Activity
- Department information

Do not permanently display every piece of information.

---

# 6. Virtual Office Layout

The office should contain clearly identifiable departments.

Minimum departments:

- Executive
- Product
- Design
- Engineering
- QA / Security
- Marketing
- Sales
- Customer Support
- DevOps / Infrastructure
- Meeting Room

Each department should have:

- Clearly defined spatial area
- Department label
- Distinct but subtle visual identity
- Workstations
- Agents
- Relevant environmental objects

---

# 7. Department Visual Design

Departments should not look like colored rectangles.

Do NOT implement:

[ colored rectangle ]
[ colored rectangle ]
[ colored rectangle ]

Instead, use environmental design.

Example:

Engineering:

- Developer desks
- Monitors
- Terminal/code screens
- Server references
- Build indicators

Design:

- Design desks
- Large screens
- Design boards
- Color/art references

Marketing:

- Campaign board
- Analytics screen
- Content workspace

Executive:

- Executive desk
- Company overview screen

DevOps:

- Server racks
- Monitoring screens
- Infrastructure indicators

The environment should communicate the department's purpose.

---

# 8. Agent Design

Agents are the most important entities inside the office.

Agents must be visually identifiable.

Each agent should have:

- Avatar
- Name
- Role
- Current status
- Current task

Example:

Backend Engineer
● Working
Implement Authentication API

---

# 9. Agent States

Agents must support visual states.

## Idle

Agent is stationary.

Minimal animation.

---

## Working

Agent is actively working.

Examples:

- Sitting at workstation
- Typing
- Looking at monitor
- Active monitor indicator

---

## Thinking

Agent appears temporarily inactive but processing.

Use subtle visual indicator.

Do NOT use excessive animation.

---

## Waiting

Agent is waiting for another task or dependency.

Use subtle waiting indicator.

---

## Reviewing

Agent is reviewing another agent's output.

Show review state.

---

## Blocked

Agent is blocked by a dependency.

Show clear warning state.

---

## Completed

Agent completed current task.

Show subtle completion feedback.

---

## Error

Agent encountered an error.

Show clear but non-alarming error state.

---

# 10. Agent Interaction

Clicking an agent opens a contextual information panel.

Example:

------------------------------------
Backend Engineer

● WORKING

Task
Implement Authentication API

Progress
████████░░ 82%

Model
GPT-5.6 Luna

Tools
Git
Terminal
Database

Started
12 minutes ago
------------------------------------

The panel should not permanently occupy screen space.

---

# 11. Agent Movement

Agent movement should communicate actual orchestration events.

Example:

Task assigned:

Orchestrator
↓
Agent walks to workstation
↓
Agent starts working

Task completed:

Agent completes task
↓
Orchestrator detects completion
↓
Agent leaves workstation
↓
Next assigned agent becomes active

Review:

Backend Engineer
↓
QA Engineer
↓
QA workstation

Movement must be based on backend state.

Animations must never become the source of truth.

---

# 12. Camera

The camera should feel cinematic and controlled.

Supported modes:

- Overview
- Follow Agent
- Department Focus
- Workflow Focus

Avoid exposing developer-oriented controls such as:

"Teleport"

Instead provide:

- Focus
- Follow
- Overview

Camera transitions should be smooth.

---

# 13. Minimap

The existing "MINIMAP / TELEPORT" component should be redesigned.

It should become a compact navigation control.

Example:

Departments

Executive
Product
Design
Engineering
Marketing
Sales
Support
Infrastructure

Clicking a department smoothly moves the camera to that department.

Do not use the term "Teleport".

---

# 14. Live Activity

A compact live activity panel should be available.

Example:

● Backend Engineer started Authentication API
● QA Engineer reviewing API
● PM approved requirements
● DevOps waiting for QA
● Orchestrator assigned TASK-023

Activity should update in real time.

---

# 15. Workflow Visualization

The office should connect visually with workflow state.

Example:

BA
 ↓
PM
 ↓
UX ───── Backend
 ↓          ↓
UI ───── Frontend
      ↓
      QA
      ↓
    DevOps

When a task is active:

- Highlight active agent
- Highlight current workflow node
- Show dependency relationship

The user should be able to understand what the company is doing without opening the task page.

---

# 16. Orchestrator Visualization

The Orchestrator should have a special visual presence.

The Orchestrator represents the company's coordination layer.

Possible representation:

- Executive office
- Central command desk
- Company dashboard
- Communication hub

When the orchestrator assigns a task:

Orchestrator
↓
visual communication event
↓
Agent receives task

This should be subtle and professional.

---

# 17. Global Header

The top of the application should contain:

Company name
Project name
System status
Active agents
Current workflow
Pause / Resume

Example:

RENS AI COMPANY

Laundry POS
● SYSTEM OPERATIONAL

8 Active Agents
Workflow: Product Development

[Pause]

---

# 18. Status Indicators

Use consistent semantic colors.

Green:
Working / healthy

Yellow:
Waiting / attention

Red:
Error / blocked

Blue:
Information

Purple:
AI / orchestration

Do not assign arbitrary colors to every department.

Color should communicate meaning.

---

# 19. Visual Style

Target visual direction:

- Premium
- Futuristic
- Professional
- Dark
- Minimal
- Cinematic
- Enterprise
- AI-native

Avoid:

- Generic SaaS template
- Excessive gradients
- Excessive neon
- Excessive glassmorphism
- Game HUD
- Cryptocurrency dashboard aesthetics
- Generic admin dashboard aesthetics

---

# 20. Visual Hierarchy

Priority order:

1. Active agents
2. Current workflow
3. Office environment
4. Current task
5. Company/system status
6. Secondary navigation
7. Historical information

The user should immediately see what the AI company is doing RIGHT NOW.

---

# 21. Responsive Behavior

Desktop:

Virtual Office should occupy most of the viewport.

Tablet:

Reduce sidebar and contextual panels.

Mobile:

Do not attempt to display the full 3D office.

Instead provide:

- Department list
- Agent list
- Current workflow
- Activity
- Agent detail

---

# 22. Performance

The office must remain responsive when many agents exist.

Target:

- 20+ agents
- 10+ departments
- Multiple simultaneous animations
- Real-time events

Use efficient rendering.

Do not render unnecessary animation for inactive agents.

---

# 23. Technical Architecture

The UI must consume the existing orchestration state.

The frontend must NOT invent agent state.

Source of truth:

Backend
↓
Workflow Engine
↓
Task System
↓
Agent State
↓
Realtime Events
↓
Virtual Office

Example event:

{
  "type": "agent.working",
  "agent_id": "agent_backend_001",
  "task_id": "TASK-023"
}

Frontend maps the event to:

Agent state
+
Animation
+
UI indicator

---

# 24. Animation Philosophy

Animation must communicate meaning.

Good:

Agent walks to desk because a task was assigned.

Agent starts typing because task is running.

Agent moves to QA because review started.

Bad:

Random character movement.

Constant idle animations.

Excessive camera movement.

Decorative effects with no operational meaning.

Every important animation should correspond to an actual system event.

---

# 25. UX Requirements

The user should be able to answer these questions within 3 seconds:

1. Is the company running?
2. How many agents are working?
3. What are they working on?
4. Which department is active?
5. Is something blocked?
6. What workflow is currently running?

If the user cannot answer these questions quickly, the UI hierarchy is incorrect.

---

# 26. Current UI Migration

Do not simply modify the existing cards.

The current Office UI should be treated as a prototype.

Redesign the composition.

Do NOT preserve the existing layout just because it already exists.

Specifically remove or redesign:

- Nested Office cards
- "MINIMAP / TELEPORT"
- Excessive borders
- Tiny 3D canvas
- Generic dashboard-card styling
- Developer/debug controls

---

# 27. Acceptance Criteria

The redesign is complete when:

- Virtual Office is the dominant element.
- Office occupies most of the available viewport.
- Agents are clearly visible.
- Departments are visually understandable.
- Agent status is immediately recognizable.
- Current tasks are visible contextually.
- Camera controls feel natural.
- Minimap no longer looks like a game/debug tool.
- Live activity is integrated with the office.
- Agent movement reflects real backend events.
- The interface no longer feels like a generic SaaS dashboard.
- The interface no longer feels like a game prototype.
- The overall experience feels like an AI company command center.

---

# 28. Important Implementation Rule

Do not redesign the UI by adding more cards.

If information can be communicated through:

- spatial positioning
- agent state
- subtle labels
- contextual overlays
- animation
- environmental objects

prefer those approaches over adding another card.

The interface should become simpler visually while becoming more informative operationally.

---

# 29. Design Direction

The final experience should communicate:

"This is a real company running in software."

Not:

"This is a dashboard containing a 3D visualization."

Not:

"This is a game."

Not:

"This is a collection of AI chatbots."

It should feel like an operating system for an AI-native company.


# reference WEB
https://tony-steel-photographs-strategy.trycloudflare.com/kerja