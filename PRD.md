PRD — AI Virtual Office Orchestrator

1. Product Overview

AI Virtual Office Orchestrator adalah platform multi-agent yang mensimulasikan sebuah perusahaan digital yang terdiri dari berbagai AI employee.

User memberikan business goal, lalu sistem secara otomatis:

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

Virtual office menjadi visual representation dari aktivitas tersebut.

Contoh:

"Buatkan SaaS POS untuk bisnis laundry."

Orchestrator dapat membentuk:

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

Tidak semua agent harus aktif. Orchestrator menentukan agent yang relevan berdasarkan tujuan.

2. Product Vision

Membangun sebuah AI company operating system di mana user tidak perlu mengelola setiap AI agent secara manual.

User bertindak sebagai:

Founder / Human-in-the-loop

Sedangkan AI company menangani:

planning
research
product
design
development
QA
security
deployment
marketing
sales
customer service
analytics
operations

Tujuan utamanya bukan membuat "chatbot dengan banyak persona", tetapi membuat sistem kerja multi-agent yang benar-benar memiliki state, task, dependency, tools, permissions, memory, dan workflow.

3. Problem

AI agent individual biasanya mampu mengerjakan task tertentu, tetapi memiliki beberapa masalah:

Tidak ada koordinasi antar-agent.
Context mudah hilang.
Agent tidak mengetahui pekerjaan agent lain.
Tidak ada dependency management.
Tidak ada approval mechanism.
Tidak ada centralized task management.
Sulit mengetahui siapa sedang mengerjakan apa.
Agent sering mengerjakan pekerjaan yang sama.
Tidak ada standardized handoff.
Tidak ada audit trail.
Semua pekerjaan sering bergantung pada satu conversational context.

Virtual Office Orchestrator menyelesaikan masalah tersebut dengan menyediakan organization-level orchestration layer.

4. Goals
   Primary Goals
   G1 — Goal-driven execution

User cukup memberikan objective.

Contoh:

Build a SaaS laundry management platform.

Sistem harus mampu mengubah objective menjadi execution plan.

G2 — Dynamic organization

Orchestrator harus dapat menentukan:

Department apa yang diperlukan?
Agent apa yang diperlukan?
Task apa yang diperlukan?
Dependency-nya apa?
Mana yang bisa parallel?
Mana yang harus menunggu?
G3 — Multi-agent collaboration

Agent harus dapat:

menerima task,
menghasilkan artifact,
meminta bantuan agent lain,
melakukan handoff,
memberikan review,
menerima feedback,
retry,
escalate.
G4 — Observable execution

User harus selalu dapat mengetahui:

Project status
Agent status
Current task
Workflow stage
Blocked tasks
Recent activity
Artifacts
Errors
Approvals
G5 — Human control

AI tidak boleh memiliki unlimited autonomy.

User dapat:

approve
reject
pause
resume
cancel
retry
reassign
G6 — Virtual office visualization

User dapat melihat aktivitas organisasi secara visual.

Contoh:

                    CEO
                     │
        ┌────────────┼────────────┐
        │            │            │
     Product      Design      Engineering
        │            │            │
       PM          UI/UX       Backend
                                Frontend
                                   QA

Agent yang bekerja akan terlihat aktif di office.

5. Non-Goals

MVP tidak bertujuan untuk:

membuat AGI,
menggantikan seluruh manusia,
menjalankan semua agent secara bersamaan,
memberikan unrestricted shell access,
langsung melakukan production deployment tanpa policy,
membuat simulation game,
membuat agent memiliki personality kompleks,
membangun microservices berlebihan.

Virtual office bukan game.

Office adalah UI untuk orchestration system.

6. Core Concept

Ada 7 konsep utama.

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

Contoh:

