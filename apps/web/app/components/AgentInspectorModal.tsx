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

interface ModelOption {
  id: string;
  name: string;
  tier: string;
  cost: string;
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
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [savingModel, setSavingModel] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);
    setSaveSuccessMsg(null);
    setErrorMsg(null);

    Promise.all([
      apiFetch<AgentDetail>(`/api/agents/instances/${agentId}`).catch(() =>
        apiFetch<AgentDetail>(`/api/agents/${agentId}`)
      ),
      apiFetch<ModelOption[]>('/api/agents/models/options').catch(() => []),
      apiFetch<{ modelName: string | null; tier: string | null }>(`/api/agents/instances/${agentId}/model`).catch(() => ({ modelName: null, tier: null })),
    ])
      .then(([agentData, models, modelConfig]) => {
        setAgent(agentData);
        setModelOptions(models);
        if (modelConfig.modelName) {
          setSelectedModel(modelConfig.modelName);
        } else if (models.length > 0) {
          setSelectedModel(models[0].id);
        }
      })
      .catch((err) => {
        console.error('Agent details fetch error:', err);
        setErrorMsg(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  async function handleSaveModel(scope: 'instance' | 'role') {
    if (!agentId || !agent || !selectedModel) return;
    setSavingModel(true);
    const chosenOption = modelOptions.find((m) => m.id === selectedModel);
    const tier = chosenOption?.tier || 'tier1_ollama';

    try {
      if (scope === 'instance') {
        await apiFetch(`/api/agents/instances/${agentId}/model`, {
          method: 'PATCH',
          body: JSON.stringify({ modelName: selectedModel, tier }),
        });
        setSaveSuccessMsg(`Tersimpan untuk ${agent.definition.name}!`);
      } else {
        await apiFetch(`/api/agents/roles/${agent.definition.role}/model`, {
          method: 'PATCH',
          body: JSON.stringify({ modelName: selectedModel, tier }),
        });
        setSaveSuccessMsg(`Default untuk semua ${agent.definition.role} tersimpan!`);
      }
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Gagal menyimpan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingModel(false);
    }
  }

  if (!agentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md bg-slate-950/90 border-l border-indigo-500/20 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-500/20 bg-slate-900/60">
          <h2 className="font-bold text-white text-base">Agent Inspector & Model Config</h2>
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

        {errorMsg && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-700/50 flex items-center justify-center text-2xl">⚠️</div>
            <div>
              <p className="text-red-300 text-sm font-semibold">Gagal memuat data agent</p>
              <p className="text-slate-500 text-xs mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        )}

        {!agent && !loading && !errorMsg && (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-slate-400 text-sm">Agent tidak ditemukan atau belum dispawn.</p>
              <p className="text-slate-600 text-xs mt-1">ID: {agentId}</p>
            </div>
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
                <p className="text-xs text-slate-500">{agent.definition.department?.name || 'Lobby & Security'}</p>
              </div>
              <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold font-mono ${STATUS_COLORS[agent.status] ?? 'bg-slate-700 text-slate-300'}`}>
                {agent.status}
              </span>
            </div>

            {/* Model Router & Cost Control ("Biar ga boncos") */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  ⚙️ Pengaturan Model LLM
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                  Anti-Boncos Active
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Pilih Model Khusus untuk Agent Ini:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  {modelOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} — {opt.cost}
                    </option>
                  ))}
                </select>
              </div>

              {saveSuccessMsg && (
                <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 p-2 rounded border border-emerald-800/50">
                  ✓ {saveSuccessMsg}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleSaveModel('instance')}
                  disabled={savingModel}
                  className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {savingModel ? 'Menyimpan...' : 'Simpan untuk Agent Ini'}
                </button>
                <button
                  onClick={() => handleSaveModel('role')}
                  disabled={savingModel}
                  className="py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  title="Terapkan model ini sebagai default untuk semua agent dengan role ini"
                >
                  Default Role
                </button>
              </div>
            </div>

            {/* Persona */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <p className="text-xs text-slate-400 mb-1 uppercase font-semibold tracking-wider">Persona</p>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{agent.definition.persona}</p>
            </div>

            {/* Permissions */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {(agent.definition.permissions || []).length === 0 ? (
                  <span className="text-xs text-slate-500">Tidak ada permission khusus.</span>
                ) : (
                  (agent.definition.permissions || []).map((p) => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 font-mono">
                      ✓ {p}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Tools */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Tools</p>
              <div className="flex flex-wrap gap-1.5">
                {(agent.definition.tools || []).length === 0 ? (
                  <span className="text-xs text-slate-500">Tidak ada tools khusus.</span>
                ) : (
                  (agent.definition.tools || []).map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-800/60 font-mono">
                      🔧 {t}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Recent Activity</p>
              {!agent.agentRuns || agent.agentRuns.length === 0 ? (
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
                        <span>{run.durationMs}ms</span>
                        <span className="font-mono text-indigo-400">{run.modelUsed}</span>
                      </div>
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
