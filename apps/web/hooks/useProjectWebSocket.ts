'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE, apiFetch } from '../lib/api';

export interface WSEvent {
  type: string;
  projectId?: string;
  timestamp?: string;
  agentRole?: string;
  role?: string;
  message?: string;
  taskId?: string;
  [key: string]: unknown;
}

export function useProjectWebSocket(projectId: string | null) {
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInitialEvents = useCallback(async (id: string) => {
    try {
      const historical = await apiFetch<WSEvent[]>(`/api/projects/${id}/events`).catch(() => []);
      if (Array.isArray(historical) && historical.length > 0) {
        const filtered = historical.filter((e) => e.type !== 'connected');
        setEvents(filtered);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  }, []);

  const connect = useCallback(() => {
    if (!projectId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/projects/${projectId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        // Ignore raw WebSocket transport handshake
        if (event.type === 'connected') return;

        setEvents((prev) => [event, ...prev].slice(0, 200));
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [projectId]);

  useEffect(() => {
    setEvents([]);
    if (projectId) {
      loadInitialEvents(projectId);
      connect();
    }
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [projectId, connect, loadInitialEvents]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, connected, clearEvents };
}
