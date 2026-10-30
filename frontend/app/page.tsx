'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  FolderPlus,
  FilePlus,
  Shield,
  RotateCcw,
  Sun,
  Moon,
  ArrowLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  Bug,
  ShieldAlert,
  Zap,
  Package,
  Wand2,
  FileCode,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import JSZip from 'jszip';
import { Issue, DependencyItem, ScanResult, CategoryType, SeverityLevel } from '@/types/scanner';
import { HealthGauge } from '@/components/HealthGauge';
import { FileExplorer } from '@/components/FileExplorer';
import { IssuesPanel } from '@/components/IssuesPanel';
import { DependenciesTab } from '@/components/DependenciesTab';
import { BestPracticesPanel } from '@/components/BestPracticesPanel';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Logo } from '@/components/ui/Logo';
import { StatusChip } from '@/components/ui/StatusChip';
import { PageBackground } from '@/components/ui/PageBackground';

// Lazy-load Monaco Editor for ultra-fast initial page load
const MonacoCodeWorkspace = dynamic(
  () => import('@/components/MonacoCodeWorkspace').then((mod) => mod.MonacoCodeWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center bg-[#0b0f19] text-slate-400 gap-2 font-mono text-xs">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Editor Engine...</span>
      </div>
    ),
  }
);

const BACKEND_URL = 'http://localhost:8000';
const MAX_FILE_SIZE = 300 * 1024; // 300 KB

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'venv',
  'env',
  '__pycache__',
  '.turbo',
  '.vscode',
  '.idea',
]);

const IGNORED_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.mp4',
  '.mp3',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.exe',
  '.dll',
  '.pyc',
  '.bin',
  '.lock',
  '.class',
  '.map',
]);