Organization
└── Project: Laundry SaaS
└── Workflow: Software Product
├── Task: Analyze requirements
│ └── Business Analyst
│
├── Task: Design UX
│ └── UX Researcher
│
├── Task: Design UI
│ └── UI/UX Designer
│
├── Task: Build API
│ └── Backend Engineer
│
├── Task: Build frontend
│ └── Frontend Engineer
│
├── Task: QA
│ └── QA Engineer
│
└── Task: Security testing
└── Pentester 7. User Roles
Founder

Primary user.

Can:

create project,
define goals,
approve actions,
inspect agents,
modify workflow,
pause execution,
override assignments.
Observer

Read-only user.

Can:

inspect project,
inspect agents,
inspect logs,
inspect artifacts. 8. Organization Structure

System harus mendukung hierarchy:

Organization
│
├── Executive
│ └── Orchestrator
│
├── Product
│ ├── PM
│ ├── Business Analyst
│ └── UX Researcher
│
├── Design
│ ├── UI/UX
│ └── Design System
│
├── Engineering
│ ├── Backend
│ ├── Frontend
│ ├── QA
│ ├── Security
│ ├── Pentest
│ └── DevOps
│
├── Marketing
│ ├── Digital Marketing
│ ├── SEO
│ └── Content
│
├── Sales
│ ├── Sales
│ └── Account Manager
│
└── Customer
├── Customer Service
└── Customer Success 9. Agent Model

Agent bukan model.

Agent
├── Role
├── Persona
├── Instructions
├── Permissions
├── Tools
├── Memory
├── Current Task
└── Model

Contoh:

agent:
id: agent_backend_001
role: backend-engineer
model: qwen
status: working

permissions: - workspace.read - workspace.write - git - database.dev

tools: - filesystem - terminal - git

Satu model dapat digunakan oleh banyak agent.

10. Orchestrator

Orchestrator merupakan central intelligence dari sistem.

Responsibilities

Orchestrator harus:

Understand goal.
Identify constraints.
Identify required departments.
Select workflow.
Generate tasks.
Build dependencies.
Assign agents.
Start execution.
Monitor execution.
Detect failures.
Request reviews.
Handle retries.
Request approvals.
Resolve blockers.
Determine completion.
Generate final report. 11. Planning Pipeline

Saat user memberikan goal:

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

Contoh:

"Build a laundry POS SaaS"

Orchestrator menghasilkan:

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
Release 12. Dynamic Workflow

Workflow tidak boleh selalu fixed.

Contoh project:

"Buat campaign Instagram untuk produk X."

Tidak membutuhkan:

Backend
Frontend
Pentester
DevOps

Workflow:

Research
↓
Marketing Strategy
↓
Content
↓
Campaign
↓
Analytics

Sedangkan:

"Build banking API"

bisa membutuhkan:

Business Analyst
↓
System Architect
↓
Backend
↓
Security
↓
QA
↓
Pentest
↓
DevOps 13. Task Graph

Workflow harus direpresentasikan sebagai DAG.

Contoh:

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

Task yang tidak memiliki dependency dapat berjalan parallel.

14. Agent Lifecycle

Agent memiliki state:

idle
↓
assigned
↓
thinking
↓
working
↓
waiting
↓
reviewing
↓
completed

Failure:

working
↓
error
↓
retry
↓
working

Jika retry gagal:

error
↓
escalated
↓
human / specialist 15. Task Lifecycle
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
└── REJECTED → RETRY
↓
RUNNING

Task juga dapat:

BLOCKED
CANCELLED
FAILED 16. Agent Collaboration

Agent tidak boleh langsung mengontrol agent lain.

Gunakan orchestrator.

Backend
↓
Request Review
↓
Orchestrator
↓
QA

Contoh:

Backend Engineer:

"Authentication API implemented.
Requesting QA review."

        ↓

Orchestrator

        ↓

QA Engineer

"Running authentication test suite." 17. Handoff

Handoff harus menghasilkan structured payload.

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
} 18. Review System

Setiap task dapat memiliki reviewer.

Contoh:

Backend
↓
QA

Security:

Backend
↓
Security Engineer
↓
Pentester

