'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Approval {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  agentInstance: {
    definition: {
      name: string;
      role: string;
    };
  };
  task?: {
    title: string;
  };
}

interface Props {
  approvals: Approval[];
  onDecided: () => void;
}

export function ApprovalCenter({ approvals, onDecided }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setLoadingId(id);
    try {
      await apiFetch(`/api/approvals/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ decidedBy: 'founder' }),
      });
      onDecided();
    } catch (err) {
      alert(`Failed to ${action}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingId(null);
    }
  }

  const pending = approvals.filter((a) => a.status === 'pending');

  if (pending.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center py-6">
        <p className="text-slate-400 text-sm">No pending approvals required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((a) => (
        <div
          key={a.id}
          className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">
                Action Required
              </span>
              <h4 className="font-semibold text-white mt-1">{a.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Requested by: {a.agentInstance.definition.name} ({a.agentInstance.definition.role})
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 bg-slate-900/60 p-3 rounded-lg font-mono text-xs">
            {a.description}
          </p>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleAction(a.id, 'reject')}
              disabled={loadingId === a.id}
              className="px-3 py-1.5 rounded-lg border border-rose-700 text-rose-300 hover:bg-rose-950/60 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => handleAction(a.id, 'approve')}
              disabled={loadingId === a.id}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Approve & Continue
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
