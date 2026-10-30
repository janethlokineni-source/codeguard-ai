'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Bug,
  Zap,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { Issue, SeverityLevel } from '@/types/scanner';

interface IssueItemProps {
  issue: Issue;
  isInitiallyExpanded?: boolean;
}

const severityBadgeStyles: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
};

export const IssueItem: React.FC<IssueItemProps> = ({ issue, isInitiallyExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopyFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(issue.suggestedFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeStyle = severityBadgeStyles[issue.severity] || severityBadgeStyles.Low;

  return (
    <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 overflow-hidden transition-all duration-200 hover:border-slate-700">
      {/* Header Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-800/40 cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0 pr-4">
          {/* Severity badge */}
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
          >
            {issue.severity}
          </span>

          {/* Category Pill */}
          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-800 text-slate-400 uppercase tracking-wider">
            {issue.category}
          </span>

          {/* Title */}
          <span className="text-sm font-medium text-slate-200 truncate">{issue.title}</span>

          {/* File location */}
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
            <FileCode className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[200px]">{issue.filePath}</span>
            <span className="text-emerald-400 font-bold">:{issue.lineNumber}</span>
          </span>

          {issue.aiEnhanced && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Ollama AI Fix
            </span>
          )}
        </div>

        <div className="text-slate-400 p-1">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-800/80 p-4 bg-slate-950/50 space-y-4"
          >
            {/* Plain-English Explanation */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Analysis & Impact
              </h5>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                {issue.explanation}
              </p>
            </div>

            {/* Side-by-side Before and After Code Diff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Problematic Code (Before) */}
              <div className="rounded-lg border border-rose-950/60 bg-rose-950/20 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-rose-950/40 border-b border-rose-950/50">
                  <span className="text-xs font-medium text-rose-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Problematic Code (Line {issue.lineNumber})
                  </span>
                </div>
                <div className="p-3 font-mono text-xs overflow-x-auto text-rose-200 whitespace-pre">
                  <div className="flex gap-3">
                    <span className="text-slate-500 select-none">{issue.lineNumber}</span>
                    <code>{issue.snippet}</code>
                  </div>
                </div>
              </div>

              {/* Suggested Fix (After) */}
              <div className="rounded-lg border border-emerald-950/60 bg-emerald-950/20 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-950/50">
                  <span className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Suggested Fix
                  </span>
                  <button
                    onClick={handleCopyFix}
                    className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-900/40 hover:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Fix</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 font-mono text-xs overflow-x-auto text-emerald-200 whitespace-pre">
                  <code>{issue.suggestedFix}</code>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

