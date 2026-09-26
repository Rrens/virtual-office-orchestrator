'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface AgentInstance {
  id: string;
  definition: {
    name: string;
    role: string;
    department?: { name: string };
  };
}

interface ArtifactPreview {
  id: string;
  name: string;
  path: string;
  type: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  agentRole: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  assignedAgent: AgentInstance | null;
  artifacts: ArtifactPreview[];
  approvals: Array<{ id: string; status: string }>;
}

type TaskStatus = 'PENDING' | 'QUEUED' | 'ASSIGNED' | 'RUNNING' | 'REVIEW' | 'APPROVED' | 'COMPLETED' | 'BLOCKED' | 'FAILED';

const DEPARTMENTS = [
  { key: 'all', label: 'Semua Divisi', icon: '🏢' },
  { key: 'Executive', label: 'Executive', icon: '👔' },
  { key: 'IT & Engineering', label: 'IT & Engineering', icon: '💻' },
  { key: 'Product', label: 'Product', icon: '📦' },
  { key: 'Design', label: 'Design', icon: '🎨' },
  { key: 'Growth', label: 'Growth', icon: '📈' },
  { key: 'Sales', label: 'Sales', icon: '💰' },
  { key: 'Customer Support', label: 'Customer Support', icon: '🎧' },
  { key: 'Data & AI', label: 'Data & AI', icon: '📊' },
  { key: 'Operations', label: 'Operations', icon: '⚙️' },
];

const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'QUEUED', label: '📋 Terjadwal / Backlog', color: '#94a3b8' },
  { status: 'ASSIGNED', label: '📌 Ditugaskan', color: '#818cf8' },
  { status: 'RUNNING', label: '⚙️ Sedang Dikerjakan', color: '#3b82f6' },
  { status: 'REVIEW', label: '🔍 QA & Review', color: '#f59e0b' },
  { status: 'APPROVED', label: '✅ Disetujui', color: '#10b981' },
  { status: 'COMPLETED', label: '🏁 Selesai', color: '#22c55e' },
  { status: 'BLOCKED', label: '⛔ Terhambat', color: '#ef4444' },
  { status: 'FAILED', label: '❌ Gagal', color: '#f43f5e' },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Menunggu',
  QUEUED: 'Terjadwal',
  ASSIGNED: 'Ditugaskan',
  RUNNING: 'Berjalan',
  REVIEW: 'QA Review',
  APPROVED: 'Disetujui',
  COMPLETED: 'Selesai',
  BLOCKED: 'Terhambat',
  FAILED: 'Gagal',
};

function inferDepartment(role: string, deptName?: string): string {
  if (deptName) return deptName;
  if (role.includes('engineer') || role.includes('devops') || role.includes('qa') || role.includes('security') || role.includes('architect')) {
    return 'IT & Engineering';
  }
  if (role.includes('product') || role.includes('manager')) return 'Product';
  if (role.includes('design') || role.includes('ui') || role.includes('ux')) return 'Design';
  if (role.includes('growth') || role.includes('marketing') || role.includes('content')) return 'Growth';
  if (role.includes('sales') || role.includes('revenue') || role.includes('account')) return 'Sales';
  if (role.includes('customer') || role.includes('support') || role.includes('cs')) return 'Customer Support';
  if (role.includes('data') || role.includes('ml') || role.includes('ai')) return 'Data & AI';
  if (role.includes('operation') || role.includes('hr') || role.includes('finance')) return 'Operations';
  return 'Executive';
}

