'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE } from '../lib/api';

export interface WSEvent {
  type: string;
  projectId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export function useProjectWebSocket(projectId: string | null) {
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!projectId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/projects/${projectId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
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
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, connected, clearEvents };
}
