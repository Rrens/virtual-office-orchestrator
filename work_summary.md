# 📋 Work Summary — AI Virtual Office Orchestrator

> Last updated: 2026-09-25 13:20 UTC  
> Active branch: `dev`

---

## 🎯 Project Overview

**AI Virtual Office Orchestrator** — platform multi-agent yang mensimulasikan perusahaan digital lengkap. User memberikan business goal, sistem secara otomatis membentuk team AI, membagi task, dan mengeksekusi workflow end-to-end.

---

## 🏗️ Architecture Decisions (ADR)

| # | Decision | Choice | Reason |
|---|---|---|---|
| ADR-001 | Backend runtime | Node.js (Fastify + TypeScript) | Async I/O tinggi, event loop ideal buat multi-agent streaming |
| ADR-002 | Database | PostgreSQL + Prisma ORM | Relational consistency untuk task state, audit trail, DAG dependencies |
| ADR-003 | Event broker | Apache Kafka (`kafkajs`) | Decoupled event-driven, event replay, audit history, horizontal scale |
| ADR-004 | Realtime transport | WebSocket (`@fastify/websocket`) | Low-latency sync state ke 3D Virtual Office UI |
| ADR-005 | AI Model tier 1 | Ollama local-first (Qwen2.5-coder, Llama3.1) | Zero API cost, fast iteration, privacy |
| ADR-006 | AI Model tier 2 | 9Router combo API | High concurrency multi-agent parallel execution |
| ADR-007 | AI Model tier 3 | Cloud fallback (Claude / GPT-4o) | Critical tasks: security audit, complex architecture, strategy |
| ADR-008 | Orchestrator intelligence | LLM-generated dynamic DAG plan | Flexible per-goal, not hardcoded workflow templates |
| ADR-009 | Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS | SSR dashboard + CSR realtime components, familiar stack |
| ADR-010 | Virtual Office renderer | Three.js + React Three Fiber (R3F) | 3D realistis, web-native, 60 FPS desktop |
| ADR-011 | Avatar system | ReadyPlayerMe | Realistic humanoid avatars, free tier, GLB export, JS SDK |
| ADR-012 | 3D environment | Procedural Three.js primitives | Fast prototype, no Blender dependency dulu |
| ADR-013 | Performance target | Cross-device 30–60 FPS | Desktop 60 FPS, mobile 30 FPS with LOD |
| ADR-014 | Tool sandbox | Docker isolated container | Code execution sandboxed, tidak ada arbitrary shell ke host |
| ADR-015 | Autonomy level (MVP) | Level 1–2 (Assisted + Supervised) | Human approval untuk high-impact actions |

---

## 📁 Repository Structure (Target)

```
virtual-office/
├── apps/
│   ├── server/                  # Node.js + Fastify backend
│   │   ├── src/
│   │   │   ├── orchestrator/    # Dynamic planner, DAG generator
│   │   │   ├── agents/          # Agent runtime & state machine
│   │   │   ├── workflows/       # Workflow engine + dependency resolver
│   │   │   ├── tasks/           # Task CRUD + lifecycle management
│   │   │   ├── tools/           # Tool gateway + sandboxed executors
│   │   │   ├── models/          # Multi-tier model router
│   │   │   ├── memory/          # Working / Project / Org memory
│   │   │   ├── events/          # Kafka producers & consumers
│   │   │   ├── realtime/        # WebSocket hub
│   │   │   └── api/             # Fastify REST routes
│   │   ├── prisma/              # PostgreSQL schema + migrations
│   │   └── package.json
│   │
│   └── web/                     # Next.js 15 frontend
│       ├── src/
│       │   ├── app/             # App Router pages
│       │   ├── components/
│       │   │   ├── dashboard/   # Project / Task / Agent views
│       │   │   ├── office/      # 3D Virtual Office (R3F + ReadyPlayerMe)
│       │   │   └── ui/          # Atomic UI components
│       │   ├── hooks/           # WebSocket + React Query hooks
│       │   └── stores/          # Zustand global state
│       └── package.json
│
├── packages/
│   └── shared/                  # Shared TypeScript types, Kafka event schemas
│
├── PRD.md                       # ✅ Product Requirements Document (updated)
├── agent.md                     # ✅ Agent Registry & Architecture Spec
├── work_summary.md              # ✅ This file — Progress tracker
└── docker-compose.yml           # Local dev: Postgres + Kafka + Ollama
```

