'use client';

import React, { useState, useMemo } from 'react';
import { Issue, SeverityLevel, CategoryType } from '@/types/scanner';
import {
  Wand2,
  Undo2,
  Copy,
  Check,
  FileCode,
  Sparkles,
  CheckCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface IssuesPanelProps {
  currentFile: string;
  issues: Issue[];
  selectedCategory: CategoryType | 'all';
  selectedIssueId: string | null;
  onSelectIssue: (issue: Issue) => void;
  onApplyFix: (issue: Issue) => void;
  onUndoFix: (issue: Issue) => void;
  onApplyAllCategoryFixes: (category: CategoryType | 'all') => void;
  onApplyAllFileFixes: () => void;
}

const severityBadgeStyles: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  High: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  Medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  Low: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
};

export const IssuesPanel: React.FC<IssuesPanelProps> = React.memo(({
  currentFile,
  issues,
  selectedCategory,
  selectedIssueId,
  onSelectIssue,
  onApplyFix,
  onUndoFix,
  onApplyAllCategoryFixes,
  onApplyAllFileFixes,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const safeFixesCount = useMemo(() => {
    return issues.filter((i) => !i.isApplied && i.suggestedFix !== undefined).length;
  }, [issues]);

  const categoryTitle = useMemo(() => {
    if (selectedCategory === 'all') return 'All Issues';
    if (selectedCategory === 'error') return 'Programming Errors';
    if (selectedCategory === 'bug') return 'Bugs & Logic Risks';
    if (selectedCategory === 'security') return 'Security Vulnerabilities';
    if (selectedCategory === 'performance') return 'Performance Bottlenecks';
    if (selectedCategory === 'quality') return 'Code Quality & Cleanliness';
    return `${selectedCategory} Issues`;
  }, [selectedCategory]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-color)]">
      {/* Panel Top Header */}
      <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] truncate">
              {categoryTitle}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {issues.length}
            </span>
          </div>
          {selectedCategory !== 'all' && (
            <span className="text-[10px] text-slate-500 block">Filtered across project</span>
          )}
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {safeFixesCount > 0 && (
            <button
              onClick={() => onApplyAllCategoryFixes(selectedCategory)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors shadow-sm cursor-pointer"
              title={`Fix all ${safeFixesCount} issues in this view`}
            >
              <Wand2 className="w-3 h-3" />
              <span>Fix All ({safeFixesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {issues.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              No {selectedCategory === 'all' ? 'issues' : selectedCategory} found in this project
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
              {selectedCategory === 'all'
                ? 'Your project code passed all static and security analysis checks.'
                : `Great job! Zero ${selectedCategory} issues were flagged across your scanned files.`}
            </p>
          </div>
        ) : (
          issues.map((issue) => {
            const isSelected = issue.id === selectedIssueId;
            const badge = severityBadgeStyles[issue.severity] || severityBadgeStyles.Low;

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-card)] border-blue-500 shadow-md ring-1 ring-blue-500/50'
                    : 'bg-[var(--bg-card)]/70 border-[var(--border-color)] hover:border-slate-600 hover:bg-[var(--bg-card)]'
                }`}
              >
                {/* File Path & Line Navigation Bar */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[var(--border-color)]">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-primary)] truncate max-w-[200px]">
                    <FileCode className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{issue.filePath}</span>
                    <span className="text-blue-400 font-bold">:{issue.lineNumber}</span>
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {issue.category}
                    </span>
                  </div>
                </div>

                {/* Issue Title & AI tag */}
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                    {issue.title}
                  </h4>
                  {issue.aiEnhanced && (
                    <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1 py-0.2 rounded shrink-0">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  )}
                </div>

                {/* Explanation */}
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {issue.explanation}
                </p>

                {/* SIDE-BY-SIDE: Problematic Code vs Solution Code */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                  {/* Problematic Code */}
                  <div className="p-2 rounded bg-rose-950/20 border border-rose-900/40 overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-rose-400 block mb-1">
                      Problematic Code (L{issue.lineNumber})
                    </span>
                    <code className="text-rose-200 block overflow-x-auto whitespace-pre">
                      {issue.snippet}
                    </code>
                  </div>

                  {/* Solution Code */}
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">
                      Solution Code
                    </span>
                    <code className="text-emerald-200 block overflow-x-auto whitespace-pre">
                      {issue.suggestedFix === '' ? '/* remove line */' : issue.suggestedFix}
                    </code>
                  </div>
                </div>

                {/* Actions: Apply Fix / Undo / Copy */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-1.5">
                    {issue.isApplied ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUndoFix(issue);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-secondary)] hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-[var(--border-color)] transition-colors cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3 text-amber-400" />
                        <span>Undo Fix</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyFix(issue);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors shadow-sm cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>Apply Fix</span>
                      </button>
                    )}
                  </div>

                  {/* Copy Fix Icon */}
                  <button
                    onClick={(e) => handleCopy(issue.suggestedFix, issue.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                    title="Copy Solution Code"
                  >
                    {copiedId === issue.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

IssuesPanel.displayName = 'IssuesPanel';
