'use client';

import { useState, useEffect, useMemo } from 'react';
import { WorkspaceHeader } from './WorkspaceHeader';
import { LiveActivitySidebar } from './LiveActivitySidebar';
import { RoadmapQAPanel } from './RoadmapQAPanel';
import { AgentStatusDock } from './AgentStatusDock';
import { OfficeSceneCanvas } from '../office/OfficeSceneCanvas';
import { AGENT_REGISTRY_30 } from '../office/OfficeWaypoints';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';

interface Task {
  id: string;
  title: string;
  status: string;
  agentRole?: string;
  assignedAgentId?: string | null;
  outputArtifacts?: string[];
}

interface Approval {
  id: string;
  title: string;
  status: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  goal: string;
  status: string;
  usedTokens: number;
  autonomyLevel: number;
  workflowExecutions?: Array<{ startedAt?: string | null }>;
}

interface Props {
  project: Project | null;
  tasks: Task[];
  approvals: Approval[];
  events: WSEvent[];
  connected: boolean;
  children?: React.ReactNode;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  starting?: boolean;
  onSelectAgent?: (agentId: string) => void;
  onOpenGraphify?: () => void;
  onOpenProjectList?: () => void;
  onOpenFeedback?: () => void;
  onOpenLogs?: () => void;
  onExport?: () => void;
  exporting?: boolean;
  onOpenArtifact?: (taskId: string, title: string) => void;
}

