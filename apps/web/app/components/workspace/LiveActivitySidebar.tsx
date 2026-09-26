'use client';

import { useMemo, useState } from 'react';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';
import { AGENT_REGISTRY_30, DEPT_THEMES } from '../office/OfficeWaypoints';

interface Props {
  events: WSEvent[];
  connected: boolean;
  onFilterAgent?: (role: string | null) => void;
  isMobile?: boolean;
}

function formatTimestamp(ts?: string | number): string {
  if (!ts) return 'just now';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function LiveActivitySidebar({ events, connected, isMobile }: Props) {
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentRole, setSelectedAgentRole] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Filter out internal websocket handshake events
      if (e.type === 'connected') return false;

      const eventRole = String(e.agentRole ?? e.role ?? '');
      const text = `${String(e.type ?? '')} ${String(e.message ?? '')} ${eventRole}`.toLowerCase();

      // Search match
      if (searchQuery && !text.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Specific role filter
      if (selectedAgentRole) {
        if (eventRole === selectedAgentRole) return true;
        const agent = AGENT_REGISTRY_30.find((a) => a.role === selectedAgentRole);
        if (agent && text.includes(agent.name.toLowerCase())) return true;
        return false;
      }

      // Department filter
      if (filterDept) {
        const matchingRoles = AGENT_REGISTRY_30.filter((a) => a.dept === filterDept).map((a) => a.role);
        if (eventRole && matchingRoles.includes(eventRole)) return true;
        return false;
      }

      return true;
    });
  }, [events, filterDept, searchQuery, selectedAgentRole]);

  return (
    <aside style={{
      width: isMobile ? '100%' : 300,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--panel)',
      borderRight: isMobile ? 'none' : '1px solid var(--line)',
      backdropFilter: 'blur(16px)',
      flexShrink: 0,
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="chip-dot live-dot" style={{ backgroundColor: connected ? 'var(--ok)' : 'var(--faint)' }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Aktivitas 30 Agent</span>
        </div>
        <span className="chip" style={{ fontSize: 10 }}>{filteredEvents.length} aksi</span>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)' }}>
        <input
          type="text"
          placeholder="Cari aksi, nama agent, peran..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid var(--line-strong)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text)',
            fontSize: 11,
            outline: 'none',
          }}
        />
      </div>

      {/* Department Filter Pills */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '8px 12px',
        borderBottom: '1px solid var(--line)',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => { setFilterDept(null); setSelectedAgentRole(null); }}
          className="chip"
          style={{
            cursor: 'pointer',
            background: filterDept === null && selectedAgentRole === null ? 'var(--pingot)' : 'rgba(255,255,255,0.05)',
            color: filterDept === null && selectedAgentRole === null ? '#fff' : 'var(--muted)',
            borderColor: filterDept === null && selectedAgentRole === null ? 'var(--pingot)' : 'var(--line)',
            whiteSpace: 'nowrap',
          }}
        >
          Semua
        </button>
        {Object.entries(DEPT_THEMES).map(([deptKey, info]) => (
          <button
            key={deptKey}
            onClick={() => {
              setFilterDept(filterDept === deptKey ? null : deptKey);
              setSelectedAgentRole(null);
            }}
            className="chip"
            style={{
              cursor: 'pointer',
              background: filterDept === deptKey ? info.neon : 'rgba(255,255,255,0.05)',
              color: filterDept === deptKey ? '#fff' : 'var(--muted)',
              borderColor: filterDept === deptKey ? info.neon : 'var(--line)',
              whiteSpace: 'nowrap',
            }}
          >
            {info.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Event Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--faint)',
            fontSize: 12,
            padding: '32px 16px',
          }}>
            Belum ada aktivitas tercatat.
          </div>
        ) : (
          filteredEvents.map((e, i) => {
            const rawRole = e.agentRole ?? e.role;
            const role = rawRole ? String(rawRole) : null;
            const agent = role ? AGENT_REGISTRY_30.find((a) => a.role === role) : null;
            const deptInfo = role
              ? (DEPT_THEMES[agent?.dept || 'executive'] || DEPT_THEMES.executive)
              : { neon: '#64748b', base: '#334155' };
            const isNew = i === 0;

            const eventId = e.eventId != null ? String(e.eventId) : `evt-${i}`;
            const message = String(e.message ?? e.type ?? '');
            const taskId = e.taskId != null ? String(e.taskId) : null;

            return (
              <div
                key={eventId}
                className={`card-ui ${isNew ? 'feed-item-new' : ''}`}
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  transition: 'background 0.2s',
                  borderColor: isNew ? 'var(--line-strong)' : 'var(--line)',
                }}
              >
                {/* Event Header: Avatar + Name + Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: deptInfo.neon,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#fff',
                    }}>
                      {agent ? (agent.name.charAt(0)) : role ? role.charAt(0).toUpperCase() : '⚡'}
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>
                        {agent ? `${agent.name} · ${agent.title}` : role ? role : 'System Event'}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 9.5, color: 'var(--faint)', fontFamily: 'monospace' }}>
                    {formatTimestamp(e.timestamp)}
                  </span>
                </div>

                {/* Event Message */}
                <p style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: 'var(--feed-text)',
                  lineHeight: 1.4,
                }}>
                  {message}
                </p>

                {/* Task ID / Meta Tag */}
                {taskId && (
                  <div style={{
                    fontSize: 9.5,
                    fontFamily: 'monospace',
                    color: 'var(--faint)',
                  }}>
                    task #{taskId.slice(0, 8)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