---

## 🗄️ Database Core Schema

Tables (PostgreSQL via Prisma):

| Table | Purpose |
|---|---|
| `organizations` | Top-level company |
| `projects` | User-created goals + budget + autonomy level |
| `departments` | Product, Design, Engineering, etc. |
| `agent_definitions` | Role contracts (27 roles) |
| `agent_instances` | Active agent per project |
| `workflows` | Workflow definition templates |
| `workflow_executions` | Runtime execution state |
| `tasks` | Individual work units |
| `task_dependencies` | DAG edges (task A requires task B) |
| `agent_runs` | Execution trace per task + token/cost stats |
| `tool_calls` | Audit log of every tool invocation |
| `artifacts` | Output files, docs, code produced by agents |
| `reviews` | Review outcomes per task |
| `approvals` | Human-in-the-loop approval queue |
| `events` | Immutable event stream |
| `memories` | Working / Project / Agent / Org memory |
| `model_runs` | Token usage, latency, cost per model call |

---

## 🤖 Agent Registry Summary

Total agents defined in `agent.md`: **30 agents** across 9 departments.

| Department | Agents |
|---|---|
| Executive | Orchestrator, Business Strategist |
| Product | PM, Business Analyst, UX Researcher, Product Analyst |
| Design | UI/UX Designer, Design System Designer, Brand Designer |
| Engineering | Backend, Frontend, Mobile, QA, Security, Pentester, DevOps, Performance, AI Engineer |
| Growth | Digital Marketer, SEO Specialist, Content Creator, Growth Analyst |
| Sales | Sales Rep, Sales Researcher, Account Manager |
| Customer | Customer Service, Customer Success |
| Data | Data Engineer, Data Analyst |
| Operations | Operations Manager |

**MVP First Wave** (Phase 1–5):
Orchestrator → Business Analyst → PM → UI/UX Designer → Backend Engineer → Frontend Engineer → QA Engineer → DevOps

**Wave 2** (after engine stable):
Security Engineer, Pentester, Performance Engineer, Data Analyst

**Wave 3** (business layer):
Digital Marketer, SEO, Content Creator, Sales, Customer Service, Customer Success

---

## 🚀 Phase Checklist

### PHASE 1 — Foundation
- [x] Init monorepo (apps/server, apps/web, packages/shared)
- [x] PostgreSQL setup + full Prisma schema migration
- [x] Kafka setup: topics `agent-events`, `task-events`, `workflow-events`, `system-logs`
- [x] Agent registry service (CRUD for `agent_definitions` + `agent_instances`)
- [x] Basic task CRUD + status transitions
- [x] Shared TypeScript types for Kafka event schemas
- [x] 30 agent definitions seeded to database
- [x] Fastify server running on port 4000 (health check OK)
- [x] Next.js 15 web app scaffolded

### PHASE 2 — Agent Runtime & Tools
- [x] Multi-tier model router (Ollama / 9Router / Cloud fallback)
- [x] Tool gateway with RBAC + parameter validator + audit log
- [x] Tool implementations: `filesystem`, `git`, `terminal.sandbox`, `browser.fetch`
- [x] Agent state machine (idle → assigned → working → reviewing → completed)
- [ ] Docker sandbox executor for code execution tools (deferred to Phase 2.x)

### PHASE 3 — Orchestrator & Workflow Engine
- [x] Dynamic goal parser (LLM-generated DAG)
- [x] DAG dependency resolver + scheduler
- [x] Parallel execution manager via Kafka event loops
- [x] Error handling: retry policy, max retries, escalation
- [x] Deadlock & cycle detection in DAG

### PHASE 4 — Collaboration & Memory
- [x] Handoff protocol with structured JSON payload
- [x] Automated review system (QA & Security review loop)
- [x] Human-in-the-loop approval gateway (API & WS endpoints)
- [x] Multi-tier memory store (Working, Project, Agent & Org memory)
- [x] Cost tracking per agent run + budget enforcement

### PHASE 5 — Dashboard & Realtime
- [x] Fastify WebSocket hub for event broadcasting
- [x] Next.js dashboard: Project overview, goal input
- [x] Realtime activity log + agent chat feed
- [x] Task list + artifact browser
- [x] Human approval action center
- [x] WebSocket reconnect with 3s backoff

