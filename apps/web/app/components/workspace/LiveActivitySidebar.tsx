'use client';

import { useMemo, useState } from 'react';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';

interface Props {
  events: WSEvent[];
  connected: boolean;
  onFilterAgent?: (role: string | null) => void;
}

const AGENT_AVATARS: Record<string, { initial: string; bg: string; name: string }> = {
  'orchestrator': { initial: 'P', bg: '#3f6fd1', name: 'Pingot' },
  'backend-engineer': { initial: 'Z', bg: '#2f9a6d', name: 'Zaki' },
  'ui-ux-designer': { initial: 'L', bg: '#d9772f', name: 'Lulu' },
  'qa-engineer': { initial: 'R', bg: '#7a5cc4', name: 'Risko' },
  'product-manager': { initial: 'M', bg: '#8b5cf6', name: 'PM' },
  'devops': { initial: 'D', bg: '#ec4899', name: 'DevOps' },
};

function formatTimestamp(ts?: string | number): string {
  if (!ts) return 'just now';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function LiveActivitySidebar({ events, connected }: Props) {
  const [filterRole, setFilterRole] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    if (!filterRole) return events;
    return events.filter((e) => {
      const eventRole = e.agentRole ?? e.role;
      if (eventRole) return eventRole === filterRole;

      // Fallback inference from event type or message
      const text = `${e.type} ${e.message ?? ''}`.toLowerCase();
      if (filterRole === 'orchestrator' && (text.includes('workflow') || text.includes('orchestrator') || text.includes('planning'))) return true;
      if (filterRole === 'backend-engineer' && (text.includes('backend') || text.includes('api') || text.includes('database') || text.includes('zaki'))) return true;
      if (filterRole === 'ui-ux-designer' && (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('lulu'))) return true;
      if (filterRole === 'qa-engineer' && (text.includes('qa') || text.includes('test') || text.includes('review') || text.includes('risko'))) return true;

      return false;
    });
  }, [events, filterRole]);

  return (
    <aside style={{
      width: 290,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--panel)',
      borderRight: '1px solid var(--line)',
      flexShrink: 0,
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="chip-dot live-dot" style={{ backgroundColor: connected ? 'var(--ok)' : 'var(--faint)' }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Aktivitas Langsung</span>
        </div>
        <span className="chip" style={{ fontSize: 10 }}>{filteredEvents.length} aksi</span>
      </div>

      {/* Agent Filter Pills */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '8px 12px',
        borderBottom: '1px solid var(--line)',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setFilterRole(null)}
          className="chip"
          style={{
            cursor: 'pointer',
            background: filterRole === null ? 'var(--text)' : '#fff',
            color: filterRole === null ? '#fff' : 'var(--muted)',
            borderColor: filterRole === null ? 'var(--text)' : 'var(--line-strong)',
          }}
        >
          Semua
        </button>
        {Object.entries(AGENT_AVATARS).slice(0, 4).map(([role, info]) => (
          <button
            key={role}
            onClick={() => setFilterRole(filterRole === role ? null : role)}
            className="chip"
            style={{
              cursor: 'pointer',
              background: filterRole === role ? info.bg : '#fff',
              color: filterRole === role ? '#fff' : 'var(--muted)',
              borderColor: filterRole === role ? info.bg : 'var(--line-strong)',
            }}
          >
            {info.initial} {info.name}
          </button>
        ))}
      </div>

      {/* Events Timeline Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--faint)', fontSize: 12 }}>
            Menunggu aktivitas tim...
          </div>
        ) : (
          filteredEvents.map((e, i) => {
            const role = String(e.agentRole ?? e.role ?? 'orchestrator');
            const agent = AGENT_AVATARS[role] ?? { initial: '?', bg: '#64748b', name: role };
            const isWarn = e.type?.includes('failed') || e.type?.includes('error');
            const isOk = e.type?.includes('completed') || e.type?.includes('approved');

            return (
              <div
                key={i}
                className={i === 0 ? 'feed-item-new' : ''}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${isWarn ? 'var(--bad-border)' : isOk ? 'var(--line-strong)' : 'var(--line)'}`,
                  background: isWarn ? 'var(--bad-bg)' : isOk ? '#f7fdf9' : '#ffffff',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                {/* Agent Avatar Initial */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: agent.bg, color: '#ffffff',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  {agent.initial}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                      {agent.name}
                    </span>
                    <span style={{ fontSize: 9.5, color: 'var(--faint)', fontFamily: 'monospace' }}>
                      {formatTimestamp(e.timestamp)}
                    </span>
                  </div>

                  <p style={{
                    fontSize: 11,
                    color: isWarn ? 'var(--bad-text)' : 'var(--feed-text)',
                    lineHeight: 1.35,
                    margin: 0,
                    wordBreak: 'break-word',
                  }}>
                    {String(e.message ?? e.type ?? '')}
                  </p>

                  {e.taskId != null && (
                    <div style={{
                      marginTop: 4,
                      fontSize: 9.5,
                      fontFamily: 'monospace',
                      color: 'var(--muted)',
                      background: 'rgba(0,0,0,0.03)',
                      padding: '1px 4px',
                      borderRadius: 4,
                      display: 'inline-block',
                    }}>
                      task #{String(e.taskId).slice(0, 6)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
