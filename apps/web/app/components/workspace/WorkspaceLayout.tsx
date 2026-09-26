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
    </div>
  );
}
