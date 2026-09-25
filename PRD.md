# PRD — AI Virtual Office Orchestrator

## 1. Product Overview

AI Virtual Office Orchestrator adalah platform multi-agent yang mensimulasikan sebuah perusahaan digital yang terdiri dari berbagai AI employee.

User memberikan business goal, lalu sistem secara otomatis:

```text
User Goal
   ↓
Orchestrator
   ↓
Planning
   ↓
Analysis
   ↓
Workflow Generation
   ↓
Task Decomposition
   ↓
Agent Assignment
   ↓
Parallel Execution
   ↓
Review / QA
   ↓
Human Approval
   ↓
Delivery
   ↓
Learning / Memory
```

Virtual office menjadi visual representation dari aktivitas tersebut.

### Contoh Skenario:

> "Buatkan SaaS POS untuk bisnis laundry."

Orchestrator dapat membentuk:

```text
CEO / Orchestrator
│
├── Product Manager
├── Business Analyst
├── UX Researcher
├── UI/UX Designer
├── Backend Engineer
├── Frontend Engineer
├── QA Engineer
├── Security Engineer
├── Pentester
├── DevOps
├── Digital Marketer
├── Sales
└── Customer Service
```

> **Catatan:** Tidak semua agent harus aktif. Orchestrator menentukan agent yang relevan berdasarkan tujuan.

---

## 2. Product Vision

Membangun sebuah **AI company operating system** di mana user tidak perlu mengelola setiap AI agent secara manual.

**User bertindak sebagai:**
* **Founder / Human-in-the-loop**

**Sedangkan AI company menangani:**
* Planning
* Research
* Product
* Design
* Development
* QA
* Security
* Deployment
* Marketing
* Sales
* Customer service
* Analytics
* Operations

Tujuan utamanya bukan membuat "chatbot dengan banyak persona", tetapi membuat sistem kerja multi-agent yang benar-benar memiliki **state, task, dependency, tools, permissions, memory, dan workflow**.

---

## 3. Problem

AI agent individual biasanya mampu mengerjakan task tertentu, tetapi memiliki beberapa masalah:

* Tidak ada koordinasi antar-agent.
* Context mudah hilang.
* Agent tidak mengetahui pekerjaan agent lain.
* Tidak ada dependency management.
* Tidak ada approval mechanism.
* Tidak ada centralized task management.
* Sulit mengetahui siapa sedang mengerjakan apa.
* Agent sering mengerjakan pekerjaan yang sama.
* Tidak ada standardized handoff.
* Tidak ada audit trail.
* Semua pekerjaan sering bergantung pada satu conversational context.

Virtual Office Orchestrator menyelesaikan masalah tersebut dengan menyediakan **organization-level orchestration layer**.

---

## 4. Goals

### Primary Goals

#### G1 — Goal-driven execution
User cukup memberikan objective.

* **Contoh:** `Build a SaaS laundry management platform.`
* Sistem harus mampu mengubah objective menjadi execution plan.

#### G2 — Dynamic organization
Orchestrator harus dapat menentukan:
* Department apa yang diperlukan?
* Agent apa yang diperlukan?
* Task apa yang diperlukan?
* Dependency-nya apa?
* Mana yang bisa parallel?
* Mana yang harus menunggu?

#### G3 — Multi-agent collaboration
Agent harus dapat:
* Menerima task
* Menghasilkan artifact
* Meminta bantuan agent lain
* Melakukan handoff
* Memberikan review
* Menerima feedback
* Retry
* Escalate

#### G4 — Observable execution
User harus selalu dapat mengetahui:
* Project status
* Agent status
* Current task
* Workflow stage
* Blocked tasks
* Recent activity
* Artifacts
* Errors
* Approvals

#### G5 — Human control
AI tidak boleh memiliki unlimited autonomy. User dapat:
* Approve
* Reject
* Pause
* Resume
* Cancel
* Retry
* Reassign

#### G6 — Virtual office visualization
User dapat melihat aktivitas organisasi secara visual.

```text
                    CEO
                     │
        ┌────────────┼────────────┐
        │            │            │
     Product      Design      Engineering
        │            │            │
       PM          UI/UX       Backend
                                Frontend
                                   QA
```

Agent yang bekerja akan terlihat aktif di office.

---

## 5. Non-Goals