export function WorkspaceLayout({
  project,
  tasks,
  approvals,
  events,
  connected,
  children,
  onStart,
  onPause,
  onResume,
  onCancel,
  starting,
  onSelectAgent,
  onOpenGraphify,
  onOpenProjectList,
  onOpenFeedback,
  onOpenLogs,
  onExport,
  exporting,
  onOpenArtifact,
}: Props) {
  const [mobileTab, setMobileTab] = useState<'canvas' | 'activity' | 'roadmap'>('canvas');
  const [isMobile, setIsMobile] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 1024);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;
  const activeTasks = tasks.filter((t) => ['QUEUED', 'ASSIGNED', 'RUNNING', 'REVIEW'].includes(t.status)).length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED' || t.status === 'FAILED').length;
  const progressPercent = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const dockedAgents = useMemo(() => {
    return AGENT_REGISTRY_30.map((reg) => {
      const agentTasks = tasks.filter((t) => t.agentRole === reg.role);
      const runningTask = agentTasks.find((t) => t.status === 'RUNNING' || t.status === 'ASSIGNED');
      const reviewTask = agentTasks.find((t) => t.status === 'REVIEW');
      const blockedTask = agentTasks.find((t) => t.status === 'BLOCKED' || t.status === 'FAILED');
      const completedTask = agentTasks.find((t) => t.status === 'COMPLETED' || t.status === 'APPROVED');
      const activeTask = runningTask || reviewTask || blockedTask || completedTask || agentTasks[0];

      const agentEvents = events.filter((e) => (e.agentRole ?? e.role) === reg.role);
      const lastEvent = agentEvents[0];
      const rawEventStatus = String(lastEvent?.newStatus ?? lastEvent?.type?.replace('agent.', '') ?? 'idle');

      let computedStatus = 'idle';
      if (runningTask) {
        computedStatus = 'working';
      } else if (reviewTask) {
        computedStatus = 'thinking';
      } else if (rawEventStatus === 'working' || rawEventStatus === 'thinking' || rawEventStatus === 'blocked') {
        computedStatus = rawEventStatus;
      } else if (blockedTask) {
        computedStatus = 'blocked';
      } else if (completedTask) {
        computedStatus = 'completed';
      }

      return {
        id: reg.role,
        name: reg.name,
        role: reg.role,
        status: computedStatus,
        currentTask: activeTask?.title,
        actionsCount: agentEvents.length,
        tokensUsed: project ? Math.round(project.usedTokens / 30) : 0,
        assignedAgentId: activeTask?.assignedAgentId ?? null,
      };
    });
  }, [tasks, events, project]);

  const artifacts = tasks
    .filter((t) => t.outputArtifacts && t.outputArtifacts.length > 0)
    .flatMap((t) => (t.outputArtifacts ?? []).map((a, i) => ({
      id: `${t.id}-${i}`,
      title: a,
      taskId: t.id,
      taskStatus: t.status,
      taskTitle: t.title,
    })));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? '100dvh' : '100vh',
      width: '100vw',
      background: 'var(--bg)',
      overflow: isMobile ? 'auto' : 'hidden',
      WebkitOverflowScrolling: isMobile ? 'touch' as any : undefined,
    }}>
      <WorkspaceHeader
        projectId={project?.id}
        projectName={project?.name ?? ''}
        projectStatus={project?.status ?? ''}
        progressPercent={progressPercent}
        totalTasks={tasks.length}
        completedTasks={completedTasks}
        activeTasks={activeTasks}
        blockedTasks={blockedTasks}
        usedTokens={project?.usedTokens ?? 0}
        connected={connected}
        workflowStartedAt={project?.workflowExecutions?.[0]?.startedAt ?? null}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onCancel={onCancel}
        starting={starting}
        onOpenProjectList={onOpenProjectList}
        onOpenProjectDetail={() => setShowProjectDetail(true)}
        onOpenFeedback={onOpenFeedback}
        onOpenLogs={onOpenLogs}
        onOpenGraphify={onOpenGraphify}
        onExport={onExport}
        exporting={exporting}
      />

      {/* Mobile / Tablet Tab Switcher */}
      {isMobile && (
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid var(--line)',
          padding: '4px 8px',
          gap: 6,
        }}>
          {[
            { key: 'canvas' as const, label: '🏢 3D Office' },
            { key: 'activity' as const, label: '⚡ Aktivitas' },
            { key: 'roadmap' as const, label: '📋 Roadmap & QA' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 8,
                border: 'none',
                background: mobileTab === tab.key ? 'var(--pingot)' : 'transparent',
                color: mobileTab === tab.key ? '#fff' : 'var(--muted)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 3-column body */}
      <div style={{ flex: 1, display: 'flex', overflow: isMobile ? 'visible' : 'hidden', minHeight: 0 }}>
        {/* Left Sidebar */}
        {(!isMobile || mobileTab === 'activity') && (
          <LiveActivitySidebar events={events} connected={connected} isMobile={isMobile} />
        )}

        {/* Center: 3D Office */}
        {(!isMobile || mobileTab === 'canvas') && (
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, height: '100%' }}>
            <div style={{ flex: 1, overflow: 'hidden', padding: 8 }}>
              {project ? (
                <OfficeSceneCanvas
                  events={events}
                  onSelectAgent={(role) => {
                    const t = tasks.find((task) => task.agentRole === role && task.assignedAgentId);
                    if (t?.assignedAgentId) onSelectAgent?.(t.assignedAgentId);
                  }}
                />
              ) : (
                <div style={{
                  height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--faint)', fontSize: 13,
                }}>
                  {children}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Right Sidebar: Roadmap & QA */}
        {(!isMobile || mobileTab === 'roadmap') && (
          <RoadmapQAPanel
            goal={project?.goal ?? ''}
            tasks={tasks}
            approvals={approvals}
            artifacts={artifacts}
            events={events}
            onOpenGraphify={onOpenGraphify}
            onOpenArtifact={onOpenArtifact}
            isMobile={isMobile}
          />
        )}
      </div>

      <AgentStatusDock
        agents={dockedAgents}
        projectId={project?.id}
        onSelectAgent={onSelectAgent}
      />

      {/* Project Detail Modal */}
      {showProjectDetail && project && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setShowProjectDetail(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <div>
                  <h3 className="text-base font-bold text-white">{project.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {project.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProjectDetail(false)}
                className="text-slate-400 hover:text-white text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">🎯 Goal / Target Utama</p>
                <p className="text-white font-semibold text-sm leading-snug">{project.goal || 'Belum ada goal.'}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Status Workflows</p>
                  <span className="text-indigo-400 font-bold uppercase">{project.status}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Otonomi Decision</p>
                  <span className="text-emerald-400 font-bold">Lvl {project.autonomyLevel ?? 3} (Auto)</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Token Terpakai</p>
                  <span className="text-amber-400 font-mono font-bold">{(project.usedTokens ?? 0).toLocaleString()} token</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">📊 Progres Tugas</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="text-white font-bold font-mono">{completedTasks}/{tasks.length} ({Math.round(progressPercent)}%)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                  <div className="text-emerald-400 font-medium">✓ Selesai: {completedTasks}</div>
                  <div className="text-indigo-400 font-medium">⚡ Berjalan: {activeTasks}</div>
                  <div className="text-rose-400 font-medium">⚠️ Terhambat: {blockedTasks}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">📄 Konteks PRD & Instruksi Proyek</p>
                <p className="text-slate-300 leading-relaxed font-mono text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap">
                  Proyek ini mengeksekusi arsitektur SaaS AI Multi-Tenant OmniRetail AI platform. Semua agent beroperasi secara otonom di bawah instruksi Orchestrator (Pak Joko & Siti) dan QA Lead (Risko).
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowProjectDetail(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
