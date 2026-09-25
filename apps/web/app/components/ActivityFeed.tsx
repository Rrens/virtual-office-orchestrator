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

export function ActivityFeed({ events, connected }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
        <h3 className="font-semibold text-white text-sm">Realtime Event Stream</h3>
        <span
          className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
            connected ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {events.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Waiting for events...</p>
        ) : (
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
                  <p className="text-slate-300">Status: {String(e.previousStatus)} → {String(e.newStatus)}</p>
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
