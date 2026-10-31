'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { Monaco, loader } from '@monaco-editor/react';
import { Issue } from '@/types/scanner';
import { Save, Sparkles, FileCode, CheckCircle2 } from 'lucide-react';

// Configure Monaco to load 100% locally from /monaco/vs with zero internet/CDN calls
if (typeof window !== 'undefined') {
  const isGh = window.location.pathname.startsWith('/codeguard-ai');
  const monacoBase = isGh ? '/codeguard-ai/monaco/vs' : '/monaco/vs';
  loader.config({ paths: { vs: monacoBase } });
}

interface MonacoCodeWorkspaceProps {
  filePath: string;
  code: string;
  onChangeCode: (newCode: string) => void;
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssueId: (id: string) => void;
  onSaveToDisk: () => void;
  isScanning: boolean;
  theme: 'vs-dark' | 'light';
}

function getLanguageForFile(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) return 'css';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

export const MonacoCodeWorkspace: React.FC<MonacoCodeWorkspaceProps> = ({
  filePath,
  code,
  onChangeCode,
  issues,
  selectedIssueId,
  onSelectIssueId,
  onSaveToDisk,
  isScanning,
  theme,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const language = getLanguageForFile(filePath);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register CLYRO Dusk custom theme
    monaco.editor.defineTheme('clyro-dusk', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '786078', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c9777f', fontStyle: 'bold' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'f0c98a' },
        { token: 'type', foreground: 'f0c98a' },
        { token: 'function', foreground: 'a5b4fc' },
        { token: 'identifier', foreground: 'f6e7dc' },
      ],
      colors: {
        'editor.background': '#120b1a',
        'editor.foreground': '#f6e7dc',
        'editorLineNumber.foreground': '#5a4560',
        'editorLineNumber.activeForeground': '#f0c98a',
        'editor.selectionBackground': '#c9777f44',
        'editor.inactiveSelectionBackground': '#c9777f22',
        'editor.lineHighlightBackground': '#1d132b88',
        'editorCursor.foreground': '#f0c98a',
        'editorWhitespace.foreground': '#3a2540',
        'editorIndentGuide.background': '#23162e',
        'editorIndentGuide.activeBackground': '#c9777f55',
      },
    });

    monaco.editor.setTheme('clyro-dusk');

    // Listen to cursor position to select corresponding issue
    editor.onDidChangeCursorPosition((e: any) => {
      const line = e.position.lineNumber;
      const matched = issues.find((i) => i.lineNumber === line);
      if (matched) {
        onSelectIssueId(matched.id);
      }
    });

    // Ctrl+S / Cmd+S save hotkey
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveToDisk();
      setHasUnsavedChanges(false);
    });

    updateMarkersAndDecorations();

    if (selectedIssueId) {
      const currentIssue = issues.find((i) => i.id === selectedIssueId);
      if (currentIssue) {
        editor.revealLineInCenter(currentIssue.lineNumber);
        editor.setPosition({ lineNumber: currentIssue.lineNumber, column: 1 });
      }
    }
  };

  // Update Monaco squiggly line markers and gutter indicators
  const updateMarkersAndDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    // 1. Monaco Markers (Native squiggly lines & hover tooltips)
    const markers = issues.map((issue) => {
      let severity = monaco.MarkerSeverity.Error;
      if (issue.severity === 'Critical' || issue.severity === 'High') {
        severity = monaco.MarkerSeverity.Error;
      } else if (issue.severity === 'Medium') {
        severity = monaco.MarkerSeverity.Warning;
      } else {
        severity = monaco.MarkerSeverity.Info;
      }

      const lineContent = model.getLineContent(Math.min(issue.lineNumber, model.getLineCount())) || '';
      const startCol = Math.max(1, lineContent.search(/\S/) + 1);
      const endCol = Math.max(startCol + 1, lineContent.length + 1);

      return {
        startLineNumber: issue.lineNumber,
        startColumn: startCol,
        endLineNumber: issue.endLineNumber || issue.lineNumber,
        endColumn: endCol,
        message: `[${issue.severity}] ${issue.title}\n\n${issue.explanation}\n\nSolution Code:\n${issue.suggestedFix}`,
        severity,
      };
    });

    monaco.editor.setModelMarkers(model, 'clyro-engine', markers);

    // 2. Editor line decorations for subtle dusk background tint
    const newDecorations = issues.map((issue) => {
      const isSelected = issue.id === selectedIssueId;
      const isCritOrHigh = issue.severity === 'Critical' || issue.severity === 'High';

      return {
        range: new monaco.Range(issue.lineNumber, 1, issue.endLineNumber || issue.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: isSelected
            ? 'bg-[#c9777f]/25 border-l-4 border-[#c9777f]'
            : isCritOrHigh
            ? 'bg-rose-950/25'
            : 'bg-amber-950/25',
          glyphMarginClassName: isCritOrHigh ? 'text-rose-400' : 'text-amber-400',
        },
      };
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [issues, selectedIssueId]);

  useEffect(() => {
    updateMarkersAndDecorations();
  }, [updateMarkersAndDecorations]);

  // Flash & reveal line when selectedIssueId changes
  useEffect(() => {
    if (!editorRef.current || !selectedIssueId) return;
    const issue = issues.find((i) => i.id === selectedIssueId);
    if (!issue) return;

    const editor = editorRef.current;
    editor.revealLineInCenter(issue.lineNumber);
    editor.setPosition({ lineNumber: issue.lineNumber, column: 1 });

    if (monacoRef.current) {
      const monaco = monacoRef.current;
      const flashDec = editor.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(issue.lineNumber, 1, issue.endLineNumber || issue.lineNumber, 1),
            options: {
              isWholeLine: true,
              className: 'line-flash-highlight',
            },
          },
        ]
      );
      setTimeout(() => {
        editor.deltaDecorations(flashDec, []);
      }, 1500);
    }
  }, [selectedIssueId, issues, filePath]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChangeCode(value);
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-[#120b1a] overflow-hidden">
      {/* Editor Sub-header Bar */}
      <div className="px-4 py-2 border-b border-[rgba(201,119,127,0.18)] bg-[#190f24] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-mono text-[#b8a5b8] truncate">
          <FileCode className="w-3.5 h-3.5 text-[#c9777f]" />
          <span className="font-semibold text-[#f6e7dc] truncate">{filePath}</span>
          <span className="text-[#b8a5b8] uppercase text-[10px] px-1.5 py-0.5 rounded-md bg-[#0f0816] border border-[rgba(201,119,127,0.2)]">
            {language}
          </span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 rounded-full bg-[#f0c98a]" title="Unsaved changes (Ctrl+S)" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#7e6980] font-sans hidden sm:inline">
            Press <kbd className="px-1 py-0.5 rounded bg-[#0f0816] border border-[rgba(201,119,127,0.2)] text-[#f0c98a] font-mono text-[10px]">Ctrl+S</kbd> to save
          </span>
          <button
            onClick={() => {
              onSaveToDisk();
              setHasUnsavedChanges(false);
            }}
            className="clyro-btn-primary flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-semibold text-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save File</span>
          </button>
        </div>
      </div>

      {/* Scanning Beam (Shown during parallel scan) */}
      {isScanning && <div className="clyro-scan-beam" />}

      {/* Main Monaco Editor Component */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="clyro-dusk"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
            fontSize: 13,
            lineHeight: 21,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: false,
          }}
        />
      </div>
    </div>
  );
};
