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
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

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
    <div className="h-full flex flex-col bg-[#190f24] border-l border-[rgba(201,119,127,0.18)]">
      {/* Panel Top Header */}
      <div className="p-3.5 border-b border-[rgba(201,119,127,0.18)] bg-[#1d132b]/80 backdrop-blur-md flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#f6e7dc] truncate">
              {categoryTitle}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#c9777f]/20 text-[#f0c98a] border border-[#c9777f]/30">
              {issues.length}
            </span>
          </div>
          {selectedCategory !== 'all' && (
            <span className="text-[10px] text-[#7e6980] block mt-0.5">Filtered across project</span>
          )}
        </div>

        {/* Bulk Action Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {safeFixesCount > 0 && (
            <button
              onClick={() => onApplyAllCategoryFixes(selectedCategory)}
              className="clyro-btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
              title={`Fix all ${safeFixesCount} issues`}
            >
              <Wand2 className="w-3 h-3 text-[#f0c98a]" />
              <span>
                {selectedCategory === 'all'
                  ? `Remove All Errors (${safeFixesCount})`
                  : `Fix All (${safeFixesCount})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {issues.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-[#86efac]" />
            </div>
            <h4 className="font-serif-heading text-sm font-semibold text-[#f6e7dc]">
              No {selectedCategory === 'all' ? 'issues' : selectedCategory} found in this project
            </h4>
            <p className="text-[11px] text-[#b8a5b8] mt-1.5 max-w-xs mx-auto leading-relaxed">
              {selectedCategory === 'all'
                ? 'Your project code passed all static security and logic inspection rules.'
                : `Zero ${selectedCategory} issues were flagged across your scanned files.`}
            </p>
          </div>
        ) : (
          issues.map((issue, index) => {
            const isSelected = issue.id === selectedIssueId;
            const issueNum = index + 1;

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#231533] border-[#c9777f] shadow-lg ring-1 ring-[#c9777f]/50'
                    : 'bg-[#1d132b]/70 border-[rgba(201,119,127,0.18)] hover:border-[rgba(201,119,127,0.38)] hover:bg-[#1d132b]'
                }`}
              >
                {/* File Path & Line Navigation Bar */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[rgba(201,119,127,0.12)]">
                  <div className="flex items-center gap-2 truncate max-w-[240px]">
                    <span className="w-5 h-5 rounded-md bg-[#c9777f]/20 border border-[#c9777f]/40 text-[#f0c98a] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {issueNum}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#f6e7dc] truncate">
                      <FileCode className="w-3 h-3 text-[#c9777f] shrink-0" />
                      <span className="truncate">{issue.filePath}</span>
                      <span className="text-[#f0c98a] font-bold">:{issue.lineNumber}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge severity={issue.severity}>{issue.severity}</Badge>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#0f0816] text-[#b8a5b8] uppercase border border-[rgba(201,119,127,0.15)]">
                      {issue.category}
                    </span>
                  </div>
                </div>

                {/* Issue Title & AI tag */}
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="text-xs font-semibold text-[#f6e7dc] leading-snug">
                    <span className="text-[#f0c98a] font-bold mr-1.5">{issueNum}.</span>
                    {issue.title}
                  </h4>
                  {issue.aiEnhanced && (
                    <span className="flex items-center gap-1 text-[9px] text-[#f0c98a] bg-[#f0c98a]/10 border border-[#f0c98a]/30 px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI Refined
                    </span>
                  )}
                </div>

                {/* Explanation */}
                <p className="text-[11px] text-[#b8a5b8] mt-1.5 leading-relaxed">
                  {issue.explanation}
                </p>

                {/* SIDE-BY-SIDE: Problematic Code vs Solution Code */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                  {/* Problematic Code (Subtle Rose Tint) */}
                  <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/35 overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-rose-300 block mb-1 tracking-wider">
                      Problematic Code (L{issue.lineNumber})
                    </span>
                    <code className="text-rose-200 block overflow-x-auto whitespace-pre">
                      {issue.snippet}
                    </code>
                  </div>

                  {/* Solution Code (Subtle Sage Tint) */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/35 overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-[#86efac] block mb-1 tracking-wider">
                      Solution Code
                    </span>
                    <code className="text-emerald-200 block overflow-x-auto whitespace-pre">
                      {issue.suggestedFix === '' ? '/* remove line */' : issue.suggestedFix}
                    </code>
                  </div>
                </div>

                {/* Actions: Apply Fix / Undo / Copy */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-[rgba(201,119,127,0.12)]">
                  <div className="flex items-center gap-2">
                    {issue.isApplied ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUndoFix(issue);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0f0816] hover:bg-[#190f24] text-[#f0c98a] text-[11px] font-medium border border-[rgba(201,119,127,0.25)] transition-colors cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3 text-[#f0c98a]" />
                        <span>Undo Fix</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyFix(issue);
                        }}
                        className="clyro-btn-primary flex items-center gap-1.5 px-3 py-1 rounded-xl text-white text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                      >
                        <Wand2 className="w-3 h-3 text-[#f0c98a]" />
                        <span>Apply Fix</span>
                      </button>
                    )}
                  </div>

                  {/* Copy Fix Button */}
                  <button
                    onClick={(e) => handleCopy(issue.suggestedFix, issue.id, e)}
                    className="p-1.5 rounded-lg text-[#b8a5b8] hover:text-[#f6e7dc] hover:bg-[rgba(201,119,127,0.15)] transition-colors cursor-pointer"
                    title="Copy Solution Code"
                  >
                    {copiedId === issue.id ? (
                      <Check className="w-3.5 h-3.5 text-[#86efac]" />
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
