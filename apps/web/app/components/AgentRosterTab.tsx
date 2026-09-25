'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface AgentDefinition {
  id: string;
  role: string;
  name: string;
  persona: string;
  modelTier: string;
  tools: string[];
  permissions: string[];
  department: { name: string };
}

interface AgentInstance {
  id: string;
  status: string;
  currentTaskId: string | null;
  definition: AgentDefinition;
}

interface Props {
  projectId: string;
  onInspectAgent?: (agentId: string) => void;
}

const DEPARTMENT_ORDER = [
  'executive',
  'product',
  'design',
  'engineering',
  'growth',
  'sales',
  'customer',
  'data',
  'operations',
];

export function AgentRosterTab({ projectId, onInspectAgent }: Props) {
  const [definitions, setDefinitions] = useState<AgentDefinition[]>([]);
  const [instances, setInstances] = useState<AgentInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<AgentDefinition[]>('/api/agents/definitions'),
      apiFetch<AgentInstance[]>(`/api/agents?projectId=${projectId}`),
    ])
      .then(([defs, insts]) => {
        setDefinitions(defs);
        setInstances(insts);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const departments = Array.from(new Set(definitions.map((d) => d.department.name))).sort(
    (a, b) => DEPARTMENT_ORDER.indexOf(a) - DEPARTMENT_ORDER.indexOf(b)
  );

  const instanceByRole = new Map<string, AgentInstance>();
  instances.forEach((i) => instanceByRole.set(i.definition.role, i));

  const filtered = definitions.filter((def) => {
    const matchesDept = selectedDept === 'all' || def.department.name === selectedDept;
    const q = search.toLowerCase();
    const matchesSearch =
      def.name.toLowerCase().includes(q) ||
      def.role.toLowerCase().includes(q) ||
      def.department.name.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const spawnedCount = instances.length;
  const totalCount = definitions.length;

  async function handleSpawn(role: string) {
    await apiFetch(`/api/projects/${projectId}/agents`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    const insts = await apiFetch<AgentInstance[]>(`/api/agents?projectId=${projectId}`);
    setInstances(insts);
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading organization roster...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Active Roles</p>
          <p className="text-xl font-bold text-white">{spawnedCount}/{totalCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Departments</p>
          <p className="text-xl font-bold text-white">{departments.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Working</p>
          <p className="text-xl font-bold text-indigo-400">
            {instances.filter((i) => i.status === 'working').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search agent or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((def) => {
          const instance = instanceByRole.get(def.role);
          const isSpawned = Boolean(instance);
          const statusColor = {
            idle: 'bg-slate-700 text-slate-300',
            assigned: 'bg-blue-900/60 text-blue-300',
            thinking: 'bg-yellow-900/60 text-yellow-300',
            working: 'bg-indigo-900/60 text-indigo-300 animate-pulse',
            reviewing: 'bg-amber-900/60 text-amber-300',
            completed: 'bg-emerald-900/60 text-emerald-300',
            error: 'bg-red-900/60 text-red-300',
            escalated: 'bg-rose-900/60 text-rose-300',
          }[instance?.status ?? 'idle'] ?? 'bg-slate-700 text-slate-300';

          return (
            <div
              key={def.role}
              className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/40 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-white">{def.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{def.role}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {def.department.name}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-3 flex-1">{def.persona}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {def.tools.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {t}
                  </span>
                ))}
                {def.tools.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    +{def.tools.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>
                  {isSpawned ? instance!.status : 'unspawned'}
                </span>

                <div className="flex items-center gap-2">
                  {isSpawned && onInspectAgent && (
                    <button
                      onClick={() => onInspectAgent(instance!.id)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                    >
                      Inspect
                    </button>
                  )}
                  {!isSpawned && (
                    <button
                      onClick={() => handleSpawn(def.role)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition-colors"
                    >
                      + Spawn
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
