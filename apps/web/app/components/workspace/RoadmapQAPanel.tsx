'use client';

import { useState } from 'react';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';

type Tab = 'roadmap' | 'keputusan' | 'output' | 'bukti-qa' | 'graphify';

interface Task {
  id: string;
  title: string;
  status: string;
  description?: string;
  agentRole?: string;
  department?: string;
  subOrchestratorName?: string;
  outputArtifacts?: string[];
}

interface Props {
  goal: string;
  tasks: Task[];
  approvals: { id: string; title: string; status: string; description?: string }[];
  artifacts: { id: string; title: string; taskId?: string; taskStatus?: string; taskTitle?: string }[];
  events: WSEvent[];
  onOpenGraphify?: () => void;
  onOpenArtifact?: (taskId: string, title: string) => void;
  isMobile?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  'orchestrator': '#3f6fd1',
  'backend-engineer': '#2f9a6d',
  'ui-ux-designer': '#d9772f',
  'qa-engineer': '#7a5cc4',
};

const STATUS_LABELS: Record<string, string> = {
  'QUEUED': 'Dijadwalkan', 'ASSIGNED': 'Ditugaskan', 'RUNNING': 'Berjalan',
  'REVIEW': 'Review', 'APPROVED': 'Disetujui', 'COMPLETED': 'Selesai',
  'BLOCKED': 'Terhambat', 'FAILED': 'Gagal',
};

