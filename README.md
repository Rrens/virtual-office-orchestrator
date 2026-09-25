# AI Virtual Office Orchestrator

AI company operating system — user memberikan business goal, sistem otomatis membentuk tim AI, membagi task, dan mengeksekusi workflow end-to-end, divisualisasikan dalam 3D Virtual Office realistis.

## Stack

| Layer | Tech |
|---|---|
| Backend | Node.js 24 + Fastify + TypeScript |
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

- Node.js 24+
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

> **Shortcut:** `make install`

### 2. Automated full setup (recommended)

```bash
make setup
```

This single command will:
1. Copy `.env.example` → `.env`
2. Start Docker infrastructure (Postgres + Kafka + Zookeeper + Kafka UI)
3. Run Prisma migrations
4. Seed 30 agent definitions

### 3. Manual setup (if you prefer step-by-step)

#### Setup environment variables

```bash
make env
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

#### Start Kafka + Zookeeper + Postgres

```bash
make up
```

Kafka UI tersedia di http://localhost:8080

#### Setup database

```bash
make db-migrate
make db-seed
```

### 4. Run development servers

Run both backend & frontend in one terminal:
```bash
make dev
```

Or run separately:

Terminal 1 — Backend:
```bash
make dev-server
# Running on http://localhost:4000
# Docs: http://localhost:4000/docs
```

Terminal 2 — Frontend:
```bash
make dev-web
# Running on http://localhost:3000
```

## Makefile Commands

```bash
make help          # Show all available commands
```

| Command | Description |
|---|---|
| `make setup` | Full initial setup (env + docker + db migrate + seed) |
| `make install` | Install npm dependencies |
| `make env` | Copy `.env.example` → `.env` |
| `make up` | Start Docker infrastructure |
| `make down` | Stop Docker infrastructure |
| `make restart` | Restart Docker containers |
| `make ps` | Show container status |
| `make db-migrate` | Run Prisma migrations |
| `make db-seed` | Seed 30 agent definitions |
| `make db-reset` | Reset database |
| `make db-studio` | Open Prisma Studio GUI |
| `make dev` | Run both backend & frontend |
| `make dev-server` | Run backend only (port 4000) |
| `make dev-web` | Run frontend only (port 3000) |
| `make test` | Run Vitest unit tests |
| `make build` | Build all workspaces |
| `make typecheck` | Run TypeScript type check |
| `make lint` | Run linting |
| `make clean` | Clean build artifacts |
| `make docker-build` | Build production Docker images |
| `make docker-up` | Start production stack |

## Production Deployment (Docker Compose)

```bash
make docker-build
make docker-up
```

Or manually:
```bash
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