export interface InMemoryFile {
  path: string;
  content: string;
  size: number;
}

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [phase, setPhase] = useState<'upload' | 'preview' | 'scanning' | 'workspace'>('upload');

  const [files, setFiles] = useState<InMemoryFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Active category filter: 'all' | 'error' | 'bug' | 'security' | 'performance' | 'quality'
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Active top tab: 'editor' | 'dependencies' | 'practices'
  const [activeTab, setActiveTab] = useState<'editor' | 'dependencies' | 'practices'>('editor');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const reScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isAllowedFile = useCallback((path: string, size: number = 0): boolean => {
    if (size > MAX_FILE_SIZE) return false;
    const parts = path.split(/[\/\\]/);
    for (const part of parts) {
      if (IGNORED_DIRS.has(part.toLowerCase())) return false;
    }
    const dotIdx = path.lastIndexOf('.');
    if (dotIdx !== -1) {
      const ext = path.substring(dotIdx).toLowerCase();
      if (IGNORED_EXTS.has(ext)) return false;
    }
    const fileName = parts[parts.length - 1].toLowerCase();
    if (fileName === 'package-lock.json' || fileName === 'pnpm-lock.yaml' || fileName === 'yarn.lock') {
      return false;
    }
    return true;
  }, []);

  // 1. DYNAMIC CATEGORY COUNTS (Always computed from scanResult.issues, never 0 when issues exist)
  const categoryCounts = useMemo(() => {
    const unappliedIssues = (scanResult?.issues || []).filter((i) => !i.isApplied);
    const counts = {
      all: unappliedIssues.length,
      error: 0,
      bug: 0,
      security: 0,
      performance: 0,
      dependency: (scanResult?.dependencies || []).length,
      quality: 0,
    };
    for (const issue of unappliedIssues) {
      const cat = issue.category?.toLowerCase();
      if (cat === 'error' || cat === 'errors') counts.error++;
      else if (cat === 'bug' || cat === 'bugs') counts.bug++;
      else if (cat === 'security') counts.security++;
      else if (cat === 'performance' || cat === 'perf') counts.performance++;
      else if (cat === 'quality') counts.quality++;
    }
    return counts;
  }, [scanResult?.issues, scanResult?.dependencies]);

  // Filtered issues to show in the right panel (across all files or for active file)
  const displayedIssues = useMemo(() => {
    if (!scanResult) return [];
    let list = scanResult.issues.filter((i) => !i.isApplied);
    if (categoryFilter !== 'all') {
      list = list.filter((i) => {
        const c = i.category.toLowerCase();
        if (categoryFilter === 'error') return c === 'error' || c === 'errors';
        if (categoryFilter === 'bug') return c === 'bug' || c === 'bugs';
        if (categoryFilter === 'performance') return c === 'performance' || c === 'perf';
        return c === categoryFilter;
      });
    }
    // Sort: issues for active file first, then other files
    return [...list].sort((a, b) => {
      if (a.filePath === activeFilePath && b.filePath !== activeFilePath) return -1;
      if (b.filePath === activeFilePath && a.filePath !== activeFilePath) return 1;
      return a.lineNumber - b.lineNumber;
    });
  }, [scanResult, categoryFilter, activeFilePath]);

  // 2. FOLDER SELECTION WITH NATIVE API OR INPUT
  const handlePickFolder = async () => {
    setErrorMsg(null);
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        setDirectoryHandle(dirHandle);

        const loadedFiles: InMemoryFile[] = [];

        async function readDir(handle: any, currentPath = '') {
          for await (const entry of handle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              if (isAllowedFile(entryPath, file.size)) {
                const content = await file.text();
                loadedFiles.push({ path: entryPath, content, size: file.size });
              }
            } else if (entry.kind === 'directory') {
              if (!IGNORED_DIRS.has(entry.name.toLowerCase())) {
                await readDir(entry, entryPath);
              }
            }
          }
        }

        await readDir(dirHandle);

        if (loadedFiles.length === 0) {
          setErrorMsg('No readable source files found.');
          return;
        }

        setFiles(loadedFiles);
        setActiveFilePath(loadedFiles[0].path);
        setPhase('preview');
        addToast('info', `Found ${loadedFiles.length} source files.`);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    folderInputRef.current?.click();
  };

  const handleInputFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const rawList = Array.from(e.target.files);
    const loaded: InMemoryFile[] = [];

    for (const f of rawList) {
      const path = (f as any).webkitRelativePath || f.name;
      if (isAllowedFile(path, f.size)) {
        const content = await f.text();
        loaded.push({ path, content, size: f.size });
      }
    }

    if (loaded.length === 0) {
      setErrorMsg('No source files found in selection.');
      return;
    }

    setFiles(loaded);
    setActiveFilePath(loaded[0].path);
    setPhase('preview');
  };

  // 3. FAST SCAN: Rule-based static scan FIRST, AI pass in background
  const runScan = async (overrideFiles?: InMemoryFile[] | React.MouseEvent) => {
    setPhase('workspace');
    setIsScanning(true);
    setScanProgress(0);
    setErrorMsg(null);

    const activeList = Array.isArray(overrideFiles) ? overrideFiles : files;
    const payloadFiles = activeList.map((f) => ({
      path: f.path,
      content: f.content,
      size: f.size,
    }));

    try {
      setScanProgress(45);
      const startTime = performance.now();

      // Rule-based fast parallel scan
      const res = await fetch(`${BACKEND_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: payloadFiles,
          enableAiEnhancement: false,
        }),
      });

      if (!res.ok) throw new Error('Scanner API failed.');

      const data: ScanResult = await res.json();
      const elapsed = Math.round(performance.now() - startTime);

      setScanResult(data);
      setScanProgress(100);

      // Select first file with issues if any
      const fileWithIssues = activeList.find((f) =>
        data.issues.some((i) => i.filePath === f.path)
      );
      if (fileWithIssues) {
        setActiveFilePath(fileWithIssues.path);
        const firstIssue = data.issues.find((i) => i.filePath === fileWithIssues.path);
        if (firstIssue) setSelectedIssueId(firstIssue.id);
      }

      addToast('success', `Scan completed in ${elapsed} ms. ${data.totalIssues} issues found.`);

      // Trigger background AI enhancement silently (Ollama pass)
      fetch(`${BACKEND_URL}/api/scan-ai-enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: payloadFiles,
          enableAiEnhancement: true,
          aiModel: 'qwen2.5-coder:7b',
        }),
      })
        .then((r) => r.json())
        .then((aiData) => {
          if (aiData?.enhancedIssues?.length > 0) {
            setScanResult((prev) => {
              if (!prev) return null;
              const enhMap = new Map<string, Issue>(
                aiData.enhancedIssues.map((i: Issue) => [i.id, i] as [string, Issue])
              );
              const updatedIssues: Issue[] = prev.issues.map((orig) =>
                enhMap.has(orig.id) ? (enhMap.get(orig.id) as Issue) : orig
              );
              return {
                ...prev,
                issues: updatedIssues,
              };
            });
            addToast('info', `Local Ollama AI refined ${aiData.enhancedIssues.length} solutions.`);
          }
        })
        .catch(() => { });
    } catch (err: any) {
      setErrorMsg(err.message || 'Scan failed.');
      addToast('error', 'Scan failed. Ensure FastAPI backend is running on port 8000.');
    } finally {
      setTimeout(() => setIsScanning(false), 400);
    }
  };

  // 4. DEBOUNCED 600ms LIVE FILE RE-SCAN (Editor typing)
  const handleCodeChange = (newCode: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === activeFilePath ? { ...f, content: newCode } : f))
    );

    if (reScanTimerRef.current) clearTimeout(reScanTimerRef.current);
    reScanTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/scan-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: activeFilePath,
            content: newCode,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const newFileIssues: Issue[] = data.issues || [];

          setScanResult((prev) => {
            if (!prev) return null;
            const otherIssues = prev.issues.filter((i) => i.filePath !== activeFilePath);
            const mergedIssues = [...otherIssues, ...newFileIssues];

            let score = 100;
            const sevCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
            const catCounts: Record<CategoryType, number> = {
              error: 0,
              bug: 0,
              security: 0,
              performance: 0,
              dependency: prev.dependencies.length,
              quality: 0,
            };

            for (const issue of mergedIssues) {
              if (issue.severity === 'Critical') score -= 15;
              else if (issue.severity === 'High') score -= 8;
              else if (issue.severity === 'Medium') score -= 4;
              else if (issue.severity === 'Low') score -= 1;

              sevCounts[issue.severity]++;
              catCounts[issue.category]++;
            }

            for (const dep of prev.dependencies) {
              if (dep.status === 'Known-vulnerable') score -= 10;
              else if (dep.status === 'Deprecated') score -= 5;
              else if (dep.status === 'Outdated') score -= 2;
            }

            return {
              ...prev,
              issues: mergedIssues,
              totalIssues: mergedIssues.length,
              severityCounts: sevCounts,
              categoryCounts: catCounts,
              healthScore: Math.max(0, Math.min(100, score)),
            };
          });
        }
      } catch (err) { }
    }, 600);
  };

  // 5. WRITE BACK TO DISK (Save)
  const saveFileToDisk = async (targetPath = activeFilePath, contentToSave?: string) => {
    const targetFile = files.find((f) => f.path === targetPath);
    if (!targetFile) return;
    const content = contentToSave !== undefined ? contentToSave : targetFile.content;

    if (directoryHandle) {
      try {
        const parts = targetPath.split(/[\/\\]/);
        let curr = directoryHandle;
        for (let i = 0; i < parts.length - 1; i++) {
          curr = await curr.getDirectoryHandle(parts[i], { create: true });
        }
        const fileHandle = await curr.getFileHandle(parts[parts.length - 1], { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        addToast('success', `Saved directly to ${targetPath}`);
        return true;
      } catch (err: any) {
        addToast('error', `Write error: ${err.message}`);
        return false;
      }
    } else {
      addToast('info', `Saved in memory. Click "Export (.zip)" to download all updated files.`);
      return true;
    }
  };

  // 6. APPLY FIX (Replaces line or range in editor, re-scans, updates counts)
  const applyFixToIssue = async (issue: Issue) => {
    // Switch to that file if not open
    if (activeFilePath !== issue.filePath) {
      setActiveFilePath(issue.filePath);
    }

    const file = files.find((f) => f.path === issue.filePath);
    if (!file) return;

    const lines = file.content.split('\n');
    const startIdx = issue.lineNumber - 1;
    const endIdx = issue.endLineNumber ? issue.endLineNumber - 1 : startIdx;
    if (startIdx < 0 || startIdx >= lines.length) return;

    const countToDelete = Math.max(1, endIdx - startIdx + 1);
    const originalText = lines.slice(startIdx, endIdx + 1).join('\n');
    issue.originalCode = originalText;
    issue.isApplied = true;

    if (issue.suggestedFix === '') {
      lines.splice(startIdx, countToDelete);
    } else {
      const fixLines = issue.suggestedFix.split('\n');
      lines.splice(startIdx, countToDelete, ...fixLines);
    }

    const newContent = lines.join('\n');
    const updatedFiles = files.map((f) => (f.path === issue.filePath ? { ...f, content: newContent } : f));
    setFiles(updatedFiles);
    handleCodeChange(newContent);
    await saveFileToDisk(issue.filePath, newContent);
    addToast('success', `Fix applied to ${issue.filePath}:${issue.lineNumber}`);
    await runScan(updatedFiles);
  };

  // UNDO FIX
  const undoFixOnIssue = async (issue: Issue) => {
    if (!issue.originalCode) return;
    const file = files.find((f) => f.path === issue.filePath);
    if (!file) return;

    const lines = file.content.split('\n');
    const startIdx = issue.lineNumber - 1;
    if (startIdx < 0 || startIdx > lines.length) return;

    const origLines = issue.originalCode.split('\n');
    const fixLineCount = issue.suggestedFix === '' ? 0 : issue.suggestedFix.split('\n').length;

    lines.splice(startIdx, fixLineCount, ...origLines);
    const newContent = lines.join('\n');
    issue.isApplied = false;

    handleCodeChange(newContent);
    await saveFileToDisk(issue.filePath, newContent);
    addToast('info', `Reverted fix on line ${issue.lineNumber}`);
  };

  // APPLY ALL FIXES FOR CURRENT CATEGORY OR ALL (REMOVE ALL ERRORS)
  const applyAllCategoryFixes = async (cat: CategoryType | 'all') => {
    const targetIssues = (scanResult?.issues || []).filter((i) => {
      if (i.isApplied || i.suggestedFix === undefined) return false;
      if (cat === 'all') return true;
      const c = i.category.toLowerCase();
      if (cat === 'error') return c === 'error' || c === 'errors';
      if (cat === 'bug') return c === 'bug' || c === 'bugs';
      if (cat === 'performance') return c === 'performance' || c === 'perf';
      return c === cat;
    });

    if (targetIssues.length === 0) {
      addToast('info', 'No pending fixes found.');
      return;
    }

    // Group by file
    const byFile: Record<string, Issue[]> = {};
    for (const i of targetIssues) {
      if (!byFile[i.filePath]) byFile[i.filePath] = [];
      byFile[i.filePath].push(i);
    }

    let appliedCount = 0;
    const updatedFiles = [...files];

    for (const [fPath, issues] of Object.entries(byFile)) {
      const fIdx = updatedFiles.findIndex((f) => f.path === fPath);
      if (fIdx === -1) continue;

      // Apply from bottom to top so line deletions do not affect earlier indices
      issues.sort((a, b) => b.lineNumber - a.lineNumber);
      let lines = updatedFiles[fIdx].content.split('\n');

      for (const issue of issues) {
        const startIdx = issue.lineNumber - 1;
        const endIdx = issue.endLineNumber ? issue.endLineNumber - 1 : startIdx;
        const countToDelete = Math.max(1, endIdx - startIdx + 1);

        if (startIdx >= 0 && startIdx < lines.length) {
          issue.originalCode = lines.slice(startIdx, endIdx + 1).join('\n');
          issue.isApplied = true;
          if (issue.suggestedFix === '') {
            lines.splice(startIdx, countToDelete);
          } else {
            const fixLines = issue.suggestedFix.split('\n');
            lines.splice(startIdx, countToDelete, ...fixLines);
          }
          appliedCount++;
        }
      }

      const newContent = lines.join('\n');
      updatedFiles[fIdx] = { ...updatedFiles[fIdx], content: newContent };
      await saveFileToDisk(fPath, newContent);
    }

    setFiles(updatedFiles);

    addToast('success', `Removed & cleaned ${appliedCount} errors across ${cat === 'all' ? 'project files' : cat}.`);
    await runScan(updatedFiles);
  };

  // FIX SINGLE DEPENDENCY
  const handleFixDependency = async (dep: DependencyItem) => {
    const isNpm = dep.ecosystem.toLowerCase() === 'npm' || !dep.ecosystem.toLowerCase().includes('python');
    const manifestName = isNpm ? 'package.json' : 'requirements.txt';

    const mIdx = files.findIndex((f) => f.path.toLowerCase().endsWith(manifestName));
    if (mIdx === -1) {
      addToast('error', `Cannot find ${manifestName} in project.`);
      return;
    }

    const targetFile = files[mIdx];
    let updatedContent = targetFile.content;
    const cleanLatest = dep.latestVersion.replace(/^[^\d]*/, '');

    if (isNpm) {
      try {
        const pkg = JSON.parse(targetFile.content);
        let found = false;
        if (pkg.dependencies && pkg.dependencies[dep.package]) {
          const prefix = pkg.dependencies[dep.package].startsWith('^') ? '^' : 
                         pkg.dependencies[dep.package].startsWith('~') ? '~' : '';
          pkg.dependencies[dep.package] = `${prefix}${cleanLatest}`;
          found = true;
        }
        if (pkg.devDependencies && pkg.devDependencies[dep.package]) {
          const prefix = pkg.devDependencies[dep.package].startsWith('^') ? '^' : 
                         pkg.devDependencies[dep.package].startsWith('~') ? '~' : '';
          pkg.devDependencies[dep.package] = `${prefix}${cleanLatest}`;
          found = true;
        }
        if (found) {
          updatedContent = JSON.stringify(pkg, null, 2);
        } else {
          const reg = new RegExp(`("${dep.package}"\\s*:\\s*")[^"]+(")`, 'g');
          updatedContent = updatedContent.replace(reg, `$1^${cleanLatest}$2`);
        }
      } catch {
        const reg = new RegExp(`("${dep.package}"\\s*:\\s*")[^"]+(")`, 'g');
        updatedContent = updatedContent.replace(reg, `$1^${cleanLatest}$2`);
      }
    } else {
      const reg = new RegExp(`^(${dep.package}\\s*(?:==|>=|<=|~=)?\\s*).*$`, 'im');
      updatedContent = updatedContent.replace(reg, `${dep.package}==${cleanLatest}`);
    }

    const updatedFiles = files.map((f, i) => (i === mIdx ? { ...f, content: updatedContent } : f));
    setFiles(updatedFiles);
    await saveFileToDisk(targetFile.path, updatedContent);
    addToast('success', `Updated ${dep.package} to ${dep.latestVersion} in ${targetFile.path}`);
    await runScan(updatedFiles);
  };

  // FIX ALL DEPENDENCIES
  const handleFixAllDependencies = async () => {
    const vulnerableDeps = (scanResult?.dependencies || []).filter(
      (d) => d.status === 'Known-vulnerable' || d.status === 'Deprecated' || d.status === 'Outdated'
    );
    if (vulnerableDeps.length === 0) {
      addToast('info', 'All dependencies are already safe and up to date.');
      return;
    }

    let updatedFiles = [...files];
    let fixedCount = 0;

    for (const dep of vulnerableDeps) {
      const isNpm = dep.ecosystem.toLowerCase() === 'npm' || !dep.ecosystem.toLowerCase().includes('python');
      const manifestName = isNpm ? 'package.json' : 'requirements.txt';
      const mIdx = updatedFiles.findIndex((f) => f.path.toLowerCase().endsWith(manifestName));
      if (mIdx === -1) continue;

      let content = updatedFiles[mIdx].content;
      const cleanLatest = dep.latestVersion.replace(/^[^\d]*/, '');

      if (isNpm) {
        try {
          const pkg = JSON.parse(content);
          let found = false;
          if (pkg.dependencies && pkg.dependencies[dep.package]) {
            const prefix = pkg.dependencies[dep.package].startsWith('^') ? '^' : '';
            pkg.dependencies[dep.package] = `${prefix}${cleanLatest}`;
            found = true;
          }
          if (pkg.devDependencies && pkg.devDependencies[dep.package]) {
            const prefix = pkg.devDependencies[dep.package].startsWith('^') ? '^' : '';
            pkg.devDependencies[dep.package] = `${prefix}${cleanLatest}`;
            found = true;
          }
          if (found) {
            content = JSON.stringify(pkg, null, 2);
          } else {
            const reg = new RegExp(`("${dep.package}"\\s*:\\s*")[^"]+(")`, 'g');
            content = content.replace(reg, `$1^${cleanLatest}$2`);
          }
        } catch {
          const reg = new RegExp(`("${dep.package}"\\s*:\\s*")[^"]+(")`, 'g');
          content = content.replace(reg, `$1^${cleanLatest}$2`);
        }
      } else {
        const reg = new RegExp(`^(${dep.package}\\s*(?:==|>=|<=|~=)?\\s*).*$`, 'im');
        content = content.replace(reg, `${dep.package}==${cleanLatest}`);
      }

      updatedFiles[mIdx] = { ...updatedFiles[mIdx], content };
      fixedCount++;
    }

    for (const f of updatedFiles) {
      const orig = files.find((of) => of.path === f.path);
      if (orig && orig.content !== f.content) {
        await saveFileToDisk(f.path, f.content);
      }
    }

    setFiles(updatedFiles);
    addToast('success', `Updated & secured ${fixedCount} packages in manifest.`);
    await runScan(updatedFiles);
  };

  // ZIP EXPORT
  const downloadFixedZip = async () => {
    const zip = new JSZip();
    for (const f of files) {
      zip.file(f.path, f.content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeguard-fixed-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Exported fixed project .zip');
  };

  const handleLogoClick = () => {
    if (phase === 'workspace' || files.length > 0) {
      setConfirmLeaveOpen(true);
    } else {
      resetToHome();
    }
  };

  const resetToHome = () => {
    setFiles([]);
    setScanResult(null);
    setDirectoryHandle(null);
    setPhase('upload');
    setErrorMsg(null);
    setConfirmLeaveOpen(false);
  };

  const activeFile = files.find((f) => f.path === activeFilePath);

  return (
    <PageBackground className="min-h-screen flex flex-col text-[var(--text-primary)]">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <ConfirmModal
        isOpen={confirmLeaveOpen}
        title="Leave this scan?"
        message="Unsaved changes will be lost if you return to the home screen."
        confirmLabel="Leave"
        cancelLabel="Cancel"
        onConfirm={resetToHome}
        onCancel={() => setConfirmLeaveOpen(false)}
      />

      {/* TOP NAVIGATION */}
      <header className="h-16 border-b border-[rgba(201,119,127,0.18)] bg-[#120b1a]/80 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between relative">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer group text-left"
          title="Return to Home"
        >
          <Logo size="md" />
        </button>

        <div className="flex items-center gap-3">
          <StatusChip variant="ai" label="OLLAMA READY" />
          <StatusChip label="PRIVATE SESSION" />

          {phase === 'workspace' && (
            <>
              <button
                onClick={downloadFixedZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#190f24] hover:bg-[#231533] text-[#f6e7dc] text-xs font-medium border border-[rgba(201,119,127,0.25)] transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-[#f0c98a]" />
                <span>Export (.zip)</span>
              </button>

              <button
                onClick={handleLogoClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#190f24] hover:bg-[#231533] text-[#b8a5b8] hover:text-[#f6e7dc] text-xs font-medium border border-[rgba(201,119,127,0.25)] transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Scan</span>
              </button>
            </>
          )}

          <a
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#190f24] hover:bg-[#231533] text-[#f6e7dc] text-xs font-medium border border-[rgba(201,119,127,0.25)] transition-all cursor-pointer shadow-sm"
            title="Account / Session"
          >
            <span className="w-2 h-2 rounded-full bg-[#f0c98a]"></span>
            <span>Sign in</span>
          </a>
        </div>

        {/* Dynamic Scanning Line */}
        {isScanning && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
            <div className="h-full w-full clyro-scan-beam" />
          </div>
        )}
      </header>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleInputFiles}
        style={{ display: 'none' }}
        {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
      />
      <input
        type="file"
        ref={filesInputRef}
        onChange={handleInputFiles}
        multiple
        style={{ display: 'none' }}
      />

      {/* 1. MINIMAL CLASSIC HOME SCREEN */}
      {phase === 'upload' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(201,119,127,0.12)] border border-[rgba(201,119,127,0.28)] text-[#c9777f] flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(201,119,127,0.15)]">
            <Shield className="w-7 h-7" />
          </div>

          <h1 className="font-serif-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f6e7dc] leading-tight">
            Scan before you merge.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#b8a5b8] font-light max-w-xl leading-relaxed">
            A clearer view before the merge. Local-first automated code inspection, vulnerability detection, and instant line fixes.
          </p>

          <div
            onClick={handlePickFolder}
            className="mt-10 w-full max-w-lg p-10 rounded-3xl border-2 border-dashed border-[rgba(201,119,127,0.3)] bg-[#190f24]/70 hover:border-[#c9777f] hover:bg-[#190f24]/90 hover:shadow-[0_0_35px_rgba(201,119,127,0.2)] transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group backdrop-blur-md"
          >
            <div className="w-14 h-14 rounded-2xl bg-[rgba(201,119,127,0.15)] border border-[rgba(201,119,127,0.25)] text-[#f0c98a] flex items-center justify-center group-hover:scale-105 group-hover:text-[#c9777f] transition-all">
              <FolderPlus className="w-7 h-7" />
            </div>

            <span className="mt-5 text-lg font-semibold text-[#f6e7dc] group-hover:text-white transition-colors">
              + Add Folder
            </span>
            <p className="text-xs text-[#b8a5b8] mt-1.5 font-sans">
              Select project directory or drag and drop files here
            </p>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-mono">or</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  filesInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0f0816] hover:bg-[#231533] text-xs font-medium text-[#f6e7dc] border border-[rgba(201,119,127,0.3)] transition-all cursor-pointer shadow-sm hover:border-[#c9777f]"
              >
                <FilePlus className="w-3.5 h-3.5 text-[#f0c98a]" />
                Add Files
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="mt-4 text-xs font-medium text-[#f43f5e] bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.3)] px-4 py-2 rounded-xl">
              {errorMsg}
            </p>
          )}

          <div className="mt-14 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#8e7a8e] font-mono">
            <Lock className="w-3.5 h-3.5 text-[#f0c98a]" />
            <span>CLYRO · PRIVATE CODE REVIEW · RUNS 100% LOCALLY</span>
          </div>
        </main>
      )}

      {/* 2. FILE PREVIEW SCREEN */}
      {phase === 'preview' && (
        <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={resetToHome}
                className="p-2 rounded-xl bg-[#190f24] hover:bg-[#231533] border border-[rgba(201,119,127,0.25)] text-[#b8a5b8] hover:text-[#f6e7dc] transition-all cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-serif-heading text-xl font-bold text-[#f6e7dc]">
                  Project Files Ready ({files.length})
                </h2>
                <p className="text-xs text-[#b8a5b8]">
                  Lock files, generated bundles, and binaries filtered out.
                </p>
              </div>
            </div>

            <button
              onClick={handlePickFolder}
              className="text-xs text-[#f0c98a] hover:text-[#f6e7dc] hover:underline cursor-pointer"
            >
              Change Folder
            </button>
          </div>

          <div className="clyro-glass rounded-3xl border border-[rgba(201,119,127,0.25)] p-4 max-h-80 overflow-y-auto space-y-1 font-mono text-xs shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-[rgba(201,119,127,0.1)] text-[#b8a5b8] transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileCode className="w-4 h-4 text-[#f0c98a] shrink-0" />
                  <span className="truncate text-[#f6e7dc]">{f.path}</span>
                </div>
                <span className="text-[11px] text-[#8e7a8e] shrink-0 ml-4 font-mono">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={runScan}
              className="clyro-btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-xs tracking-wider uppercase shadow-lg transition-all cursor-pointer hover:shadow-[0_0_25px_rgba(201,119,127,0.4)]"
            >
              <Zap className="w-4 h-4 fill-current text-[#f0c98a]" />
              <span>Start Fast Scan ({files.length} files)</span>
            </button>
          </div>
        </main>
      )}

      {/* 3. WORKSPACE WITH TOP CATEGORY BUTTONS & 3-PANE IDE */}
      {phase === 'workspace' && scanResult && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar with Live Health Score & Category Filter Buttons */}
          <div className="px-6 py-3 border-b border-[rgba(201,119,127,0.18)] bg-[#190f24]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
            {/* Health Score */}
            <div className="flex items-center gap-3">
              <HealthGauge score={scanResult.healthScore} size={50} />
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8e7a8e] font-mono">
                  Health Index
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold font-serif-heading text-[#f6e7dc]">
                    {scanResult.healthScore}/100
                  </span>
                  <span className="text-xs text-[#b8a5b8]">
                    ({scanResult.totalIssues} issues)
                  </span>
                </div>
              </div>
            </div>

            {/* SIX CATEGORY BUTTONS + ALL (Live counts, filtering across project) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* ALL BUTTON */}
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setActiveTab('editor');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${categoryFilter === 'all' && activeTab === 'editor'
                    ? 'clyro-btn-primary border-transparent text-white shadow-[0_0_15px_rgba(201,119,127,0.35)]'
                    : 'bg-[#0f0816]/80 border-[rgba(201,119,127,0.25)] text-[#b8a5b8] hover:text-[#f6e7dc] hover:border-[rgba(201,119,127,0.45)]'
                  }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#f0c98a]" />
                <span>All</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#000000]/60 font-mono text-[#f6e7dc]">
                  {categoryCounts.all}
                </span>
              </button>

              {/* 6 CATEGORY BUTTONS */}
              {[
                { id: 'error', label: 'Errors', count: categoryCounts.error, color: 'text-rose-400', icon: AlertTriangle },
                { id: 'bug', label: 'Bugs', count: categoryCounts.bug, color: 'text-orange-400', icon: Bug },
                { id: 'security', label: 'Security', count: categoryCounts.security, color: 'text-red-400', icon: ShieldAlert },
                { id: 'performance', label: 'Perf', count: categoryCounts.performance, color: 'text-amber-400', icon: Zap },
                { id: 'dependency', label: 'Deps', count: categoryCounts.dependency, color: 'text-indigo-400', icon: Package },
                { id: 'quality', label: 'Quality', count: categoryCounts.quality, color: 'text-emerald-400', icon: CheckCircle },
              ].map((item) => {
                const isActive =
                  item.id === 'dependency'
                    ? activeTab === 'dependencies'
                    : categoryFilter === item.id && activeTab === 'editor';

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'dependency') {
                        setActiveTab('dependencies');
                      } else {
                        setActiveTab('editor');
                        // Toggle filter
                        setCategoryFilter(categoryFilter === item.id ? 'all' : (item.id as CategoryType));
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isActive
                        ? 'clyro-btn-primary border-transparent text-white shadow-[0_0_15px_rgba(201,119,127,0.35)]'
                        : 'bg-[#0f0816]/80 border-[rgba(201,119,127,0.25)] text-[#b8a5b8] hover:text-[#f6e7dc] hover:border-[rgba(201,119,127,0.45)]'
                      }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span>{item.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${item.count > 0 ? 'bg-[#000000]/60 font-bold text-[#f6e7dc]' : 'opacity-60 text-[#8e7a8e]'
                        }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}

              {/* REMOVE ALL ERRORS (1-CLICK CLEANUP) */}
              {scanResult.issues.filter(i => !i.isApplied && i.suggestedFix !== undefined).length > 0 && (
                <button
                  onClick={() => applyAllCategoryFixes('all')}
                  className="clyro-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-[0_0_20px_rgba(201,119,127,0.35)] transition-all cursor-pointer ml-1"
                  title="Automatically fix and remove all detected errors in this project"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#f0c98a]" />
                  <span>Remove All Errors ({scanResult.issues.filter(i => !i.isApplied && i.suggestedFix !== undefined).length})</span>
                </button>
              )}
            </div>

            {/* TAB SWITCHER */}
            <div className="flex items-center gap-1 bg-[#0f0816]/90 p-1 rounded-full border border-[rgba(201,119,127,0.25)]">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${activeTab === 'editor'
                    ? 'bg-[rgba(201,119,127,0.25)] border border-[rgba(201,119,127,0.45)] text-[#f6e7dc] font-semibold shadow-sm'
                    : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
                  }`}
              >
                Workspace
              </button>
              <button
                onClick={() => setActiveTab('dependencies')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${activeTab === 'dependencies'
                    ? 'bg-[rgba(201,119,127,0.25)] border border-[rgba(201,119,127,0.45)] text-[#f6e7dc] font-semibold shadow-sm'
                    : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
                  }`}
              >
                Dependencies ({categoryCounts.dependency})
              </button>
              <button
                onClick={() => setActiveTab('practices')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${activeTab === 'practices'
                    ? 'bg-[rgba(201,119,127,0.25)] border border-[rgba(201,119,127,0.45)] text-[#f6e7dc] font-semibold shadow-sm'
                    : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
                  }`}
              >
                Best Practices
              </button>
            </div>
          </div>

          {/* TAB 1: CODE WORKSPACE (3-Pane IDE) */}
          {activeTab === 'editor' && (
            <div className="flex-1 grid grid-cols-12 overflow-hidden">
              {/* LEFT: File Explorer (Cols 3) */}
              <div className="col-span-3 h-full overflow-hidden">
                <FileExplorer
                  files={files}
                  selectedPath={activeFilePath}
                  onSelectFile={(path) => {
                    setActiveFilePath(path);
                    const first = scanResult.issues.find((i) => i.filePath === path);
                    if (first) setSelectedIssueId(first.id);
                  }}
                  issues={scanResult.issues.filter((i) => !i.isApplied)}
                />
              </div>

              {/* CENTER: Monaco Code Editor with Live Squiggly Lines (Cols 5) */}
              <div className="col-span-5 h-full overflow-hidden border-r border-[var(--border-color)]">
                {activeFile ? (
                  <MonacoCodeWorkspace
                    filePath={activeFilePath}
                    code={activeFile.content}
                    onChangeCode={handleCodeChange}
                    issues={scanResult.issues.filter((i) => i.filePath === activeFilePath && !i.isApplied)}
                    selectedIssueId={selectedIssueId}
                    onSelectIssueId={(id) => setSelectedIssueId(id)}
                    onSaveToDisk={() => saveFileToDisk()}
                    isScanning={isScanning}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Select a file from the explorer
                  </div>
                )}
              </div>

              {/* RIGHT: Issues Panel with Filtered Category, Side-by-Side Solution Code, and Apply Fix (Cols 4) */}
              <div className="col-span-4 h-full overflow-hidden">
                <IssuesPanel
                  currentFile={activeFilePath}
                  issues={displayedIssues}
                  selectedCategory={categoryFilter}
                  selectedIssueId={selectedIssueId}
                  onSelectIssue={(issue) => {
                    setSelectedIssueId(issue.id);
                    // Open that file if different
                    if (issue.filePath !== activeFilePath) {
                      setActiveFilePath(issue.filePath);
                    }
                  }}
                  onApplyFix={applyFixToIssue}
                  onUndoFix={undoFixOnIssue}
                  onApplyAllCategoryFixes={applyAllCategoryFixes}
                  onApplyAllFileFixes={() => applyAllCategoryFixes('all')}
                />
              </div>
            </div>
          )}

          {/* TAB 2: DEPENDENCIES */}
          {activeTab === 'dependencies' && (
            <div className="flex-1 p-6 overflow-y-auto max-w-6xl w-full mx-auto">
              <DependenciesTab
                dependencies={scanResult.dependencies}
                onFixDependency={handleFixDependency}
                onFixAllDependencies={handleFixAllDependencies}
              />
            </div>
          )}

          {/* TAB 3: BEST PRACTICES */}
          {activeTab === 'practices' && (
            <div className="flex-1 p-6 overflow-y-auto max-w-4xl w-full mx-auto">
              <BestPracticesPanel practices={scanResult.bestPractices} />
            </div>
          )}
        </div>
      )}
    </PageBackground>
  );
}
