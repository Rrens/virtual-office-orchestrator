'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreateProjectForm } from './components/CreateProjectForm';
import { ActivityFeed } from './components/ActivityFeed';
import { TaskList } from './components/TaskList';
import { ApprovalCenter } from './components/ApprovalCenter';
import { Office3DCanvas } from './components/Office3DCanvas';
import { useProjectWebSocket } from '../hooks/useProjectWebSocket';
import { apiFetch } from '../lib/api';

interface Project {
  id: string;
  name: string;
  goal: string;
  status: string;
  autonomyLevel: number;
  usedTokens: number;
  workflowExecutions: Array<{ id: string; status: string; tasks: Task[] }>;
}

interface Task {
  id: string;
  title: string;
  description: string;
  agentRole: string;
  status: string;
  outputArtifacts: string[];
}

interface Approval {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  agentInstance: { definition: { name: string; role: string } };
  task?: { title: string };
}

type Tab = 'tasks' | 'approvals' | 'activity' | '3d-office';

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [showNewProject, setShowNewProject] = useState(false);
  const [starting, setStarting] = useState(false);

  const { events, connected } = useProjectWebSocket(selectedProjectId);

  const loadProjects = useCallback(async () => {
    const data = await apiFetch<Project[]>('/api/projects');
    setProjects(data);
  }, []);

  const loadProject = useCallback(async (id: string) => {
    const data = await apiFetch<Project>(`/api/projects/${id}`);
    setProject(data);
  }, []);

  const loadApprovals = useCallback(async (id: string) => {
    const data = await apiFetch<Approval[]>(`/api/approvals?projectId=${id}`);
    setApprovals(data);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadProject(selectedProjectId);
    loadApprovals(selectedProjectId);
  }, [selectedProjectId, events, loadProject, loadApprovals]);

  async function handleStart() {
    if (!selectedProjectId) return;
    setStarting(true);
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/start`, { method: 'POST' });
      setActiveTab('tasks');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setStarting(false);
    }
  }

  const tasks = project?.workflowExecutions?.[0]?.tasks ?? [];
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const STATUS_COLORS: Record<string, string> = {
    draft: 'text-slate-400', planning: 'text-yellow-400', running: 'text-indigo-400',
    completed: 'text-emerald-400', paused: 'text-amber-400', cancelled: 'text-red-400',
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white tracking-tight">🏢 Virtual Office</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI Company OS</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Projects</span>
            <button
              onClick={() => setShowNewProject(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + New
            </button>
          </div>

          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProjectId(p.id); setShowNewProject(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedProjectId === p.id
                  ? 'bg-indigo-600/30 text-white border border-indigo-600/50'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-medium truncate">{p.name}</div>
              <div className={`text-[11px] ${STATUS_COLORS[p.status] ?? 'text-slate-400'}`}>
                {p.status}
              </div>
            </button>
          ))}

          {projects.length === 0 && !showNewProject && (
            <p className="text-xs text-slate-500 px-3 py-2">No projects yet. Create one.</p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {project && (
              <>
                <h2 className="font-semibold text-white">{project.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-800 ${STATUS_COLORS[project.status] ?? 'text-slate-400'}`}>
                  {project.status}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {project && (project.status === 'draft' || project.status === 'planning') && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                {starting ? 'Starting...' : '▶ Start Workflow'}
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {showNewProject || (!selectedProjectId && projects.length === 0) ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">New AI Project</h3>
                <CreateProjectForm
                  onCreated={(id) => {
                    loadProjects();
                    setSelectedProjectId(id);
                    setShowNewProject(false);
                  }}
                />
              </div>
            </div>
          ) : selectedProjectId && project ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Left panel */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Goal */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Business Goal</p>
                  <p className="text-sm text-slate-200">{project.goal}</p>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>Autonomy Level: <strong className="text-slate-300">{project.autonomyLevel}</strong></span>
                    <span>Tokens Used: <strong className="text-slate-300">{project.usedTokens.toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  {(['tasks', 'approvals', '3d-office', 'activity'] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                        activeTab === tab
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === '3d-office' ? '🏢 3D Office' : tab}
                      {tab === 'approvals' && pendingApprovals.length > 0 && (
                        <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {pendingApprovals.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {activeTab === 'tasks' && <TaskList tasks={tasks} />}
                {activeTab === 'approvals' && (
                  <ApprovalCenter approvals={approvals} onDecided={() => loadApprovals(selectedProjectId)} />
                )}
                {activeTab === '3d-office' && (
                  <div className="h-[65vh]">
                    <Office3DCanvas events={events} />
                  </div>
                )}
                {activeTab === 'activity' && (
                  <div className="h-[60vh]">
                    <ActivityFeed events={events} connected={connected} />
                  </div>
                )}
              </div>

              {/* Right panel — live activity */}
              <div className="w-80 flex-shrink-0 border-l border-slate-800 p-4 overflow-y-auto">
                <ActivityFeed events={events} connected={connected} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a project or create a new one to get started.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
