'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Save,
  CheckCheck,
} from 'lucide-react';
import JSZip from 'jszip';
import { Issue, DependencyItem, ScanResult, CategoryType, SeverityLevel } from '@/types/scanner';
import { HealthGauge } from '@/components/HealthGauge';
import { FileExplorer } from '@/components/FileExplorer';
import { MonacoCodeWorkspace } from '@/components/MonacoCodeWorkspace';
import { IssuesPanel } from '@/components/IssuesPanel';
import { DependenciesTab } from '@/components/DependenciesTab';
import { BestPracticesPanel } from '@/components/BestPracticesPanel';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';

const BACKEND_URL = 'http://localhost:8000';

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
]);

export interface InMemoryFile {
  path: string;
  content: string;
  size: number;
}

export default function Home() {
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // App Phase: 'upload' | 'preview' | 'scanning' | 'workspace'
  const [phase, setPhase] = useState<'upload' | 'preview' | 'scanning' | 'workspace'>('upload');

  // Files in memory
  const [files, setFiles] = useState<InMemoryFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');

  // Native directory handle for File System Access API
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);

  // Scan state
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningStatusText, setScanningStatusText] = useState('');

  // Selected issue in workspace
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Active top tab in workspace: 'editor' | 'dependencies' | 'practices'
  const [activeTab, setActiveTab] = useState<'editor' | 'dependencies' | 'practices'>('editor');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');

  // UI helpers
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const reScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set theme data-attribute on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Safe file filter
  const isAllowedFile = (path: string): boolean => {
    const parts = path.split(/[\/\\]/);
    for (const part of parts) {
      if (IGNORED_DIRS.has(part.toLowerCase())) return false;
    }
    const dotIdx = path.lastIndexOf('.');
    if (dotIdx !== -1) {
      const ext = path.substring(dotIdx).toLowerCase();
      if (IGNORED_EXTS.has(ext)) return false;
    }
    return true;
  };

  // 1. PICK FOLDER WITH BROWSER DIRECTORY PICKER OR INPUT FALLBACK
  const handlePickFolder = async () => {
    setErrorMsg(null);
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });
        setDirectoryHandle(dirHandle);

        const loadedFiles: InMemoryFile[] = [];

        async function readDir(handle: any, currentPath = '') {
          for await (const entry of handle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
              if (isAllowedFile(entryPath)) {
                const file = await entry.getFile();
                const content = await file.text();
                loadedFiles.push({
                  path: entryPath,
                  content,
                  size: file.size,
                });
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
          setErrorMsg('No source files found in selected directory.');
          return;
        }

        setFiles(loadedFiles);
        setActiveFilePath(loadedFiles[0].path);
        setPhase('preview');
        addToast('info', `Loaded ${loadedFiles.length} project files with live disk write access.`);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        // Fallback to HTML input
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
      if (isAllowedFile(path)) {
        const content = await f.text();
        loaded.push({ path, content, size: f.size });
      }
    }

    if (loaded.length === 0) {
      setErrorMsg('No source files found in the chosen selection.');
      return;
    }

    setFiles(loaded);
    setActiveFilePath(loaded[0].path);
    setPhase('preview');
  };

  // Drag and Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    if (!items) return;

    const loaded: InMemoryFile[] = [];

    const traverse = async (entry: any, curPath = '') => {
      const full = curPath ? `${curPath}/${entry.name}` : entry.name;
      if (entry.isFile) {
        if (isAllowedFile(full)) {
          const file: File = await new Promise((res) => entry.file(res));
          const content = await file.text();
          loaded.push({ path: full, content, size: file.size });
        }
      } else if (entry.isDirectory) {
        if (!IGNORED_DIRS.has(entry.name.toLowerCase())) {
          const reader = entry.createReader();
          const entries: any[] = await new Promise((res) => reader.readEntries(res));
          for (const c of entries) {
            await traverse(c, full);
          }
        }
      }
    };

    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const entry = (items[i] as any).webkitGetAsEntry?.();
      if (entry) promises.push(traverse(entry));
    }

    await Promise.all(promises);

    if (loaded.length > 0) {
      setFiles(loaded);
      setActiveFilePath(loaded[0].path);
      setPhase('preview');
    }
  };

  // 2. START THE PROJECT SCAN
  const runScan = async () => {
    setPhase('workspace');
    setIsScanning(true);
    setScanProgress(0);
    setErrorMsg(null);

    try {
      const payloadFiles = files.map((f) => ({
        path: f.path,
        content: f.content,
        size: f.size,
      }));

      setScanningStatusText('Performing AST parsing and security pattern audit...');
      setScanProgress(30);

      const res = await fetch(`${BACKEND_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: payloadFiles,
          enableAiEnhancement: true,
          aiModel: 'qwen2.5-coder:7b',
        }),
      });

      if (!res.ok) {
        throw new Error('Scanner API failed.');
      }

      setScanProgress(80);
      setScanningStatusText('Aggregating findings & computing health index...');

      const data: ScanResult = await res.json();
      setScanResult(data);
      setScanProgress(100);

      if (data.issues.length > 0) {
        setSelectedIssueId(data.issues[0].id);
      }

      addToast('success', `Scan complete. Found ${data.totalIssues} issues across ${data.scannedFiles} files.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Scan failed.');
      addToast('error', 'Scan failed. Ensure backend is running.');
    } finally {
      setTimeout(() => setIsScanning(false), 600);
    }
  };

  // 3. LIVE DEBOUNCED RE-SCAN OF EDITED FILE
  const handleCodeChange = (newCode: string) => {
    // Update local state immediately
    setFiles((prev) =>
      prev.map((f) => (f.path === activeFilePath ? { ...f, content: newCode } : f))
    );

    // Debounce re-scan by 800ms
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

          // Merge issues back into scanResult
          setScanResult((prev) => {
            if (!prev) return null;
            const otherIssues = prev.issues.filter((i) => i.filePath !== activeFilePath);
            const mergedIssues = [...otherIssues, ...newFileIssues];

            // Recompute counts & health score
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
      } catch (err) {
        // Silent background fallback
      }
    }, 800);
  };

  // 4. WRITE CODE TO DISK (Save)
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
        addToast('error', `Disk write failed: ${err.message}`);
        return false;
      }
    } else {
      addToast('info', `Updated in memory. Use "Export .zip" to save all project files.`);
      return true;
    }
  };

  // 5. APPLY FIX ON AN ISSUE
  const applyFixToIssue = async (issue: Issue) => {
    const file = files.find((f) => f.path === issue.filePath);
    if (!file) return;

    const lines = file.content.split('\n');
    const lineIdx = issue.lineNumber - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) return;

    const originalLine = lines[lineIdx];
    // If fix is empty string, remove the line completely
    if (issue.suggestedFix === '') {
      lines.splice(lineIdx, 1);
    } else {
      lines[lineIdx] = issue.suggestedFix;
    }

    const newContent = lines.join('\n');
    issue.originalCode = originalLine;
    issue.isApplied = true;

    handleCodeChange(newContent);
    await saveFileToDisk(issue.filePath, newContent);
    addToast('success', `Fix applied to ${issue.filePath}:${issue.lineNumber}`);
  };

  // UNDO FIX
  const undoFixOnIssue = async (issue: Issue) => {
    if (!issue.originalCode) return;
    const file = files.find((f) => f.path === issue.filePath);
    if (!file) return;

    const lines = file.content.split('\n');
    const lineIdx = issue.lineNumber - 1;

    if (issue.suggestedFix === '') {
      // Re-insert removed line
      lines.splice(lineIdx, 0, issue.originalCode);
    } else if (lineIdx < lines.length) {
      lines[lineIdx] = issue.originalCode;
    }

    const newContent = lines.join('\n');
    issue.isApplied = false;

    handleCodeChange(newContent);
    await saveFileToDisk(issue.filePath, newContent);
    addToast('info', `Reverted fix on line ${issue.lineNumber}`);
  };

  // APPLY ALL SAFE FIXES IN CURRENT FILE
  const applyAllSafeFixesInFile = async () => {
    const fileIssues = (scanResult?.issues || [])
      .filter((i) => i.filePath === activeFilePath && !i.isApplied && i.suggestedFix !== undefined)
      // Apply from bottom to top so line deletions do not affect earlier indices!
      .sort((a, b) => b.lineNumber - a.lineNumber);

    if (fileIssues.length === 0) return;

    const file = files.find((f) => f.path === activeFilePath);
    if (!file) return;

    let lines = file.content.split('\n');

    for (const issue of fileIssues) {
      const idx = issue.lineNumber - 1;
      if (idx >= 0 && idx < lines.length) {
        issue.originalCode = lines[idx];
        issue.isApplied = true;
        if (issue.suggestedFix === '') {
          lines.splice(idx, 1);
        } else {
          lines[idx] = issue.suggestedFix;
        }
      }
    }

    const newContent = lines.join('\n');
    handleCodeChange(newContent);
    await saveFileToDisk(activeFilePath, newContent);
    addToast('success', `Applied ${fileIssues.length} fixes to ${activeFilePath}`);
  };

  // APPLY ALL SAFE FIXES ACROSS WHOLE PROJECT
  const applyAllProjectFixes = async () => {
    const allSafe = (scanResult?.issues || []).filter((i) => !i.isApplied && i.suggestedFix !== undefined);
    if (allSafe.length === 0) {
      addToast('info', 'No pending fixes to apply.');
      return;
    }

    // Group by file
    const byFile: Record<string, Issue[]> = {};
    for (const i of allSafe) {
      if (!byFile[i.filePath]) byFile[i.filePath] = [];
      byFile[i.filePath].push(i);
    }

    let appliedCount = 0;
    const updatedFiles = [...files];

    for (const [fPath, issues] of Object.entries(byFile)) {
      const fIdx = updatedFiles.findIndex((f) => f.path === fPath);
      if (fIdx === -1) continue;

      // Sort descending line numbers
      issues.sort((a, b) => b.lineNumber - a.lineNumber);
      let lines = updatedFiles[fIdx].content.split('\n');

      for (const issue of issues) {
        const idx = issue.lineNumber - 1;
        if (idx >= 0 && idx < lines.length) {
          issue.originalCode = lines[idx];
          issue.isApplied = true;
          if (issue.suggestedFix === '') {
            lines.splice(idx, 1);
          } else {
            lines[idx] = issue.suggestedFix;
          }
          appliedCount++;
        }
      }

      const newContent = lines.join('\n');
      updatedFiles[fIdx] = { ...updatedFiles[fIdx], content: newContent };
      await saveFileToDisk(fPath, newContent);
    }

    setFiles(updatedFiles);
    // Trigger global re-scan
    runScan();
    addToast('success', `Applied ${appliedCount} fixes across the entire project.`);
  };

  // DOWNLOAD FIXED PROJECT ZIP
  const downloadFixedZip = async () => {
    const zip = new JSZip();
    for (const f of files) {
      zip.file(f.path, f.content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeguard-fixed-project-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Downloaded fixed project zip.');
  };

  // LOGO & HOME CONFIRMATION
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
  const activeFileIssues = (scanResult?.issues || [])
    .filter((i) => i.filePath === activeFilePath)
    .filter((i) => (categoryFilter === 'all' ? true : i.category === categoryFilter))
    .sort((a, b) => a.lineNumber - b.lineNumber);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Confirm Leave Modal */}
      <ConfirmModal
        isOpen={confirmLeaveOpen}
        title="Leave this scan?"
        message="Unsaved code changes will be lost if you return to the home screen."
        confirmLabel="Leave"
        cancelLabel="Cancel"
        onConfirm={resetToHome}
        onCancel={() => setConfirmLeaveOpen(false)}
      />

      {/* TOP NAVBAR */}
      <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        {/* Brand Logo - Returns Home */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer group"
          title="Return to Home"
        >
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-serif-heading font-bold text-base tracking-tight text-[var(--text-primary)]">
            CODEGUARD AI
          </span>
        </button>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* New Scan / Export Buttons */}
          {phase === 'workspace' && (
            <>
              <button
                onClick={downloadFixedZip}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--bg-secondary)] hover:bg-slate-800 text-[var(--text-primary)] text-xs font-medium border border-[var(--border-color)] transition-colors cursor-pointer"
                title="Download updated code as .zip"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export (.zip)</span>
              </button>

              <button
                onClick={handleLogoClick}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--bg-secondary)] hover:bg-slate-800 text-[var(--text-secondary)] hover:text-white text-xs font-medium border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Scan</span>
              </button>
            </>
          )}
        </div>
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

      {/* MAIN SCREEN FLOWS */}

      {/* 1. CLASSIC HOME SCREEN: Centered serif heading, single tagline, drop zone */}
      {phase === 'upload' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto">
          <div className="w-12 h-12 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-500 flex items-center justify-center mb-6 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>

          <h1 className="font-serif-heading text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            Scan Before You Merge
          </h1>
          <p className="mt-3 text-base text-[var(--text-secondary)] font-normal max-w-lg leading-relaxed">
            Local, in-editor code inspection, vulnerability detection, and automated line fixes for hackathon teams.
          </p>

          {/* Add Folder Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={handlePickFolder}
            className="mt-10 w-full max-w-md p-10 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] hover:border-blue-500/80 hover:bg-[var(--bg-secondary)] transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group shadow-sm"
          >
            <div className="w-12 h-12 rounded-md bg-blue-600/10 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderPlus className="w-6 h-6" />
            </div>

            <span className="mt-4 text-base font-semibold text-[var(--text-primary)]">
              + Add Folder
            </span>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Select project folder or drag & drop here
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">or</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  filesInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-secondary)] hover:bg-slate-800 text-xs font-medium text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                <FilePlus className="w-3 h-3 text-blue-400" />
                Add Files
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="mt-4 text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded">
              {errorMsg}
            </p>
          )}
        </main>
      )}

      {/* 2. PREVIEW FILE LIST SCREEN */}
      {phase === 'preview' && (
        <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={resetToHome}
                className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-serif-heading text-lg font-bold text-[var(--text-primary)]">
                  Project Files Ready ({files.length})
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Binary and build files excluded. Ready for in-editor analysis.
                </p>
              </div>
            </div>

            <button
              onClick={handlePickFolder}
              className="text-xs text-blue-500 hover:underline cursor-pointer"
            >
              Change Folder
            </button>
          </div>

          {/* File list preview */}
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 max-h-72 overflow-y-auto space-y-1 font-mono text-xs">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-4">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={runScan}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide shadow-md transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Start Live Scan ({files.length} files)</span>
            </button>
          </div>
        </main>
      )}

      {/* 3. WORKSPACE: COMPACT TOP SUMMARY BAR + 3-PANE IDE WORKSPACE */}
      {phase === 'workspace' && scanResult && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Compact Summary Bar */}
          <div className="px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-wrap items-center justify-between gap-4">
            {/* Left: Health Gauge & Score */}
            <div className="flex items-center gap-4">
              <HealthGauge score={scanResult.healthScore} size={54} />
              <div>
                <span className="text-xs uppercase font-semibold tracking-wider text-[var(--text-secondary)]">
                  Project Health
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-serif-heading text-[var(--text-primary)]">
                    {scanResult.healthScore}/100
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    ({scanResult.totalIssues} issues)
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: 6 Counter Badges (Clicking filters list) */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'error', label: 'Errors', count: scanResult.categoryCounts.error, color: 'text-rose-400', icon: AlertTriangle },
                { id: 'bug', label: 'Bugs', count: scanResult.categoryCounts.bug, color: 'text-orange-400', icon: Bug },
                { id: 'security', label: 'Security', count: scanResult.categoryCounts.security, color: 'text-red-400', icon: ShieldAlert },
                { id: 'performance', label: 'Perf', count: scanResult.categoryCounts.performance, color: 'text-amber-400', icon: Zap },
                { id: 'dependency', label: 'Deps', count: scanResult.dependencies.length, color: 'text-blue-400', icon: Package },
                { id: 'quality', label: 'Quality', count: scanResult.categoryCounts.quality, color: 'text-emerald-400', icon: CheckCircle },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'dependency') {
                      setActiveTab('dependencies');
                    } else {
                      setActiveTab('editor');
                      setCategoryFilter(categoryFilter === item.id ? 'all' : (item.id as CategoryType));
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    (categoryFilter === item.id && activeTab === 'editor') ||
                    (item.id === 'dependency' && activeTab === 'dependencies')
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.label}</span>
                  <span className="font-bold text-[var(--text-primary)]">{item.count}</span>
                </button>
              ))}
            </div>

            {/* Right: Tab Switcher (Editor Workspace | Dependencies | Best Practices) */}
            <div className="flex items-center gap-1 bg-[var(--bg-card)] p-0.5 rounded-md border border-[var(--border-color)]">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Code Workspace
              </button>
              <button
                onClick={() => setActiveTab('dependencies')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'dependencies'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Dependencies ({scanResult.dependencies.length})
              </button>
              <button
                onClick={() => setActiveTab('practices')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'practices'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Best Practices
              </button>
            </div>
          </div>

          {/* MAIN WORKSPACE BODY */}
          {activeTab === 'editor' && (
            <div className="flex-1 grid grid-cols-12 overflow-hidden">
              {/* LEFT: File Explorer Tree (Cols 3) */}
              <div className="col-span-3 h-full overflow-hidden">
                <FileExplorer
                  files={files}
                  selectedPath={activeFilePath}
                  onSelectFile={(path) => {
                    setActiveFilePath(path);
                    const first = scanResult.issues.find((i) => i.filePath === path);
                    if (first) setSelectedIssueId(first.id);
                  }}
                  issues={scanResult.issues}
                />
              </div>

              {/* CENTER: Monaco Code Editor with Live Squiggly Markers (Cols 6) */}
              <div className="col-span-6 h-full overflow-hidden border-r border-[var(--border-color)]">
                {activeFile ? (
                  <MonacoCodeWorkspace
                    filePath={activeFilePath}
                    code={activeFile.content}
                    onChangeCode={handleCodeChange}
                    issues={scanResult.issues.filter((i) => i.filePath === activeFilePath)}
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

              {/* RIGHT: Issues Panel with "Apply Fix" & Diff Preview (Cols 3) */}
              <div className="col-span-3 h-full overflow-hidden">
                <IssuesPanel
                  currentFile={activeFilePath}
                  issues={activeFileIssues}
                  selectedIssueId={selectedIssueId}
                  onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                  onApplyFix={applyFixToIssue}
                  onUndoFix={undoFixOnIssue}
                  onApplyAllSafeFixes={applyAllSafeFixesInFile}
                  onApplyAllProjectFixes={applyAllProjectFixes}
                />
              </div>
            </div>
          )}

          {/* TAB: DEPENDENCIES */}
          {activeTab === 'dependencies' && (
            <div className="flex-1 p-6 overflow-y-auto max-w-6xl w-full mx-auto">
              <DependenciesTab dependencies={scanResult.dependencies} />
            </div>
          )}

          {/* TAB: BEST PRACTICES */}
          {activeTab === 'practices' && (
            <div className="flex-1 p-6 overflow-y-auto max-w-4xl w-full mx-auto">
              <BestPracticesPanel practices={scanResult.bestPractices} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
