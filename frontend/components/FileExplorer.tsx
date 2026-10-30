'use client';

import React from 'react';
import { FileCode, Folder, FolderOpen, CheckCircle, ShieldAlert } from 'lucide-react';
import { Issue } from '@/types/scanner';

interface FileExplorerProps {
  files: { path: string; content: string }[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
  issues: Issue[];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedPath,
  onSelectFile,
  issues,
}) => {
  // Compute badge color & issue count per file
  const getFileBadge = (filePath: string) => {
    const fileIssues = issues.filter((i) => i.filePath === filePath);
    if (fileIssues.length === 0) {
      return {
        count: 0,
        label: 'Clean',
        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    }
    const hasCritOrHigh = fileIssues.some((i) => i.severity === 'Critical' || i.severity === 'High');
    if (hasCritOrHigh) {
      return {
        count: fileIssues.length,
        label: `${fileIssues.length}`,
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        dot: 'bg-rose-500',
      };
    }
    const hasMed = fileIssues.some((i) => i.severity === 'Medium');
    if (hasMed) {
      return {
        count: fileIssues.length,
        label: `${fileIssues.length}`,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        dot: 'bg-amber-500',
      };
    }
    return {
      count: fileIssues.length,
      label: `${fileIssues.length}`,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      dot: 'bg-blue-400',
    };
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/80 border-r border-slate-800/80 select-none">
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Project Files ({files.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 font-mono text-xs">
        {files.map((f) => {
          const isSelected = f.path === selectedPath;
          const badge = getFileBadge(f.path);
          const fileName = f.path.split(/[\/\\]/).pop() || f.path;
          const dirPath = f.path.substring(0, f.path.lastIndexOf(fileName));

          return (
            <button
              key={f.path}
              onClick={() => onSelectFile(f.path)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer group ${
                isSelected
                  ? 'bg-blue-600/20 text-white font-medium border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0 mr-2">
                <FileCode
                  className={`w-4 h-4 shrink-0 ${
                    isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <div className="flex flex-col truncate">
                  <span className="truncate text-xs">{fileName}</span>
                  {dirPath && (
                    <span className="text-[10px] text-slate-500 truncate -mt-0.5">
                      {dirPath}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.count === 0 ? '✓' : badge.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