export function RoadmapQAPanel({ goal, tasks, approvals, artifacts, events, onOpenGraphify, onOpenArtifact, isMobile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('roadmap');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;

  return (
    <aside style={{
      width: isMobile ? '100%' : 300,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--panel)',
      borderLeft: isMobile ? 'none' : '1px solid var(--line)',
      flexShrink: 0,
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Goal Block */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10, color: 'var(--faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          Tujuan Proyek
        </div>
        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
          {goal || 'Belum ada proyek aktif.'}
        </p>
        <div style={{ marginTop: 8, height: 4, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'var(--ok)', width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
          <span>Progress</span>
          <span>{completedCount}/{tasks.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--line)',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
      }}>
        {([
          { key: 'roadmap', label: 'Roadmap' },
          { key: 'graphify', label: 'Graphify' },
          { key: 'keputusan', label: 'Keputusan' },
          { key: 'output', label: 'Output' },
          { key: 'bukti-qa', label: 'QA' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1,
              padding: '10px 2px',
              fontSize: 11,
              fontWeight: 700,
              border: 'none',
              background: activeTab === t.key ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === t.key ? '#ffffff' : 'var(--muted)',
              borderBottom: activeTab === t.key ? '2px solid var(--pingot)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {activeTab === 'roadmap' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', padding: 24 }}>
                Belum ada task.
              </p>
            ) : (
              tasks.map((t, i) => {
                const done = t.status === 'COMPLETED' || t.status === 'APPROVED';
                const blocked = t.status === 'BLOCKED' || t.status === 'FAILED';
                const running = t.status === 'RUNNING' || t.status === 'ASSIGNED';
                const displayTitle = (t.title && t.title !== '...') ? t.title : (t.description && t.description !== '...') ? t.description : `Tugas #${i + 1} (${t.agentRole || 'Tim'})`;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    title="Klik untuk melihat detail tugas"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${done ? 'rgba(16, 185, 129, 0.35)' : running ? 'rgba(99, 102, 241, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                      background: done ? 'rgba(16, 185, 129, 0.08)' : running ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backdropFilter: 'blur(6px)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${done ? 'var(--ok)' : blocked ? 'var(--bad)' : 'var(--line-strong)'}`,
                      background: done ? 'var(--ok)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff', fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#f8fafc', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayTitle}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span className="chip" style={{
                          fontSize: 9,
                          display: 'inline-flex',
                          background: done ? 'rgba(16, 185, 129, 0.2)' : running ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          color: done ? '#34d399' : running ? '#a5b4fc' : '#94a3b8',
                          borderColor: done ? 'rgba(16, 185, 129, 0.3)' : running ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        }}>
                          {STATUS_LABELS[t.status] ?? t.status}
                        </span>
                        {t.agentRole && (
                          <span style={{ fontSize: 9, color: 'var(--faint)', fontFamily: 'monospace' }}>
                            {t.agentRole.replace(/-/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'graphify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '16px 6px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                📊
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                Graphify Knowledge Graph
              </h4>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.35 }}>
                Visualisasi hubungan antar agent, artifact, API, database, dan komponen UI dalam proyek ini.
              </p>
            </div>
            <button
              onClick={onOpenGraphify}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--pingot)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Buka Graphify Explorer
            </button>
          </div>
        )}

        {activeTab === 'keputusan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {approvals.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', padding: 24 }}>
                Belum ada keputusan approval.
              </p>
            ) : (
              approvals.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${a.status === 'approved' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                    background: a.status === 'approved' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.55)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, lineHeight: 1.3 }}>{a.description || 'Tidak ada deskripsi.'}</div>
                  <span className="chip" style={{ fontSize: 9, marginTop: 4 }}>
                    <div className="chip-dot" style={{ backgroundColor: a.status === 'approved' ? 'var(--ok)' : a.status === 'pending' ? 'var(--warn)' : 'var(--bad)' }} />
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {artifacts.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', padding: 24 }}>
                Belum ada artifact/output.
              </p>
            ) : (
              artifacts.map((a) => {
                const parentTask = tasks.find((t) => t.id === a.taskId);
                const status = a.taskStatus || parentTask?.status || 'PENDING';
                const isReady = status === 'COMPLETED' || status === 'APPROVED';

                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (isReady && a.taskId) {
                        onOpenArtifact?.(a.taskId, a.title);
                      } else if (parentTask) {
                        setSelectedTask(parentTask);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${isReady ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      background: isReady ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.65)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📄 {(a.title && a.title.trim().length > 0 && a.title !== '...' && a.title !== '..' && a.title !== '.') ? a.title : `${a.taskTitle || 'Dokumen'} Output`}
                      </div>
                      {isReady ? (
                        <span style={{ fontSize: 9, color: '#34d399', fontWeight: 700, flexShrink: 0 }}>
                          ✓ Siap
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
                          ⏳ Proses
                        </span>
                      )}
                    </div>

                    {isReady ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        {a.taskId && (
                          <span style={{ fontSize: 9, color: 'var(--faint)', fontFamily: 'monospace' }}>
                            task #{String(a.taskId).slice(0, 6)}
                          </span>
                        )}
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--pingot)' }}>
                          Lihat Preview ➔
                        </span>
                      </div>
                    ) : (
                      <div className="marquee-box" style={{ marginTop: 4, background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                        <span className="marquee-running" style={{ fontSize: 9.5, fontWeight: 700, color: '#fbbf24' }}>
                          ⚡ Sedang Dikerjakan · On Progress... (Agent sedang menulis dokumen/kode ini)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'bukti-qa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(() => {
              const qaEvents = events.filter((e) => {
                const t = String(e.type ?? '').toLowerCase();
                const role = String(e.agentRole ?? '').toLowerCase();
                const msg = String(e.message ?? '').toLowerCase();
                return (
                  t.includes('qa') ||
                  t.includes('review') ||
                  t.includes('approval') ||
                  t.includes('handoff') ||
                  role === 'qa-engineer' ||
                  role === 'security-engineer' ||
                  msg.includes('review') ||
                  msg.includes('qa') ||
                  msg.includes('disetujui')
                );
              });

              if (qaEvents.length === 0) {
                return (
                  <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px', fontWeight: 600 }}>
                      Belum ada bukti QA
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--faint)', margin: 0, lineHeight: 1.4 }}>
                      Setiap task yang selesai dikerjakan developer akan otomatis diuji oleh Risko (QA Lead) dan dicatat di sini.
                    </p>
                  </div>
                );
              }

              return qaEvents.map((e, i) => {
                const eType = String(e.type ?? '');
                const eMsg = String(e.message ?? '');
                const isApproved = eType.includes('approved') || eMsg.includes('disetujui');
                const isRejected = eType.includes('failed') || eType.includes('rejected');
                const badgeColor = isApproved ? 'var(--ok)' : isRejected ? 'var(--bad)' : 'var(--warn)';

                return (
                  <div
                    key={i}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                      background: isApproved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.55)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--risko)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 800 }}>
                          R
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>Risko · QA Lead</span>
                      </div>
                      <span className="chip" style={{ fontSize: 9, color: badgeColor, borderColor: badgeColor }}>
                        {eType.replace('approval.', '').replace('task.', '')}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--feed-text)', lineHeight: 1.35 }}>
                      {eMsg || eType}
                    </div>
                    {e.taskId != null && (
                      <div style={{ fontSize: 9, color: 'var(--faint)', marginTop: 3, fontFamily: 'monospace' }}>
                        task #{String(e.taskId).slice(0, 8)}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">📋 Detail Tugas Roadmap</span>
                <span className="chip" style={{ fontSize: 9 }}>
                  {STATUS_LABELS[selectedTask.status] ?? selectedTask.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Judul Tugas</p>
                <p className="text-white font-bold text-sm bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {selectedTask.title && selectedTask.title !== '...' ? selectedTask.title : selectedTask.description || 'Tugas Proyek'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Deskripsi & Instruksi</p>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {selectedTask.description && selectedTask.description !== '...' ? selectedTask.description : 'Tidak ada deskripsi rinci.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Pelaksana / Role</p>
                  <p className="text-indigo-400 font-semibold font-mono">{selectedTask.agentRole || 'orchestrator'}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">ID Tugas</p>
                  <p className="text-slate-400 font-mono text-[11px] truncate">#{selectedTask.id}</p>
                </div>
              </div>

              {selectedTask.outputArtifacts && selectedTask.outputArtifacts.length > 0 && (
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Target Artefak / Output</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTask.outputArtifacts.map((art) => (
                      <span key={art} className="px-2 py-1 rounded bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-[10px] font-mono">
                        📄 {art}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
