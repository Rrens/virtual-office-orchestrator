'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Props {
  projectId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function CustomerFeedbackModal({ projectId, onClose, onSubmitted }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'ux' | 'general'>('bug');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSubmitting(true);
    try {
      await apiFetch(`/api/projects/${projectId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName || 'Anonymous',
          customerEmail: customerEmail || 'anonymous@example.com',
          feedback,
          category,
        }),
      });
      setSuccess(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Customer Feedback (Closed-Loop)</h3>
            <p className="text-xs text-slate-400">Submitting feedback auto-triages and creates improvement tasks.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-emerald-300 text-sm text-center">
            ✓ Feedback processed! Orchestrator triaged and scheduled a follow-up task.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="bug">🐛 Bug Report</option>
                <option value="feature">✨ Feature Request</option>
                <option value="ux">🎨 UX Improvement</option>
                <option value="general">💬 General Feedback</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">Feedback Details</label>
              <textarea
                required
                rows={4}
                placeholder="Describe issue or suggestion in detail..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {submitting ? 'Triaging...' : 'Submit & Triage'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