MVP tidak bertujuan untuk:
* Membuat AGI
* Menggantikan seluruh manusia
* Menjalankan semua agent secara bersamaan
* Memberikan unrestricted shell access
* Langsung melakukan production deployment tanpa policy
* Membuat simulation game
* Membuat agent memiliki personality kompleks
* Membangun microservices berlebihan

> **Prinsip Utama:** Virtual office bukan game. Office adalah UI untuk orchestration system.

---

## 6. Core Concept

Ada 7 konsep utama:

```text
Organization
     ↓
  Project
     ↓
 Workflow
     ↓
   Task
     ↓
 Agent Run
     ↓
 Tool Call
     ↓
 Artifact
```

### Contoh Hierarki:

```text
Organization
└── Project: Laundry SaaS
    └── Workflow: Software Product
        ├── Task: Analyze requirements
        │   └── Business Analyst
        │
        ├── Task: Design UX
        │   └── UX Researcher
        │
        ├── Task: Design UI
        │   └── UI/UX Designer
        │
        ├── Task: Build API
        │   └── Backend Engineer
        │
        ├── Task: Build frontend
        │   └── Frontend Engineer
        │
        ├── Task: QA
        │   └── QA Engineer
        │
        └── Task: Security testing
            └── Pentester
```

---

## 7. User Roles

### Founder
Primary user.

**Permissions & Capabilities:**
* Create project
* Define goals
* Approve actions
* Inspect agents
* Modify workflow
* Pause execution
* Override assignments

### Observer
Read-only user.

**Permissions & Capabilities:**
* Inspect project
* Inspect agents
* Inspect logs
* Inspect artifacts

---

## 8. Organization Structure

System harus mendukung hierarchy:

```text
Organization
│
├── Executive
│   └── Orchestrator
│
├── Product
│   ├── PM
│   ├── Business Analyst
│   └── UX Researcher
│
├── Design
│   ├── UI/UX
│   └── Design System
│
├── Engineering
│   ├── Backend
│   ├── Frontend
│   ├── QA
│   ├── Security
│   ├── Pentest
│   └── DevOps
│
├── Marketing
│   ├── Digital Marketing
│   ├── SEO
│   └── Content
│
├── Sales
│   ├── Sales
│   └── Account Manager
│
└── Customer
    ├── Customer Service
    └── Customer Success
```

---

## 9. Agent Model

> **Prinsip:** Agent bukan sekadar model LLM.

```text
Agent
├── Role
├── Persona
├── Instructions
├── Permissions
├── Tools
├── Memory
├── Current Task
└── Model
```

### Contoh Konfigurasi Agent:

```yaml
agent:
  id: agent_backend_001
  role: backend-engineer
  model: qwen
  status: working
  permissions:
    - workspace.read
    - workspace.write
    - git
    - database.dev
  tools:
    - filesystem
    - terminal
    - git
```

> **Catatan:** Satu model dapat digunakan oleh banyak agent.

---

## 10. Orchestrator

Orchestrator merupakan central intelligence dari sistem.

### Responsibilities:
Orchestrator harus:
* Understand goal.
* Identify constraints.
* Identify required departments.
* Select workflow.
* Generate tasks.
* Build dependencies.
* Assign agents.
* Start execution.
* Monitor execution.
* Detect failures.
* Request reviews.
* Handle retries.
* Request approvals.
* Resolve blockers.
* Determine completion.
* Generate final report.

---

## 11. Planning Pipeline

Saat user memberikan goal:

```text
       User
        ↓
   Goal Parser
        ↓
 Context Builder
        ↓
Strategic Planner
        ↓
Department Selector
        ↓
 Workflow Selector
        ↓
   Task Planner
        ↓
Dependency Resolver
        ↓
  Risk Analyzer
        ↓
 Execution Plan
```

### Contoh Flow Eksekusi:
> "Build a laundry POS SaaS"

Orchestrator menghasilkan:

```text
Business Analysis
       ↓
Product Requirements
       ↓
   UX Research
       ↓
    UI Design
       ↓
  Architecture
       ↓
    Backend ────────┐
                    ├── QA
    Frontend ───────┘
       ↓
    Pentest
       ↓
    DevOps
       ↓
    Release
```

---

## 12. Dynamic Workflow

Workflow tidak boleh selalu fixed.

