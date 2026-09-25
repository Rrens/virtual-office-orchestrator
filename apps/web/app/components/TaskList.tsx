'use client';

import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  agentRole: string;
  status: string;
  outputArtifacts: string[];
}

interface Props {
  tasks: Task[];
  onViewArtifacts?: (taskId: string, taskTitle: string) => void;
}

const STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-slate-700 text-slate-300',
  QUEUED: 'bg-blue-900/60 text-blue-300',
  ASSIGNED: 'bg-cyan-900/60 text-cyan-300',
  RUNNING: 'bg-indigo-900/60 text-indigo-300 animate-pulse',
  REVIEW: 'bg-amber-900/60 text-amber-300',
  APPROVED: 'bg-emerald-900/60 text-emerald-300',
  COMPLETED: 'bg-emerald-950 text-emerald-400 border border-emerald-800/60',
  BLOCKED: 'bg-rose-950 text-rose-300 border border-rose-800/60',
  FAILED: 'bg-red-950 text-red-400 border border-red-800/60',
};

const FILTER_OPTIONS = ['ALL', 'RUNNING', 'REVIEW', 'COMPLETED', 'BLOCKED', 'FAILED'] as const;

export function TaskList({ tasks, onViewArtifacts }: Props) {
  const [filter, setFilter] = useState<typeof FILTER_OPTIONS[number]>('ALL');

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700/40">
        <p className="text-slate-400 text-sm">No tasks generated yet. Start the project workflow to build the execution plan.</p>
      </div>
    );
  }

  const filtered = filter === 'ALL'
    ? tasks
    : tasks.filter((t) => {
        if (filter === 'RUNNING') return ['QUEUED', 'ASSIGNED', 'RUNNING'].includes(t.status);
        if (filter === 'COMPLETED') return ['COMPLETED', 'APPROVED'].includes(t.status);
        return t.status === filter;
      });

  return (
    <div className="space-y-3">
      {/* Filter Bar (PRD §27) */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((f) => {
          const count = f === 'ALL'
            ? tasks.length
            : f === 'RUNNING'
            ? tasks.filter((t) => ['QUEUED', 'ASSIGNED', 'RUNNING'].includes(t.status)).length
            : f === 'COMPLETED'
            ? tasks.filter((t) => ['COMPLETED', 'APPROVED'].includes(t.status)).length
            : tasks.filter((t) => t.status === f).length;

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40'
              }`}
            >
              {f} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs rounded-xl bg-slate-800/20 border border-slate-800">
            No tasks match the selected filter.
          </div>
        ) : (
          filtered.map((task) => {
            const badgeClass = STATUS_BADGES[task.status] ?? 'bg-slate-800 text-slate-300';
            const hasArtifacts = ['COMPLETED', 'APPROVED', 'REVIEW'].includes(task.status);

            return (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{task.id}</span>
                    <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span>Role: <strong className="text-slate-300">{task.agentRole}</strong></span>
                    {task.outputArtifacts.length > 0 && (
                      <span>Output: {task.outputArtifacts.join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasArtifacts && onViewArtifacts && (
                    <button
                      onClick={() => onViewArtifacts(task.id, task.title)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                    >
                      📄 View Artifacts
                    </button>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold font-mono whitespace-nowrap ${badgeClass}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
