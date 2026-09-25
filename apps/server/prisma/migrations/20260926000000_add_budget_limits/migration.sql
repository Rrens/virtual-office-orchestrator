-- Add per-task and per-agent budget limit columns to projects
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "task_budget_tokens" INTEGER;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "agent_budget_tokens" INTEGER;