### Contoh Project 1:
> "Buat campaign Instagram untuk produk X."

**Tidak membutuhkan:**
* Backend, Frontend, Pentester, DevOps

**Workflow:**
```text
Research → Marketing Strategy → Content → Campaign → Analytics
```

### Contoh Project 2:
> "Build banking API"

**Bisa membutuhkan:**
```text
Business Analyst → System Architect → Backend → Security → QA → Pentest → DevOps
```

---

## 13. Task Graph

Workflow harus direpresentasikan sebagai **Directed Acyclic Graph (DAG)**.

```text
                 Requirements
                /      |      \
               /       |       \
            UX       Backend   Architecture
             |          |          |
             └──────┬───┴──────────┘
                    ↓
                   QA
                    ↓
                 Pentest
                    ↓
                  DevOps
```

> **Catatan:** Task yang tidak memiliki dependency dapat berjalan secara **parallel**.

---

## 14. Agent Lifecycle

### Standard Flow:
```text
idle → assigned → thinking → working → waiting → reviewing → completed
```

### Failure Flow:
```text
working → error → retry → working
```

### Jika Retry Gagal:
```text
error → escalated → human / specialist
```

---

## 15. Task Lifecycle

```text
PENDING
   ↓
 QUEUED
   ↓
ASSIGNED
   ↓
RUNNING
   ↓
 REVIEW
   ├── APPROVED → COMPLETED
   │
   └── REJECTED → RETRY → RUNNING
```

**State Lainnya:**
* `BLOCKED`
* `CANCELLED`
* `FAILED`

---

## 16. Agent Collaboration

Agent tidak boleh langsung mengontrol agent lain secara peer-to-peer. **Harus melalui Orchestrator.**

```text
Backend ──(Request Review)──> Orchestrator ──(Dispatch Review)──> QA
```

### Contoh Dialog Alur:

* **Backend Engineer:**
  > "Authentication API implemented. Requesting QA review."
* **Orchestrator:**
  > "Sending TASK-120 to QA."
* **QA Engineer:**
  > "Running authentication test suite."

---

## 17. Handoff

Handoff antar-agent harus menghasilkan payload terstruktur:

```json
{
  "from": "backend-engineer",
  "to": "qa-engineer",
  "task_id": "TASK-120",
  "summary": "Authentication API implemented",
  "artifacts": [
    "src/auth",
    "tests/auth"
  ],
  "known_issues": [],
  "next_action": "run integration tests"
}
```

---

## 18. Review System

Setiap task dapat memiliki reviewer:

* **Engineering:** `Backend` → `QA`
* **Security:** `Backend` → `Security Engineer` → `Pentester`
* **Design:** `UX Research` → `UI/UX` → `Design System`

**Review Result Options:**
* `approved`
* `rejected`
* `approved_with_changes`

---

## 19. Human Approval

Human approval diperlukan untuk tindakan berdampak tinggi (high-impact action).

```text
DevOps → Production Deployment → Approval Required → User → Approve → Deployment
```

### Representasi UI Approval:

```text
┌───────────────────────────────┐
│     Production Deployment     │
│                               │
│ Project: Laundry SaaS         │
│ Environment: Production       │
│ Agent: DevOps                 │
│                               │
│ Changes: 14 files             │
│ Tests: 238 passed             │
│ Security: Passed              │
│                               │
│   [ Reject ]     [ Approve ]  │
└───────────────────────────────┘
```

---

## 20. Tool Gateway

Agent tidak boleh langsung menjalankan arbitrary command ke host OS:

```text
Agent ──✕──> arbitrary shell
```

**Alur yang benar:**
```text
Agent → Tool Gateway → Permission Check → Policy → Sandbox → Tool
```

**Daftar Tools Terintegrasi:**
* filesystem
* terminal
* git
* github
* browser
* database
* docker
* cloud
* email
* CRM
* analytics
* monitoring

---

## 21. Memory

Memory dibagi menjadi 4 level:
1. **Working Memory**
2. **Project Memory**
3. **Agent Memory**
4. **Organization Memory**

### Context Agent:
* System Instructions
* Role
* Current Task
* Relevant Project Memory
* Required Artifacts
* Previous Task Results

> **Prinsip:** Tidak semua memory dimasukkan ke prompt sekaligus (selective context).

---

## 22. Model Routing

Model dipilih secara dinamis berdasarkan task:

