'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreateProjectForm } from './components/CreateProjectForm';
import { ActivityFeed } from './components/ActivityFeed';
import { TaskList } from './components/TaskList';
import { ApprovalCenter } from './components/ApprovalCenter';
import { Office3DCanvas } from './components/Office3DCanvas';
import { AgentInspectorModal } from './components/AgentInspectorModal';
import { ArtifactViewerModal } from './components/ArtifactViewerModal';
import { BudgetPanel } from './components/BudgetPanel';
import { CustomerFeedbackModal } from './components/CustomerFeedbackModal';
import { AgentRosterTab } from './components/AgentRosterTab';
import { WorkflowDagVisualizer } from './components/WorkflowDagVisualizer';
import { useProjectWebSocket } from '../hooks/useProjectWebSocket';
import { useOfficeSounds } from '../hooks/useOfficeSounds';
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
  assignedAgentId: string | null;
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

type Tab = 'tasks' | 'dag' | 'roster' | 'approvals' | '3d-office' | 'activity';

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [starting, setStarting] = useState(false);

  const [inspectedAgentId, setInspectedAgentId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [artifactView, setArtifactView] = useState<{ taskId: string; taskTitle: string } | null>(null);

  const { events, connected } = useProjectWebSocket(selectedProjectId);
  const { sounds, enable, disable } = useOfficeSounds();

  // Play sound FX on relevant WS events
  useEffect(() => {
    if (!events.length || !soundEnabled) return;
    const latest = events[0];
    if (latest.type === 'task.assigned') sounds.taskAssigned();
    else if (latest.type === 'task.completed') sounds.taskCompleted();
    else if (latest.type === 'task.failed') sounds.taskFailed();
    else if (latest.type === 'approval.requested') sounds.approvalRequested();
    else if (latest.type === 'workflow.started') sounds.workflowStarted();
    else if (latest.type === 'workflow.completed') sounds.workflowCompleted();
  }, [events, soundEnabled]);

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

  async function handlePause() {
    if (!selectedProjectId) return;
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/pause`, { method: 'POST' });
      await loadProject(selectedProjectId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to pause');
    }
  }

  async function handleResume() {
    if (!selectedProjectId) return;
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/resume`, { method: 'POST' });
      await loadProject(selectedProjectId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resume');
    }
  }

  async function handleCancel() {
    if (!selectedProjectId || !confirm('Are you sure you want to cancel this project workflow?')) return;
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/cancel`, { method: 'POST' });
      await loadProject(selectedProjectId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

  const tasks = project?.workflowExecutions?.[0]?.tasks ?? [];
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const progressPercent = tasks.length > 0 
    ? (tasks.filter(t => t.status === 'COMPLETED' || t.status === 'APPROVED').length / tasks.length) * 100 
    : 0;
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
            {/* Sound FX Toggle */}
            <button
              onClick={() => {
                if (soundEnabled) { disable(); setSoundEnabled(false); }
                else { enable(); setSoundEnabled(true); }
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${soundEnabled ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
            >
              {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>

            {project && (project.status === 'draft' || project.status === 'planning') && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                {starting ? 'Starting...' : '▶ Start Workflow'}
              </button>
            )}

            {project && project.status === 'running' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePause}
                  className="bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  ✕ Cancel
                </button>
              </div>
            )}

            {project && project.status === 'paused' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResume}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  ▶ Resume
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  ✕ Cancel
                </button>
              </div>
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
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Business Goal</p>
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                    >
                      💬 Feedback
                    </button>
                  </div>
                  <p className="text-sm text-slate-200">{project.goal}</p>

                  {/* Progress Bar (PRD §26) */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Workflow Progress</span>
                      <span className="text-white font-semibold">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                      <span>Active: <strong className="text-slate-300">{tasks.filter((t) => ['QUEUED','ASSIGNED','RUNNING','REVIEW'].includes(t.status)).length}</strong></span>
                      <span>Completed: <strong className="text-slate-300">{tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length}</strong></span>
                      <span>Blocked/Failed: <strong className="text-slate-300">{tasks.filter((t) => t.status === 'BLOCKED' || t.status === 'FAILED').length}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>Autonomy Level: <strong className="text-slate-300">{project.autonomyLevel}</strong></span>
                    <span>Tokens Used: <strong className="text-slate-300">{project.usedTokens.toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Budget & Cost Tracker */}
                <BudgetPanel projectId={selectedProjectId} />

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60 flex-wrap">
                  {(['tasks', 'dag', 'roster', 'approvals', '3d-office', 'activity'] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === '3d-office' ? '🏢 Office' : tab === 'dag' ? 'DAG' : tab === 'roster' ? 'Agents' : tab}
                      {tab === 'approvals' && pendingApprovals.length > 0 && (
                        <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {pendingApprovals.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {activeTab === 'tasks' && (
                  <TaskList
                    tasks={tasks}
                    onViewArtifacts={(taskId, taskTitle) => setArtifactView({ taskId, taskTitle })}
                  />
                )}
                {activeTab === 'dag' && (
                  <WorkflowDagVisualizer
                    tasks={tasks}
                    onSelectTask={(taskId) => {
                      const task = tasks.find((t) => t.id === taskId);
                      if (task && (task.status === 'COMPLETED' || task.status === 'APPROVED')) {
                        setArtifactView({ taskId: task.id, taskTitle: task.title });
                      }
                    }}
                  />
                )}
                {activeTab === 'roster' && selectedProjectId && (
                  <AgentRosterTab
                    projectId={selectedProjectId}
                    onInspectAgent={setInspectedAgentId}
                  />
                )}
                {activeTab === 'approvals' && (
                  <ApprovalCenter approvals={approvals} onDecided={() => loadApprovals(selectedProjectId)} />
                )}
                {activeTab === '3d-office' && (
                  <div className="h-[65vh]">
                    <Office3DCanvas
                      events={events}
                      onSelectAgent={(role) => {
                        const taskWithAgent = tasks.find((t) => t.agentRole === role && t.assignedAgentId);
                        if (taskWithAgent?.assignedAgentId) {
                          setInspectedAgentId(taskWithAgent.assignedAgentId);
                        }
                      }}
                    />
                  </div>
                )}
                {activeTab === 'activity' && (
                  <div className="h-[60vh]">
                    <ActivityFeed events={events} connected={connected} />
                  </div>
                )}
              </div>

              {/* Right panel — live activity + agent list */}
              <div className="w-80 flex-shrink-0 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
                <ActivityFeed events={events} connected={connected} />

                {/* Active Agents */}
                {project.workflowExecutions?.[0] && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Active Agents</p>
                    <div className="space-y-1.5">
                      {project.workflowExecutions[0].tasks
                        .filter((t) => t.assignedAgentId)
                        .map((t) => (
                          <button
                            key={t.assignedAgentId}
                            onClick={() => setInspectedAgentId(t.assignedAgentId!)}
                            className="w-full text-left px-2.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/50 transition-colors text-xs"
                          >
                            <p className="text-white font-medium truncate">{t.agentRole}</p>
                            <p className="text-slate-400 truncate">{t.title}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a project or create a new one to get started.
            </div>
          )}
        </div>
      </main>

      {/* Agent Inspector Slide-over */}
      <AgentInspectorModal
        agentId={inspectedAgentId}
        onClose={() => setInspectedAgentId(null)}
      />

      {/* Artifact Viewer */}
      <ArtifactViewerModal
        taskId={artifactView?.taskId ?? null}
        taskTitle={artifactView?.taskTitle}
        onClose={() => setArtifactView(null)}
      />

      {/* Customer Feedback Modal */}
      {showFeedbackModal && selectedProjectId && (
        <CustomerFeedbackModal
          projectId={selectedProjectId}
          onClose={() => setShowFeedbackModal(false)}
          onSubmitted={() => loadProject(selectedProjectId)}
        />
      )}
    </div>
  );
}