Design:

UX Research
↓
UI/UX
↓
Design System

Review result:

approved
rejected
approved_with_changes 19. Human Approval

Human approval diperlukan untuk high-impact action.

Contoh:

DevOps
↓
Production Deployment
↓
Approval Required
↓
User
↓
Approve
↓
Deployment

UI:

┌───────────────────────────────┐
│ Production Deployment │
│ │
│ Project: Laundry SaaS │
│ Environment: Production │
│ Agent: DevOps │
│ │
│ Changes: 14 files │
│ Tests: 238 passed │
│ Security: Passed │
│ │
│ [ Reject ] [ Approve ] │
└───────────────────────────────┘ 20. Tool Gateway

Agent tidak boleh:

Agent → arbitrary shell

Harus:

Agent
↓
Tool Gateway
↓
Permission Check
↓
Policy
↓
Sandbox
↓
Tool

Tools:

filesystem
terminal
git
github
browser
database
docker
cloud
email
CRM
analytics
monitoring 21. Memory

Memory dibagi:

Working Memory
Project Memory
Agent Memory
Organization Memory

Context agent:

System Instructions

- Role
- Current Task
- Relevant Project Memory
- Required Artifacts
- Previous Task Results

Tidak semua memory dimasukkan ke prompt.

22. Model Routing

Model dipilih berdasarkan task.

Task
↓
Complexity
↓
Risk
↓
Context Size
↓
Model Router

Tier:

Small
Medium
Strong

Contoh:

Simple classification → Small

Business analysis → Medium

Complex architecture → Strong

Simple customer response → Small

Security architecture review → Strong

Local-first:

Ollama
↓
If sufficient → execute

If insufficient
↓
Escalate model 23. Virtual Office (3D Realistic Environment)

Virtual office adalah representasi 3D realistis dari kantor perusahaan AI.

Technology Stack:
- Three.js + React Three Fiber (R3F)
- ReadyPlayerMe untuk realistic 3D avatars
- Procedural environment generation
- WebSocket real-time state synchronization

Virtual office memiliki ruangan:

Reception / Executive
Product Studio
Design Studio
Engineering Lab
Marketing Hub
Sales & Customer Room
Server Room / DevOps
Central Meeting Room
Lobby Dashboard Wall

3D Office Layout:

┌────────────────────────────────────────────────────────────────┐
│                       AI COMPANY HQ (3D)                       │
│                                                                │
│   ┌────────────┐   ┌────────────┐   ┌──────────────────────┐  │
│   │  Executive │   │  Product   │   │      Engineering     │  │
│   │   Office   │   │  Studio    │   │        Lab           │  │
│   │            │   │  PM/UX/BA  │   │  Backend / Frontend  │  │
│   │ Orchestrator│   │            │   │  QA / Security       │  │
│   └────────────┘   └────────────┘   └───────────┬──────────┘  │
│                                                 │              │
│   ┌────────────┐   ┌────────────┐   ┌───────────▼──────────┐  │
│   │  Server    │   │  Marketing │   │      Sales &         │  │
│   │   Room     │   │   Hub      │   │   Customer Support   │  │
│   │ DevOps/DB  │   │            │   │                      │  │
│   └────────────┘   └────────────┘   └──────────────────────┘  │
│                                                                │
│        ┌─────────────────────────────────────────────┐        │
│        │           Central Meeting Room              │        │
│        │      (Review / Demo / Standup Space)       │        │
│        └─────────────────────────────────────────────┘        │
│                                                                │
│   [ Reception / Lobby with Company Status Dashboard Wall ]     │
└────────────────────────────────────────────────────────────────┘

3D Environment Features:
- Realistic office furniture (desks, chairs, monitors, whiteboards)
- Dynamic lighting (day/night cycle, room lights)
- Interactive objects (click desk → view task, click monitor → artifact)
- Environmental details (coffee machine, server racks, projectors)
- Minimap & floor plan overlay for navigation
- Camera modes: Free orbit, Follow agent, Department view, Cinematic

