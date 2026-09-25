'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface BudgetSummary {
  usedTokens: number;
  budgetTokens: number | null;
  totalCostEstimatedUsd: number;
  isBudgetExceeded: boolean;
  projectStatus: string;
}

interface Props {
  projectId: string;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function BudgetPanel({ projectId }: Props) {
  const [data, setData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    apiFetch<BudgetSummary>(`/api/projects/${projectId}/budget`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
        <p className="text-slate-400 text-xs">Loading budget...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
        <p className="text-slate-400 text-xs">Budget data unavailable.</p>
      </div>
    );
  }

  const usagePercent = data.budgetTokens
    ? Math.min((data.usedTokens / data.budgetTokens) * 100, 100)
    : 0;

  const barColor = data.isBudgetExceeded
    ? 'bg-red-500'
    : usagePercent > 80
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget & Usage</p>
        {data.isBudgetExceeded && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-800/60 font-semibold">
            Budget Exceeded
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Tokens Used</span>
          <span className="text-base font-bold text-white">{formatNumber(data.usedTokens)}</span>
        </div>

        {data.budgetTokens && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Budget Limit</span>
              <span className="text-sm font-semibold text-slate-300">{formatNumber(data.budgetTokens)}</span>
            </div>

            <div className="space-y-1">
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 text-right">{usagePercent.toFixed(1)}% used</p>
            </div>
          </>
        )}

        <div className="pt-2 border-t border-slate-700/60 flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Estimated Cost</span>
          <span className="text-base font-bold text-emerald-400">${data.totalCostEstimatedUsd.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