export default function KanbanBoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [agentRoles, setAgentRoles] = useState<{ role: string; name: string; department?: { name: string } }[]>([]);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRole, setNewRole] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    apiFetch<Project[]>('/api/projects')
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const paramProj = urlParams.get('projectId');
          if (paramProj && data.some((p) => p.id === paramProj)) {
            setSelectedProjectId(paramProj);
          } else {
            setSelectedProjectId(data[0].id);
          }
        }
      })
      .catch(console.error);

    apiFetch<{ role: string; name: string; department?: { name: string } }[]>('/api/agents/definitions')
      .then((defs) => setAgentRoles(defs))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<Task[]>(`/api/projects/${selectedProjectId}/department-tasks`)
      .then((data) => {
        setTasks(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const dept = inferDepartment(t.agentRole, t.assignedAgent?.definition.department?.name);
      const matchesDept = selectedDept === 'all' || dept === selectedDept;
      const q = search.toLowerCase();
      const matchesSearch =
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.agentRole.toLowerCase().includes(q) ||
        (t.assignedAgent?.definition.name ?? '').toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [tasks, selectedDept, search]);

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiFetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      showToast(`Tugas dipindahkan ke "${STATUS_LABELS[newStatus]}"`);
    } catch (err) {
      alert(`Gagal memperbarui status: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newTitle.trim() || !newRole) {
      alert('Judul tugas dan role agent wajib diisi!');
      return;
    }

    try {
      const created = await apiFetch<Task>(`/api/projects/${selectedProjectId}/department-tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          agentRole: newRole,
        }),
      });

      setTasks((prev) => [...prev, created]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewRole(agentRoles[0]?.role ?? '');
      showToast('Tugas divisi baru berhasil ditambahkan!');
    } catch (err) {
      alert(`Gagal membuat tugas: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      done: filteredTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length,
      inProgress: filteredTasks.filter((t) => t.status === 'RUNNING' || t.status === 'ASSIGNED').length,
      review: filteredTasks.filter((t) => t.status === 'REVIEW').length,
      blocked: filteredTasks.filter((t) => t.status === 'BLOCKED' || t.status === 'FAILED').length,
    };
  }, [filteredTasks]);

  return (
    <div className="h-screen w-screen overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans select-text">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400 font-semibold text-xs flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={selectedProjectId ? `/?projectId=${selectedProjectId}` : '/'}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Virtual Office</span>
          </Link>

          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📊</span> Department Kanban Board & Task Manager
            </h1>
            <p className="text-xs text-slate-400">
              Pantau progress semua divisi: Executive, IT, Product, Design, Growth, Sales, CS, Data & AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Tugas Divisi</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 space-y-5">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Tugas', value: stats.total, color: 'text-white' },
            { label: 'Selesai', value: stats.done, color: 'text-emerald-400' },
            { label: 'Berjalan', value: stats.inProgress, color: 'text-blue-400' },
            { label: 'Review QA', value: stats.review, color: 'text-amber-400' },
            { label: 'Terhambat', value: stats.blocked, color: 'text-red-400' },
          ].map((s) => (
            <div
              key={s.label}
              className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center"
            >
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.key}
                onClick={() => setSelectedDept(dept.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedDept === dept.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="mr-1">{dept.icon}</span>
                {dept.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Cari tugas, role, agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Kanban Columns */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
            Loading papan Kanban divisi...
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 items-start" style={{ minHeight: '60vh' }}>
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className="w-72 flex-shrink-0 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col max-h-[calc(100vh-300px)]"
                >
                  {/* Column Header */}
                  <div
                    className="p-3 border-b border-slate-800 rounded-t-2xl flex items-center justify-between"
                    style={{ backgroundColor: `${col.color}10`, borderBottomColor: `${col.color}30` }}
                  >
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      {col.label}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: `${col.color}20`, color: col.color }}
                    >
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div className="p-2 space-y-2 overflow-y-auto flex-1">
                    {colTasks.length === 0 ? (
                      <div className="p-4 text-center text-slate-600 text-xs">
                        Tidak ada tugas di kolom ini.
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const dept = inferDepartment(
                          task.agentRole,
                          task.assignedAgent?.definition.department?.name
                        );
                        const isApproved = task.status === 'APPROVED';
                        const isDone = task.status === 'COMPLETED' || task.status === 'APPROVED';

                        return (
                          <div
                            key={task.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-white leading-snug">
                                {task.title}
                              </h4>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono whitespace-nowrap">
                                {dept}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>

                            {/* Agent Assignment */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="text-indigo-400 font-semibold">
                                {task.assignedAgent?.definition.name || task.agentRole}
                              </span>
                              <span>·</span>
                              <span className="font-mono">task #{task.id.slice(0, 6)}</span>
                            </div>

                            {/* Artifact Previews */}
                            {task.artifacts.length > 0 && (
                              <div className="pt-1 border-t border-slate-800 space-y-1">
                                <p className="text-[9px] text-slate-500 uppercase font-semibold">Output & Artefak</p>
                                {task.artifacts.slice(0, 2).map((artifact) => (
                                  <Link
                                    key={artifact.id}
                                    href={`/code?projectId=${selectedProjectId}&file=${artifact.id}`}
                                    className="block text-[10px] text-indigo-300 hover:text-indigo-200 font-mono truncate"
                                  >
                                    📄 {artifact.name}
                                  </Link>
                                ))}
                                {task.artifacts.length > 2 && (
                                  <p className="text-[9px] text-slate-500">
                                    +{task.artifacts.length - 2} file lainnya
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Move Actions */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {isDone ? null : col.status === 'QUEUED' ? (
                                <button
                                  onClick={() => handleMoveTask(task.id, 'ASSIGNED')}
                                  className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[9px] font-semibold hover:bg-blue-900 transition-colors cursor-pointer"
                                >
                                  Tugaskan →
                                </button>
                              ) : col.status === 'ASSIGNED' ? (
                                <button
                                  onClick={() => handleMoveTask(task.id, 'RUNNING')}
                                  className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[9px] font-semibold hover:bg-blue-900 transition-colors cursor-pointer"
                                >
                                  Mulai →
                                </button>
                              ) : col.status === 'RUNNING' ? (
                                <button
                                  onClick={() => handleMoveTask(task.id, 'REVIEW')}
                                  className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[9px] font-semibold hover:bg-amber-900 transition-colors cursor-pointer"
                                >
                                  Kirim QA →
                                </button>
                              ) : col.status === 'REVIEW' ? (
                                <>
                                  <button
                                    onClick={() => handleMoveTask(task.id, 'APPROVED')}
                                    className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
                                  >
                                    Approve ✓
                                  </button>
                                  <button
                                    onClick={() => handleMoveTask(task.id, 'BLOCKED')}
                                    className="px-2 py-0.5 rounded bg-red-950 text-red-300 text-[9px] font-semibold hover:bg-red-900 transition-colors cursor-pointer"
                                  >
                                    Block
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleMoveTask(task.id, 'QUEUED')}
                                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                  Reset ←
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📌</span> Tambah Tugas Divisi
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Judul Tugas:</label>
                <input
                  type="text"
                  placeholder="Misal: Refactor API autentikasi, buat landing page..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Assign ke Agent / Role:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">Pilih role agent...</option>
                  {agentRoles.map((agent) => (
                    <option key={agent.role} value={agent.role}>
                      {agent.name} ({agent.role}){agent.department ? ` — ${agent.department.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Deskripsi Tugas:</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan detail tugas, kriteria selesai, dan ekspektasi output..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
                >
                  Buat Tugas
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
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
