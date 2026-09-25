'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface CreateProjectForm {
  name: string;
  goal: string;
  autonomyLevel: number;
}

interface Props {
  onCreated: (projectId: string) => void;
}

export function CreateProjectForm({ onCreated }: Props) {
  const [form, setForm] = useState<CreateProjectForm>({
    name: '',
    goal: '',
    autonomyLevel: 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.goal.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const project = await apiFetch<{ id: string }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onCreated(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Project Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Laundry SaaS POS"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Business Goal
        </label>
        <textarea
          rows={3}
          value={form.goal}
          onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
          placeholder="e.g. Build a SaaS POS system for laundry businesses with order tracking, inventory, and reporting."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Autonomy Level
        </label>
        <select
          value={form.autonomyLevel}
          onChange={(e) => setForm((f) => ({ ...f, autonomyLevel: Number(e.target.value) }))}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={1}>Level 1 — Assisted (manual start)</option>
          <option value={2}>Level 2 — Supervised (auto, human approval for deploys)</option>
          <option value={3}>Level 3 — Autonomous (within policy)</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