Avatar System (ReadyPlayerMe Integration):
- Each agent has unique 3D humanoid avatar matching role
- Customizable per department (PM with tablet, Backend with hoodie, DevOps near servers)
- Facial expressions sync with agent state
- Professional attire appropriate to role

24. Virtual Office Agent Behavior (3D Animations)

Agent activity harus mencerminkan backend state secara real-time dalam 3D.

Avatar agent dirender menggunakan ReadyPlayerMe GLB model di Three.js scene.
Semua animasi digerakkan oleh backend event via WebSocket — bukan sebaliknya.

Event-to-Animation Mapping:

agent.assigned   → Agent bangkit dari idle, berjalan ke meja/ruangan (navmesh pathfinding)
agent.thinking   → Duduk, layar monitor berkedip, floating bubble "💡 Thinking..."
agent.working    → Animasi mengetik / menggambar / membaca sesuai role
task.handoff     → Agent berjalan ke agent lain, artifact glow effect, serah terima
task.review      → Agent berjalan ke meeting room, layar besar tampilkan artifact
approval.requested → Spotlight ke Founder desk, notification bell + pause seluruh terkait
agent.error      → Animasi frustrated, lampu ruangan berkedip merah
task.completed   → Confetti micro-particle, agent idle celebrasi, checkmark di task board

Animation States per Agent:
- idle: duduk santai / berdiri di meja
- walking: berjalan menggunakan navmesh ke target posisi
- thinking: head scratch / look at monitor
- working: typing / drawing / reading (per-role)
- presenting: standing at whiteboard / projector
- handoff: walking toward target agent + object pass
- waiting: tapping foot / looking around
- error: head-in-hands / frustrated
- completed: thumbs up / fist pump

Camera Modes:
- Free Orbit: user kontrol kamera bebas
- Follow Agent: kamera ikuti agent tertentu
- Department View: zoom out ke satu departemen
- Cinematic: auto-pan, dramatik, untuk mode showcase

Performance Guidelines:
- Max 30 agent avatars rendered simultaneously (LOD system untuk yang jauh)
- Avatar geometry: ~15k poly (high), ~5k poly (LOD1), billboard (LOD2)
- Target: 60 FPS desktop, 30 FPS mobile
- Shadows: baked untuk static objects, realtime hanya untuk avatars

Animation bukan source of truth.

Backend tetap menjadi source of truth.

25. Agent Communication UI

User dapat melihat communication stream:

10:42 Backend Engineer

Authentication API completed.

        ↓

10:43 Orchestrator

Sending TASK-120 to QA.

        ↓

10:44 QA Engineer

Starting integration tests.

        ↓

10:47 QA Engineer

2 test cases failed.

        ↓

10:47 Orchestrator

Returning TASK-120 to Backend. 26. Dashboard

Dashboard utama:

┌─────────────────────────────────────────────────┐
│ AI COMPANY User │
├─────────────┬───────────────────────────────────┤
│ │ │
│ Overview │ Project: Laundry SaaS │
│ Projects │ │
│ Tasks │ Progress 64% │
│ Agents │ │
│ Workflows │ ████████████░░░░░ │
│ Departments │ │
│ Activity │ Active Agents: 7 │
│ Artifacts │ Tasks: 24 / 38 │
│ Approvals │ Blocked: 2 │
│ │ │
└─────────────┴───────────────────────────────────┘ 27. Project View

Project page harus menampilkan:

Overview
Goal
Progress
Status
Deadline
Active agents
Workflow

Visual DAG.

Tasks

Filter:

All
Running
Blocked
Review
Completed
Failed
Agents

Menampilkan agent yang aktif.

Activity

Realtime event stream.

Artifacts

Dokumen dan output agent.

Approvals

Action yang membutuhkan human.

28. Agent Detail

Klik agent:

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

29. Event Architecture

Event utama:

