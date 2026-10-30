export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type CategoryType = 'error' | 'bug' | 'security' | 'performance' | 'dependency' | 'quality';

export interface Issue {
  id: string;
  filePath: string;
  lineNumber: number;
  endLineNumber?: number;
  snippet: string;
  category: CategoryType;
  severity: SeverityLevel;
  title: string;
  explanation: string;
  suggestedFix: string;
  ruleId: string;
  aiEnhanced?: boolean;
  originalCode?: string;
  isApplied?: boolean;
}

export interface DependencyItem {
  package: string;
  currentVersion: string;
  latestVersion: string;
  status: 'Safe' | 'Outdated' | 'Deprecated' | 'Known-vulnerable';
  ecosystem: string;
  upgradeCommand: string;
  vulnerabilityDetails?: string | null;
}

export interface ScanResult {
  healthScore: number;
  totalFiles: number;
  scannedFiles: number;
  totalIssues: number;
  severityCounts: Record<SeverityLevel, number>;
  categoryCounts: Record<CategoryType, number>;
  issues: Issue[];
  dependencies: DependencyItem[];
  bestPractices: string[];
  aiProvider?: string | null;
  aiStatusMessage?: string | null;
}

export interface SelectedFile {
  path: string;
  file: File;
  content?: string;
  size: number;
}