```text
Task → Complexity + Risk + Context Size → Model Router
```

### Model Tiers:
* **Small** (e.g. Simple classification, simple customer response)
* **Medium** (e.g. Business analysis)
* **Strong** (e.g. Complex architecture, security architecture review)

### Local-First Strategy:
```text
Ollama
  ↓
If sufficient → execute
  ↓
If insufficient → Escalate model (cloud/stronger)
```

---

## 23. Virtual Office (3D Realistic Environment)

Virtual office adalah representasi 3D realistis dari kantor perusahaan AI.

### Technology Stack:
* **Three.js + React Three Fiber (R3F)**
* **ReadyPlayerMe** untuk realistic 3D avatars
* Procedural environment generation
* WebSocket real-time state synchronization

### Pembagian Ruangan Kantor:
* Reception / Executive
* Product Studio
* Design Studio
* Engineering Lab
* Marketing Hub
* Sales & Customer Room
* Server Room / DevOps
* Central Meeting Room
* Lobby Dashboard Wall

### 3D Office Layout:

```text
┌────────────────────────────────────────────────────────────────┐
│                       AI COMPANY HQ (3D)                       │
│                                                                │
│   ┌────────────┐   ┌────────────┐   ┌──────────────────────┐   │
│   │  Executive │   │  Product   │   │      Engineering     │   │
│   │   Office   │   │  Studio    │   │        Lab           │   │
│   │            │   │  PM/UX/BA  │   │  Backend / Frontend  │   │
│   │ Orchestrator│   │            │   │  QA / Security       │   │
│   └────────────┘   └────────────┘   └───────────┬──────────┘   │
│                                                 │              │
│   ┌────────────┐   ┌────────────┐   ┌───────────▼──────────┐   │
│   │  Server    │   │  Marketing │   │      Sales &         │   │
│   │   Room     │   │   Hub      │   │   Customer Support   │   │
│   │ DevOps/DB  │   │            │   │                      │   │
│   └────────────┘   └────────────┘   └──────────────────────┘   │
│                                                                │
│        ┌─────────────────────────────────────────────┐         │
│        │           Central Meeting Room              │         │
│        │      (Review / Demo / Standup Space)        │         │
│        └─────────────────────────────────────────────┘         │
│                                                                │
│   [ Reception / Lobby with Company Status Dashboard Wall ]     │
└────────────────────────────────────────────────────────────────┘
```

### 3D Environment Features:
* Realistic office furniture (desks, chairs, monitors, whiteboards)
* Dynamic lighting (day/night cycle, room lights)
* Interactive objects (click desk → view task, click monitor → artifact)
* Environmental details (coffee machine, server racks, projectors)
* Minimap & floor plan overlay for navigation
* Camera modes: Free orbit, Follow agent, Department view, Cinematic

### Avatar System (ReadyPlayerMe Integration):
* Each agent has unique 3D humanoid avatar matching role
* Customizable per department (PM with tablet, Backend with hoodie, DevOps near servers)
* Facial expressions sync with agent state
* Professional attire appropriate to role

---

## 24. Virtual Office Agent Behavior (3D Animations)

Agent activity harus mencerminkan backend state secara real-time dalam 3D. Avatar agent dirender menggunakan ReadyPlayerMe GLB model di Three.js scene. Semua animasi digerakkan oleh backend event via WebSocket — bukan sebaliknya.

### Event-to-Animation Mapping:

| Backend Event | 3D Animation / Visual Cue |
| :--- | :--- |
| `agent.assigned` | Agent bangkit dari idle, berjalan ke meja/ruangan (navmesh pathfinding) |
| `agent.thinking` | Duduk, layar monitor berkedip, floating bubble "💡 Thinking..." |
| `agent.working` | Animasi mengetik / menggambar / membaca sesuai role |
| `task.handoff` | Agent berjalan ke agent lain, artifact glow effect, serah terima |
| `task.review` | Agent berjalan ke meeting room, layar besar tampilkan artifact |
| `approval.requested` | Spotlight ke Founder desk, notification bell + pause seluruh terkait |
| `agent.error` | Animasi frustrated, lampu ruangan berkedip merah |
| `task.completed` | Confetti micro-particle, agent idle selebrasi, checkmark di task board |

