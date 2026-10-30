'use client';

import React, { useState } from 'react';
import { Issue, SeverityLevel } from '@/types/scanner';
import {
  Wand2,
  Undo2,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Eye,
  CheckCheck,
} from 'lucide-react';

interface IssuesPanelProps {
  currentFile: string;
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: Issue) => void;
  onApplyFix: (issue: Issue) => void;
  onUndoFix: (issue: Issue) => void;
  onApplyAllSafeFixes: () => void;
  onApplyAllProjectFixes: () => void;
}

const severityBadgeStyles: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  High: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  Medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  Low: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
};

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  currentFile,
  issues,
  selectedIssueId,
  onSelectIssue,
  onApplyFix,
  onUndoFix,
  onApplyAllSafeFixes,
  onApplyAllProjectFixes,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [diffPreviewIssueId, setDiffPreviewIssueId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const safeFixesCount = issues.filter((i) => !i.isApplied && i.suggestedFix).length;

  return (
    <div className="h-full flex flex-col bg-slate-950/80 border-l border-slate-800/80">
      {/* Panel Top Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Issues in File
          </span>
          <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-200">
            {issues.length}
          </span>
        </div>

        {/* Apply All Safe Fixes Buttons */}
        <div className="flex items-center gap-1.5">
          {safeFixesCount > 0 && (
            <button
              onClick={onApplyAllSafeFixes}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors shadow-sm cursor-pointer"
              title="Apply all safe fixes in this file"
            >
              <Wand2 className="w-3 h-3" />
              <span>Fix File ({safeFixesCount})</span>
            </button>
          )}

          <button
            onClick={onApplyAllProjectFixes}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Apply all safe fixes across all files"
          >
            <CheckCheck className="w-3 h-3 text-blue-400" />
            <span>Fix All Project</span>
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {issues.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-300">Clean file</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No issues detected on this file.</p>
          </div>
        ) : (
          issues.map((issue) => {
            const isSelected = issue.id === selectedIssueId;
            const badge = severityBadgeStyles[issue.severity] || severityBadgeStyles.Low;
            const isPreviewingDiff = diffPreviewIssueId === issue.id;

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                    : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Header line: Line Number + Severity + Category */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-900/60 px-1.5 py-0.5 rounded">
                      L{issue.lineNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {issue.category}
                    </span>
                  </div>

                  {issue.aiEnhanced && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                  {issue.title}
                </h4>

                {/* Plain-English Explanation */}
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {issue.explanation}
                </p>

                {/* Diff Preview Mode */}
                {isPreviewingDiff ? (
                  <div className="mt-2.5 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                    <div className="flex items-start gap-1 text-rose-400 bg-rose-950/30 p-1 rounded">
                      <span className="select-none text-rose-500">-</span>
                      <span className="break-all whitespace-pre-wrap">{issue.snippet}</span>
                    </div>
                    <div className="flex items-start gap-1 text-emerald-400 bg-emerald-950/30 p-1 rounded">
                      <span className="select-none text-emerald-500">+</span>
                      <span className="break-all whitespace-pre-wrap">
                        {issue.suggestedFix || '/* removed line */'}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDiffPreviewIssueId(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDiffPreviewIssueId(null);
                          onApplyFix(issue);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold cursor-pointer"
                      >
                        Confirm Fix
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons: Apply Fix / Undo / Copy / Diff */
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      {issue.isApplied ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUndoFix(issue);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Undo2 className="w-3 h-3 text-amber-400" />
                          <span>Undo</span>
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

                      {!issue.isApplied && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDiffPreviewIssueId(issue.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-[11px] transition-colors cursor-pointer"
                          title="Preview Line Diff"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Diff</span>
                        </button>
                      )}
                    </div>

                    {/* Copy Fix Secondary Icon */}
                    <button
                      onClick={(e) => handleCopy(issue.suggestedFix, issue.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Copy Suggested Fix"
                    >
                      {copiedId === issue.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

