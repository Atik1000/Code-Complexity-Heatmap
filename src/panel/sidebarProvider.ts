// @ts-nocheck
import * as vscode from 'vscode';
import { FileAnalysis, FunctionInfo, WorkspaceAnalysis } from '../types';
import * as path from 'path';

/**
 * Tree item for the sidebar panel
 */
class ComplexityTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly functionInfo?: FunctionInfo,
    public readonly fileAnalysis?: FileAnalysis
  ) {
    super(label, collapsibleState);

    if (functionInfo) {
      this.description = `${functionInfo.complexity.score} (${functionInfo.complexity.level})`;
      this.tooltip = this.buildTooltip(functionInfo);
      this.iconPath = this.getIconPath(functionInfo.complexity.level);
      this.command = {
        command: 'codeHeatmap.jumpToFunction',
        title: 'Jump to Function',
        arguments: [functionInfo]
      };
    } else if (fileAnalysis) {
      const avgComplexity = fileAnalysis.averageComplexity.toFixed(1);
      this.description = `Avg: ${avgComplexity} | Functions: ${fileAnalysis.totalFunctions}`;
      this.tooltip = `Average Complexity: ${avgComplexity}\nTotal Functions: ${fileAnalysis.totalFunctions}`;
    }
  }

  private buildTooltip(func: FunctionInfo): string {
    return `Function: ${func.name}\n` +
           `Score: ${func.complexity.score}\n` +
           `Level: ${func.complexity.level}\n` +
           `Lines: ${func.startLine}-${func.endLine}`;
  }

  private getIconPath(level: string): vscode.ThemeIcon {
    switch (level) {
      case 'Low':
        return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.green'));
      case 'Medium':
        return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.yellow'));
      case 'High':
        return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.orange'));
      case 'Critical':
        return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.red'));
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

/**
 * Sidebar provider for complexity overview
 */
export class SidebarProvider implements vscode.TreeDataProvider<ComplexityTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ComplexityTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private workspaceAnalysis: WorkspaceAnalysis | null = null;
  private fileAnalyses: Map<string, FileAnalysis> = new Map();

  constructor() {}

  /**
   * Update analysis for a file
   */
  updateFileAnalysis(analysis: FileAnalysis): void {
    this.fileAnalyses.set(analysis.filePath, analysis);
    this.updateWorkspaceAnalysis();
    this.refresh();
  }

  /**
   * Remove file analysis
   */
  removeFileAnalysis(filePath: string): void {
    this.fileAnalyses.delete(filePath);
    this.updateWorkspaceAnalysis();
    this.refresh();
  }

  /**
   * Clear all analyses
   */
  clearAll(): void {
    this.fileAnalyses.clear();
    this.workspaceAnalysis = null;
    this.refresh();
  }

  /**
   * Get workspace analysis
   */
  getWorkspaceAnalysis(): WorkspaceAnalysis | null {
    return this.workspaceAnalysis;
  }

  /**
   * Update workspace-level analysis
   */
  private updateWorkspaceAnalysis(): void {
    const files = Array.from(this.fileAnalyses.values());
    
    if (files.length === 0) {
      this.workspaceAnalysis = null;
      return;
    }

    const totalFunctions = files.reduce((sum, file) => sum + file.totalFunctions, 0);
    const totalComplexity = files.reduce(
      (sum, file) => sum + (file.averageComplexity * file.totalFunctions),
      0
    );
    const averageComplexity = totalFunctions > 0 ? totalComplexity / totalFunctions : 0;

    // Calculate technical debt score (sum of all function scores / number of functions)
    let allScores: number[] = [];
    for (const file of files) {
      allScores = allScores.concat(file.functions.map(f => f.complexity.score));
    }
    
    const technicalDebtScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

    this.workspaceAnalysis = {
      files,
      technicalDebtScore: Math.round(technicalDebtScore * 10) / 10,
      totalFunctions,
      averageComplexity: Math.round(averageComplexity * 10) / 10
    };
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Get tree item
   */
  getTreeItem(element: ComplexityTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for tree view
   */
  getChildren(element?: ComplexityTreeItem): Promise<ComplexityTreeItem[]> {
    if (!element) {
      // Root level - show summary and files
      return Promise.resolve(this.getRootItems());
    } else if (element.contextValue === 'file') {
      // File level - show functions
      return Promise.resolve(this.getFunctionItems(element.fileAnalysis!));
    }

    return Promise.resolve([]);
  }

  /**
   * Get root level items
   */
  private getRootItems(): ComplexityTreeItem[] {
    const items: ComplexityTreeItem[] = [];

    // Add workspace summary
    if (this.workspaceAnalysis) {
      const debtStatus = this.getTechnicalDebtStatus(this.workspaceAnalysis.technicalDebtScore);
      const summaryItem = new ComplexityTreeItem(
        `Technical Debt: ${this.workspaceAnalysis.technicalDebtScore} (${debtStatus})`,
        vscode.TreeItemCollapsibleState.None,
        'summary'
      );
      summaryItem.iconPath = new vscode.ThemeIcon('graph');
      summaryItem.description = `${this.workspaceAnalysis.totalFunctions} functions`;
      items.push(summaryItem);
    }

    // Add files sorted by average complexity (highest first)
    const files = Array.from(this.fileAnalyses.values())
      .sort((a, b) => b.averageComplexity - a.averageComplexity);

    for (const file of files) {
      const fileName = path.basename(file.filePath);
      const fileItem = new ComplexityTreeItem(
        fileName,
        vscode.TreeItemCollapsibleState.Expanded,
        'file',
        undefined,
        file
      );
      fileItem.resourceUri = vscode.Uri.file(file.filePath);
      items.push(fileItem);
    }

    if (items.length === 0) {
      const emptyItem = new ComplexityTreeItem(
        'No complexity data available',
        vscode.TreeItemCollapsibleState.None,
        'empty'
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      items.push(emptyItem);
    }

    return items;
  }

  /**
   * Get function items for a file
   */
  private getFunctionItems(fileAnalysis: FileAnalysis): ComplexityTreeItem[] {
    // Sort functions by complexity score (highest first)
    const sortedFunctions = [...fileAnalysis.functions]
      .sort((a, b) => b.complexity.score - a.complexity.score);

    return sortedFunctions.map(func => 
      new ComplexityTreeItem(
        func.name,
        vscode.TreeItemCollapsibleState.None,
        'function',
        func
      )
    );
  }

  /**
   * Get technical debt status
   */
  private getTechnicalDebtStatus(score: number): string {
    if (score <= 10) {
      return 'Healthy';
    } else if (score <= 20) {
      return 'Moderate';
    } else {
      return 'High';
    }
  }
}
