# PRD: OmniRetail AI — Enterprise POS & Merchant Intelligence Platform

**Version:** 1.0.0  
**Date:** 2026-09-26  
**Owner:** Rendy (CEO / Chief Orchestrator)  
**Status:** Approved for Development

---

## 1. Executive Summary

OmniRetail AI adalah platform SaaS B2B Omni-Channel yang dirancang untuk merchant retail di Indonesia. Platform ini menggabungkan sistem POS mobile & tablet offline-first, merchant web portal berbasis AI, integrasi pembayaran multi-gateway (QRIS, Kartu Kredit, E-Wallet), serta engine kecerdasan bisnis untuk prediksi stok dan analitik penjualan otomatis.

**Target Market:**  
- Primary: Retail chain menengah–besar (5–500 cabang), minimarket, toko elektronik, fashion retail.  
- Secondary: F&B (restoran, kafe), apotek, klinik kecantikan.

**Revenue Model:**  
- SaaS subscription tiered: Starter (Rp 299k/bln), Growth (Rp 799k/bln), Enterprise (custom).  
- Transaction fee: 0.1–0.3% per transaksi digital.  
- Marketplace add-on: integrasi Tokopedia/Shopee seller, loyalty engine, analytics premium.

---

## 2. Product Architecture & Multi-Platform Scope

### 2.1 Platform Components

| Platform | Stack | Deskripsi |
| :--- | :--- | :--- |
| **Merchant Web Portal** | Next.js 14 App Router, TypeScript, Tailwind CSS | Dashboard manajemen inventori, laporan penjualan, pengaturan cabang |
| **POS Mobile App** | Flutter (Dart) — iOS & Android | Kasir offline-first, barcode scanner, cetak struk thermal bluetooth |
| **POS Tablet App** | Flutter + React Native (opsional) | Layar customer-facing, input order, split bill, loyalty point |
| **Backend REST API** | Fastify, TypeScript, Prisma ORM, PostgreSQL | Auth JWT, multi-tenant, event sourcing, real-time WebSocket |
| **AI Intelligence Engine** | Python FastAPI + Redis | Demand forecasting, stock recommendation, churn prediction |
| **DevOps & Infrastructure** | Docker, docker-compose, Nginx, GitHub Actions CI/CD | Multi-region deployment, auto-scaling, Prometheus + Grafana monitoring |

### 2.2 High-Level Architecture

```
[Flutter POS App] ←→ [Fastify REST API] ←→ [PostgreSQL + Redis]
[Next.js Portal]  ←→        ↓                      ↓
                     [AI Python Engine]  ←→  [Event Bus / Kafka]
                              ↓
                     [Analytics Warehouse]
```

---

## 3. Database Schema Specification

### 3.1 Core Tables

```sql
-- Multi-tenant Organizations
organizations (id, name, slug, plan_tier, created_at)

-- Branches & Outlets
branches (id, org_id, name, address, timezone, is_active)

-- Users & RBAC
users (id, org_id, email, password_hash, role, mfa_secret, created_at)
roles (id, name, permissions JSONB)

-- Products & Inventory
products (id, org_id, sku, name, category_id, price, cost, image_url, is_active)
categories (id, org_id, name, parent_id)
inventory (id, product_id, branch_id, qty_on_hand, qty_reserved, reorder_level, last_updated)
inventory_movements (id, product_id, branch_id, type, qty_delta, reference_id, created_at)

-- Transactions & Orders
orders (id, branch_id, cashier_id, customer_id, status, subtotal, discount, tax, total, payment_method, created_at)
order_items (id, order_id, product_id, qty, unit_price, discount_pct, subtotal)
payments (id, order_id, gateway, gateway_tx_id, amount, status, paid_at)

-- Customers & Loyalty
customers (id, org_id, name, phone, email, tier, total_points, total_spend, created_at)
loyalty_transactions (id, customer_id, order_id, points_delta, balance_after, type, created_at)

-- AI & Analytics
demand_forecasts (id, product_id, branch_id, forecast_date, predicted_qty, confidence_score, model_version)
sales_aggregations (id, branch_id, date, total_revenue, total_orders, avg_basket_size, top_product_id)
```

