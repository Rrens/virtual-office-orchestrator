'use client';

import { useState } from 'react';
import { AGENT_REGISTRY_30, DEPT_THEMES } from '../office/OfficeWaypoints';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  currentTask?: string;
  tokensUsed: number;
  actionsCount: number;
  assignedAgentId?: string | null;
}

interface Props {
  agents: Agent[];
  onSelectAgent?: (agentId: string) => void;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  idle:      { label: 'Santai',   color: 'var(--faint)' },
  working:   { label: 'Bekerja',  color: 'var(--ok)' },
  thinking:  { label: 'Mikir',    color: 'var(--warn)' },
  blocked:   { label: 'Tertahan', color: 'var(--bad)' },
  completed: { label: 'Selesai',  color: 'var(--ok)' },
};

export function AgentStatusDock({ agents, onSelectAgent }: Props) {
  const [filterDept, setFilterDept] = useState<string | null>(null);

  // Merge full 30 agent registry with active runtime stats
  const fullAgents = AGENT_REGISTRY_30.map((reg) => {
    const active = agents.find((a) => a.role === reg.role);
    return {
      id: reg.role,
      role: reg.role,
      name: reg.name,
      title: reg.title,
      dept: reg.dept,
      status: active?.status ?? 'idle',
      currentTask: active?.currentTask,
      tokensUsed: active?.tokensUsed ?? 0,
      actionsCount: active?.actionsCount ?? 0,
      assignedAgentId: active?.assignedAgentId,
    };
  });

  const filtered = filterDept ? fullAgents.filter((a) => a.dept === filterDept) : fullAgents;

  return (
    <footer
      style={{
        height: 105,
        borderTop: '1px solid var(--line)',
        background: 'var(--panel)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 16px 8px',
        flexShrink: 0,
        gap: 6,
      }}
    >
      {/* Mini Dept Filter Line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
        <button
          onClick={() => setFilterDept(null)}
          className="chip"
          style={{
            cursor: 'pointer',
            fontSize: 9.5,
            padding: '1px 6px',
            background: filterDept === null ? '#1e293b' : '#fff',
            color: filterDept === null ? '#fff' : 'var(--muted)',
          }}
        >
          Semua (30)
        </button>
        {Object.entries(DEPT_THEMES).map(([deptKey, theme]) => {
          const count = fullAgents.filter((a) => a.dept === deptKey).length;
          const isSelected = filterDept === deptKey;
          return (
            <button
              key={deptKey}
              onClick={() => setFilterDept(isSelected ? null : deptKey)}
              className="chip"
              style={{
                cursor: 'pointer',
                fontSize: 9.5,
                padding: '1px 6px',
                background: isSelected ? theme.color : '#fff',
                color: isSelected ? '#fff' : 'var(--muted)',
                borderColor: isSelected ? theme.color : 'var(--line-strong)',
              }}
            >
              {theme.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Agents Scroll Track */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          flex: 1,
          alignItems: 'center',
          paddingBottom: 2,
        }}
      >
        {filtered.map((agent) => {
          const dept = DEPT_THEMES[agent.dept] ?? DEPT_THEMES.operations;
          const badge = STATUS_BADGES[agent.status] ?? STATUS_BADGES.idle;
          const isBusy = agent.status === 'working' || agent.status === 'thinking';

          return (
            <button
              key={agent.role}
              onClick={() => agent.assignedAgentId && onSelectAgent?.(agent.assignedAgentId)}
              style={{
                flex: '0 0 190px',
                padding: '6px 10px',
                borderRadius: 10,
                border: `1px solid ${isBusy ? dept.color : 'var(--line)'}`,
                background: isBusy ? '#faf8f5' : '#ffffff',
                cursor: agent.assignedAgentId ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left',
                boxShadow: isBusy ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {/* Avatar circle */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: dept.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {agent.name.charAt(0)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.name}
                  </span>
                  <span style={{ fontSize: 9, color: badge.color, fontWeight: 600 }}>
                    {badge.label}
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agent.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