### Animation States per Agent:
* **idle:** duduk santai / berdiri di meja
* **walking:** berjalan menggunakan navmesh ke target posisi
* **thinking:** head scratch / look at monitor
* **working:** typing / drawing / reading (per-role)
* **presenting:** standing at whiteboard / projector
* **handoff:** walking toward target agent + object pass
* **waiting:** tapping foot / looking around
* **error:** head-in-hands / frustrated
* **completed:** thumbs up / fist pump

### Camera Modes:
* **Free Orbit:** user kontrol kamera bebas
* **Follow Agent:** kamera ikuti agent tertentu
* **Department View:** zoom out ke satu departemen
* **Cinematic:** auto-pan, dramatis, untuk mode showcase

### Performance Guidelines:
* Max 30 agent avatars rendered simultaneously (LOD system untuk yang jauh)
* Avatar geometry: ~15k poly (high), ~5k poly (LOD1), billboard (LOD2)
* Target: 60 FPS desktop, 30 FPS mobile
* Shadows: baked untuk static objects, realtime hanya untuk avatars

> **Prinsip Utama:** Animation bukan source of truth. Backend tetap menjadi source of truth.

---

## 25. Agent Communication UI

User dapat melihat communication stream:

```text
10:42 [Backend Engineer]
      "Authentication API completed."
             ↓
10:43 [Orchestrator]
      "Sending TASK-120 to QA."
             ↓
10:44 [QA Engineer]
      "Starting integration tests."
             ↓
10:47 [QA Engineer]
      "2 test cases failed."
             ↓
10:47 [Orchestrator]
      "Returning TASK-120 to Backend."
```

---

## 26. Dashboard

Tampilan dashboard utama:

```text
┌─────────────────────────────────────────────────┐
│ AI COMPANY User                                 │
├─────────────┬───────────────────────────────────┤
│             │                                   │
│ Overview    │ Project: Laundry SaaS             │
│ Projects    │                                   │
│ Tasks       │ Progress: 64%                     │
│ Agents      │ [████████████░░░░░]               │
│ Workflows   │                                   │
│ Departments │ Active Agents: 7                  │
│ Activity    │ Tasks: 24 / 38                    │
│ Artifacts   │ Blocked: 2                        │
│ Approvals   │                                   │
│             │                                   │
└─────────────┴───────────────────────────────────┘
```

---

## 27. Project View

Halaman project harus menampilkan:
* **Overview:** Goal, Progress, Status, Deadline, Active agents
* **Workflow:** Visual DAG
* **Tasks:** Filter (All, Running, Blocked, Review, Completed, Failed)
* **Agents:** Menampilkan agent yang aktif
* **Activity:** Realtime event stream
* **Artifacts:** Dokumen dan output agent
* **Approvals:** Action yang membutuhkan human

---

## 28. Agent Detail

Contoh panel saat memilih/mengklik suatu agent:

```text
Backend Engineer
Status: Working

Current Task:
Implement authentication API

Model:
Qwen

Tools:
✓ Git
✓ Terminal
✓ Database

Permissions:
✓ Development
✗ Production

Recent Activity:
- Read API requirements
- Created auth handler
- Ran tests
- Fixed validation
```

---

## 29. Event Architecture

### Event Utama Sistem:

* **Agent Lifecycle:** `agent.created`, `agent.assigned`, `agent.started`, `agent.working`, `agent.waiting`, `agent.completed`, `agent.failed`
* **Task Lifecycle:** `task.created`, `task.assigned`, `task.started`, `task.blocked`, `task.review`, `task.completed`, `task.failed`
* **Workflow:** `workflow.started`, `workflow.completed`
* **Approval:** `approval.requested`, `approval.approved`, `approval.rejected`
* **Tools:** `tool.started`, `tool.completed`, `tool.failed`
* **Deployment:** `deployment.started`, `deployment.completed`, `deployment.failed`

> Virtual office subscribe ke event-event di atas via WebSocket.

---

## 30. Database Core Entities

### Entitas Minimal:
* `organizations`
* `projects`
* `departments`
* `agent_definitions`
* `agent_instances`
* `workflows`
* `workflow_executions`
* `tasks`
* `task_dependencies`
* `agent_runs`
* `tool_calls`
* `artifacts`
* `reviews`
* `approvals`
* `events`
* `memories`
* `model_runs`

### Skema Relasi:

```text
Organization
│
└── Projects
    │
    └── Workflow Execution
        │
        └── Tasks
            │
            ├── Agent Run
            ├── Artifacts
            ├── Reviews
            └── Tool Calls
```

---

## 31. API Requirements

### Minimal REST API:

#### Projects
* `POST /projects`
* `GET /projects`
* `GET /projects/:id`
* `POST /projects/:id/plan`
* `POST /projects/:id/start`
* `POST /projects/:id/pause`
* `POST /projects/:id/resume`
* `POST /projects/:id/cancel`
* `GET /projects/:id/tasks`
* `GET /projects/:id/events`

#### Tasks & Workflows
* `GET /tasks/:id`
* `GET /workflows`
* `GET /workflows/:id`

#### Agents & Artifacts
* `GET /agents`
* `GET /agents/:id`
* `GET /artifacts/:id`

#### Events & Approvals
* `GET /events`
* `GET /approvals`
* `POST /approvals/:id/approve`
* `POST /approvals/:id/reject`

#### Realtime WebSocket:
* `WS /ws/projects/:id`

---

## 32. Example End-to-End Scenario

> **User Prompt:** "Build a SaaS POS system for laundry businesses."

* **Step 1 — Planning (Orchestrator):** Menentukan kebutuhan: Product, Design, Engineering, QA, Security, DevOps, Marketing, Sales, Customer Support.
* **Step 2 — Analysis (Business Analyst):** Mengidentifikasi business model, user roles, workflows, requirements, edge cases → `requirements.md`.
* **Step 3 — Product (PM):** Membuat product scope, MVP, user stories, acceptance criteria.
* **Step 4 — Design (UX & UI):** UX menyusun customer journey & information architecture; UI/UX mendesain Dashboard, POS screen, laundry order flow, customer management.
* **Step 5 — Engineering (Backend & Frontend):** Backend membangun API, Database, Auth, Logic; Frontend membangun Dashboard, POS, Orders, Customers. *(Parallel execution diperbolehkan jika dependency terpenuhi)*.
* **Step 6 — QA (QA Engineer):** Membaca requirements, menjalankan unit tests, integration tests, E2E tests. Jika gagal, escalate kembali via Orchestrator ke Backend/Frontend.
* **Step 7 — Pentest (Security Agent):** Cek auth, input validation, API security, vulnerability scope.
* **Step 8 — DevOps:** Setup Docker, CI/CD, staging, monitoring, backup. Production butuh approval human.
* **Step 9 — Marketing:** Market research, positioning, SEO, content, campaign.
* **Step 10 — Sales:** Lead research, qualification, outreach draft, CRM pipeline.
* **Step 11 — Customer Service:** Knowledge base, ticket classification, escalation, feedback.

Feedback kembali ke Product:
```text
Customer Feedback → Customer Success → Product Analyst → PM → New Task
```
*(Menjadikan sistem closed-loop organization).*

---

## 33. Closed Loop

Fitur jangka panjang agar sistem terus mengiterasi produk:

```text
                 ┌─────────────────────┐
                 │       PRODUCT       │
                 └──────────┬──────────┘
                            ↓
                         RELEASE
                            ↓
                         USERS
                            ↓
                      CUSTOMER SERVICE
                            ↓
                       FEEDBACK
                            ↓
                       ANALYTICS
                            ↓
                       PRODUCT
                            │
                            └──────────────→ NEXT ITERATION
```

---

## 34. Autonomy Levels

* **Level 0 — Manual:** AI hanya memberikan rekomendasi.
* **Level 1 — Assisted:** AI menjalankan task setelah user memulai.
* **Level 2 — Supervised:** AI dapat menjalankan workflow, tetapi high-risk action membutuhkan approval.
* **Level 3 — Autonomous:** AI dapat menjalankan workflow dalam policy yang ditentukan.
* **Level 4 — Continuous:** AI memonitor sistem secara mandiri dan membuat improvement tasks berdasarkan data/event.

> **Catatan:** MVP menggunakan **Level 1–2**.

---

## 35. Cost Control

Setiap agent run mencatat:
* Model
* Input tokens & Output tokens
* Latency
* Tool calls
* Estimated cost

Orchestrator memiliki pembatasan budget:
* Project Budget
* Daily Budget
* Task Budget
* Agent Budget

