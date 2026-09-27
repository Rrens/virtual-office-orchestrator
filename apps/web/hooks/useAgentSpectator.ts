import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/api';
import type { WSEvent } from './useProjectWebSocket';

export interface SpectatorToolCall {
  id: string;
  toolName: string;
  inputJson: string;
  outputJson: string;
  status: string;
  durationMs: number;
  errorMessage: string | null;
}

export interface SpectatorRun {
  id: string;
  taskId: string | null;
  taskTitle: string;
  taskStatus: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  costEstimated: number;
  durationMs: number;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  toolCalls: SpectatorToolCall[];
  outputContent: string | null;
}

export interface AgentSpectatorData {
  agentId: string;
  agentName: string;
  agentRole: string;
  department: string;
  status: string;
  currentTaskTitle: string | null;
  runs: SpectatorRun[];
  liveEvents: WSEvent[];
}

export function useAgentSpectator(
  agentInstanceId: string,
  agentRole: string,
  allEvents: WSEvent[]
): {
  data: AgentSpectatorData | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<AgentSpectatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setRefreshing(true);
    try {
      const res = await apiFetch<{
        agent: any;
        runs: SpectatorRun[];
      }>(`/api/agents/instances/${agentInstanceId}/runs`);

      if (!res || !res.agent) return;

      // Filter live events for this specific agent
      const relevantEvents = allEvents.filter((e) =>
        e.agentInstanceId === agentInstanceId ||
        e.agentRole === agentRole ||
        e.role === agentRole
      );

      setData({
        agentId: res.agent.id ?? agentInstanceId,
        agentName: res.agent.definition?.name ?? agentRole,
        agentRole: res.agent.definition?.role ?? agentRole,
        department: res.agent.definition?.department?.name ?? '',
        status: res.agent.status ?? 'idle',
        currentTaskTitle:
          res.agent.assignedTasks?.[0]?.title ??
          res.runs?.[0]?.taskTitle ??
          null,
        runs: res.runs ?? [],
        liveEvents: relevantEvents,
      });
    } catch (err) {
      console.error('[useAgentSpectator] fetch error:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [agentInstanceId, agentRole]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    refresh();
    return () => { mountedRef.current = false; };
  }, []);

  // Re-filter events when allEvents changes (WS updates)
  useEffect(() => {
    if (!data) return;
    const relevantEvents = allEvents.filter((e) =>
      e.agentInstanceId === agentInstanceId ||
      e.agentRole === agentRole ||
      e.role === agentRole
    );
    setData((prev) => prev ? { ...prev, liveEvents: relevantEvents } : prev);
  }, [allEvents, agentInstanceId, agentRole, !!data]);

  // Polling fallback every 10 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, refreshing, refresh };
}