### 3.2 Key Indexes

```sql
CREATE INDEX idx_orders_branch_created ON orders(branch_id, created_at DESC);
CREATE INDEX idx_inventory_product_branch ON inventory(product_id, branch_id);
CREATE INDEX idx_customers_org_phone ON customers(org_id, phone);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_demand_forecasts_product_date ON demand_forecasts(product_id, forecast_date DESC);
```

---

## 4. REST API Endpoints Specification

### 4.1 Authentication

```
POST   /api/v1/auth/login           → { access_token, refresh_token, user }
POST   /api/v1/auth/refresh         → { access_token }
POST   /api/v1/auth/logout
POST   /api/v1/auth/mfa/setup
POST   /api/v1/auth/mfa/verify
```

### 4.2 Products & Inventory

```
GET    /api/v1/products             → Paginated product list with inventory levels
POST   /api/v1/products             → Create product with initial stock
PUT    /api/v1/products/:id         → Update product details
DELETE /api/v1/products/:id         → Soft delete product
GET    /api/v1/inventory            → Current stock by branch
POST   /api/v1/inventory/adjust     → Manual stock adjustment
POST   /api/v1/inventory/transfer   → Inter-branch stock transfer
```

### 4.3 Orders & Payments

```
POST   /api/v1/orders               → Create new transaction (POS checkout)
GET    /api/v1/orders/:id           → Get order details with items
POST   /api/v1/orders/:id/payment   → Process payment (QRIS/Kartu/Ewallet)
POST   /api/v1/orders/:id/refund    → Initiate partial/full refund
GET    /api/v1/orders/reports/daily → Daily sales report by branch
```

### 4.4 AI Intelligence

```
GET    /api/v1/ai/forecast/:product_id       → Demand forecast next 30 days
GET    /api/v1/ai/restock-recommendations    → Low stock + reorder suggestions
GET    /api/v1/ai/customer-segments          → RFM segmentation results
POST   /api/v1/ai/chat                       → Merchant AI assistant chat
```

### 4.5 Customer & Loyalty

```
GET    /api/v1/customers                     → Customer list with tier
POST   /api/v1/customers                     → Register new customer
GET    /api/v1/customers/:id/loyalty         → Loyalty point history
POST   /api/v1/customers/:id/loyalty/redeem  → Redeem points on order
```

---

## 5. UI/UX & Design Specification

### 5.1 Design Tokens

```
Colors:
  Primary:    #6366F1 (Indigo-500)
  Secondary:  #0EA5E9 (Sky-500)
  Success:    #22C55E (Green-500)
  Warning:    #F59E0B (Amber-500)
  Danger:     #EF4444 (Red-500)
  Background: #0F172A (Slate-900)
  Surface:    #1E293B (Slate-800)
  Border:     #334155 (Slate-700)
  Text:       #F8FAFC (Slate-50)
  Muted:      #94A3B8 (Slate-400)

Typography:
  Font:       Inter (UI), JetBrains Mono (code/numeric)
  Scale:      12px / 14px / 16px / 18px / 24px / 32px / 48px
  Weight:     400 (body), 600 (semibold), 700 (bold)

Spacing Grid: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64px)
Border Radius: 4px (sm), 8px (md), 12px (lg), 16px (xl), 9999px (full)
```

### 5.2 Key Screens

**Merchant Dashboard (Web):**
- Today's Revenue card, Orders count, Avg Basket Size, Inventory Alerts
- Real-time sales trend chart (last 7 days)
- Top 5 Products table
- Low stock warning with reorder CTA

**POS Cashier Screen (Flutter):**
- Product grid dengan barcode search
- Cart sidebar dengan quantity adjustments
- Payment method selector (QRIS QR code, kartu NFC tap, e-wallet deeplink)
- Customer lookup & loyalty point redemption
- Receipt preview + Bluetooth thermal print

---

## 6. Security Architecture (OWASP Top 10 & PCI-DSS)

### 6.1 Authentication & Authorization
- JWT RS256 asymmetric key rotation setiap 24 jam
- Refresh token rotation dengan revocation list (Redis)
- MFA TOTP wajib untuk role Owner & Manager
- RBAC fine-grained: Owner > Manager > Cashier > Viewer
- Session invalidation on suspicious geolocation change