### PHASE 6A — 3D Office Core
- [x] Three.js + React Three Fiber scene setup
- [x] Procedural floor plan with department rooms
- [x] Orbit camera + ambient/directional lighting
- [x] WebSocket → scene agent status mapper

### PHASE 6B — 3D Characters & Animation
- [x] ReadyPlayerMe avatar GLB loader with Suspense & fallback capsule mesh
- [x] Preset RPM avatars for 7 core roles (orchestrator, PM, backend, frontend, UI/UX, QA, DevOps)
- [x] Dynamic clone scene & independent transform positioning
- [x] Status bubble HTML overlay above agents
- [x] Real-time status updates from WebSocket events
- [ ] Navmesh pathfinding for agent walking
- [ ] Handoff & interaction animations

### PHASE 6C — Realistic Polish
- [ ] Detailed office props (monitors, server racks, whiteboards)
- [ ] Dynamic lighting (day/night cycle)
- [ ] Sound FX & ambient audio toggle
- [ ] LOD system for mobile performance
- [ ] Minimap overlay

---

## 📅 Session Log

| Date | Session | Work Done |
|---|---|---|
| 2026-09-25 | Session 1 | Read PRD.md + ai-virtual-company-md docs, defined full architecture, ADRs, agent registry (30 agents), 3D Virtual Office upgrade (ReadyPlayerMe + Three.js), PRD.md updated (sections 23/24/38/40), generated agent.md + work_summary.md |
| 2026-09-25 | Session 2 (Phase 1) | Monorepo setup (Turborepo), Fastify backend, Prisma schema (13 models) migrated & seeded with 30 agents, Kafka event helpers, Next.js 15 web shell, all pushed to branch dev |
| 2026-09-25 | Session 3 (Phase 2) | Multi-tier Model Router (Ollama/9Router/Cloud fallback), Tool Gateway with RBAC & audit trail, 5 tool implementations (read/write/git/sandbox/fetch), Agent State Machine lifecycle |
| 2026-09-25 | Session 4 (Phase 3) | GoalPlanner LLM-driven dynamic DAG planner with fallback, WorkflowEngine with DAG cycle validation & dependency resolution, Kafka TaskConsumer event loop with automatic retries & auto-approval |
| 2026-09-25 | Session 5 (Phase 4) | ReviewService automated QA/Security review loop, ApprovalService human-in-the-loop approval gateway, MemoryService multi-tier storage, BudgetTracker token cost tracking & project budget enforcement |
| 2026-09-25 | Session 6 (Phase 5) | Fastify WebSocket hub + Kafka event broadcaster, Next.js dashboard (project sidebar, goal input, task list, approval center, realtime activity feed), WebSocket hook with auto-reconnect |
| 2026-09-25 | Session 7 (Phase 6) | 3D Virtual Office canvas with Three.js & React Three Fiber, procedural department rooms, interactive OrbitControls, agent desks & monitors, real-time WebSocket state-to-mesh status sync |
| 2026-09-25 | Session 8 (E2E Verification) | Tested complete end-to-end flow: project creation, LLM DAG plan generation (14s via Proxmox Ollama qwen2.5:0.5b), workflow start, dynamic agent spawning, task DAG state transitions (QUEUED -> PENDING). Kafka broker & Zookeeper live. All pushed to dev |
| 2026-09-25 | Session 9 (RPM 3D Avatars) | Integrated ReadyPlayerMe GLB 3D avatar loader with Suspense & graceful procedural fallback, 7 role avatar presets, Next.js COOP/COEP headers, production build verified, all pushed to dev |

---

## 🔑 Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-25 | Backend = Node.js (tidak pakai Go) | Stack consistency, JS async event loop, TypeScript shared types bisa dipakai FE+BE |
| 2026-09-25 | Kafka bukan Redis pubsub | Event replay, audit trail, horizontal scale — Kafka lebih tepat untuk event-driven orchestration |
| 2026-09-25 | Virtual Office = 3D realistis (bukan 2D) | User requirement: realistic representation. Three.js + R3F + ReadyPlayerMe |
| 2026-09-25 | Avatar = ReadyPlayerMe | Realistic humanoid, free tier, GLB export, web SDK, cepat integrate |
| 2026-09-25 | Tool sandbox = Docker container | Security: no arbitrary shell ke host, resource-limited, isolated network |
| 2026-09-25 | MVP Autonomy Level = 1-2 | Human-in-the-loop untuk high-impact actions (deploy, delete, broadcast) |
