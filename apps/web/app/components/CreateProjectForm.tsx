'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface UploadedFile {
  name: string;
  content: string;
  sizeBytes: number;
  mimeType: string;
}

interface CreateProjectFormData {
  name: string;
  goal: string;
  autonomyLevel: number;
  prdFiles?: UploadedFile[];
}

interface Props {
  onCreated: (projectId: string) => void;
}

interface DAGPlanPreview {
  projectId: string;
  goal: string;
  departments: string[];
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    agentRole: string;
    dependencies: string[];
    expectedArtifacts: string[];
    estimatedComplexity?: string;
  }>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CreateProjectForm({ onCreated }: Props) {
  const [form, setForm] = useState<CreateProjectFormData>({
    name: '',
    goal: '',
    autonomyLevel: 2,
  });
  const [prdFiles, setPrdFiles] = useState<UploadedFile[]>([]);
  const [readingFiles, setReadingFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<DAGPlanPreview | null>(null);
  const [startingWorkflow, setStartingWorkflow] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setReadingFiles(true);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const textContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });

        newFiles.push({
          name: file.name,
          content: textContent,
          sizeBytes: file.size,
          mimeType: file.type || 'text/plain',
        });
      } catch (err) {
        console.warn(`Could not read file ${file.name}:`, err);
      }
    }

    setPrdFiles((prev) => [...prev, ...newFiles]);
    setReadingFiles(false);
    // Reset file input value so same files can be re-selected if needed
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPrdFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.goal.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const project = await apiFetch<{ id: string }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          prdFiles,
        }),
      });
      setCreatedProjectId(project.id);

      // Generate DAG Plan with 9Router-2-High-Performance for review
      try {
        const plan = await apiFetch<DAGPlanPreview>(`/api/projects/${project.id}/plan`, {
          method: 'POST',
        });
        if (plan && plan.tasks && plan.tasks.length > 0) {
          setPlanPreview(plan);
          return;
        }
      } catch (planErr) {
        console.warn('Could not pre-generate plan preview:', planErr);
      }

      onCreated(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartWorkflow() {
    if (!createdProjectId) return;
    setStartingWorkflow(true);
    try {
      await apiFetch(`/api/projects/${createdProjectId}/start`, { method: 'POST' });
    } catch (err) {
      console.warn('Workflow start notice:', err);
    } finally {
      setStartingWorkflow(false);
      onCreated(createdProjectId);
    }
  }

  if (planPreview && createdProjectId) {
    return (
      <div className="space-y-4 max-h-[75vh] flex flex-col">
        <div className="border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="text-sm font-bold text-white">Rencana Eksekusi Proyek (DAG Plan)</h3>
              <p className="text-[11px] text-slate-400">
                Dirancang oleh AI Orchestrator ({planPreview.tasks.length} tasks disiapkan)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {planPreview.departments.map((dept) => (
              <span
                key={dept}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              >
                {dept}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {planPreview.tasks.map((task, idx) => (
            <div
              key={task.id}
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-all text-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                  <span>{task.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-mono whitespace-nowrap">
                  {task.agentRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {task.description}
              </p>
              {task.expectedArtifacts?.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Deliverables:</span>
                  {task.expectedArtifacts.map((art, aIdx) => (
                    <span key={aIdx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 font-mono">
                      📄 {art}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onCreated(createdProjectId)}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Lewati & Langsung Masuk
          </button>
          <button
            type="button"
            onClick={handleStartWorkflow}
            disabled={startingWorkflow}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>🚀</span>
            <span>{startingWorkflow ? 'Memulai Agen...' : 'Setujui & Mulai Eksekusi'}</span>
          </button>
        </div>
      </div>
    );
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
          Business Goal & Directive
        </label>
        <textarea
          rows={3}
          value={form.goal}
          onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
          placeholder="e.g. Build a SaaS POS system for laundry businesses with order tracking, inventory, and reporting."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Multi-File PRD Upload */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-300">
            Dokumen PRD & Spesifikasi (Bisa &gt; 1 File)
          </label>
          <span className="text-[11px] text-slate-400">
            {prdFiles.length} file dipilih
          </span>
        </div>

        <div className="p-3 rounded-lg border border-dashed border-slate-600 bg-slate-800/60 hover:bg-slate-800/90 transition-colors">
          <label className="flex flex-col items-center justify-center cursor-pointer py-2">
            <span className="text-xl mb-1">📂</span>
            <span className="text-xs font-semibold text-indigo-400">
              {readingFiles ? 'Membaca file...' : 'Klik untuk pilih file PRD (.md, .txt, .json, .pdf)'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Anda bisa memilih beberapa file sekaligus
            </span>
            <input
              type="file"
              multiple
              accept=".md,.txt,.json,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Selected Files List */}
        {prdFiles.length > 0 && (
          <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto">
            {prdFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-indigo-400">📄</span>
                  <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({formatFileSize(file.sizeBytes)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-400 text-sm ml-2 px-1 cursor-pointer"
                  title="Hapus file ini"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
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
        disabled={loading || readingFiles}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
      >
        {loading ? 'Creating Project...' : 'Create Project'}
      </button>
    </form>
  );
}