> **Safety Rule:** Jika budget terlampaui → `pause` → notify user.

---

## 36. Reliability

System harus menangani kegagalan:
* **Model failure:** `retry` → fallback model
* **Tool failure:** `retry` → alternative tool → escalate
* **Agent failure:** `reassign`
* **Workflow failure:** pause downstream tasks → diagnose → resume / retry / human

---

## 37. Acceptance Criteria

MVP dianggap berhasil jika:

* **Project:** User dapat membuat project, memberikan objective, dan orchestrator menghasilkan execution plan.
* **Agents:** Minimal 6 role dapat dieksekusi, memiliki permission berbeda, dapat menerima & menyelesaikan task.
* **Workflow:** Mendukung dependencies, parallel execution untuk independent tasks, retry saat gagal, dan pause/resume.
* **Collaboration:** Agent dapat handoff, review oleh agent lain, dan human approval dapat menghentikan workflow.
* **Tools:** Akses dibatasi permission, semua tool call tercatat di audit log, code execution di sandbox.
* **UI:** User dapat melihat project, workflow, agent status, task status, realtime events, dan virtual office yang merefleksikan state backend.
* **Reliability:** Task state tidak hilang saat worker restart (idempotency & persistent storage), websocket reconnect berjalan normal.

---

## 38. MVP Development Order

> **Aturan:** Jangan mulai dari virtual office terlebih dahulu.

```text
PHASE 1: Foundation
Database → Task System → Agent Registry

PHASE 2: Execution Engine
Agent Runtime → Tool Gateway → Model Router

PHASE 3: Orchestration
Orchestrator → Workflow Engine → Dependency Graph

PHASE 4: Collaboration & Memory
Reviews → Human Approval → Memory

PHASE 5: UI & Realtime
Dashboard → Realtime Events

PHASE 6A: 3D Office Core
Three.js + R3F Setup → Floor Plan, Rooms, Lighting → WebSocket State Sync

PHASE 6B: 3D Characters
ReadyPlayerMe Avatars → Animation State Machine → Navmesh Pathfinding → Handoff & Interactions

PHASE 6C: Realistic Polish
Environment Props → Dynamic Lighting & Shadows → Audio FX → Cross-device Optimization
```

---

## 39. MVP Agent Set

Mulai secara bertahap:

### Phase 1 Agents (Core MVP):
1. Orchestrator
2. Business Analyst
3. Product Manager
4. UI/UX Designer
5. Backend Engineer
6. Frontend Engineer
7. QA Engineer
8. DevOps

### Secondary Wave (Engineering & Data):
* Security Engineer
* Pentester
* Performance Engineer
* Data Analyst

### Tertiary Wave (Business & Operations):
* Digital Marketing
* SEO Specialist
* Content Writer
* Sales Specialist
* Customer Service
* Customer Success

---

## 40. Final Architecture

```text
                         ┌───────────────┐
                         │     USER      │
                         └───────┬───────┘
                                 │
                         ┌───────▼───────┐
                         │   DASHBOARD   │
                         │ 3D VIRTUAL    │
                         │    OFFICE     │
                         └───────┬───────┘
                                 │
                         ┌───────▼───────┐
                         │      API      │
                         └───────┬───────┘
                                 │
                   ┌─────────────▼─────────────┐
                   │       ORCHESTRATOR        │
                   └─────────────┬─────────────┘
                                 │
                 ┌───────────────▼───────────────┐
                 │        WORKFLOW ENGINE        │
                 └───────────────┬───────────────┘
                                 │
                 ┌───────────────▼───────────────┐
                 │          TASK ENGINE          │
                 └───────────────┬───────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
       ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
       │   AGENT   │       │   AGENT   │       │   AGENT   │
       │    PM     │       │  BACKEND  │       │    QA     │
       └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 │
                         ┌───────▼───────┐
                         │  TOOL GATEWAY │
                         └───────┬───────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
          GitHub              Browser              Docker
             │                   │                   │
          Database             APIs               Sandbox
```

### Core Rule
> **Orchestrator** mengatur pekerjaan. **Agent** mengerjakan pekerjaan. **Tool Gateway** mengatur akses. **Workflow Engine** mengatur dependency. **PostgreSQL** menyimpan state. **Event System** menghubungkan semuanya. **Virtual Office** hanya memvisualisasikan state tersebut.
