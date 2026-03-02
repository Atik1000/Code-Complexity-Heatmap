/**
 * Core types for the Code Complexity Heatmap extension
 */

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  functionLength: number;
  nestedDepth: number;
  conditionCount: number;
  loopCount: number;
  parameterCount: number;
  returnCount: number;
}

export interface ComplexityScore {
  score: number;
  level: ComplexityLevel;
  metrics: ComplexityMetrics;
}

export enum ComplexityLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  complexity: ComplexityScore;
  filePath: string;
}

export interface FileAnalysis {
  filePath: string;
  language: string;
  functions: FunctionInfo[];
  averageComplexity: number;
  totalFunctions: number;
}

export interface WorkspaceAnalysis {
  files: FileAnalysis[];
  technicalDebtScore: number;
  totalFunctions: number;
  averageComplexity: number;
}

export interface ComplexityThresholds {
  low: number;
  medium: number;
  high: number;
}

export interface RefactoringSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
