from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field

SeverityLevel = Literal["Critical", "High", "Medium", "Low"]
CategoryType = Literal["error", "bug", "security", "performance", "dependency", "quality"]

class Issue(BaseModel):
    id: str
    filePath: str
    lineNumber: int
    endLineNumber: Optional[int] = None
    snippet: str
    category: CategoryType
    severity: SeverityLevel
    title: str
    explanation: str
    suggestedFix: str
    ruleId: str
    aiEnhanced: bool = False
    originalCode: Optional[str] = None
    isApplied: bool = False

class DependencyItem(BaseModel):
    package: str
    currentVersion: str
    latestVersion: str
    status: Literal["Safe", "Outdated", "Deprecated", "Known-vulnerable"]
    ecosystem: str
    upgradeCommand: str
    vulnerabilityDetails: Optional[str] = None

class FileInput(BaseModel):
    path: str
    content: str
    size: Optional[int] = 0

class ScanRequest(BaseModel):
    files: List[FileInput]
    enableAiEnhancement: bool = True
    aiModel: Optional[str] = "qwen2.5-coder:7b"

class SingleFileScanRequest(BaseModel):
    path: str
    content: str
    enableAiEnhancement: bool = False
    aiModel: Optional[str] = "qwen2.5-coder:7b"

class ScanResult(BaseModel):
    healthScore: int
    totalFiles: int
    scannedFiles: int
    totalIssues: int
    severityCounts: Dict[str, int]
    categoryCounts: Dict[str, int]
    issues: List[Issue]
    dependencies: List[DependencyItem]
    bestPractices: List[str]
    aiProvider: Optional[str] = None
    aiStatusMessage: Optional[str] = None
