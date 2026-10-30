'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface BestPracticesPanelProps {
  practices: string[];
}

export const BestPracticesPanel: React.FC<BestPracticesPanelProps> = ({ practices }) => {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[rgba(201,119,127,0.18)] text-[#f0c98a] border border-[rgba(201,119,127,0.3)]">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif-heading text-lg font-bold text-[#f6e7dc]">
            Top Architectural & Security Improvements
          </h3>
          <p className="text-xs text-[#b8a5b8] mt-0.5">
            Priority recommendations tailored to issues flagged in your team&apos;s code
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {practices.map((rec, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#0f0816]/70 border border-[rgba(201,119,127,0.15)] hover:border-[rgba(201,119,127,0.35)] transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(54,33,72,0.95)] text-[#f0c98a] font-serif-heading text-xs font-bold border border-[rgba(201,119,127,0.3)] shrink-0 mt-0.5 shadow-sm">
              {idx + 1}
            </div>
            <p className="text-sm text-[#f6e7dc] leading-relaxed font-sans">{rec}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
