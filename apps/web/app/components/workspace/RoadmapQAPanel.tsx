'use client';

import { useState } from 'react';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';

type Tab = 'roadmap' | 'keputusan' | 'output' | 'bukti-qa' | 'graphify';

interface Task {
  id: string;
  title: string;
  status: string;
  agentRole?: string;
  department?: string;
  subOrchestratorName?: string;
}

interface Props {
  goal: string;
  tasks: Task[];
  approvals: { id: string; title: string; status: string; description?: string }[];
  artifacts: { id: string; title: string; taskId?: string }[];
  events: WSEvent[];
  onOpenGraphify?: () => void;
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

export function RoadmapQAPanel({ goal, tasks, approvals, artifacts, events, onOpenGraphify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('roadmap');

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;

  return (
    <aside style={{
      width: 300,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--panel)',
      borderLeft: '1px solid var(--line)',
      flexShrink: 0,
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
        background: 'rgba(255,255,255,0.6)',
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
              padding: '8px 2px',
              fontSize: 10,
              fontWeight: 700,
              border: 'none',
              background: activeTab === t.key ? '#ffffff' : 'transparent',
              color: activeTab === t.key ? 'var(--text)' : 'var(--muted)',
              borderBottom: activeTab === t.key ? '2px solid var(--pingot)' : 'none',
              cursor: 'pointer',
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
                return (
                  <div
                    key={t.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: done ? '#f7fdf9' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${done ? 'var(--ok)' : blocked ? 'var(--bad)' : 'var(--line-strong)'}`,
                      background: done ? 'var(--ok)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff', fontWeight: 800,
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title}
                      </div>
                      <span className="chip" style={{ fontSize: 9, marginTop: 2, display: 'inline-flex' }}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
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
                    border: `1px solid ${a.status === 'approved' ? 'var(--ok)' : 'var(--line)'}`,
                    background: a.status === 'approved' ? '#f7fdf9' : '#ffffff',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{a.title}</div>
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
              artifacts.map((a) => (
                <button
                  key={a.id}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>📄 {a.title}</div>
                  {a.taskId && (
                    <div style={{ fontSize: 9, color: 'var(--faint)', marginTop: 2, fontFamily: 'monospace' }}>
                      task #{String(a.taskId).slice(0, 6)}
                    </div>
                  )}
                </button>
              ))
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
                      border: `1px solid ${isApproved ? 'var(--ok)' : 'var(--line)'}`,
                      background: isApproved ? '#f7fdf9' : '#ffffff',
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
    </aside>
  );
}
