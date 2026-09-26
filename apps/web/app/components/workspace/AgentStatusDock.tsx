'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  projectId?: string;
  onSelectAgent?: (agentId: string) => void;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  idle:      { label: 'Santai',   color: 'var(--faint)' },
  working:   { label: 'Bekerja',  color: 'var(--ok)' },
  thinking:  { label: 'Mikir',    color: 'var(--warn)' },
  blocked:   { label: 'Tertahan', color: 'var(--bad)' },
  completed: { label: 'Selesai',  color: 'var(--ok)' },
};

export function AgentStatusDock({ agents, projectId, onSelectAgent }: Props) {
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const statusPriority: Record<string, number> = {
    working: 0,
    thinking: 1,
    blocked: 2,
    completed: 3,
    idle: 4,
  };

  const sortedAgents = [...fullAgents].sort((a, b) => {
    const pa = statusPriority[a.status] ?? 5;
    const pb = statusPriority[b.status] ?? 5;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  const filtered = sortedAgents.filter((a) => {
    const matchesDept = filterDept ? a.dept === filterDept : true;
    const matchesSearch =
      !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <footer
      style={{
        height: 110,
        borderTop: '1px solid var(--line)',
        background: 'var(--panel)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 16px 8px',
        flexShrink: 0,
        gap: 6,
      }}
    >
      {/* Filter Line: Dept Pills + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
        <button
          onClick={() => setFilterDept(null)}
          className="chip"
          style={{
            cursor: 'pointer',
            fontSize: 9.5,
            padding: '1px 6px',
            background: filterDept === null ? 'var(--pingot)' : 'rgba(255,255,255,0.05)',
            color: filterDept === null ? '#fff' : 'var(--muted)',
          }}
        >
          Semua (30)
        </button>
        {Object.entries(DEPT_THEMES).map(([deptKey, info]) => (
          <button
            key={deptKey}
            onClick={() => setFilterDept(filterDept === deptKey ? null : deptKey)}
            className="chip"
            style={{
              cursor: 'pointer',
              fontSize: 9.5,
              padding: '1px 6px',
              background: filterDept === deptKey ? info.neon : 'rgba(255,255,255,0.05)',
              color: filterDept === deptKey ? '#fff' : 'var(--muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {info.name.split(' ')[0]}
          </button>
        ))}

        <input
          type="text"
          placeholder="Cari agent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '3px 10px',
            borderRadius: 99,
            border: '1px solid var(--line)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text)',
            fontSize: 10,
            width: 110,
            outline: 'none',
          }}
        />

        <Link
          href={projectId ? `/code?projectId=${projectId}` : '/code'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 8,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#7dd3fc',
            fontSize: 10,
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span>💻</span>
          <span>Code</span>
        </Link>

        <Link
          href={projectId ? `/kanban?projectId=${projectId}` : '/kanban'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            fontSize: 10,
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span>📊</span>
          <span>Kanban</span>
        </Link>

        <Link
          href={projectId ? `/agents?projectId=${projectId}` : '/agents'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span>⚙️</span>
          <span>Agents</span>
        </Link>
      </div>

      {/* Agent Cards Scroll Area */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
          flex: 1,
          alignItems: 'stretch',
        }}
      >
        {filtered.map((agent) => {
          const theme = DEPT_THEMES[agent.dept] || DEPT_THEMES.executive;
          const badge = STATUS_BADGES[agent.status] ?? STATUS_BADGES.idle;
          const isActive = ['working', 'thinking'].includes(agent.status);

          return (
            <button
              key={agent.role}
              onClick={() => onSelectAgent?.(agent.assignedAgentId ?? agent.role)}
              style={{
                flexShrink: 0,
                width: 135,
                borderRadius: 10,
                border: `1px solid ${isActive ? theme.neon : 'var(--line)'}`,
                background: isActive ? `${theme.neon}12` : 'rgba(255,255,255,0.03)',
                padding: '6px 8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isActive ? `0 0 12px ${theme.neon}30` : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: theme.neon,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {agent.name.charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.title}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: badge.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.color }} />
                  {badge.label}
                </span>
                <span style={{ fontSize: 9, color: 'var(--faint)', fontFamily: 'monospace' }}>
                  {(agent.tokensUsed / 1000).toFixed(1)}k
                </span>
              </div>

              {agent.currentTask && (
                <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {agent.currentTask}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
}
