'use client';

import { useState } from 'react';
import { useAgentSpectator } from '../../hooks/useAgentSpectator';
import type { WSEvent } from '../../hooks/useProjectWebSocket';
import type { SpectatorRun, SpectatorToolCall } from '../../hooks/useAgentSpectator';

interface Props {
  agentInstanceId: string;
  agentRole: string;
  agentName: string;
  allEvents: WSEvent[];
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  idle:      { label: 'Idle',       color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  assigned:  { label: 'Assigned',   color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  thinking:  { label: 'Thinking',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  working:   { label: 'Working',    color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  reviewing: { label: 'Reviewing',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  completed: { label: 'Completed',  color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  error:     { label: 'Error',      color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  escalated: { label: 'Escalated',  color: '#fb7185', bg: 'rgba(251,113,133,0.15)' },
};

const EVENT_ICON: Record<string, string> = {
  'agent.working':   '⚡',
  'agent.thinking':  '🤔',
  'agent.reviewing': '🔍',
  'agent.completed': '✅',
  'agent.failed':    '❌',
  'agent.assigned':  '📋',
  'task.assigned':   '📋',
  'task.started':    '🚀',
  'task.review':     '🔍',
  'task.completed':  '✅',
  'task.failed':     '❌',
  'tool.started':    '⚙️',
  'tool.completed':  '✅',
  'tool.failed':     '❌',
};

function ToolCallRow({ tc }: { tc: SpectatorToolCall }) {
  const [open, setOpen] = useState(false);
  const statusColor = tc.status === 'success' ? '#34d399' : tc.status === 'running' ? '#a78bfa' : '#f87171';

  let inputParsed: any = null;
  let outputParsed: any = null;
  try { inputParsed = JSON.parse(tc.inputJson || '{}'); } catch {}
  try { outputParsed = JSON.parse(tc.outputJson || '{}'); } catch {}

  return (
    <div style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 6 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px', background: 'rgba(255,255,255,0.04)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13 }}>⚙️</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#e0e7ff', fontFamily: 'monospace' }}>
          {tc.toolName}
        </span>
        {tc.durationMs > 0 && (
          <span style={{ fontSize: 9, color: '#64748b' }}>{tc.durationMs}ms</span>
        )}
        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>
          {tc.status === 'success' ? '✓' : tc.status === 'running' ? '...' : '✗'}
        </span>
        <span style={{ fontSize: 9, color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Input</div>
            <pre style={{
              fontSize: 10, color: '#7dd3fc', fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.4)', padding: '6px 8px', borderRadius: 6,
              overflow: 'auto', maxHeight: 120, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {JSON.stringify(inputParsed, null, 2)}
            </pre>
          </div>
          {tc.outputJson && tc.outputJson !== '{}' && (
            <div>
              <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Output</div>
              <pre style={{
                fontSize: 10, color: '#86efac', fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.4)', padding: '6px 8px', borderRadius: 6,
                overflow: 'auto', maxHeight: 160, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>
                {JSON.stringify(outputParsed, null, 2)}
              </pre>
            </div>
          )}
          {tc.errorMessage && (
            <div style={{ fontSize: 10, color: '#f87171', fontFamily: 'monospace', background: 'rgba(248,113,113,0.1)', padding: '4px 8px', borderRadius: 6 }}>
              {tc.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunSection({ run }: { run: SpectatorRun }) {
  const [outputOpen, setOutputOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const statusColor = run.status === 'success' ? '#34d399' : run.status === 'running' ? '#a78bfa' : '#f87171';

  function copyOutput() {
    if (run.outputContent) {
      navigator.clipboard.writeText(run.outputContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{ borderRadius: 12, border: '1px solid rgba(99,102,241,0.25)', padding: '10px 12px', background: 'rgba(99,102,241,0.07)', marginBottom: 10 }}>
      {/* Run header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>
            {run.status === 'running' ? '⚡ Running' : run.status === 'success' ? '✅ Success' : '❌ Failed'}
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
            {run.modelUsed?.split(':')?.[1] || run.modelUsed}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: '#64748b' }}>
          {run.durationMs > 0 && <span>{(run.durationMs / 1000).toFixed(1)}s</span>}
          {run.promptTokens > 0 && <span>{run.promptTokens + run.completionTokens} tok</span>}
        </div>
      </div>

      {/* Task title */}
      <div style={{ fontSize: 11, color: '#e0e7ff', fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>
        {run.taskTitle}
      </div>

      {/* Tool calls */}
      {run.toolCalls.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            Tool Calls ({run.toolCalls.length})
          </div>
          {run.toolCalls.map((tc) => <ToolCallRow key={tc.id} tc={tc} />)}
        </div>
      )}

      {/* Output content */}
      {run.outputContent && (
        <div>
          <button
            onClick={() => setOutputOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 6, padding: '5px 10px', cursor: 'pointer', marginBottom: outputOpen ? 6 : 0,
            }}
          >
            <span style={{ fontSize: 10 }}>📄</span>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#7dd3fc', textAlign: 'left' }}>
              Output / Kode ({Math.round(run.outputContent.length / 1000)}K chars)
            </span>
            <span style={{ fontSize: 9, color: '#64748b' }}>{outputOpen ? '▲ Tutup' : '▼ Lihat'}</span>
          </button>

          {outputOpen && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={copyOutput}
                style={{
                  position: 'absolute', top: 6, right: 6, zIndex: 1,
                  padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 10,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <pre style={{
                fontSize: 10.5, color: '#e2e8f0', fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.5)', padding: '10px 12px', borderRadius: 8,
                overflow: 'auto', maxHeight: 400, margin: 0, whiteSpace: 'pre-wrap',
                wordBreak: 'break-word', lineHeight: 1.5,
              }}>
                {run.outputContent}
              </pre>
            </div>
          )}
        </div>
      )}

      {run.errorMessage && (
        <div style={{ fontSize: 10, color: '#f87171', fontFamily: 'monospace', background: 'rgba(248,113,113,0.1)', padding: '6px 8px', borderRadius: 6, marginTop: 6 }}>
          ❌ {run.errorMessage}
        </div>
      )}
    </div>
  );
}

export function AgentSpectatorModal({ agentInstanceId, agentRole, agentName, allEvents, onClose }: Props) {
  const { data, loading, refreshing, refresh } = useAgentSpectator(agentInstanceId, agentRole, allEvents);
  const [activeTab, setActiveTab] = useState<'live' | 'runs' | 'output'>('live');

  const statusCfg = STATUS_CONFIG[data?.status ?? 'idle'] ?? STATUS_CONFIG.idle;
  const latestRun = data?.runs?.[0];
  const totalTokens = data?.runs?.reduce((s, r) => s + r.promptTokens + r.completionTokens, 0) ?? 0;
  const totalCost = data?.runs?.reduce((s, r) => s + (r.costEstimated ?? 0), 0) ?? 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 760, maxWidth: '96vw', maxHeight: '90vh',
          background: 'linear-gradient(135deg, rgba(10,15,30,0.98), rgba(20,30,55,0.98))',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 60px rgba(99,102,241,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(56,189,248,0.08))',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#fff', fontWeight: 900, flexShrink: 0,
          }}>
            {agentName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>{agentName}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: statusCfg.bg, color: statusCfg.color,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {statusCfg.label}
              </span>
              {refreshing && (
                <span style={{ fontSize: 9, color: '#6366f1', animation: 'pulse 1s infinite' }}>● live</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{agentRole}</div>
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>Runs</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{data?.runs?.length ?? 0}</div>
            </div>
            <div style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>Tokens</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{totalTokens.toLocaleString()}</div>
            </div>
            <div style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>Cost</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>${totalCost.toFixed(4)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={refresh}
              title="Refresh data"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8, padding: '5px 10px', color: '#a5b4fc', fontSize: 12, cursor: 'pointer' }}
            >
              ↻
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Current task banner */}
        {data?.currentTaskTitle && (
          <div style={{
            padding: '8px 18px', background: 'rgba(99,102,241,0.1)',
            borderBottom: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <span style={{ fontSize: 10 }}>⚡</span>
            <span style={{ fontSize: 11, color: '#c7d2fe', fontWeight: 600 }}>
              Task: {data.currentTaskTitle}
            </span>
            {latestRun?.modelUsed && (
              <span style={{ marginLeft: 'auto', fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>
                via {latestRun.modelUsed.split(':')?.[1] || latestRun.modelUsed}
              </span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)', flexShrink: 0,
        }}>
          {([
            { key: 'live', label: '⚡ Live Events' },
            { key: 'runs', label: '🔄 Execution Runs' },
            { key: 'output', label: '📄 Output / Kode' },
          ] as { key: typeof activeTab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: '10px 4px', fontSize: 11, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: activeTab === t.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeTab === t.key ? '#e0e7ff' : '#64748b',
                borderBottom: activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#64748b', fontSize: 13 }}>
              Memuat data agent...
            </div>
          ) : (
            <>
              {/* LIVE EVENTS TAB */}
              {activeTab === 'live' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data?.liveEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>👁</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Menunggu aktivitas agent...</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>Events akan muncul di sini saat agent aktif bekerja</div>
                    </div>
                  ) : (
                    data?.liveEvents.map((e, i) => {
                      const icon = EVENT_ICON[String(e.type)] ?? '📡';
                      const isToolEvent = String(e.type).startsWith('tool.');
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                            padding: '8px 10px', borderRadius: 8,
                            background: isToolEvent ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isToolEvent ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)'}`,
                          }}
                        >
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc', fontFamily: 'monospace' }}>
                                {String(e.type)}
                              </span>
                              <span style={{ fontSize: 9, color: '#475569', flexShrink: 0 }}>
                                {e.timestamp ? new Date(e.timestamp).toLocaleTimeString('id-ID') : '-'}
                              </span>
                            </div>
                            {e.message && (
                              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2, lineHeight: 1.4 }}>
                                {e.message}
                              </div>
                            )}
                            {(e as any).inputSummary && (
                              <pre style={{ fontSize: 9.5, color: '#7dd3fc', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '3px 6px', borderRadius: 4, margin: '4px 0 0', overflow: 'hidden', maxHeight: 60, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                IN: {(e as any).inputSummary}
                              </pre>
                            )}
                            {(e as any).outputSummary && (
                              <pre style={{ fontSize: 9.5, color: '#86efac', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '3px 6px', borderRadius: 4, margin: '4px 0 0', overflow: 'hidden', maxHeight: 60, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                OUT: {(e as any).outputSummary}
                              </pre>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* RUNS TAB */}
              {activeTab === 'runs' && (
                <div>
                  {!data?.runs?.length ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>🔄</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Belum ada execution run</div>
                    </div>
                  ) : (
                    data.runs.map((run) => <RunSection key={run.id} run={run} />)
                  )}
                </div>
              )}

              {/* OUTPUT TAB */}
              {activeTab === 'output' && (
                <div>
                  {!latestRun?.outputContent ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Belum ada output</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>Output akan muncul di sini setelah agent selesai bekerja</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{latestRun.taskTitle}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            {latestRun.modelUsed} · {(latestRun.durationMs / 1000).toFixed(1)}s · {latestRun.promptTokens + latestRun.completionTokens} tokens
                          </div>
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(latestRun.outputContent ?? ''); }}
                          style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>
                      <pre style={{
                        fontSize: 11, color: '#e2e8f0', fontFamily: 'monospace',
                        background: 'rgba(0,0,0,0.55)', padding: '14px 16px', borderRadius: 10,
                        overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        lineHeight: 1.6, border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {latestRun.outputContent}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
