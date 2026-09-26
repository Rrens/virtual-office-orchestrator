'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../lib/api';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  model?: string;
  agentRole?: string;
  data?: any;
}

interface LogsResponse {
  date: string;
  dates: string[];
  logs: LogEntry[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  info:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  warn:  { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
  error: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  debug: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

export function LogViewerModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.set('date', selectedDate);
      if (selectedLevel) params.set('level', selectedLevel);
      if (search) params.set('search', search);
      params.set('limit', '300');

      const res = await apiFetch<LogsResponse>(`/api/logs?${params.toString()}`);
      setData(res);
      if (!selectedDate && res.date) {
        setSelectedDate(res.date);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedLevel, search]);

  useEffect(() => {
    if (!isOpen) return;
    fetchLogs();
  }, [isOpen, fetchLogs]);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, fetchLogs]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90vw',
          maxWidth: 1100,
          height: '82vh',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              📜 System & Agent Logs
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 99,
                background: autoRefresh ? '#dcfce7' : '#f1f5f9',
                color: autoRefresh ? '#15803d' : '#64748b',
                fontWeight: 600,
              }}
            >
              {autoRefresh ? '● Live' : '○ Paused'}
            </span>
            {loading && <span style={{ fontSize: 11, color: '#94a3b8' }}>Refreshing...</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {autoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                color: '#64748b',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            background: '#ffffff',
            flexWrap: 'wrap',
          }}
        >
          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Tanggal:</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
              }}
            >
              {(data?.dates || [new Date().toISOString().split('T')[0]]).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
              }}
            >
              <option value="">Semua Level</option>
              <option value="info">INFO</option>
              <option value="warn">WARN</option>
              <option value="error">ERROR</option>
              <option value="debug">DEBUG</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Cari:</label>
            <input
              type="text"
              placeholder="Filter teks, module, task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 160,
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
              }}
            />
          </div>

          <span style={{ fontSize: 11, color: '#64748b' }}>
            {data?.logs.length || 0} entri
          </span>
        </div>

        {/* Logs Stream List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 20px',
            background: '#0f172a',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {(!data?.logs || data.logs.length === 0) ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
              Tidak ada log untuk tanggal {selectedDate || 'hari ini'}.
            </div>
          ) : (
            data.logs.map((log, i) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString();
              const levelStyle = LEVEL_COLORS[log.level] || LEVEL_COLORS.info;

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    lineHeight: 1.45,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    paddingBottom: 4,
                  }}
                >
                  {/* Timestamp */}
                  <span style={{ color: '#64748b', flexShrink: 0, fontSize: 11 }}>
                    [{timeStr}]
                  </span>

                  {/* Level Badge */}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: levelStyle.bg,
                      color: levelStyle.text,
                      border: `1px solid ${levelStyle.border}`,
                      flexShrink: 0,
                    }}
                  >
                    {log.level.toUpperCase()}
                  </span>

                  {/* Module Name */}
                  <span style={{ color: '#38bdf8', fontWeight: 600, flexShrink: 0 }}>
                    [{log.module}]
                  </span>

                  {/* Model Tag if present */}
                  {log.model && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(168, 85, 247, 0.2)',
                        color: '#c084fc',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      🤖 {log.model}
                    </span>
                  )}

                  {/* Message & Data */}
                  <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                    <span style={{ color: log.level === 'error' ? '#f87171' : log.level === 'warn' ? '#fde047' : '#f8fafc' }}>
                      {log.message}
                    </span>
                    {log.data && (
                      <pre
                        style={{
                          margin: '4px 0 0',
                          padding: '6px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 6,
                          fontSize: 11,
                          color: '#94a3b8',
                          overflowX: 'auto',
                        }}
                      >
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
