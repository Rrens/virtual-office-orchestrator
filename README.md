# AI Virtual Office Orchestrator

AI company operating system — user memberikan business goal, sistem otomatis membentuk tim AI, membagi task, dan mengeksekusi workflow end-to-end, divisualisasikan dalam 3D Virtual Office realistis.

## Stack

| Layer | Tech |
|---|---|
| Backend | Node.js 22 + Fastify + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Event Broker | Apache Kafka |
| AI Model Tier 1 | Ollama (Proxmox `192.168.0.2:11434`) |
| AI Model Tier 2 | 9Router Combo API |
| AI Model Tier 3 | Cloud fallback (OpenAI / Anthropic) |
| Frontend | Next.js 16 + React 19 + Tailwind CSS |
| 3D Virtual Office | Three.js + React Three Fiber + ReadyPlayerMe |
| Realtime | WebSocket |

## Struktur Project

```
virtual-office/
├── apps/
│   ├── server/          # Fastify backend
│   └── web/             # Next.js 16 dashboard + 3D office
├── packages/
│   └── shared/          # TypeScript types + Kafka event schemas
├── docker-compose.yml       # Dev environment
├── docker-compose.prod.yml  # Production deployment
└── turbo.json
```

## Prerequisites

- Node.js 22+
- Docker + Docker Compose
- Ollama running (local atau remote)
- PostgreSQL 16

## Quick Start (Development)

### 1. Clone & install dependencies

```bash
git clone https://github.com/Rrens/virtual-office-orchestrator.git
cd virtual-office-orchestrator
git checkout dev
npm install
```

### 2. Setup environment variables

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:
```env
DATABASE_URL="postgresql://admin:password@localhost:5432/virtual_office"
OLLAMA_BASE_URL=http://192.168.0.2:11434
OLLAMA_MODEL_CODE=qwen2.5-coder:3b
OLLAMA_MODEL_GENERAL=qwen2.5:0.5b
OLLAMA_MODEL_PLANNER=qwen2.5:0.5b
KAFKA_BROKER=localhost:9092
```

### 3. Start Kafka + Zookeeper

```bash
docker-compose up -d zookeeper kafka kafka-ui
```

Kafka UI tersedia di http://localhost:8080

### 4. Setup database

```bash
# Run Prisma migration
npm run db:migrate --workspace=@virtual-office/server

# Seed 30 agent definitions
node --import tsx apps/server/src/db/seed.ts
```

### 5. Run development servers

Terminal 1 — Backend:
```bash
npm run dev --workspace=@virtual-office/server
# Running on http://localhost:4000
# Docs: http://localhost:4000/docs
```

Terminal 2 — Frontend:
```bash
npm run dev --workspace=@virtual-office/web
# Running on http://localhost:3000
```

## Production Deployment (Docker Compose)

```bash
# Build & start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migration inside container
docker exec vo-prod-server node apps/server/dist/db/seed.js
```

Services:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Docs: http://localhost:4000/docs
- Kafka UI: http://localhost:8080

## Cara Pakai

1. Buka http://localhost:3000
2. Klik **+ New Project**
3. Isi nama project + business goal (e.g. "Build a SaaS laundry POS")
4. Klik **Create Project**
5. Klik **▶ Start Workflow**
6. Lihat AI agents bekerja di tab **Tasks** dan **🏢 3D Office**
7. Approve actions di tab **Approvals** jika diperlukan

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:id` | Project detail |
| POST | `/api/projects/:id/plan` | Generate DAG plan |
| POST | `/api/projects/:id/start` | Start workflow |
| GET | `/api/projects/:id/tasks` | List tasks |
| GET | `/api/approvals` | Pending approvals |
| POST | `/api/approvals/:id/approve` | Approve action |
| POST | `/api/approvals/:id/reject` | Reject action |
| WS | `/ws/projects/:id` | Realtime events |

## Agent Roles (30 Total)

| Department | Agents |
|---|---|
| Executive | Orchestrator, Business Strategist |
| Product | PM, Business Analyst, UX Researcher, Product Analyst |
| Design | UI/UX Designer, Design System Lead, Brand Designer |
| Engineering | Backend, Frontend, Mobile, QA, Security, Pentest, DevOps, Performance, AI Engineer |
| Growth | Digital Marketer, SEO, Content Creator, Growth Analyst |
| Sales | Sales Rep, Sales Researcher, Account Manager |
| Customer | Customer Service, Customer Success |
| Data | Data Engineer, Data Analyst |
| Operations | Operations Manager |

## Model Routing

| Tier | Provider | Dipakai Untuk |
|---|---|---|
| Tier 1 | Ollama local (Proxmox) | Planning, general agents, light tasks |
| Tier 2 | 9Router Combo API | Engineering agents, concurrent execution |
| Tier 3 | Cloud (OpenAI/Anthropic) | Security audit, complex architecture |

Automatic fallback: Tier 1 → Tier 2 → Tier 3 jika provider tidak tersedia.

## Branch

- `dev` — development branch (active)
- `main` — production-ready (manual PR dari dev)