agent.created
agent.assigned
agent.started
agent.working
agent.waiting
agent.completed
agent.failed

task.created
task.assigned
task.started
task.blocked
task.review
task.completed
task.failed

workflow.started
workflow.completed

approval.requested
approval.approved
approval.rejected

tool.started
tool.completed
tool.failed

deployment.started
deployment.completed
deployment.failed

Virtual office subscribe ke event tersebut.

30. Database Core Entities

Minimal:

organizations
projects
departments
agent_definitions
agent_instances
workflows
workflow_executions
tasks
task_dependencies
agent_runs
tool_calls
artifacts
reviews
approvals
events
memories
model_runs

Relationship:

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
└── Tool Calls 31. API Requirements

Minimal API:

POST /projects
GET /projects
GET /projects/:id

POST /projects/:id/plan
POST /projects/:id/start
POST /projects/:id/pause
POST /projects/:id/resume
POST /projects/:id/cancel

GET /projects/:id/tasks
GET /tasks/:id

GET /agents
GET /agents/:id

GET /workflows
GET /workflows/:id

GET /events
GET /projects/:id/events

GET /approvals
POST /approvals/:id/approve
POST /approvals/:id/reject

GET /artifacts/:id

Realtime:

/ws/projects/:id 32. Example End-to-End Scenario

User:

"Build a SaaS POS system for laundry businesses."

Step 1 — Planning

Orchestrator:

Project requires:

Product
Design
Engineering
QA
Security
DevOps
Marketing
Sales
Customer Support
Step 2 — Analysis

Business Analyst:

Identify:

- business model
- user roles
- workflows
- requirements
- edge cases

Output:

requirements.md
Step 3 — Product

PM:

Create:

- product scope
- MVP
- user stories
- acceptance criteria
  Step 4 — Design

UX:

Customer journey
Information architecture
User flows

UI/UX:

Dashboard
POS screen
Laundry order flow
Customer management
Step 5 — Engineering

Backend:

API
Database
Authentication
Business logic

Frontend:

Dashboard
POS
Orders
Customers
Reports

Parallel execution diperbolehkan jika dependency terpenuhi.

Step 6 — QA

QA membaca:

requirements
acceptance criteria
backend
frontend

Kemudian menjalankan:

unit tests
integration tests
E2E tests

Jika gagal:

QA
↓
Orchestrator
↓
Backend / Frontend
↓
QA
Step 7 — Pentest

Security agent memeriksa:

authentication
authorization
input validation
API security
dependency vulnerabilities
common web vulnerabilities

Hanya target yang masuk scope.

Step 8 — DevOps

DevOps:

Docker
CI/CD
staging
monitoring
backup
deployment

Production:

Approval
↓
Deploy
Step 9 — Marketing

Marketing:

market research
positioning
SEO
content
campaign
analytics
Step 10 — Sales

Sales:

lead research
qualification
outreach draft
CRM
pipeline
Step 11 — Customer Service

Customer Service:

knowledge base
ticket classification
response
escalation
feedback

Feedback kembali ke Product:

Customer Feedback
↓
Customer Success
↓
Product Analyst
↓
PM
↓
New Task

Ini membuat sistem menjadi closed-loop organization.

33. Closed Loop

Ini salah satu fitur jangka panjang paling penting.

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

Jadi company tidak berhenti setelah deployment.

34. Autonomy Levels

Setiap project memiliki autonomy level.

Level 0 — Manual

AI hanya memberikan rekomendasi.

Level 1 — Assisted

AI menjalankan task setelah user memulai.

Level 2 — Supervised

AI dapat menjalankan workflow tetapi high-risk action membutuhkan approval.

Level 3 — Autonomous

AI dapat menjalankan workflow dalam policy yang telah ditentukan.

Level 4 — Continuous

AI dapat terus memonitor sistem dan membuat improvement tasks berdasarkan event/data.

MVP menggunakan Level 1–2.

35. Cost Control

Setiap agent run mencatat:

