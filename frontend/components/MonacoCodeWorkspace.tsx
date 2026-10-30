'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Issue } from '@/types/scanner';
import { Save, Sparkles, FileCode, CheckCircle2 } from 'lucide-react';

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
        endLineNumber: issue.lineNumber,
        endColumn: endCol,
        message: `[${issue.severity}] ${issue.title}\n\n${issue.explanation}\n\nSuggested Fix:\n${issue.suggestedFix}`,
        severity,
      };
    });

    monaco.editor.setModelMarkers(model, 'codeguard', markers);

    // 2. Editor line decorations for subtle background tint
    const newDecorations = issues.map((issue) => {
      const isSelected = issue.id === selectedIssueId;
      const isCritOrHigh = issue.severity === 'Critical' || issue.severity === 'High';

      return {
        range: new monaco.Range(issue.lineNumber, 1, issue.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: isSelected
            ? 'bg-blue-600/20 border-l-4 border-blue-500'
            : isCritOrHigh
            ? 'bg-rose-950/20'
            : 'bg-amber-950/20',
          glyphMarginClassName: isCritOrHigh ? 'text-rose-500' : 'text-amber-500',
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

    // Flash highlight line temporarily
    if (monacoRef.current) {
      const monaco = monacoRef.current;
      const flashDec = editor.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(issue.lineNumber, 1, issue.lineNumber, 1),
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
  }, [selectedIssueId, issues]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChangeCode(value);
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-[#0b0f19] overflow-hidden">
      {/* Editor Sub-header Bar */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-mono text-slate-300 truncate">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-100 truncate">{filePath}</span>
          <span className="text-slate-500 uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
            {language}
          </span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes (Ctrl+S)" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-sans">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl+S</kbd> to save
          </span>
          <button
            onClick={() => {
              onSaveToDisk();
              setHasUnsavedChanges(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save File</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas with sweep beam when scanning */}
      <div className="relative flex-1">
        {isScanning && <div className="editor-scan-beam" />}

        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme === 'light' ? 'light' : 'vs-dark'}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, ui-monospace, Menlo, Monaco, Consolas, monospace',
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            glyphMargin: true,
            renderLineHighlight: 'all',
          }}
        />
      </div>
    </div>
  );
};

