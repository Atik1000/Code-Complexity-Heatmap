import * as vscode from 'vscode';
import { FunctionInfo } from '../types';

/**
 * Provides hover information for functions with complexity metrics
 */
export class ComplexityHoverProvider implements vscode.HoverProvider {
  private functionsMap: Map<string, FunctionInfo[]> = new Map();

  /**
   * Update the functions map for a file
   */
  updateFunctions(filePath: string, functions: FunctionInfo[]): void {
    this.functionsMap.set(filePath, functions);
  }

  /**
   * Clear functions for a file
   */
  clearFunctions(filePath: string): void {
    this.functionsMap.delete(filePath);
  }

  /**
   * Provide hover information
   */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const filePath = document.uri.fsPath;
    const functions = this.functionsMap.get(filePath);

    if (!functions || functions.length === 0) {
      return null;
    }

    // Find function at current position
    const line = position.line + 1; // Convert to 1-based
    const foundFunction = functions.find(
      fn => line >= fn.startLine && line <= fn.endLine
    );

    if (!foundFunction) {
      return null;
    }

    // Build hover content
    const markdown = this.buildHoverMarkdown(foundFunction);
    return new vscode.Hover(markdown);
  }

  /**
   * Build markdown content for hover tooltip
   */
  private buildHoverMarkdown(func: FunctionInfo): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    const { complexity, name } = func;
    const { score, level, metrics } = complexity;

    // Add emoji based on complexity level
    const emoji = this.getComplexityEmoji(level);
    const levelColor = this.getComplexityColor(level);

    md.appendMarkdown(`### ${emoji} Function: \`${name}\`\n\n`);
    md.appendMarkdown(`**Complexity Score:** ${score} _(${level})_\n\n`);
    md.appendMarkdown('---\n\n');
    md.appendMarkdown('**Metrics:**\n\n');
    md.appendMarkdown(`- Cyclomatic Complexity: ${metrics.cyclomaticComplexity}\n`);
    md.appendMarkdown(`- Nested Depth: ${metrics.nestedDepth}\n`);
    md.appendMarkdown(`- Lines of Code: ${metrics.functionLength}\n`);
    md.appendMarkdown(`- Conditions: ${metrics.conditionCount}\n`);
    md.appendMarkdown(`- Loops: ${metrics.loopCount}\n`);
    md.appendMarkdown(`- Parameters: ${metrics.parameterCount}\n`);
    md.appendMarkdown(`- Return Statements: ${metrics.returnCount}\n`);

    // Add suggestion
    if (score > 10) {
      md.appendMarkdown('\n---\n\n');
      md.appendMarkdown('**💡 Suggestion:**\n\n');
      md.appendMarkdown(this.getRefactoringSuggestion(complexity));
    }

    return md;
  }

  /**
   * Get emoji for complexity level
   */
  private getComplexityEmoji(level: string): string {
    switch (level) {
      case 'Low':
        return '🟢';
      case 'Medium':
        return '🟡';
      case 'High':
        return '🟠';
      case 'Critical':
        return '🔴';
      default:
        return '⚪';
    }
  }

  /**
   * Get color for complexity level
   */
  private getComplexityColor(level: string): string {
    switch (level) {
      case 'Low':
        return 'green';
      case 'Medium':
        return 'yellow';
      case 'High':
        return 'orange';
      case 'Critical':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Get refactoring suggestion based on complexity
   */
  private getRefactoringSuggestion(complexity: any): string {
    const { metrics } = complexity;
    const suggestions: string[] = [];

    if (metrics.nestedDepth > 3) {
      suggestions.push('- Reduce nesting depth by extracting nested logic into separate functions');
    }

    if (metrics.functionLength > 50) {
      suggestions.push('- Break this large function into smaller, focused functions');
    }

    if (metrics.cyclomaticComplexity > 10) {
      suggestions.push('- Reduce decision points by simplifying conditional logic');
    }

    if (metrics.parameterCount > 4) {
      suggestions.push('- Consider using an options object instead of multiple parameters');
    }

    if (metrics.returnCount > 3) {
      suggestions.push('- Consolidate return statements for better readability');
    }

    if (suggestions.length === 0) {
      suggestions.push('- Consider splitting this function into smaller helper functions');
    }

    return suggestions.join('\n');
  }
}
