# 📋 Work Summary — AI Virtual Office Orchestrator

> Last updated: 2026-09-26 02:20 UTC  
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
- [x] Animated agent lerp walking (position interpolation toward target)
- [x] Agent walks to meeting room during `reviewing` state
- [x] Monitor screen glow when agent is `working`
- [x] Dynamic ambient lighting (intensifies with active agent count)
- [x] 2D Minimap teleport overlay (click room → camera jump)
- [ ] Sound FX & ambient audio toggle
- [ ] LOD system for mobile performance

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
| 2026-09-25 | Session 10 (Polish & Prod Ready) | Phase 6C walking animation lerp, meeting room walk on review, monitor glow, minimap teleport, Dockerfile multi-stage for server & web, docker-compose.prod.yml, root README.md setup guide, all verified & pushed to dev |
| 2026-09-25 | Session 11 (Advanced Features) | Closed-loop customer feedback service (CS → PM/engineer task auto-creation), GitHub Actions CI/CD with typecheck + test + build, concurrent task execution without blocking Kafka consumer |
| 2026-09-26 | Session 12 (Scandinavian Redesign & ZIP Export) | Redesigned Scandinavian UI design system (#efeae3), glassmorphism layout, 3-column workspace, project ZIP export endpoint + code extraction engine, daily logger per date, LogViewerModal with model tag filter, fixed hydration mismatch & React 19 Html portal unmount race conditions |
| 2026-09-26 | Session 13 (Multi-Dept Office & Leisure Upgrade) | Expanded 3D office to 80x60 multi-department company (8 dept rooms, 30 agent workstations), 30 Indonesian agent names + titles, LOD renderer (full/medium/dot), Music Studio (guitar/piano/drum/mic), Billiard Table Area, PS5 Lounge, timer persistence across refreshes, automated QA approval pipeline + review events |
| 2026-09-26 | Session 14 (Command Center, Multi-Floor & Model Config) | Dark Glassmorphism AI Command Center redesign (#0B0F19), 3-floor building (L1 Ground/Pantry/Lounge, L2 Tech/Product Hub with 3D Kanban whiteboards & server LEDs, L3 Penthouse Executive Budi with gold inlays & detailed balcony mini-golf), glass elevator shaft & open staircase, outdoor campus with trees, lawn, and skyscrapers, doorways between rooms, per-agent & per-role LLM model override ("anti-boncos"), interactive output preview cards, all 30 agents in sidebar & dock with search/filter, unified top bar (no overlap), full responsive mobile/tablet layout |
| 2026-09-26 | Session 15 (13-Level Skyscraper Tower, Helipad & CEO Rendy) | Renamed CEO to Rendy, upgraded headquarters to 13-Level Skyscraper Tower with bright daylight lighting & Carrara marble floors, Grand Lobby with Siti (Receptionist) & Pak Joko (Satpam at security turnstile, zero-LLM cost), 1-2 teams per floor with high ceilings, and Rooftop Helipad Tower with executive helicopter |
| 2026-09-26 | Session 16 (Pillars, Full Elevation, Lift, Stairs & Dense Office Furnishing) | Refactored tower to pure functional corporate skyscraper: removed basement and car parks; added 4 mega corner structural pillars spanning all 64m height with gold rings + grand lobby marble columns + facade ribs so building feels solid and imposing; dense furnishing on each floor (Kanban sprint board, 8-16 server racks, sales pipeline bell, full cafeteria pantry, 2 billiards, band music studio, PS5 lounge, executive penthouse & mini golf); full glass elevator shaft & staircase with agent floor-transition elevator pathing; panoramic default camera zoom [0, 55, 135] with maxDistance 400 |
| 2026-09-26 | Session 17 (Dark Glassmorphism UI Fix & Graceful Agent Inspector Route) | Refactored RoadmapQAPanel tab & card styling to full Dark Glassmorphism, eliminating white-on-white text issues; updated /api/agents/instances/:id and /api/agents/:id routes to support role-based queries and fallback synthetic instances for unspawned & static lobby agents (Pak Joko, Siti), completely resolving the "Agent instance not found" console error |
| 2026-09-26 | Session 18 (Dedicated Agent Management Page & Full LLM Router) | Built dedicated /agents page with Dark Glassmorphism UI for full agent roster management: per-agent LLM selection (Ollama local fast 3B/7B, 9Router Qwen 32B, DeepSeek, Cloud Claude 3.5 Sonnet / GPT-4o), 1-click batch presets (Mode Hemat Free Local, Mode Balanced 32B, Mode Max Intelligence), inline & modal editing for agent name, role, department, system persona prompt, tools matrix, permissions, custom agent creation, and direct navigation via "🤖 Kelola Agent" in WorkspaceHeader |
| 2026-09-26 | Session 19 (Fix Duplicate CEO Activity Feed On Project Switch) | Fixed bug where switching projects accumulated duplicate "Rendy · CEO connected" items: useProjectWebSocket now resets state per project and filters out raw socket handshake transport messages ({ type: 'connected' }), while LiveActivitySidebar now properly attributes non-agent events as '⚡ System' instead of falling back to Rendy CEO |
| 2026-09-26 | Session 20 (Code Editor & Multi-Department Kanban Board Pages) | Integrated Microsoft Monaco Editor (@monaco-editor/react) and created dedicated /code page (Code Editor with multi-tab editor, syntax highlighting, file explorer tree, live save, copy/download, and Detail Code AI Author inspector); built dedicated /kanban page with multi-department filtering (Executive, IT, Product, Design, Growth, Sales, CS, Data, Ops), 8 status columns, task creation per division, and live output artifact linking; wired navigation across WorkspaceHeader, AgentStatusDock, and ArtifactViewerModal |
| 2026-09-26 | Session 21 (Fix Duplicate TaskDependency & Circular Dependency) | Resolved Prisma unique constraint failure on `prisma.taskDependency.create()` by deduplicating dependency pairs across engine.ts, tasks/service.ts, and hierarchicalPlanner.ts; implemented automatic DFS cycle detection & auto-breaking in planner.ts and engine.ts so circular LLM outputs (e.g. TASK-1 loop) are safely resolved into clean acyclic DAGs without runtime errors |
| 2026-09-26 | Session 22 (Kanban Sync, Multi-File PRD Upload, VSCode Theme & Output Marquee) | Fixed Kanban ↔ Main Page sync via real-time `task.status_changed` WebSocket events and window focus re-fetching; added drag-and-drop multi-file PRD upload in CreateProjectForm with backend MemoryStore & GoalPlanner AI context injection; fixed task titles showing "..." and added Task Detail Modal in Roadmap; implemented auto-spawn and stuck-agent reset in task-consumer; added VSCode Dark+ syntax highlighting theme, Git status colors (Amber `M`, Green `U`), and running marquee animation `⚡ On Progress...` in Output tab; set Code/Kanban/Agents links to `target="_blank"` with active project return routing |
| 2026-09-26 | Session 23 (Architectural Cutaway Tower, Realistic Helipad, 3D Chopper & Dynamic Priority Dock) | Upgraded corporate tower from raw skeleton to Architectural Cutaway Diorama: added tinted rear/side glass curtain walls, drop ceilings with warm LED downlights, safety glass railings, Silver Metallic CEO Penthouse (L7), and textured concrete Helipad with flat aviation markings; built realistic 3D Executive Helicopter with animated spinning main & tail rotors and strobe beacons; resolved ground Z-fighting glitch via strict layer stacking & polygonOffset; eliminated 3D text collision; slowed agent walk speed to 1.6 for comfortable badge readability; connected all 30 agents to live task status with auto-priority sorting to the leftmost in AgentStatusDock; synced Header ("3 Task Aktif") and HUD indicators; sanitized "..." artifact titles; made mobile/tablet responsive with full-width sidebars & touch scroll; and implemented automatic multi-file source code extraction for Code Studio / Export ZIP |
| 2026-09-26 | Session 24 (Compact 3-Floor High-Performance HQ & Scandinavian Realism) | Compressed headquarters into a high-density, silky-smooth 3-Floor HQ (GF Grand Lobby & Sales/CS/Pantry Cafe, L1 Mega Tech & Design Studio, L2 Penthouse CEO & Helipad Rooftop); enriched each floor with dense Scandinavian accessories (oak bookshelves filled with books, terracotta potted plants, round collaboration scrum tables with laptops, green lounge couches, glass whiteboards, 8 glowing server racks, dual monitors, coffee mugs); set dynamic pixel ratio dpr={[1, 1.5]} and optimized shadow maps to eliminate Retina GPU lag; and updated camera presets for intimate, crisp 60 FPS navigation |
| 2026-09-26 | Session 25 (Fix Waypoint TypeError, 30 FPS Cap & Cyber Executive SplashScreen) | Fixed runtime crash `Cannot read properties of undefined (reading '1')` in `AgentBehaviorController.ts` by updating 3-floor waypoint mappings (`PS5_LOUNGE`, `MEETING_ROUND_1`, `COFFEE_BAR`, `WATER_COOLER`) and adding defensive fallback guards; capped render loop at 30 FPS and throttled React state sync to 2Hz, reducing GPU/CPU load by >60%; removed heavy external CDN `<Environment preset="city" />` in favor of zero-latency local PBR studio lighting; and implemented a Dark Glassmorphism `SplashScreen.tsx` with progress bar (0% -> 100%) and cinematic fade-out on mount/refresh |
| 2026-09-26 | Session 26 (Scandinavian Workstation & Ergonomic Swivel Chair Redesign) | Redesigned agent workstations to mirror user reference image: warm Scandinavian oak wood tabletop with rounded chamfers, 4 slim white cylindrical metal legs with round foot pads & under-desk cross braces; dual widescreen displays (primary monitor with lime-green digital clock "11:39" and secondary monitor with dark IDE code); low-profile white keyboard, white mouse, paperwork, soda can, and teal coffee mug; realistic 5-star swivel ergonomic chair with chrome hydraulic cylinder, 5 radial caster wheels, padded seat, and curved mesh backrest with dual armrests |
| 2026-09-26 | Session 27 (Architectural Cutaway HQ, VIP CEO Elevator & Floating Stairs) | Overhauled office diorama to match user reference image: exposed black steel I-beam girders & spandrels, polished terrazzo ground floor, warm Scandinavian oak parquet on L2 & L3, hanging linear pendant LED lights suspended by cables above workstations, multi-panel sprint Kanban whiteboards & cork bulletin boards with wall clock, teal lounge sofa + media TV + freestanding water cooler dispenser; implemented floating architectural staircase on left wing (x = -20) with wood treads & diagonal steel stringers used exclusively by the 29 non-CEO agents; built VIP panoramic glass elevator on right wing (x = 20) with automated sliding glass doors and state machine (call -> doors open -> enter -> doors close -> transit -> doors open -> exit -> doors close) dedicated exclusively for CEO Rendy; resolved agent name/role badge occlusion via 2D billboard glassmorphism, eliminated 2Hz stuttering with smooth 60fps lerp interpolation, and aligned desk idle rotation to face monitors |
| 2026-09-26 | Session 28 (Stairwell Floor Cutout Opening & Dark Glassmorphism Badge Clean Up) | Eliminated floating white text boxes by merging Name/Role and Activity Message into a single unified Dark Glassmorphism card; re-enabled standard Three.js depth testing so agents on lower floors no longer bleed through upper floor slabs; implemented realistic stairwell floor cutout openings (lubang tangga) on Level 2 (y = 9) and Level 3 (y = 18) at x: -24 to -16.5, z: -4.5 to +4.5 surrounded by modern black & glass safety railings matching user reference image 2; aligned floating staircase and agent stair traversal path to pass seamlessly through the cutout openings without clipping solid floor slabs |
| 2026-09-26 | Session 29 (Elevator Shaft Floor Opening, Front Entrance Doors & CEO Suite Leisure Area) | Opened dedicated elevator shaft voids through Level 2 and Level 3 floor slabs (x: 17.8 to 24, z: -2.2 to 2.2) clearing all obstructing furniture and server racks; added automatic double glass sliding entrance doors with stainless steel handles at ground level (z = 18); built grand reception counter with illuminated sign for Siti at [0, 0, 11] and entrance turnstile guard post with multi-CCTV monitor for Satpam Pak Joko at [5.5, 0, 15.5]; placed realistic 9-foot mahogany billiard table at [-10, 0, 6] and 65-inch PS5 gaming lounge with white console & cyan LED bar at [-4, 0, 6] in CEO Penthouse Level 3; disabled helicopter shadow casting to prevent dark silhouettes on ground floor; and tuned idle agent activity distribution (increased desk pacing/chatting, longer timeouts 45-95s, same-floor chatting filter) so agents no longer crowd into Level 3 simultaneously |

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
| 2026-09-26 | ADR-016: Dark Glassmorphism Command Center | Memberikan visual depth, high-tech command center aesthetic, dan kontras neon tajam per divisi |
| 2026-09-26 | ADR-017: Multi-Level Vertical Office (3 Floors) | Menampung 30 agen secara terstruktur: L1 Operasional & Pantry/Lounge, L2 Tech & Product, L3 Penthouse Executive |
| 2026-09-26 | ADR-018: Granular Per-Agent Model Routing | Memungkinkan pengguna memilih model LLM spesifik per agen atau per role agar hemat biaya (anti-boncos) |
| 2026-09-26 | ADR-019: 13-Level High-Rise Skyscraper Architecture | Menjadikan kantor virtual menara pencakar langit utama yang megah dan tinggi dengan skylines kota proporsional |
| 2026-09-26 | ADR-020: Zero-LLM Decorative Agents | Satpam (Pak Joko) & Resepsionis (Siti) ditempatkan di lobby tanpa memanggil LLM agar tidak memakan token/biaya |
| 2026-09-26 | ADR-021: Realistic Architectural Cutaway Tower & Realtime Dynamic Agent Priority Dock | Mengubah kerangka bangunan menjadi menara arsitektur nyata dengan tampak depan terbuka, dekorasi tematik per divisi di dinding belakang/samping ("Theater Stage"), helikopter 3D berbaling-baling animasi, dan pergeseran otomatis agen yang bekerja ke urutan terdepan dock status |
| 2026-09-26 | ADR-022: High-Density 3-Floor Compact Headquarters & GPU Optimization | Mengubah struktur dari menara vertikal 9-tingkat tinggi yang renggang menjadi 3 lantai terpadu yang padat, penuh aksesoris Scandinavian (rak buku, tanaman, meja bulat, sofa), dengan resolusi DPR [1, 1.5] teroptimasi untuk menjamin performa geser/orbit 60 FPS mulus di semua layar |
| 2026-09-26 | ADR-023: 30 FPS Performance Limiter & Executive Booting Splash Screen | Mengunci framerate pada 30 FPS stabil dan men-throttle state React ke 2Hz untuk menghilangkan lag GPU 3D; menambahkan Splash Screen booting sequence di awal render dan refresh |
| 2026-09-26 | ADR-024: Scandinavian Oak Workstation & Realistic 5-Star Swivel Chair Redesign | Mengganti box meja polos dengan meja kayu oak Skandinavia berkaki silinder putih, dual monitor tipis dengan jam digital hijau "11:39" & kode IDE, aksesoris desktop lengkap (keyboard slim putih, mouse, mug teal, kaleng hijau, kertas), serta kursi kantor ergonomis realistis 5-star swivel beroda caster |
| 2026-09-26 | ADR-025: Architectural Cutaway Diorama, Exclusive VIP CEO Elevator & Floating Staircase | Membangun gedung perkantoran nyata sesuai gambar referensi dengan balok baja I-beam, lantai kayu parquet & terrazzo ground, lampu gantung linear LED, whiteboard Kanban sprint besar, area lounge sofa teal + dispenser galon air, tangga industrial kayu di sisi kiri (wajib untuk 29 agen non-CEO), dan lift kaca panoramik di sisi kanan dengan pintu geser otomatis (khusus VIP CEO Rendy) |
| 2026-09-26 | ADR-026: Stairwell Floor Cutout Openings & Unified Glassmorphism Badges | Membuka lubang void lantai persegi panjang di sekeliling tangga (x: -24 s/d -16.5, z: -4.5 s/d 4.5) di lantai 2 & 3 berpagar kaca/baja pengaman sesuai referensi; menyatukan badge nama & pesan status ke kartu dark glassmorphism gelap bersih dan mengaktifkan kembali standard depth testing sehingga agen lantai bawah tertutup rapi oleh lantai atas |
| 2026-09-26 | ADR-027: Shaft Openings, Entrance Doors, CEO Leisure Suite & Balanced Idle Distribution | Melubangi jalur poros lift kaca di lantai 2 & 3 tanpa halangan barang/rak server; memasang pintu kaca geser otomatis di lobby depan (z = 18); membangun meja resepsionis megah Siti dan pos satpam turnstile Pak Joko; menempatkan meja billiard mahoni 9 kaki & lounge PS5 TV 65 inci di lantai 3 CEO; menonaktifkan castShadow helikopter; serta menyeimbangkan distribusi istirahat agen (idle timeout 45-95s, 70% di lantai sendiri) agar agen tidak berbondong-bondong naik ke lantai 3 |
