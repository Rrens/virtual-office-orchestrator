'use client';

import { useMemo } from 'react';

interface Task {
  id: string;
  title: string;
  agentRole: string;
  status: string;
  assignedAgentId?: string | null;
}

interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

interface Props {
  tasks: Task[];
  dependencies?: TaskDependency[];
  onSelectTask?: (taskId: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING:  { bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-400' },
  QUEUED:   { bg: 'bg-blue-950', border: 'border-blue-700', text: 'text-blue-300' },
  ASSIGNED: { bg: 'bg-cyan-950', border: 'border-cyan-700', text: 'text-cyan-300' },
  RUNNING:  { bg: 'bg-indigo-950', border: 'border-indigo-500', text: 'text-indigo-300' },
  REVIEW:   { bg: 'bg-amber-950', border: 'border-amber-600', text: 'text-amber-300' },
  APPROVED: { bg: 'bg-emerald-950', border: 'border-emerald-600', text: 'text-emerald-300' },
  COMPLETED:{ bg: 'bg-emerald-950', border: 'border-emerald-500', text: 'text-emerald-200' },
  BLOCKED:  { bg: 'bg-rose-950', border: 'border-rose-700', text: 'text-rose-300' },
  FAILED:   { bg: 'bg-red-950', border: 'border-red-700', text: 'text-red-300' },
  CANCELLED:{ bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-500' },
};

const NODE_W = 160;
const NODE_H = 64;
const COL_GAP = 60;
const ROW_GAP = 24;

function computeLevels(tasks: Task[], deps: TaskDependency[]): Map<string, number> {
  const depMap = new Map<string, Set<string>>();
  tasks.forEach((t) => depMap.set(t.id, new Set()));
  deps.forEach((d) => depMap.get(d.taskId)?.add(d.dependsOnTaskId));

  const levels = new Map<string, number>();
  const queue = tasks.filter((t) => (depMap.get(t.id)?.size ?? 0) === 0).map((t) => t.id);
  queue.forEach((id) => levels.set(id, 0));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const level = levels.get(id) ?? 0;
    tasks.forEach((t) => {
      if (depMap.get(t.id)?.has(id)) {
        const newLevel = Math.max(levels.get(t.id) ?? 0, level + 1);
        levels.set(t.id, newLevel);
        queue.push(t.id);
      }
    });
  }

  return levels;
}

export function WorkflowDagVisualizer({ tasks, dependencies = [], onSelectTask }: Props) {
  const { positions, svgWidth, svgHeight } = useMemo(() => {
    if (tasks.length === 0) return { positions: new Map(), svgWidth: 0, svgHeight: 0 };

    const levels = computeLevels(tasks, dependencies);
    const maxLevel = Math.max(...Array.from(levels.values()));

    const byLevel: Map<number, Task[]> = new Map();
    tasks.forEach((t) => {
      const lvl = levels.get(t.id) ?? 0;
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(t);
    });

    const positions = new Map<string, { x: number; y: number }>();
    let totalHeight = 0;

    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const col = byLevel.get(lvl) ?? [];
      const colHeight = col.length * (NODE_H + ROW_GAP) - ROW_GAP;
      totalHeight = Math.max(totalHeight, colHeight);
    }

    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const col = byLevel.get(lvl) ?? [];
      const colHeight = col.length * (NODE_H + ROW_GAP) - ROW_GAP;
      const startY = (totalHeight - colHeight) / 2;
      col.forEach((t, i) => {
        positions.set(t.id, {
          x: lvl * (NODE_W + COL_GAP),
          y: startY + i * (NODE_H + ROW_GAP),
        });
      });
    }

    const svgWidth = (maxLevel + 1) * (NODE_W + COL_GAP) - COL_GAP + 20;
    const svgHeight = totalHeight + 20;

    return { positions, svgWidth, svgHeight };
  }, [tasks, dependencies]);

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm rounded-xl bg-slate-800/40 border border-slate-700/60">
        No tasks in workflow yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl bg-slate-900/60 border border-slate-800 p-4">
      <svg
        width={svgWidth + 20}
        height={svgHeight + 20}
        style={{ minHeight: 200 }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
        </defs>

        {/* Edges */}
        {dependencies.map((dep) => {
          const from = positions.get(dep.dependsOnTaskId);
          const to = positions.get(dep.taskId);
          if (!from || !to) return null;

          const x1 = from.x + NODE_W + 10;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x - 2;
          const y2 = to.y + NODE_H / 2;
          const mx = (x1 + x2) / 2;

          return (
            <path
              key={`${dep.dependsOnTaskId}-${dep.taskId}`}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {tasks.map((task) => {
          const pos = positions.get(task.id);
          if (!pos) return null;
          const colors = STATUS_COLORS[task.status] ?? STATUS_COLORS.PENDING;

          return (
            <foreignObject
              key={task.id}
              x={pos.x + 10}
              y={pos.y + 10}
              width={NODE_W}
              height={NODE_H}
            >
              <div
                onClick={() => onSelectTask?.(task.id)}
                className={`w-full h-full rounded-xl border ${colors.bg} ${colors.border} px-3 py-2 cursor-pointer hover:brightness-125 transition-all flex flex-col justify-between`}
              >
                <p className={`text-[11px] font-semibold leading-tight line-clamp-2 ${colors.text}`}>
                  {task.title}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-slate-500 font-mono truncate max-w-[90px]">
                    {task.agentRole}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${colors.text}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}
