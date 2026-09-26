'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Props {
  projectId?: string;
  projectName: string;
  projectStatus: string;
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  blockedTasks: number;
  usedTokens: number;
  connected: boolean;
  workflowStartedAt?: string | null;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  starting?: boolean;
  onOpenProjectList?: () => void;
  onOpenFeedback?: () => void;
  onOpenLogs?: () => void;
  onOpenGraphify?: () => void;
  onExport?: () => void;
  exporting?: boolean;
}

function LiveTimer({ running, startedAt }: { running: boolean; startedAt?: string | null }) {
  const [seconds, setSeconds] = useState(() => {
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  });
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedAt && seconds === 0) {
      setSeconds(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    }
  }, [startedAt]);

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
      fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
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
  projectId,
  projectName, projectStatus, progressPercent,
  totalTasks, completedTasks, activeTasks, blockedTasks,
  usedTokens, connected, workflowStartedAt,
  onStart, onPause, onResume, onCancel, starting,
  onOpenProjectList, onOpenFeedback, onOpenLogs, onOpenGraphify, onExport, exporting,
}: Props) {
  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid var(--line)',
      background: 'var(--panel)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0,
      gap: 12,
      zIndex: 50,
    }}>
      {/* Left: Project Selector + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 0 }}>
        {onOpenProjectList && (
          <button
            onClick={onOpenProjectList}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid var(--line-strong)',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              backgroundColor: connected ? 'var(--ok)' : 'var(--faint)',
            }} className={connected ? 'live-dot' : ''} />
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {projectName || 'Pilih Proyek'}
            </span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
          </button>
        )}

        {projectStatus && (
          <span className="chip" style={{ color: STATUS_COLORS[projectStatus] ?? 'var(--muted)', borderColor: STATUS_COLORS[projectStatus] ?? 'var(--line-strong)' }}>
            <div className="chip-dot" style={{ backgroundColor: STATUS_COLORS[projectStatus] ?? 'var(--faint)' }} />
            {STATUS_LABELS[projectStatus] ?? projectStatus}
          </span>
        )}
      </div>

      {/* Center: Command Tool Bar (Code Studio, Kanban, Agent Management, Graphify, Logs, Export, Feedback) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Link
          href={projectId ? `/code?projectId=${projectId}` : '/code'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '5px 11px',
            borderRadius: 8,
            border: '1px solid rgba(56, 189, 248, 0.5)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.2))',
            color: '#bae6fd',
            fontSize: 11,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
            transition: 'all 0.15s ease',
          }}
        >
          <span>💻</span>
          <span>Code Studio</span>
        </Link>
        <Link
          href={projectId ? `/kanban?projectId=${projectId}` : '/kanban'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '5px 11px',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.5)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))',
            color: '#a7f3d0',
            fontSize: 11,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.15s ease',
          }}
        >
          <span>📊</span>
          <span>Kanban Divisi</span>
        </Link>
        <Link
          href={projectId ? `/agents?projectId=${projectId}` : '/agents'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '5px 11px',
            borderRadius: 8,
            border: '1px solid rgba(99, 102, 241, 0.6)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(59, 130, 246, 0.25))',
            color: '#e0e7ff',
            fontSize: 11,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <span>⚙️</span>
          <span>Agent Management</span>
        </Link>
        {onOpenGraphify && (
          <button
            onClick={onOpenGraphify}
            style={{
              padding: '4px 10px', borderRadius: 8,
              border: '1px solid rgba(129, 140, 248, 0.4)',
              background: 'rgba(129, 140, 248, 0.12)',
              color: '#818cf8', fontSize: 11, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📊 Graphify
          </button>
        )}
        {onOpenLogs && (
          <button
            onClick={onOpenLogs}
            style={{
              padding: '4px 10px', borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--muted)', fontSize: 11, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📜 Logs
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            disabled={exporting}
            style={{
              padding: '4px 10px', borderRadius: 8,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: exporting ? 'var(--faint)' : 'var(--ok)', fontSize: 11, fontWeight: 700,
              cursor: exporting ? 'default' : 'pointer',
            }}
          >
            {exporting ? 'Exporting...' : '📁 Export ZIP'}
          </button>
        )}
        {onOpenFeedback && (
          <button
            onClick={onOpenFeedback}
            style={{
              padding: '4px 10px', borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--muted)', fontSize: 11,
              cursor: 'pointer',
            }}
          >
            💬 Feedback
          </button>
        )}
      </div>

      {/* Center-Right: Progress bar + timer */}
      <div style={{ flex: 1, maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
            {completedTasks}/{totalTasks} tugas
          </span>
          <LiveTimer running={projectStatus === 'running'} startedAt={workflowStartedAt} />
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: progressPercent >= 100 ? 'var(--ok)' : 'linear-gradient(90deg, var(--pingot), #38bdf8)',
            width: `${progressPercent}%`,
            transition: 'width 0.6s ease',
            boxShadow: '0 0 6px rgba(56, 189, 248, 0.3)',
          }} />
        </div>
      </div>

      {/* Right: stat pills + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span className="chip">
          <div className="chip-dot" style={{ backgroundColor: 'var(--ok)' }} />
          {activeTasks} Task Aktif
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
              padding: '5px 12px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, var(--pingot), #3b82f6)', color: '#fff',
              fontWeight: 700, fontSize: 11, cursor: starting ? 'default' : 'pointer',
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
                padding: '4px 10px', borderRadius: 8, border: '1px solid var(--warn-border)',
                background: 'var(--warn-bg)', color: 'var(--warn-text)',
                fontWeight: 700, fontSize: 11, cursor: 'pointer',
              }}>Jeda</button>
            )}
            {onCancel && (
              <button onClick={onCancel} style={{
                padding: '4px 10px', borderRadius: 8, border: '1px solid var(--bad-border)',
                background: 'var(--bad-bg)', color: 'var(--bad-text)',
                fontWeight: 700, fontSize: 11, cursor: 'pointer',
              }}>Batalkan</button>
            )}
          </div>
        )}
        {projectStatus === 'paused' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {onResume && (
              <button onClick={onResume} style={{
                padding: '4px 12px', borderRadius: 8, border: 'none',
                background: 'var(--ok)', color: '#fff',
                fontWeight: 700, fontSize: 11, cursor: 'pointer',
              }}>Lanjutkan</button>
            )}
            {onCancel && (
              <button onClick={onCancel} style={{
                padding: '4px 10px', borderRadius: 8, border: '1px solid var(--bad-border)',
                background: 'var(--bad-bg)', color: 'var(--bad-text)',
                fontWeight: 700, fontSize: 11, cursor: 'pointer',
              }}>Batalkan</button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