### 6.2 Data Security
- Semua data sensitif (kartu, PAN) tidak disimpan di sistem — tokenisasi via payment gateway
- Database encryption at rest (AES-256)
- TLS 1.3 enforced untuk semua koneksi API
- Input sanitization & parameterized queries (Prisma) mencegah SQL Injection
- Rate limiting: 100 req/menit per IP, 1000 req/menit per authenticated user
- XSS protection via DOMPurify + CSP headers

### 6.3 Infrastructure Security
- Firewall: hanya port 80/443/22 terbuka ke publik
- SSH key-only authentication, fail2ban untuk brute-force protection
- Secret management via environment variables (tidak pernah commit ke Git)
- Container image vulnerability scanning (Trivy) di CI/CD pipeline
- Automated dependency audit (npm audit, snyk)

---

## 7. QA & Testing Strategy

### 7.1 Test Coverage Requirements

| Layer | Framework | Minimum Coverage |
| :--- | :--- | :--- |
| Unit Tests | Vitest | 85% |
| Integration Tests | Supertest + Vitest | 75% |
| E2E Tests | Playwright | Critical flows only |
| Mobile Tests | Flutter Test / Detox | Core POS flows |
| Performance | K6 Load Testing | P99 < 200ms |
| Security | OWASP ZAP | OWASP Top 10 |

### 7.2 Critical Test Scenarios
- Checkout flow: scan → cart → payment → receipt (offline & online)
- Inventory deduction concurrent dengan multi-kasir
- Loyalty point accrual & redemption
- JWT refresh token rotation
- Offline mode sync ketika koneksi kembali tersedia

---

## 8. DevOps & Infrastructure Specification

### 8.1 Docker Services

```yaml
services:
  api:
    image: omniretail-api:latest
    ports: ["4000:4000"]
    environment: [DATABASE_URL, REDIS_URL, JWT_SECRET, STRIPE_SECRET]
    depends_on: [postgres, redis, kafka]

  web:
    image: omniretail-web:latest
    ports: ["3000:3000"]

  ai-engine:
    image: omniretail-ai:latest
    ports: ["8000:8000"]

  postgres:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports: ["9092:9092"]

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [./nginx.conf:/etc/nginx/nginx.conf, ./certs:/etc/ssl/certs]

  prometheus:
    image: prom/prometheus:latest

  grafana:
    image: grafana/grafana:latest
    ports: ["3001:3000"]
```

### 8.2 CI/CD Pipeline (GitHub Actions)

```
on: [push to main, pull_request]

stages:
  1. Lint & Type Check  (ESLint, tsc --noEmit)
  2. Unit + Integration Tests  (vitest run --coverage)
  3. Security Audit  (npm audit, trivy image scan)
  4. Docker Build & Push  (GHCR registry)
  5. Deploy to Staging  (docker compose up --pull always)
  6. Playwright E2E on Staging
  7. Deploy to Production  (manual approval gate)
```

---

## 9. Go-To-Market & Sales Strategy

### 9.1 Target Segments & ICP

**Tier 1 (Enterprise):** Retail chain 20+ cabang — direct sales, dedicated onboarding, custom SLA  
**Tier 2 (Growth):** 5–20 cabang — inside sales, freemium trial 30 hari, self-serve onboarding  
**Tier 3 (Starter):** 1–4 cabang — product-led growth, referral program, marketplace listing  

### 9.2 Acquisition Channels
1. Google Ads — kata kunci "software kasir", "aplikasi POS toko", "sistem retail Indonesia"
2. Content Marketing — blog SEO: "Cara Manajemen Stok Retail 2026", "QRIS POS Integration Guide"
3. Direct Sales B2B — cold outreach retail chain, APRINDO (Asosiasi Pengusaha Retail Indonesia)
4. Partnership — integrasi Tokopedia/Shopee seller center, bank BNI/Mandiri merchant program
5. Referral Program — diskon 1 bulan per referral merchant yang berhasil subscribe

### 9.3 Pricing Matrix

