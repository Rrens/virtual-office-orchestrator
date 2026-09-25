'use client';

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

const AGENT_COLORS: Record<string, string> = {
  'orchestrator': 'var(--pingot)',
  'backend-engineer': 'var(--zaki)',
  'ui-ux-designer': 'var(--lulu)',
  'qa-engineer': 'var(--risko)',
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  'idle': { label: 'Idle', color: 'var(--faint)' },
  'working': { label: 'Bekerja', color: 'var(--ok)' },
  'thinking': { label: 'Berpikir', color: 'var(--warn)' },
  'blocked': { label: 'Terhambat', color: 'var(--bad)' },
  'completed': { label: 'Selesai', color: 'var(--ok)' },
};

export function AgentStatusDock({ agents, onSelectAgent }: Props) {
  return (
    <footer style={{
      height: 110,
      borderTop: '1px solid var(--line)',
      background: 'var(--panel)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {agents.map((agent) => {
        const color = AGENT_COLORS[agent.role] ?? '#6f6a62';
        const badge = STATUS_BADGES[agent.status] ?? { label: agent.status, color: 'var(--muted)' };

        return (
          <button
            key={agent.id}
            onClick={() => agent.assignedAgentId && onSelectAgent?.(agent.assignedAgentId)}
            style={{
              flex: '1 0 220px',
              maxWidth: 260,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(60,45,25,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Agent Avatar Circle */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 800,
              color: '#ffffff',
              flexShrink: 0,
            }}>
              {agent.name.charAt(0)}
            </div>

            {/* Agent Info */}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {agent.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {agent.currentTask || 'Tidak ada task aktif'}
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="chip" style={{ fontSize: 9 }}>
                  <div className="chip-dot" style={{ backgroundColor: badge.color }} />
                  {badge.label}
                </span>
                <span style={{ fontSize: 9, color: 'var(--faint)', fontFamily: 'monospace' }}>
                  {agent.actionsCount} aksi
                </span>
                <span style={{ fontSize: 9, color: 'var(--faint)', fontFamily: 'monospace' }}>
                  {(agent.tokensUsed / 1000).toFixed(1)}k tok
                </span>
              </div>
            </div>
          </button>
        );
      })}

      {agents.length === 0 && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--faint)',
          fontSize: 12,
        }}>
          Tidak ada agen aktif saat ini.
        </div>
      )}
    </footer>
  );
}
