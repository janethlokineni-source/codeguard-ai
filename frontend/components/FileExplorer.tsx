'use client';

import React from 'react';
import { FileCode, CheckCircle2 } from 'lucide-react';
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
  const getFileBadge = (filePath: string) => {
    const fileIssues = issues.filter((i) => i.filePath === filePath);
    if (fileIssues.length === 0) {
      return {
        count: 0,
        label: 'Clean',
        color: 'bg-emerald-500/15 text-[#86efac] border-emerald-500/30',
        dot: 'bg-[#86efac]',
      };
    }
    const hasCritOrHigh = fileIssues.some((i) => i.severity === 'Critical' || i.severity === 'High');
    if (hasCritOrHigh) {
      return {
        count: fileIssues.length,
        label: `${fileIssues.length}`,
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/35',
        dot: 'bg-rose-400',
      };
    }
    const hasMed = fileIssues.some((i) => i.severity === 'Medium');
    if (hasMed) {
      return {
        count: fileIssues.length,
        label: `${fileIssues.length}`,
        color: 'bg-amber-500/20 text-[#f0c98a] border-amber-500/35',
        dot: 'bg-[#f0c98a]',
      };
    }
    return {
      count: fileIssues.length,
      label: `${fileIssues.length}`,
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35',
      dot: 'bg-indigo-400',
    };
  };

  return (
    <div className="h-full flex flex-col bg-[#190f24] border-r border-[rgba(201,119,127,0.18)] select-none">
      <div className="p-3.5 border-b border-[rgba(201,119,127,0.18)] bg-[#1d132b]/80 backdrop-blur-md flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#b8a5b8]">
          Project Files ({files.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 font-mono text-xs">
        {files.map((f) => {
          const isSelected = f.path === selectedPath;
          const badge = getFileBadge(f.path);
          const fileName = f.path.split(/[\/\\]/).pop() || f.path;
          const dirPath = f.path.substring(0, f.path.lastIndexOf(fileName));

          return (
            <button
              key={f.path}
              onClick={() => onSelectFile(f.path)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                isSelected
                  ? 'bg-[#28173a] text-[#f6e7dc] font-medium border border-[#c9777f]/45 shadow-sm'
                  : 'text-[#b8a5b8] hover:bg-[#20132e] hover:text-[#f6e7dc] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate min-w-0 mr-2">
                <FileCode
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? 'text-[#c9777f]' : 'text-[#7e6980] group-hover:text-[#b8a5b8]'
                  }`}
                />
                <div className="flex flex-col truncate">
                  <span className="truncate text-xs font-sans font-medium">{fileName}</span>
                  {dirPath && (
                    <span className="text-[10px] text-[#7e6980] truncate -mt-0.5 font-mono">
                      {dirPath}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badge.color}`}
              >
                {badge.count === 0 ? (
                  <CheckCircle2 className="w-3 h-3 text-[#86efac]" />
                ) : (
                  <span>{badge.label}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