model
input tokens
output tokens
latency
tool calls
estimated cost

Orchestrator memiliki budget:

Project Budget
Daily Budget
Task Budget
Agent Budget

Jika budget terlampaui:

pause
↓
notify user 36. Reliability

System harus menangani:

Model failure
retry
↓
fallback model
Tool failure
retry
↓
alternative tool
↓
escalate
Agent failure
reassign
Workflow failure
pause downstream tasks
↓
diagnose
↓
resume / retry / human 37. Acceptance Criteria

MVP dianggap berhasil jika:

Project
User dapat membuat project.
User dapat memberikan objective.
Orchestrator menghasilkan execution plan.
Agents
Minimal 6 role dapat dieksekusi.
Agent memiliki permission berbeda.
Agent dapat menerima dan menyelesaikan task.
Workflow
Workflow mendukung dependency.
Independent tasks dapat berjalan parallel.
Failed task dapat retry.
Workflow dapat pause/resume.
Collaboration
Agent dapat melakukan handoff.
Review dapat dilakukan agent lain.
Human approval dapat menghentikan workflow.
Tools
Agent tidak dapat mengakses tool di luar permission.
Tool call tercatat di audit log.
Code execution berjalan dalam sandbox.
UI
User dapat melihat project.
User dapat melihat workflow.
User dapat melihat agent status.
User dapat melihat task status.
User dapat melihat realtime events.
Virtual office merepresentasikan state backend.
Reliability
Restart worker tidak kehilangan task state.
Duplicate execution dapat dicegah dengan idempotency.
Event consumer dapat reconnect. 38. MVP Development Order

Jangan mulai dari virtual office.

Urutan implementasi:

PHASE 1
Database
↓
Task System
↓
Agent Registry
PHASE 2
Agent Runtime
↓
Tool Gateway
↓
Model Router
PHASE 3
Orchestrator
↓
Workflow Engine
↓
Dependency Graph
PHASE 4
Reviews
↓
Human Approval
↓
Memory
PHASE 5
Dashboard
↓
Realtime Events
PHASE 6A
3D Office Core
↓
Three.js + React Three Fiber setup
↓
Floor plan, rooms, lighting
↓
WebSocket state sync
PHASE 6B
3D Characters
↓
ReadyPlayerMe avatar integration
↓
Animation state machine
↓
Navmesh pathfinding
↓
Handoff & interaction animations
PHASE 6C
Realistic Polish
↓
Environment props & details
↓
Dynamic lighting & shadows
↓
Sound FX & ambient audio
↓
Mobile / cross-device optimization 39. MVP Agent Set

Jangan langsung deploy 30 agent.

Mulai dengan:

Orchestrator
↓
Business Analyst
↓
Product Manager
↓
UI/UX Designer
↓
Backend Engineer
↓
Frontend Engineer
↓
QA Engineer
↓
DevOps

Setelah engine stabil:

Security
Pentester
Performance
Data Analyst

Kemudian business:

Digital Marketing
SEO
Content
Sales
Customer Service
Customer Success 40. Final Architecture

Target architecture:

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
                 │          TASK ENGINE           │
                 └───────────────┬───────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
       ┌─────▼─────┐       ┌─────▼─────┐       ┌────▼────┐
       │   AGENT   │       │   AGENT   │       │  AGENT  │
       │   PM      │       │ BACKEND   │       │   QA    │
       └─────┬─────┘       └─────┬─────┘       └────┬────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 │
                         ┌───────▼───────┐
                         │  TOOL GATEWAY │
                         └───────┬───────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
          GitHub              Browser             Docker
             │                   │                   │
          Database            APIs              Sandbox

Core rule

Orchestrator mengatur pekerjaan. Agent mengerjakan pekerjaan. Tool Gateway mengatur akses. Workflow Engine mengatur dependency. PostgreSQL menyimpan state. Event System menghubungkan semuanya. Virtual Office hanya memvisualisasikan state tersebut.
