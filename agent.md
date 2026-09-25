# 🤖 Agent Registry & Architecture Specification

> **AI Virtual Office Orchestrator**  
> Document Version: 1.0  
> Target Architecture: Node.js (Fastify/TS) + PostgreSQL (Prisma) + Apache Kafka + Three.js / ReadyPlayerMe  

---

## 📑 Table of Contents

1. [Overview & Agent Model](#1-overview--agent-model)
2. [Multi-Tier Model Routing Strategy](#2-multi-tier-model-routing-strategy)
3. [Agent Lifecycle & State Machine](#3-agent-lifecycle--state-machine)
4. [Tool Gateway & Permission Matrix](#4-tool-gateway--permission-matrix)
5. [3D Avatar & Animation Mapping (ReadyPlayerMe)](#5-3d-avatar--animation-mapping-readyplayerme)
6. [27 Agent Role Contracts](#6-27-agent-role-contracts)
   - [Executive Department](#executive-department)
   - [Product Department](#product-department)
   - [Design Department](#design-department)
   - [Engineering Department](#engineering-department)
   - [Growth & Marketing Department](#growth--marketing-department)
   - [Sales Department](#sales-department)
   - [Customer Department](#customer-department)
   - [Data Department](#data-department)
   - [Operations Department](#operations-department)
7. [Handoff & Review Protocols](#7-handoff--review-protocols)

---

## 1. Overview & Agent Model

In this system, **an Agent is a role contract, not an isolated LLM instance**. A single underlying model (e.g., Qwen on Ollama or a 9Router endpoint) can power multiple agents at different times by loading specific system instructions, permissions, memory contexts, and tool definitions.

```
Agent Instance
├── Role & Definition (Name, Department, Persona)
├── System Prompt & Behavioral Instructions
├── Permissions (Fine-grained RBAC for tools & scopes)
├── Tool Gateway Bindings (Allowed tools + sandboxed execution)
├── Memory Layer (Working, Project, Role, Org Memory)
├── Current Task & State (IDLE, WORKING, REVIEWING, etc.)
├── Assigned 3D Avatar (ReadyPlayerMe ID + 3D Animation profile)
└── Model Routing Config (Tier 1: Ollama / Tier 2: 9Router / Tier 3: Cloud)
```

---

## 2. Multi-Tier Model Routing Strategy

To balance speed, cost, and task complexity:

| Tier | Provider | Best For | Examples |
|---|---|---|---|
| **Tier 1 (Local First)** | **Ollama** (`qwen2.5-coder:7b`, `llama3.1:8b`) | Simple classification, data parsing, light coding, status reporting | QA unit test run, ticket classification, doc string generator |
| **Tier 2 (High Parallel)** | **9Router Combo** (Multi-model endpoints) | Concurrent agent execution, full-stack coding, UI design schema, SEO analysis | Backend API build, Next.js components, database migrations, marketing copy |
| **Tier 3 (Cloud Fallback)** | **Cloud Models** (Claude 3.5 Sonnet, GPT-4o) | High-stakes strategy, complex architecture, critical security pentest | Dynamic planning DAG, security vulnerability audit, human-in-the-loop escalations |

---

## 3. Agent Lifecycle & State Machine

```
   ┌─────────┐      task.assigned      ┌──────────┐      thinking      ┌──────────┐
   │  IDLE   ├─────────────────────────► ASSIGNED ├───────────────────► THINKING │
   └────▲────┘                         └──────────┘                    └────┬─────┘
        │                                                                   │
        │                                                                   │ working
        │                                                                   ▼
   ┌────┴──────┐      task.review      ┌──────────┐      execute tool  ┌──────────┐
   │ COMPLETED │◄──────────────────────┤REVIEWING │◄───────────────────┤ WORKING  │
   └───────────┘                       └────┬─────┘                    └────┬─────┘
                                            │                               │
                                     reject │                               │ error
                                            ▼                               ▼
                                       ┌──────────┐      retry ok      ┌──────────┐
                                       │  RETRY   ├───────────────────►│  ERROR   │
                                       └──────────┘                    └────┬─────┘
                                                                            │ max retries
                                                                            ▼
                                                                       ┌──────────┐
                                                                       │ESCALATED │
                                                                       └──────────┘
```

---

## 4. Tool Gateway & Permission Matrix

Agents never get unrestricted bash or host access. All operations go through the **Tool Gateway** with RBAC verification:

| Permission Flag | Description | Authorized Roles |
|---|---|---|
| `workspace.read` | Read files in project workspace | All Agents |
| `workspace.write` | Create / edit files in project workspace | PM, UI/UX, Backend, Frontend, DevOps, Content |
| `git.commit` | Create branches and commit artifacts | Backend, Frontend, DevOps |
| `terminal.sandbox` | Execute bash in an isolated Docker container | Backend, QA, Pentester, DevOps |
| `database.dev` | Run queries and migrations against Dev DB | Backend, Data Engineer, Data Analyst |
| `browser.fetch` | Scrape or browse approved URLs | Business Analyst, UX, Marketer, SEO, Sales |
| `deployment.staging` | Deploy artifacts to Staging environment | DevOps |
| `deployment.prod` | Deploy to Production (**Requires Human Approval**) | DevOps (Pending Founder sign-off) |

---

## 5. 3D Avatar & Animation Mapping (ReadyPlayerMe)

Each agent in the 3D Virtual Office is rendered using a **ReadyPlayerMe GLB avatar** customized to their departmental persona:

| Department | Avatar Archetype | Signature Prop / Outfit | 3D Working Animation |
|---|---|---|---|
| **Executive** | Sharp Suit / Blazer | Smart watch, Executive desk | Standing at podium / Orbiting digital board |
| **Product** | Business Casual, Smart Glasses | Tablet / Stylus | Wireframing on tablet, gesturing |
| **Design** | Creative Streetwear | Stylus pen, Wacom tablet, Color swatches | Drawing on digital canvas, comparing screens |
| **Engineering** | Hoodie / Tech Tee + Headphones | Mechanical keyboard, multi-monitors | Fast dual-hand typing, terminal screen glow |
| **QA / Testing** | Smart Casual + Tablet | Clipboard, Bug badge | Running test scripts, inspect screen |
| **Security** | Dark Techwear / Jacket | Encrypted laptop, Security token | Matrix terminal view, scanning monitor |
| **DevOps** | Utility vest / Tactical tech | Server rack terminal, Cables | Server rack interaction, cable wiring |
| **Growth & Marketing** | Modern Casual / Creator look | Smartphone, Microphone | Social dashboard viewing, analytics chart |
| **Sales** | Semi-Formal Shirt | Headset phone, CRM tablet | Dialing calls, presenting deal slides |
| **Customer** | Casual Polo + Headset | Support headset, Smile | Typing on chat interface, taking calls |
| **Data** | Minimalist Casual | Glasses, Statistical graphs | Data pipeline flow chart viewing |
| **Operations** | Smart Casual | Digital clipboard | Walking between rooms, checklist ticking |

---

## 6. 27 Agent Role Contracts

### Executive Department

#### 1. Orchestrator
- **ID**: `agent_orchestrator`
- **Model Tier**: Tier 3 (Cloud / Strong Model)
- **Mission**: Central intelligence. Breaks user goals into dynamic DAG workflows, assigns agents, monitors execution, resolves blockers, and generates the final project delivery.
- **Tools**: `workflow.engine`, `task.manager`, `agent.registry`, `event.stream`
- **Permissions**: `all.read`, `tasks.manage`, `workflows.manage`
- **Inputs**: User Objective, Business Constraints, Project Budget
- **Outputs**: DAG Execution Plan, Task Assignments, Status Reports

#### 2. Business Strategist
- **ID**: `agent_business_strategist`
- **Model Tier**: Tier 2 / 3
- **Mission**: Define business models, monetization strategy, market positioning, unit economics, and competitive advantage.
- **Tools**: `browser.fetch`, `document.generator`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Goal, Market vertical
- **Outputs**: `strategy.md`, `monetization_plan.md`, `swot_analysis.md`

---

### Product Department

#### 3. Product Manager (PM)
- **ID**: `agent_product_manager`
- **Model Tier**: Tier 2
- **Mission**: Define product vision, user stories, MVP scope, acceptance criteria, and feature roadmaps.
- **Tools**: `workspace.write`, `document.generator`, `jira.sync`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Business Strategy, Requirements
- **Outputs**: `PRD.md`, `user_stories.json`, `roadmap.md`

#### 4. Business Analyst (BA)
- **ID**: `agent_business_analyst`
- **Model Tier**: Tier 1 / 2
- **Mission**: Analyze workflows, domain business logic, data models, edge cases, and functional specifications.
- **Tools**: `browser.fetch`, `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: High-level problem statement
- **Outputs**: `functional_spec.md`, `domain_models.md`, `edge_cases.md`

#### 5. UX Researcher
- **ID**: `agent_ux_researcher`
- **Model Tier**: Tier 1 / 2
- **Mission**: Research user personas, pain points, customer journeys, and information architecture.
- **Tools**: `browser.fetch`, `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: User demographic, Target industry
- **Outputs**: `user_personas.md`, `customer_journey.md`, `ux_flows.json`

#### 6. Product Analyst
- **ID**: `agent_product_analyst`
- **Model Tier**: Tier 1
- **Mission**: Define product metrics (North Star, Pirate Metrics / AARRR), telemetry requirements, and feature KPIs.
- **Tools**: `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: PRD, User stories
- **Outputs**: `telemetry_specs.json`, `kpi_dashboard_plan.md`

---

### Design Department

#### 7. UI/UX Designer
- **ID**: `agent_ui_ux_designer`
- **Model Tier**: Tier 2
- **Mission**: Create component wireframes, layout structures, user interaction states, and screen specifications.
- **Tools**: `workspace.write`, `design_token.generator`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: UX Flows, Wireframe requirements
- **Outputs**: `screens_spec.json`, `component_layouts.md`, `wireframes/`

#### 8. Design System Designer
- **ID**: `agent_design_system_designer`
- **Model Tier**: Tier 2
- **Mission**: Enforce typography, 4px grid spacing, semantic color palettes (WCAG AA compliant), and reusable UI tokens.
- **Tools**: `workspace.write`, `theme.generator`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Brand guidelines, UI requirements
- **Outputs**: `design_tokens.json`, `tailwind_theme.config.js`

#### 9. Brand Designer
- **ID**: `agent_brand_designer`
- **Model Tier**: Tier 1 / 2
- **Mission**: Establish company branding, tone of voice, visual identity principles, and logo / asset guidelines.
- **Tools**: `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Business Strategy, Target audience
- **Outputs**: `brand_guidelines.md`, `asset_manifest.json`

---

### Engineering Department

#### 10. Backend Engineer
- **ID**: `agent_backend_engineer`
- **Model Tier**: Tier 2 (9Router / Qwen Coder)
- **Mission**: Design & implement REST/GraphQL APIs, database schemas, repository patterns, middleware, and business logic.
- **Tools**: `workspace.write`, `git.commit`, `terminal.sandbox`, `database.dev`
- **Permissions**: `workspace.read`, `workspace.write`, `git.commit`, `terminal.sandbox`, `database.dev`
- **Inputs**: Functional spec, API contracts, DB schema
- **Outputs**: API Source code, Migration scripts, OpenAPI spec (`swagger.json`)

#### 11. Frontend Engineer
- **ID**: `agent_frontend_engineer`
- **Model Tier**: Tier 2 (9Router / Qwen Coder)
- **Mission**: Build responsive web applications in Next.js / React, integrate API client, manage client/server state, and enforce accessibility.
- **Tools**: `workspace.write`, `git.commit`, `terminal.sandbox`
- **Permissions**: `workspace.read`, `workspace.write`, `git.commit`, `terminal.sandbox`
- **Inputs**: UI Screen specs, API contracts, Design tokens
- **Outputs**: React/Next.js components, Pages, State stores

#### 12. Mobile Engineer
- **ID**: `agent_mobile_engineer`
- **Model Tier**: Tier 2
- **Mission**: Build cross-platform mobile apps (Flutter / React Native) with offline-first caching, navigation, and native bridge safety.
- **Tools**: `workspace.write`, `git.commit`, `terminal.sandbox`
- **Permissions**: `workspace.read`, `workspace.write`, `git.commit`, `terminal.sandbox`
- **Inputs**: Mobile UI specs, API endpoints
- **Outputs**: Mobile app codebase, Widget tests

#### 13. QA Engineer
- **ID**: `agent_qa_engineer`
- **Model Tier**: Tier 1 / 2
- **Mission**: Read requirements, write and execute automated test suites (unit, integration, E2E), verify acceptance criteria, and report bugs.
- **Tools**: `workspace.read`, `terminal.sandbox`, `test.runner`
- **Permissions**: `workspace.read`, `terminal.sandbox`
- **Inputs**: PRD Acceptance criteria, Source code, API endpoints
- **Outputs**: `test_report.json`, Bug tickets, Test suite scripts

#### 14. Security Engineer
- **ID**: `agent_security_engineer`
- **Model Tier**: Tier 2 / 3
- **Mission**: Audit code and architecture against OWASP Top 10 / API Top 10, check for secret leaks, enforce input validation, and verify RBAC.
- **Tools**: `workspace.read`, `security.scanner`
- **Permissions**: `workspace.read`
- **Inputs**: Full codebase, API schemas, Configs
- **Outputs**: `security_audit.md`, Vulnerability remediation plan

#### 15. Penetration Tester
- **ID**: `agent_penetration_tester`
- **Model Tier**: Tier 3
- **Mission**: Execute black-box exploitation simulations on sandboxed target endpoints (SQLi, IDOR/BOLA, SSRF, XSS).
- **Tools**: `terminal.sandbox`, `exploit.simulator`
- **Permissions**: `terminal.sandbox` (Restricted to sandbox network)
- **Inputs**: Staging URL, Target endpoints
- **Outputs**: `pentest_report.md`, Exploitation PoCs

#### 16. DevOps / SRE
- **ID**: `agent_devops`
- **Model Tier**: Tier 2
- **Mission**: Write multi-stage Dockerfiles, Docker Compose, CI/CD pipelines, reverse proxy configs (Nginx/Traefik), and monitoring setups.
- **Tools**: `workspace.write`, `terminal.sandbox`, `docker.build`, `deployment.staging`
- **Permissions**: `workspace.read`, `workspace.write`, `terminal.sandbox`, `deployment.staging`, `deployment.prod`
- **Inputs**: App architecture, Environment variables
- **Outputs**: `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`, `nginx.conf`

#### 17. Performance Engineer
- **ID**: `agent_performance_engineer`
- **Model Tier**: Tier 2
- **Mission**: Benchmark API response times (p95/p99), analyze database query execution plans (`EXPLAIN ANALYZE`), find memory leaks and CPU bottlenecks.
- **Tools**: `terminal.sandbox`, `benchmark.runner`
- **Permissions**: `workspace.read`, `terminal.sandbox`
- **Inputs**: Backend codebase, Database schemas
- **Outputs**: `benchmark_report.md`, SQL indexing recommendations

#### 18. AI Engineer
- **ID**: `agent_ai_engineer`
- **Model Tier**: Tier 2 / 3
- **Mission**: Implement LLM integrations, RAG pipelines, vector embeddings, prompt engineering templates, and model evaluation metrics.
- **Tools**: `workspace.write`, `terminal.sandbox`
- **Permissions**: `workspace.read`, `workspace.write`, `terminal.sandbox`
- **Inputs**: Feature requirement requiring AI
- **Outputs**: AI Prompts, Vector index scripts, Pipeline code

---

### Growth & Marketing Department

#### 19. Digital Marketer
- **ID**: `agent_digital_marketer`
- **Model Tier**: Tier 1 / 2
- **Mission**: Formulate go-to-market strategies, campaign roadmaps, channel distribution plans, and conversion funnels.
- **Tools**: `browser.fetch`, `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Product description, Target audience
- **Outputs**: `gtm_strategy.md`, `campaign_plan.md`

#### 20. SEO Specialist
- **ID**: `agent_seo_specialist`
- **Model Tier**: Tier 1 / 2
- **Mission**: Keyword research, meta tag optimization, content structure recommendations, and technical SEO checklists.
- **Tools**: `browser.fetch`, `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Product domain, Target keywords
- **Outputs**: `seo_audit.md`, `keyword_matrix.json`, `sitemap_spec.xml`

#### 21. Content Creator
- **ID**: `agent_content_creator`
- **Model Tier**: Tier 1 / 2
- **Mission**: Write high-converting landing page copy, blog articles, email sequences, and product documentation.
- **Tools**: `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Tone of voice, Feature list
- **Outputs**: `landing_page_copy.md`, `email_sequence.md`, `blog_posts/`

#### 22. Growth Analyst
- **ID**: `agent_growth_analyst`
- **Model Tier**: Tier 1
- **Mission**: Design A/B testing experiments, viral loops, referral mechanisms, and conversion optimization strategies.
- **Tools**: `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Marketing plan, Product features
- **Outputs**: `growth_experiments.md`, `ab_test_matrix.json`

---

### Sales Department

#### 23. Sales Representative
- **ID**: `agent_sales_representative`
- **Model Tier**: Tier 1 / 2
- **Mission**: Draft cold outreach messages, sales pitch decks, handle sales objections, and close enterprise inquiries.
- **Tools**: `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Value proposition, Target lead profile
- **Outputs**: `sales_pitch.md`, `cold_outreach_templates.md`

#### 24. Sales Researcher
- **ID**: `agent_sales_researcher`
- **Model Tier**: Tier 1
- **Mission**: Identify target industry verticals, scrape public B2B lead signals, and qualify prospects.
- **Tools**: `browser.fetch`, `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Target ICP (Ideal Customer Profile)
- **Outputs**: `prospect_list.json`, `market_lead_report.md`

#### 25. Account Manager
- **ID**: `agent_account_manager`
- **Model Tier**: Tier 1
- **Mission**: Client onboarding workflows, upsell playbooks, client retention strategies, and QBR (Quarterly Business Review) outlines.
- **Tools**: `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Customer profile, Plan tier
- **Outputs**: `onboarding_playbook.md`, `retention_strategy.md`

---

### Customer Department

#### 26. Customer Service & Support
- **ID**: `agent_customer_service`
- **Model Tier**: Tier 1 (Ollama fast tier)
- **Mission**: Classify user inquiries, respond with accurate knowledge base answers, escalate bugs, and maintain FAQ docs.
- **Tools**: `workspace.read`, `workspace.write`
- **Permissions**: `workspace.read`, `workspace.write`
- **Inputs**: Support ticket payload, Project knowledge base
- **Outputs**: Ticket response, `faq.md` update

#### 27. Customer Success
- **ID**: `agent_customer_success`
- **Model Tier**: Tier 1 / 2
- **Mission**: Synthesize user feedback, calculate CSAT/NPS signals, and convert user friction into actionable improvement tickets for the Product Manager (closing the continuous loop).
- **Tools**: `workspace.write`, `task.manager`
- **Permissions**: `workspace.read`, `workspace.write`, `tasks.create`
- **Inputs**: Customer support logs, Feedback streams
- **Outputs**: `customer_health_report.md`, New Improvement Tasks

---

### Data & Operations Department

#### 28. Data Engineer
- **ID**: `agent_data_engineer`
- **Model Tier**: Tier 2
- **Mission**: Design ETL/ELT data pipelines, data lake/warehouse schemas, Kafka stream processors, and database indexes.
- **Tools**: `workspace.write`, `terminal.sandbox`, `database.dev`
- **Permissions**: `workspace.read`, `workspace.write`, `terminal.sandbox`, `database.dev`
- **Inputs**: Raw data requirements, Reporting specs
- **Outputs**: `pipeline_schema.sql`, `kafka_consumer.ts`

#### 29. Data Analyst
- **ID**: `agent_data_analyst`
- **Model Tier**: Tier 1 / 2
- **Mission**: Write analytical SQL queries, compute business metrics (MRR, Churn, LTV), and generate business intelligence summaries.
- **Tools**: `database.dev`, `workspace.write`
- **Permissions**: `workspace.read`, `database.dev`
- **Inputs**: Business queries, DB Schema
- **Outputs**: `analytics_report.md`, `dashboard_queries.sql`

#### 30. Operations Manager
- **ID**: `agent_operations_manager`
- **Model Tier**: Tier 1 / 2
- **Mission**: Monitor agent workloads, balance task distribution, identify agent bottlenecks, and ensure company budget limits are respected.
- **Tools**: `agent.registry`, `budget.tracker`
- **Permissions**: `all.read`, `agents.manage`
- **Inputs**: Execution metrics, Token costs
- **Outputs**: `operations_health.md`, Resource reallocation requests

---

## 7. Handoff & Review Protocols

### Standard Handoff Schema
When an agent finishes a task and passes it to another (e.g. Backend → QA):

```json
{
  "handoff_id": "HO-2026-0091",
  "from_agent": "agent_backend_engineer",
  "to_agent": "agent_qa_engineer",
  "task_id": "TASK-102",
  "workflow_id": "WF-LAUNDRY-01",
  "status": "READY_FOR_REVIEW",
  "summary": "Authentication REST API implemented with JWT & Refresh token rotation",
  "artifacts": [
    {
      "path": "src/api/auth.controller.ts",
      "type": "code",
      "version": "1.0.0"
    },
    {
      "path": "src/services/auth.service.ts",
      "type": "code",
      "version": "1.0.0"
    },
    {
      "path": "docs/api/swagger.json",
      "type": "documentation",
      "version": "1.0.0"
    }
  ],
  "known_issues": [],
  "next_recommended_action": "Execute integration test suite against endpoints POST /api/v1/auth/login and POST /api/v1/auth/refresh"
}
```

### Review Result Protocol
Reviewer evaluates the artifacts:
- **`APPROVED`**: Task marked `COMPLETED`. Dependent tasks in DAG unblocked.
- **`APPROVED_WITH_CHANGES`**: Minor fixes requested; auto-assigned back with feedback.
- **`REJECTED`**: Task returns to `RUNNING` for original agent with structured bug report. Max 3 retries before escalating to human approval.
