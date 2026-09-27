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
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

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
          onClick={() => setSelectedApproval(a)}
          className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-3 cursor-pointer hover:border-rose-600/60 transition-all shadow-sm"
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

          <p className="text-sm text-slate-300 bg-slate-900/60 p-3 rounded-lg font-mono text-xs line-clamp-3">
            {a.description}
          </p>

          <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedApproval(a)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Detail
            </button>
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

      {/* Approval Detail Modal */}
      {selectedApproval && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setSelectedApproval(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Keputusan Diperlukan
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedApproval.title}</h3>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-white text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Pengaju</p>
                  <p className="text-white font-medium">{selectedApproval.agentInstance.definition.name}</p>
                  <p className="text-indigo-400 font-mono text-[10px]">{selectedApproval.agentInstance.definition.role}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Status / Waktu</p>
                  <p className="text-amber-400 font-medium uppercase">{selectedApproval.status}</p>
                  <p className="text-slate-500 text-[10px]">{new Date(selectedApproval.createdAt).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {selectedApproval.task?.title && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Tugas Terkait</p>
                  <p className="text-slate-200 font-medium">{selectedApproval.task.title}</p>
                </div>
              )}

              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Deskripsi Lengkap & Konteks</p>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-mono text-[11px]">
                  {selectedApproval.description}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedApproval(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={async () => {
                  await handleAction(selectedApproval.id, 'reject');
                  setSelectedApproval(null);
                }}
                disabled={loadingId === selectedApproval.id}
                className="px-3 py-1.5 rounded-lg border border-rose-700 text-rose-300 hover:bg-rose-950/60 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Tolak Keputusan
              </button>
              <button
                onClick={async () => {
                  await handleAction(selectedApproval.id, 'approve');
                  setSelectedApproval(null);
                }}
                disabled={loadingId === selectedApproval.id}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Setujui & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
