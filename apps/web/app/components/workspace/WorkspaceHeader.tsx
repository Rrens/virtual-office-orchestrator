'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  projectName: string;
  projectStatus: string;
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  blockedTasks: number;
  usedTokens: number;
  connected: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  starting?: boolean;
}

function LiveTimer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');

  return (
    <span style={{
      fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
      color: running ? 'var(--ok)' : 'var(--faint)',
      letterSpacing: 1,
    }}>
      {h}:{m}:{s}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', planning: 'Planning', running: 'Running',
  completed: 'Selesai', paused: 'Dijeda', cancelled: 'Dibatalkan',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--faint)', planning: 'var(--warn)', running: 'var(--pingot)',
  completed: 'var(--ok)', paused: 'var(--warn)', cancelled: 'var(--bad)',
};

export function WorkspaceHeader({
  projectName, projectStatus, progressPercent,
  totalTasks, completedTasks, activeTasks, blockedTasks,
  usedTokens, connected,
  onStart, onPause, onResume, onCancel, starting,
}: Props) {
  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid var(--line)',
      background: 'var(--panel)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      gap: 16,
    }}>
      {/* Left: Project title + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: connected ? 'var(--ok)' : 'var(--faint)',
          flexShrink: 0,
        }} className={connected ? 'live-dot' : ''} />
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
          {projectName || 'Virtual Office'}
        </span>
        {projectStatus && (
          <span className="chip" style={{ color: STATUS_COLORS[projectStatus] ?? 'var(--muted)', borderColor: STATUS_COLORS[projectStatus] ?? 'var(--line-strong)' }}>
            <div className="chip-dot" style={{ backgroundColor: STATUS_COLORS[projectStatus] ?? 'var(--faint)' }} />
            {STATUS_LABELS[projectStatus] ?? projectStatus}
          </span>
        )}
      </div>

      {/* Center: Progress bar + timer */}
      <div style={{ flex: 1, maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
            {completedTasks}/{totalTasks} tugas
          </span>
          <LiveTimer running={projectStatus === 'running'} />
        </div>
        <div style={{ height: 5, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: progressPercent >= 100 ? 'var(--ok)' : 'var(--pingot)',
            width: `${progressPercent}%`,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Right: stat pills + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span className="chip">
          <div className="chip-dot" style={{ backgroundColor: 'var(--ok)' }} />
          {activeTasks} aktif
        </span>
        {blockedTasks > 0 && (
          <span className="chip" style={{ color: 'var(--bad-text)', borderColor: 'var(--bad-border)' }}>
            <div className="chip-dot" style={{ backgroundColor: 'var(--bad)' }} />
            {blockedTasks} blocked
          </span>
        )}
        <span className="chip" style={{ fontFamily: 'monospace' }}>
          {(usedTokens / 1000).toFixed(1)}k tok
        </span>

        {/* Action Buttons */}
        {(projectStatus === 'draft' || projectStatus === 'planning') && onStart && (
          <button
            onClick={onStart}
            disabled={starting}
            style={{
              padding: '5px 14px', borderRadius: 8, border: 'none',
              background: 'var(--pingot)', color: '#fff',
              fontWeight: 700, fontSize: 12, cursor: starting ? 'default' : 'pointer',
              opacity: starting ? 0.6 : 1,
            }}
          >
            {starting ? 'Memulai...' : 'Mulai'}
          </button>
        )}
        {projectStatus === 'running' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {onPause && (
              <button onClick={onPause} style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid var(--warn-border)',
                background: 'var(--warn-bg)', color: 'var(--warn-text)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>Jeda</button>
            )}
            {onCancel && (
              <button onClick={onCancel} style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid var(--bad-border)',
                background: 'var(--bad-bg)', color: 'var(--bad-text)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>Batalkan</button>
            )}
          </div>
        )}
        {projectStatus === 'paused' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {onResume && (
              <button onClick={onResume} style={{
                padding: '5px 14px', borderRadius: 8, border: 'none',
                background: 'var(--ok)', color: '#fff',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>Lanjutkan</button>
            )}
            {onCancel && (
              <button onClick={onCancel} style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid var(--bad-border)',
                background: 'var(--bad-bg)', color: 'var(--bad-text)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>Batalkan</button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
