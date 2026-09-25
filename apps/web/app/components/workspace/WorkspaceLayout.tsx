'use client';

import { WorkspaceHeader } from './WorkspaceHeader';
import { LiveActivitySidebar } from './LiveActivitySidebar';
import { RoadmapQAPanel } from './RoadmapQAPanel';
import { AgentStatusDock } from './AgentStatusDock';
import { OfficeSceneCanvas } from '../office/OfficeSceneCanvas';
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
}: Props) {
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;
  const activeTasks = tasks.filter((t) => ['QUEUED', 'ASSIGNED', 'RUNNING', 'REVIEW'].includes(t.status)).length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED' || t.status === 'FAILED').length;
  const progressPercent = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const dockedAgents = [
    { id: 'pingot', name: 'Pingot', role: 'orchestrator', status: 'idle', tokensUsed: 0, actionsCount: 0 },
    { id: 'zaki',   name: 'Zaki',   role: 'backend-engineer', status: 'idle', tokensUsed: 0, actionsCount: 0 },
    { id: 'lulu',   name: 'Lulu',   role: 'ui-ux-designer', status: 'idle', tokensUsed: 0, actionsCount: 0 },
    { id: 'risko',  name: 'Risko',  role: 'qa-engineer', status: 'idle', tokensUsed: 0, actionsCount: 0 },
  ].map((a) => {
    const agentTask = tasks.find((t) => t.agentRole === a.role);
    const agentEvents = events.filter((e) => (e.agentRole ?? e.role) === a.role);
    const lastEvent = agentEvents[0];
    const rawStatus = String(lastEvent?.newStatus ?? lastEvent?.type?.replace('agent.', '') ?? 'idle');
    const mappedStatus = (['working', 'thinking', 'blocked', 'completed', 'idle'].includes(rawStatus) ? rawStatus : 'idle');
    return {
      ...a,
      status: mappedStatus,
      currentTask: agentTask?.title,
      actionsCount: agentEvents.length,
      tokensUsed: project ? Math.round(project.usedTokens / 4) : 0,
      assignedAgentId: agentTask?.assignedAgentId ?? null,
    };
  });

  const artifacts = tasks
    .filter((t) => t.outputArtifacts && t.outputArtifacts.length > 0)
    .flatMap((t) => (t.outputArtifacts ?? []).map((a, i) => ({ id: `${t.id}-${i}`, title: a, taskId: t.id })));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      <WorkspaceHeader
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
      />

      {/* 3-column body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LiveActivitySidebar events={events} connected={connected} />

        {/* Center: 3D Office + children panel */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden', padding: 12 }}>
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

        <RoadmapQAPanel
          goal={project?.goal ?? ''}
          tasks={tasks}
          approvals={approvals}
          artifacts={artifacts}
          events={events}
          onOpenGraphify={onOpenGraphify}
        />
      </div>

      <AgentStatusDock
        agents={dockedAgents}
        onSelectAgent={onSelectAgent}
      />
    </div>
  );
}
