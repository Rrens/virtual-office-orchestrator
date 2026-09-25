'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface AgentRun {
  id: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
  task: { title: string; agentRole: string };
  toolCalls: Array<{ toolName: string; status: string; durationMs: number }>;
}

interface AgentDetail {
  id: string;
  status: string;
  avatarUrl: string | null;
  definition: {
    name: string;
    role: string;
    persona: string;
    modelTier: string;
    tools: string[];
    permissions: string[];
    department: { name: string };
  };
  assignedTasks: Array<{ id: string; title: string; status: string }>;
  agentRuns: AgentRun[];
}

interface Props {
  agentId: string | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-slate-700 text-slate-300',
  assigned: 'bg-blue-900 text-blue-300',
  thinking: 'bg-yellow-900 text-yellow-300',
  working: 'bg-indigo-900 text-indigo-300 animate-pulse',
  reviewing: 'bg-amber-900 text-amber-300',
  completed: 'bg-emerald-900 text-emerald-300',
  error: 'bg-red-900 text-red-300',
  escalated: 'bg-rose-900 text-rose-300',
};

export function AgentInspectorModal({ agentId, onClose }: Props) {
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);
    apiFetch<AgentDetail>(`/api/agents/instances/${agentId}`)
      .then(setAgent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  if (!agentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md bg-slate-900 border-l border-slate-700 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="font-bold text-white text-base">Agent Inspector</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 text-sm animate-pulse">Loading agent data...</p>
          </div>
        )}

        {agent && !loading && (
          <div className="flex-1 p-4 space-y-5">
            {/* Identity */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{agent.definition.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{agent.definition.role}</p>
                <p className="text-xs text-slate-500">{agent.definition.department.name}</p>
              </div>
              <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold font-mono ${STATUS_COLORS[agent.status] ?? 'bg-slate-700 text-slate-300'}`}>
                {agent.status}
              </span>
            </div>

            {/* Persona */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <p className="text-xs text-slate-400 mb-1 uppercase font-semibold tracking-wider">Persona</p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{agent.definition.persona}</p>
            </div>

            {/* Model & Config */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <p className="text-slate-500 mb-1">Model Tier</p>
                <p className="font-mono text-indigo-300">{agent.definition.modelTier}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <p className="text-slate-500 mb-1">Agent ID</p>
                <p className="font-mono text-slate-300 truncate">{agent.id.slice(0, 8)}...</p>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.definition.permissions.map((p) => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 font-mono">
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Tools</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.definition.tools.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-800/60 font-mono">
                    🔧 {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Recent Activity</p>
              {agent.agentRuns.length === 0 ? (
                <p className="text-xs text-slate-500">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {agent.agentRuns.slice(0, 5).map((run) => (
                    <div key={run.id} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-medium truncate">{run.task?.title ?? 'Unknown task'}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono ${run.status === 'success' ? 'bg-emerald-900 text-emerald-300' : run.status === 'failed' ? 'bg-red-900 text-red-300' : 'bg-indigo-900 text-indigo-300'}`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="flex gap-3 text-slate-500 text-[10px]">
                        <span>In: {run.promptTokens} tok</span>
                        <span>Out: {run.completionTokens} tok</span>
                        <span>{(run.durationMs / 1000).toFixed(1)}s</span>
                      </div>
                      {run.toolCalls.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {run.toolCalls.map((tc, i) => (
                            <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">
                              {tc.toolName} ({tc.status})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