| Feature | Starter (Rp 299k/bln) | Growth (Rp 799k/bln) | Enterprise (Custom) |
| :--- | :---: | :---: | :---: |
| Kasir / User | 2 | 10 | Unlimited |
| Cabang | 1 | 5 | Unlimited |
| Produk | 500 | 5.000 | Unlimited |
| AI Forecast | — | ✓ | ✓ |
| Custom Domain | — | ✓ | ✓ |
| Dedicated Support | — | — | ✓ |
| SLA Uptime | 99.5% | 99.9% | 99.95% |

---

## 10. Customer Support & Success Matrix

### 10.1 Support Tiers

| Tier | Response SLA | Channel |
| :--- | :--- | :--- |
| Critical (P0) | 1 jam | Hotline + WhatsApp |
| High (P1) | 4 jam | WhatsApp + Email |
| Medium (P2) | 24 jam | Email + Ticket |
| Low (P3) | 72 jam | Self-service portal |

### 10.2 Onboarding Flow
1. **Day 0:** Aktivasi akun & konfigurasi profil toko
2. **Day 1–3:** Import produk & inventori awal (CSV/Excel upload)
3. **Day 4–7:** Pelatihan kasir via video tutorial + live demo
4. **Day 8–14:** Go-live kasir dengan pendampingan CS
5. **Day 30:** Health check call & review metrik awal

---

## 11. Analytics & Data Intelligence

### 11.1 Key Metrics (North Star)

| Metric | Target 6 Bulan | Definition |
| :--- | :--- | :--- |
| Monthly Recurring Revenue (MRR) | Rp 500 juta | Total recurring subscription revenue |
| Active Merchants | 500 | Merchants dengan min. 1 transaksi/bulan |
| Gross Transaction Volume (GTV) | Rp 20 miliar/bulan | Total nilai transaksi di platform |
| Net Revenue Retention (NRR) | > 110% | Expansion revenue dari existing merchants |
| POS Uptime | > 99.9% | Ketersediaan sistem kasir online & offline |

### 11.2 Analytics Stack
- **Event Tracking:** Kafka event bus → ClickHouse OLAP warehouse
- **Dashboards:** Grafana (operational) + Metabase (business intelligence)
- **AI Models:** Prophet (demand forecasting) + LightGBM (churn prediction)
- **Real-time:** WebSocket push ke merchant dashboard

---

## 12. Acceptance Criteria (Gherkin Format)

```gherkin
Feature: POS Checkout & Payment

  Scenario: Cashier completes offline transaction
    Given the POS app is in offline mode
    And the cart has 3 items totaling Rp 150,000
    When the cashier selects Cash payment
    Then the order is saved locally with status PENDING_SYNC
    And a receipt is printed via Bluetooth thermal printer
    And when internet is restored, the order syncs to the server within 30 seconds

  Scenario: Customer redeems loyalty points
    Given a customer has 5,000 loyalty points (equivalent to Rp 50,000)
    When the cashier looks up the customer by phone number
    And selects "Redeem 5,000 points"
    Then the cart total is reduced by Rp 50,000
    And the loyalty balance shows 0 points after checkout

  Scenario: AI restocking recommendation
    Given a product has 5 units remaining
    And the AI model predicts 45 units will be sold in the next 7 days
    When the merchant views the AI Restock Recommendations page
    Then the product appears with "Order 40+ units" recommendation
    And the confidence score is displayed as a percentage
```

---

## 13. Timeline & Milestones

| Phase | Durasi | Deliverable |
| :--- | :--- | :--- |
| Phase 1 — Foundation | 2 minggu | DB schema, Auth API, product & inventory CRUD |
| Phase 2 — POS Core | 2 minggu | Flutter POS app, checkout flow, payment gateway |
| Phase 3 — Web Portal | 2 minggu | Next.js dashboard, inventory management, reports |
| Phase 4 — AI Engine | 1 minggu | Demand forecast API, restock recommendation |
| Phase 5 — Security & QA | 1 minggu | Pentest, OWASP audit, E2E test coverage 85% |
| Phase 6 — DevOps & Launch | 1 minggu | CI/CD pipeline, Docker production deployment |
| Phase 7 — GTM | Ongoing | Sales outreach, SEO content, customer onboarding |
