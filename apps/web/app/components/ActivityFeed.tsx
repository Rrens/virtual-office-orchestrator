'use client';

import { useState } from 'react';
import type { WSEvent } from '../../hooks/useProjectWebSocket';

interface Props {
  events: WSEvent[];
  connected: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  'workflow.started': 'text-purple-400 bg-purple-400/10',
  'workflow.completed': 'text-emerald-400 bg-emerald-400/10',
  'task.assigned': 'text-blue-400 bg-blue-400/10',
  'task.started': 'text-cyan-400 bg-cyan-400/10',
  'task.review': 'text-amber-400 bg-amber-400/10',
  'task.completed': 'text-emerald-400 bg-emerald-400/10',
  'task.failed': 'text-red-400 bg-red-400/10',
  'approval.requested': 'text-rose-400 bg-rose-400/10',
  'agent.thinking': 'text-yellow-400 bg-yellow-400/10',
  'agent.working': 'text-indigo-400 bg-indigo-400/10',
  'tool.started': 'text-slate-400 bg-slate-400/10',
  'tool.completed': 'text-teal-400 bg-teal-400/10',
};

function formatDialogue(e: WSEvent): { role: string; text: string } | null {
  if (e.type === 'task.assigned') {
    return {
      role: 'Orchestrator',
      text: `Assigned task ${e.taskId ?? ''} to worker agent.`,
    };
  }
  if (e.type === 'agent.working') {
    return {
      role: String(e.agentRole ?? 'Agent'),
      text: `Started working on task ${e.taskId ?? ''}.`,
    };
  }
  if (e.type === 'task.review') {
    return {
      role: 'Orchestrator',
      text: `Task ${e.taskId ?? ''} completed initial work. Dispatched to QA/Security review.`,
    };
  }
  if (e.type === 'task.completed') {
    return {
      role: 'Reviewer',
      text: `Approved deliverables for task ${e.taskId ?? ''}. Moving to next phase.`,
    };
  }
  if (e.type === 'approval.requested') {
    return {
      role: 'Agent',
      text: `High-risk action reached. Requesting human founder approval: "${e.title ?? ''}".`,
    };
  }
  if (e.type === 'task.failed') {
    return {
      role: 'QA / Orchestrator',
      text: `Review rejected or execution failed on ${e.taskId ?? ''}. Retrying or escalating.`,
    };
  }
  return null;
}

export function ActivityFeed({ events, connected }: Props) {
  const [view, setView] = useState<'events' | 'dialogue'>('events');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
        <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => setView('events')}
            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
              view === 'events' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Raw Events
          </button>
          <button
            onClick={() => setView('dialogue')}
            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
              view === 'dialogue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            💬 Dialogue (PRD)
          </button>
        </div>

        <span
          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
            connected ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {events.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Waiting for events...</p>
        ) : view === 'dialogue' ? (
          // PRD §25 Dialogue View
          events
            .map((e, idx) => ({ d: formatDialogue(e), e, idx }))
            .filter(({ d }) => Boolean(d))
            .map(({ d, e, idx }) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300 text-[11px] font-mono">
                    [{d!.role}]
                  </span>
                  <span className="text-slate-500 text-[9px]">
                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
                <p className="text-slate-200 text-xs italic">"{d!.text}"</p>
              </div>
            ))
        ) : (
          // Raw Events View
          events.map((e, i) => {
            const badgeClass = TYPE_COLORS[e.type] ?? 'text-slate-400 bg-slate-400/10';
            return (
              <div key={i} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded font-mono font-medium ${badgeClass}`}>
                    {e.type}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
                {Boolean(e.taskId) && (
                  <p className="text-slate-400 truncate">Task: {String(e.taskId)}</p>
                )}
                {Boolean(e.newStatus) && (
                  <p className="text-slate-300">
                    Status: {String(e.previousStatus)} → {String(e.newStatus)}
                  </p>
                )}
                {Boolean(e.agentInstanceId) && (
                  <p className="text-slate-400 truncate">Agent: {String(e.agentInstanceId)}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
