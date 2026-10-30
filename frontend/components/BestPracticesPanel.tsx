'use client';

import React from 'react';
import { Award, CheckCircle2, ArrowRight } from 'lucide-react';

interface BestPracticesPanelProps {
  practices: string[];
}

export const BestPracticesPanel: React.FC<BestPracticesPanelProps> = ({ practices }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            Top 5 Architectural & Security Improvements
          </h3>
          <p className="text-xs text-slate-400">
            Priority recommendations tailored to issues flagged in your team's code
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {practices.map((rec, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 font-mono text-xs font-bold border border-emerald-800/60 shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

