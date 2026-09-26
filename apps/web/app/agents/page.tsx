'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface PreferredModel {
  modelName: string | null;
  tier: string | null;
}

interface AgentDefinition {
  id: string;
  role: string;
  name: string;
  persona: string;
  modelTier: string;
  tools: string[];
  permissions: string[];
  departmentId: string;
  department: Department;
  preferredModel?: PreferredModel | null;
}

interface ModelOption {
  id: string;
  name: string;
  tier: string;
  cost: string;
}

const ALL_AVAILABLE_TOOLS = [
  'web-scraper',
  'git',
  'bash',
  'code-analysis',
  'db-query',
  'graphify-search',
  'docker',
  'mcp-email',
  'pentest-scanner',
];

const ALL_AVAILABLE_PERMISSIONS = [
  'autonomous-execution',
  'require-human-approval',
  'filesystem-write',
  'network-outbound',
  'model-override',
  'production-deploy',
];

export default function AgentManagementPage() {
  const [definitions, setDefinitions] = useState<AgentDefinition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('projectId');
    if (pid) setActiveProjectId(pid);
  }, []);

  // Modals state
  const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // New Agent Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [newModel, setNewModel] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [defs, depts, models] = await Promise.all([
        apiFetch<AgentDefinition[]>('/api/agents/definitions'),
        apiFetch<Department[]>('/api/departments').catch(() => []),
        apiFetch<ModelOption[]>('/api/agents/models/options').catch(() => []),
      ]);
      setDefinitions(defs);
      setDepartments(depts);
      setModelOptions(models);
      if (depts.length > 0 && !newDeptId) setNewDeptId(depts[0].id);
      if (models.length > 0 && !newModel) setNewModel(models[0].id);
    } catch (err) {
      console.error('Failed to load agent management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleModelChange = async (role: string, modelId: string) => {
    setSavingRoleId(role);
    const chosen = modelOptions.find((m) => m.id === modelId);
    const tier = chosen?.tier || 'tier1_ollama';

    try {
      await apiFetch(`/api/agents/roles/${role}/model`, {
        method: 'PATCH',
        body: JSON.stringify({ modelName: modelId, tier }),
      });
      showToast(`Model untuk ${role} berhasil diperbarui ke ${chosen?.name || modelId}!`);

      // Update local state
      setDefinitions((prev) =>
        prev.map((d) =>
          d.role === role ? { ...d, preferredModel: { modelName: modelId, tier } } : d
        )
      );
    } catch (err) {
      alert(`Gagal mengubah model: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleApplyPreset = async (preset: 'local' | 'balanced' | 'max') => {
    setBatchLoading(true);
    try {
      const res = await apiFetch<{ count: number; modelName: string }>(
        '/api/agents/models/batch-override',
        {
          method: 'POST',
          body: JSON.stringify({ preset }),
        }
      );
      showToast(`Preset "${preset.toUpperCase()}" diterapkan ke seluruh ${res.count} agent!`);
      await loadData();
    } catch (err) {
      alert(`Gagal menerapkan preset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    try {
      const updated = await apiFetch<AgentDefinition>(
        `/api/agents/definitions/${editingAgent.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editingAgent.name,
            persona: editingAgent.persona,
            departmentId: editingAgent.departmentId,
            tools: editingAgent.tools,
            permissions: editingAgent.permissions,
          }),
        }
      );

      setDefinitions((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      showToast(`Pengaturan agent ${updated.name} berhasil disimpan!`);
      setEditingAgent(null);
    } catch (err) {
      alert(`Gagal menyimpan: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRole || !newDeptId) {
      alert('Nama, Role, dan Departemen wajib diisi!');
      return;
    }

    try {
      const created = await apiFetch<AgentDefinition>('/api/agents/definitions', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          role: newRole.toLowerCase().replace(/\s+/g, '-'),
          persona: newPersona || `Agent ${newName} khusus untuk ${newRole}`,
          departmentId: newDeptId,
          modelTier: 'tier1_ollama',
          tools: ['web-scraper', 'bash'],
          permissions: ['autonomous-execution'],
        }),
      });

      if (newModel) {
        const chosen = modelOptions.find((m) => m.id === newModel);
        await apiFetch(`/api/agents/roles/${created.role}/model`, {
          method: 'PATCH',
          body: JSON.stringify({ modelName: newModel, tier: chosen?.tier || 'tier1_ollama' }),
        });
      }

      showToast(`Agent baru "${created.name}" (${created.role}) berhasil ditambahkan!`);
      setShowCreateModal(false);
      setNewName('');
      setNewRole('');
      setNewPersona('');
      await loadData();
    } catch (err) {
      alert(`Gagal membuat agent: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus agent "${name}"?`)) return;

    try {
      await apiFetch(`/api/agents/definitions/${id}`, { method: 'DELETE' });
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
      showToast(`Agent "${name}" berhasil dihapus.`);
    } catch (err) {
      alert(`Gagal menghapus agent: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const deptNames = Array.from(new Set(definitions.map((d) => d.department?.name).filter(Boolean)));

  const filteredDefinitions = definitions.filter((d) => {
    const matchesDept = selectedDept === 'all' || d.department?.name === selectedDept;
    const q = search.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.role.toLowerCase().includes(q) ||
      (d.department?.name ?? '').toLowerCase().includes(q) ||
      d.persona.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  // Calculate statistics
  const totalAgents = definitions.length;
  const localModelCount = definitions.filter(
    (d) =>
      !d.preferredModel?.tier ||
      d.preferredModel?.tier === 'tier1_ollama' ||
      (d.preferredModel?.modelName ?? '').includes('qwen2.5-coder:3b') ||
      (d.preferredModel?.modelName ?? '').includes('qwen2.5-coder:7b')
  ).length;

  return (
    <div className="h-screen w-screen overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans select-text">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400 font-semibold text-xs flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={activeProjectId ? `/?projectId=${activeProjectId}` : '/'}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Kembali ke 3D Virtual Office</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🤖</span> Manajemen Agent & AI Model Router
            </h1>
            <p className="text-xs text-slate-400">
              Atur nama agent, peran (role), departemen, instruksi persona, serta alokasi model LLM (Local Ollama / 9Router / Cloud)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Tambah Agent Baru</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Top Overview & Quick Presets Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-2xl">
              🏢
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Roster Agent</p>
              <p className="text-2xl font-black text-white">{totalAgents}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Model Local (Free)</p>
              <p className="text-2xl font-black text-emerald-400">{localModelCount} / {totalAgents}</p>
            </div>
          </div>

          {/* Preset Buttons Bar */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-center space-y-2">
            <p className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>⚡ Global LLM Presets (1-Click Switch All)</span>
              {batchLoading && <span className="text-indigo-400 animate-pulse text-[10px]">Applying preset...</span>}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleApplyPreset('local')}
                disabled={batchLoading}
                className="py-1.5 px-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 text-center"
                title="Terapkan Qwen 2.5 Coder 7B Local (Free) ke semua agent"
              >
                ⚡ Mode Hemat (Local)
              </button>
              <button
                onClick={() => handleApplyPreset('balanced')}
                disabled={batchLoading}
                className="py-1.5 px-2 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 text-center"
                title="Terapkan Qwen 2.5 Coder 32B via 9Router ke semua agent"
              >
                ⚖️ Mode Balanced (32B)
              </button>
              <button
                onClick={() => handleApplyPreset('max')}
                disabled={batchLoading}
                className="py-1.5 px-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 text-center"
                title="Terapkan Claude 3.5 Sonnet ke semua agent"
              >
                🧠 Mode Max (Cloud)
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar: Department Filters & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedDept === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Semua Departemen ({definitions.length})
            </button>
            {deptNames.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedDept === dept
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Cari agent, role, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Agent Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
            Loading roster & model configuration...
          </div>
        ) : filteredDefinitions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/30 rounded-2xl border border-slate-800">
            Tidak ada agent yang cocok dengan filter atau pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDefinitions.map((agent) => {
              const currentModelId = agent.preferredModel?.modelName || 'qwen2.5-coder:7b';
              const currentOption = modelOptions.find((m) => m.id === currentModelId);

              return (
                <div
                  key={agent.id}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 p-5 flex flex-col justify-between transition-all backdrop-blur-sm space-y-4"
                >
                  {/* Top Bar: Avatar, Name, Role, Dept */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-xl shadow-inner">
                          🤖
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight flex items-center gap-2">
                            {agent.name}
                          </h3>
                          <p className="text-xs text-indigo-400 font-mono mt-0.5">{agent.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {agent.department?.name || 'General'}
                      </span>
                    </div>

                    {/* LLM Selector Dropdown */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300">Model LLM Utama:</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          {currentOption?.cost || 'Free (Local)'}
                        </span>
                      </div>
                      <select
                        value={currentModelId}
                        onChange={(e) => handleModelChange(agent.role, e.target.value)}
                        disabled={savingRoleId === agent.role}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {modelOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} — {opt.cost}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Persona Excerpt */}
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
                        System Persona & Prompt
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {agent.persona}
                      </p>
                    </div>

                    {/* Tools & Permissions badges */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60 font-mono"
                          >
                            🔧 {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>✏️</span> Edit Detail & Persona
                    </button>

                    <button
                      onClick={() => handleDeleteAgent(agent.id, agent.name)}
                      className="text-red-400 hover:text-red-300 text-xs p-1.5 transition-colors cursor-pointer"
                      title="Hapus Agent Ini"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: EDIT AGENT DETAIL */}
      {editingAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setEditingAgent(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>✏️</span> Edit Detail Agent: {editingAgent.name}
              </h2>
              <button
                onClick={() => setEditingAgent(null)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Nama Agent:</label>
                  <input
                    type="text"
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Departemen:</label>
                  <select
                    value={editingAgent.departmentId}
                    onChange={(e) => setEditingAgent({ ...editingAgent, departmentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">System Persona & Prompt:</label>
                <textarea
                  rows={5}
                  value={editingAgent.persona}
                  onChange={(e) => setEditingAgent({ ...editingAgent, persona: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-indigo-500 leading-relaxed font-mono"
                  required
                />
              </div>

              {/* Tools Selector */}
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">Hak Akses Tools (Fitur Kemampuan):</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AVAILABLE_TOOLS.map((tool) => {
                    const active = editingAgent.tools.includes(tool);
                    return (
                      <button
                        type="button"
                        key={tool}
                        onClick={() => {
                          const nextTools = active
                            ? editingAgent.tools.filter((t) => t !== tool)
                            : [...editingAgent.tools, tool];
                          setEditingAgent({ ...editingAgent, tools: nextTools });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                          active
                            ? 'bg-sky-950 text-sky-300 border-sky-700 font-bold'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {active ? '✓ ' : '+ '} {tool}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Selector */}
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">Izin Operasional (Permissions):</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AVAILABLE_PERMISSIONS.map((perm) => {
                    const active = editingAgent.permissions.includes(perm);
                    return (
                      <button
                        type="button"
                        key={perm}
                        onClick={() => {
                          const nextPerms = active
                            ? editingAgent.permissions.filter((p) => p !== perm)
                            : [...editingAgent.permissions, perm];
                          setEditingAgent({ ...editingAgent, permissions: nextPerms });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {active ? '✓ ' : '+ '} {perm}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW AGENT */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🤖</span> Tambah Agent Baru ke Roster
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Nama Agent:</label>
                <input
                  type="text"
                  placeholder="Misal: Alex, Rendy, Sarah, Maya..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Role Unique Identifier:</label>
                  <input
                    type="text"
                    placeholder="misal: ai-researcher"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Departemen:</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Pilih Initial Model LLM:</label>
                <select
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {modelOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} — {opt.cost}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Instruksi Persona & Role Prompt:</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan peran, tanggung jawab, dan keahlian spesifik agent ini..."
                  value={newPersona}
                  onChange={(e) => setNewPersona(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
                >
                  Buat Agent
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
