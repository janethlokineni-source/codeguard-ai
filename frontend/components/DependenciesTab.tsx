'use client';

import React, { useState } from 'react';
import { DependencyItem } from '@/types/scanner';
import { Copy, Check, AlertOctagon, AlertTriangle, ShieldCheck, Info, Wand2 } from 'lucide-react';

interface DependenciesTabProps {
  dependencies: DependencyItem[];
  onFixDependency?: (dep: DependencyItem) => void;
  onFixAllDependencies?: () => void;
}

export const DependenciesTab: React.FC<DependenciesTabProps> = ({
  dependencies,
  onFixDependency,
  onFixAllDependencies,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'vulnerable' | 'outdated'>('all');

  const vulnerableOrOutdated = dependencies.filter(
    (d) => d.status === 'Known-vulnerable' || d.status === 'Deprecated' || d.status === 'Outdated'
  );

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filtered = dependencies.filter((dep) => {
    if (filter === 'vulnerable') return dep.status === 'Known-vulnerable' || dep.status === 'Deprecated';
    if (filter === 'outdated') return dep.status === 'Outdated';
    return true;
  });

  const getStatusBadge = (status: DependencyItem['status']) => {
    switch (status) {
      case 'Known-vulnerable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3" />
            Known Vulnerable
          </span>
        );
      case 'Deprecated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3 h-3" />
            Deprecated
          </span>
        );
      case 'Outdated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Info className="w-3 h-3" />
            Outdated
          </span>
        );
      case 'Safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            Safe
          </span>
        );
    }
  };

  if (dependencies.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
        <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto mb-2" />
        <h4 className="text-sm font-medium text-slate-300">No dependency manifests found</h4>
        <p className="text-xs text-slate-500 mt-1">
          Include a package.json or requirements.txt in your folder to scan third-party libraries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All Packages ({dependencies.length})
          </button>
          <button
            onClick={() => setFilter('vulnerable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'vulnerable'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Vulnerable / Deprecated (
            {dependencies.filter((d) => d.status === 'Known-vulnerable' || d.status === 'Deprecated').length}
            )
          </button>
          <button
            onClick={() => setFilter('outdated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'outdated'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Outdated ({dependencies.filter((d) => d.status === 'Outdated').length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {vulnerableOrOutdated.length > 0 && onFixAllDependencies && (
            <button
              onClick={onFixAllDependencies}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
              title="Auto-upgrade all vulnerable and outdated packages to their latest safe versions"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Fix All Dependencies ({vulnerableOrOutdated.length})</span>
            </button>
          )}

          <span className="text-xs text-slate-500">
            Showing {filtered.length} of {dependencies.length} packages
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-850/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Installed</th>
              <th className="px-4 py-3">Latest</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Remediation & Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((dep, idx) => (
              <tr key={`${dep.package}-${idx}`} className="hover:bg-slate-850/40 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">
                  <div className="flex flex-col">
                    <span className="font-mono">{dep.package}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{dep.ecosystem}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{dep.currentVersion}</td>
                <td className="px-4 py-3 font-mono text-xs text-emerald-400 font-semibold">
                  {dep.latestVersion}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(dep.status)}
                    {dep.vulnerabilityDetails && (
                      <span className="text-[11px] text-rose-300/80 max-w-xs leading-tight">
                        {dep.vulnerabilityDetails}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300 font-mono">
                      {dep.upgradeCommand}
                    </code>
                    <button
                      onClick={() => handleCopy(dep.upgradeCommand, idx)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Copy command"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {dep.status !== 'Safe' && onFixDependency && (
                      <button
                        onClick={() => onFixDependency(dep)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer ml-1"
                        title={`Auto-update ${dep.package} to ${dep.latestVersion} in package manifest`}
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>Fix This</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

