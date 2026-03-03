// @ts-nocheck
import * as vscode from 'vscode';
import { ComplexityLevel, FunctionInfo } from '../types';

/**
 * Manages decorations for the complexity heatmap
 */
export class HeatmapDecorator {
  private lowComplexityDecoration: vscode.TextEditorDecorationType;
  private mediumComplexityDecoration: vscode.TextEditorDecorationType;
  private highComplexityDecoration: vscode.TextEditorDecorationType;
  private criticalComplexityDecoration: vscode.TextEditorDecorationType;

  constructor() {
    this.lowComplexityDecoration = this.createDecoration(
      'rgba(0, 255, 0, 0.15)',
      'rgba(0, 200, 0, 0.4)',
      '#008000'
    );

    this.mediumComplexityDecoration = this.createDecoration(
      'rgba(255, 255, 0, 0.25)',
      'rgba(255, 200, 0, 0.5)',
      '#FFA500'
    );

    this.highComplexityDecoration = this.createDecoration(
      'rgba(255, 140, 0, 0.3)',
      'rgba(255, 100, 0, 0.6)',
      '#FF8C00'
    );

    this.criticalComplexityDecoration = this.createDecoration(
      'rgba(255, 0, 0, 0.35)',
      'rgba(255, 0, 0, 0.7)',
      '#DC143C'
    );
  }

  /**
   * Create a decoration type with specific colors
   */
  private createDecoration(
    backgroundColor: string,
    borderColor: string,
    overviewRulerColor: string
  ): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor,
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor,
      overviewRulerColor,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      isWholeLine: true
    });
  }

  /**
   * Apply decorations to an editor based on function complexity
   */
  applyDecorations(editor: vscode.TextEditor, functions: FunctionInfo[]): void {
    const lowRanges: vscode.Range[] = [];
    const mediumRanges: vscode.Range[] = [];
    const highRanges: vscode.Range[] = [];
    const criticalRanges: vscode.Range[] = [];

    for (const func of functions) {
      // Create range for the entire function
      const range = new vscode.Range(
        func.startLine - 1, // Convert to 0-based
        func.startColumn,
        func.endLine - 1,
        func.endColumn
      );

      // Categorize by complexity level
      switch (func.complexity.level) {
        case ComplexityLevel.Low:
          lowRanges.push(range);
          break;
        case ComplexityLevel.Medium:
          mediumRanges.push(range);
          break;
        case ComplexityLevel.High:
          highRanges.push(range);
          break;
        case ComplexityLevel.Critical:
          criticalRanges.push(range);
          break;
      }
    }

    // Apply decorations
    editor.setDecorations(this.lowComplexityDecoration, lowRanges);
    editor.setDecorations(this.mediumComplexityDecoration, mediumRanges);
    editor.setDecorations(this.highComplexityDecoration, highRanges);
    editor.setDecorations(this.criticalComplexityDecoration, criticalRanges);
  }

  /**
   * Clear all decorations from an editor
   */
  clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.lowComplexityDecoration, []);
    editor.setDecorations(this.mediumComplexityDecoration, []);
    editor.setDecorations(this.highComplexityDecoration, []);
    editor.setDecorations(this.criticalComplexityDecoration, []);
  }

  /**
   * Dispose of all decoration types
   */
  dispose(): void {
    this.lowComplexityDecoration.dispose();
    this.mediumComplexityDecoration.dispose();
    this.highComplexityDecoration.dispose();
    this.criticalComplexityDecoration.dispose();
  }
}
