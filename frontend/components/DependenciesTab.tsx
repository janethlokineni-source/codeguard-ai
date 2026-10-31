'use client';

import React, { useState, useEffect } from 'react';
import { DependencyItem } from '@/types/scanner';
import { Copy, Check, ShieldCheck, Wand2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

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
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const on = () => setIsOnline(true);
      const off = () => setIsOnline(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      return () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      };
    }
  }, []);

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

  if (dependencies.length === 0) {
    return (
      <Card className="text-center py-16 p-6">
        <Package className="w-10 h-10 text-[#f0c98a] mx-auto mb-3 opacity-80" />
        <h4 className="font-serif-heading text-base font-semibold text-[#f6e7dc]">
          No dependency manifests found
        </h4>
        <p className="text-xs text-[#b8a5b8] mt-1.5 max-w-sm mx-auto leading-relaxed">
          Include a package.json or requirements.txt in your folder to scan third-party dependencies.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Bulk Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#0f0816] p-1 rounded-2xl border border-[rgba(201,119,127,0.2)]">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[rgba(54,33,72,0.95)] text-[#f6e7dc] border border-[rgba(201,119,127,0.35)] shadow-sm'
                : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
            }`}
          >
            All Packages ({dependencies.length})
          </button>
          <button
            onClick={() => setFilter('vulnerable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'vulnerable'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
            }`}
          >
            Vulnerable (
            {dependencies.filter((d) => d.status === 'Known-vulnerable' || d.status === 'Deprecated').length}
            )
          </button>
          <button
            onClick={() => setFilter('outdated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'outdated'
                ? 'bg-amber-500/20 text-[#f0c98a] border border-amber-500/40 shadow-sm'
                : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
            }`}
          >
            Outdated ({dependencies.filter((d) => d.status === 'Outdated').length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {vulnerableOrOutdated.length > 0 && onFixAllDependencies && (
            <button
              onClick={onFixAllDependencies}
              className="clyro-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
              title="Auto-upgrade all vulnerable and outdated packages to their latest safe versions"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#f0c98a]" />
              <span>Fix All Dependencies ({vulnerableOrOutdated.length})</span>
            </button>
          )}

          <span className="text-xs text-[#7e6980]">
            Showing {filtered.length} of {dependencies.length} packages
          </span>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1d132b]/90 text-[10px] font-semibold uppercase tracking-widest text-[#b8a5b8] border-b border-[rgba(201,119,127,0.18)]">
            <tr>
              <th className="px-5 py-3.5">Package</th>
              <th className="px-5 py-3.5">Installed</th>
              <th className="px-5 py-3.5">Latest</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Remediation & Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,119,127,0.1)] font-sans">
            {filtered.map((dep, idx) => (
              <tr
                key={`${dep.package}-${idx}`}
                className="hover:bg-[#20132e]/60 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-[#f6e7dc]">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs">{dep.package}</span>
                    <span className="text-[9px] text-[#7e6980] uppercase tracking-wider font-semibold">
                      {dep.ecosystem}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#b8a5b8]">
                  {dep.currentVersion}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#86efac] font-semibold">
                  {dep.latestVersion}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col gap-1">
                    <Badge
                      severity={
                        dep.status === 'Known-vulnerable'
                          ? 'Critical'
                          : dep.status === 'Deprecated'
                          ? 'High'
                          : dep.status === 'Outdated'
                          ? 'Medium'
                          : dep.status === 'Unknown (offline)'
                          ? 'Default'
                          : 'Safe'
                      }
                    >
                      {dep.status}
                    </Badge>
                    {dep.vulnerabilityDetails && (
                      <span className="text-[10px] text-rose-300/85 max-w-xs leading-tight mt-0.5">
                        {dep.vulnerabilityDetails}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-[11px] bg-[#0f0816] px-2.5 py-1 rounded-lg border border-[rgba(201,119,127,0.18)] text-[#f6e7dc] font-mono">
                      {dep.upgradeCommand}
                    </code>
                    <button
                      onClick={() => handleCopy(dep.upgradeCommand, idx)}
                      className="p-1.5 rounded-lg text-[#b8a5b8] hover:text-[#f6e7dc] hover:bg-[rgba(201,119,127,0.15)] transition-colors cursor-pointer"
                      title="Copy command"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-[#86efac]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {dep.status !== 'Safe' && onFixDependency && (
                      <button
                        onClick={() => onFixDependency(dep)}
                        className="clyro-btn-primary flex items-center gap-1 px-3 py-1 rounded-xl text-white text-[11px] font-semibold shadow-sm transition-all cursor-pointer ml-1"
                        title={`Auto-update ${dep.package} to ${dep.latestVersion} in package manifest`}
                      >
                        <Wand2 className="w-3 h-3 text-[#f0c98a]" />
                        <span>Fix This</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(26,17,37,0.7)] border border-[rgba(201,119,127,0.2)] text-[11px] text-[#b8a5b8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f0c98a]" />
          <span>Running offline. Third-party packages evaluated using bundled local security snapshot database.</span>
        </div>
      )}
    </div>
  );
};
