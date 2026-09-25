.PHONY: help install setup env up down restart ps db-migrate db-seed db-reset dev dev-server dev-web build test lint clean docker-build

# Default target
help:
	@echo "AI Virtual Office Orchestrator — Commands"
	@echo ""
	@echo "Setup & Install:"
	@echo "  make install        Install npm dependencies"
	@echo "  make env            Copy .env.example to .env if not exists"
	@echo "  make setup          Full initial setup (env + up + db-migrate + db-seed)"
	@echo ""
	@echo "Infrastructure (Docker):"
	@echo "  make up             Start Postgres, Kafka, Zookeeper, and Kafka UI"
	@echo "  make down           Stop all infrastructure containers"
	@echo "  make restart        Restart all infrastructure containers"
	@echo "  make ps             Show running infrastructure containers"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate     Run Prisma database migrations"
	@echo "  make db-seed        Seed 30 agent definitions into PostgreSQL"
	@echo "  make db-reset       Reset database and run all migrations"
	@echo "  make db-studio      Open Prisma Studio GUI"
	@echo ""
	@echo "Development:"
	@echo "  make dev            Run Turbo dev for both backend & frontend"
	@echo "  make dev-server     Run Fastify backend only (port 4000)"
	@echo "  make dev-web        Run Next.js frontend only (port 3000)"
	@echo ""
	@echo "Quality & Testing:"
	@echo "  make test           Run unit tests in server (Vitest)"
	@echo "  make build          Build all workspaces"
	@echo "  make typecheck      Run TypeScript type checking"
	@echo "  make lint           Run linting"
	@echo "  make clean          Clean build artifacts"
	@echo ""
	@echo "Production Docker:"
	@echo "  make docker-build   Build production docker-compose containers"
	@echo "  make docker-up      Start production docker-compose stack"

install:
	npm install

env:
	@if [ ! -f apps/server/.env ]; then \
		cp apps/server/.env.example apps/server/.env; \
		echo "Created apps/server/.env from .env.example"; \
	else \
		echo "apps/server/.env already exists"; \
	fi

up:
	docker compose up -d postgres zookeeper kafka kafka-ui

down:
	docker compose down

restart:
	docker compose restart

ps:
	docker compose ps

db-migrate:
	npm run db:migrate --workspace=@virtual-office/server

db-seed:
	node --import tsx apps/server/src/db/seed.ts

db-reset:
	npm run db:reset --workspace=@virtual-office/server

db-studio:
	npm run db:studio --workspace=@virtual-office/server

setup: env install up
	@echo "Waiting 5 seconds for PostgreSQL to initialize..."
	@sleep 5
	$(MAKE) db-migrate
	$(MAKE) db-seed
	@echo "Setup completed successfully! Run 'make dev' to start."

dev:
	npm run dev

dev-server:
	npm run dev --workspace=@virtual-office/server

dev-web:
	npm run dev --workspace=@virtual-office/web

build:
	npm run build

typecheck:
	npm run typecheck

test:
	npm run test --workspace=@virtual-office/server

lint:
	npm run lint

clean:
	npm run clean

docker-build:
	docker compose -f docker-compose.prod.yml build

docker-up:
	docker compose -f docker-compose.prod.yml up -d
