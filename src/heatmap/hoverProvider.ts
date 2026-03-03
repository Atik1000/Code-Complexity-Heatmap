// @ts-nocheck
import * as vscode from 'vscode';
import { FunctionInfo } from '../types';
import { LLMProvider } from '../ai/llmProvider';

/**
 * Provides hover information for functions with complexity metrics
 */
export class ComplexityHoverProvider implements vscode.HoverProvider {
  private functionsMap: Map<string, FunctionInfo[]> = new Map();
  private aiSuggestionsCache: Map<string, string> = new Map();
  private llmProvider: LLMProvider;

  constructor() {
    this.llmProvider = new LLMProvider();
  }

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
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
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
    const markdown = await this.buildHoverMarkdown(foundFunction, document);
    return new vscode.Hover(markdown);
  }

  /**
   * Build markdown content for hover tooltip
   */
  private async buildHoverMarkdown(func: FunctionInfo, document: vscode.TextDocument): Promise<vscode.MarkdownString> {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    const { complexity, name } = func;
    const { score, level, metrics } = complexity;

    // Add emoji based on complexity level
    const emoji = this.getComplexityEmoji(level);

    md.appendMarkdown(`### ${emoji} Function: \`${name}\`\n\n`);
    md.appendMarkdown(`**Complexity Score:** \`${score}\` _(${level})_\n\n`);
    md.appendMarkdown('---\n\n');
    md.appendMarkdown('**📊 Metrics:**\n\n`);
    md.appendMarkdown(`- **Cyclomatic Complexity:** ${metrics.cyclomaticComplexity}\n`);
    md.appendMarkdown(`- **Nested Depth:** ${metrics.nestedDepth}\n`);
    md.appendMarkdown(`- **Lines of Code:** ${metrics.functionLength}\n`);
    md.appendMarkdown(`- **Conditions:** ${metrics.conditionCount}\n`);
    md.appendMarkdown(`- **Loops:** ${metrics.loopCount}\n`);
    md.appendMarkdown(`- **Parameters:** ${metrics.parameterCount}\n`);
    md.appendMarkdown(`- **Return Statements:** ${metrics.returnCount}\n`);

    // Add AI suggestions if enabled
    const config = vscode.workspace.getConfiguration('codeHeatmap');
    const aiEnabled = config.get('ai.enabled', false);

    if (score > 10) {
      md.appendMarkdown('\n---\n\n');
      md.appendMarkdown('### 💡 Refactoring Recommendations:\n\n');
      
      if (aiEnabled) {
        // Try to get AI suggestions
        const cacheKey = `${func.filePath}:${func.name}:${score}`;
        let aiSuggestion = this.aiSuggestionsCache.get(cacheKey);

        if (!aiSuggestion) {
          md.appendMarkdown('_🤖 Generating AI suggestions..._\n\n');
          
          // Get function code
          const functionCode = document.getText(new vscode.Range(
            func.startLine - 1, 0,
            func.endLine - 1, 999
          ));

          // Get AI suggestion asynchronously
          this.llmProvider.getSuggestions(func, functionCode).then(suggestion => {
            if (suggestion) {
              this.aiSuggestionsCache.set(cacheKey, suggestion);
            }
          });
        } else {
          md.appendMarkdown('**🤖 AI-Powered Suggestions:**\n\n');
          md.appendMarkdown(aiSuggestion);
          md.appendMarkdown('\n\n---\n\n');
        }
      }
      
      // Always show rule-based suggestions as fallback
      md.appendMarkdown('**📋 Rule-Based Suggestions:**\n\n');
      md.appendMarkdown(this.getRefactoringSuggestion(complexity));
    } else {
      md.appendMarkdown('\n---\n\n');
      md.appendMarkdown('✅ **This function has good complexity!**\n\n');
      md.appendMarkdown('Keep maintaining this level of simplicity.\n');
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
    const { metrics, level, score } = complexity;
    const suggestions: string[] = [];

    // Critical suggestions
    if (metrics.nestedDepth > 4) {
      suggestions.push('🔴 **Critical:** Nesting depth is too high (' + metrics.nestedDepth + ' levels)');
      suggestions.push('  - Extract nested logic into separate helper functions');
      suggestions.push('  - Use early returns to reduce nesting');
      suggestions.push('  - Consider using guard clauses');
    } else if (metrics.nestedDepth > 3) {
      suggestions.push('🟠 **Warning:** Reduce nesting depth by extracting nested logic into separate functions');
    }

    if (metrics.functionLength > 100) {
      suggestions.push('🔴 **Critical:** Function is too long (' + metrics.functionLength + ' lines)');
      suggestions.push('  - Break into smaller, focused functions (aim for <50 lines)');
      suggestions.push('  - Apply Single Responsibility Principle');
    } else if (metrics.functionLength > 50) {
      suggestions.push('🟠 **Warning:** Break this large function into smaller, focused functions');
    }

    if (metrics.cyclomaticComplexity > 15) {
      suggestions.push('🔴 **Critical:** Cyclomatic complexity is very high (' + metrics.cyclomaticComplexity + ')');
      suggestions.push('  - Simplify conditional logic using strategy pattern');
      suggestions.push('  - Extract complex conditions into well-named functions');
      suggestions.push('  - Consider using lookup tables instead of switch/if-else chains');
    } else if (metrics.cyclomaticComplexity > 10) {
      suggestions.push('🟠 **Warning:** Reduce decision points by simplifying conditional logic');
    }

    if (metrics.parameterCount > 5) {
      suggestions.push('🟠 **Warning:** Too many parameters (' + metrics.parameterCount + ')');
      suggestions.push('  - Use an options/config object instead');
      suggestions.push('  - Consider if this function has too many responsibilities');
    } else if (metrics.parameterCount > 4) {
      suggestions.push('💡 Consider using an options object instead of multiple parameters');
    }

    if (metrics.returnCount > 5) {
      suggestions.push('🟡 Consolidate return statements (currently ' + metrics.returnCount + ')');
      suggestions.push('  - Use a single return point if possible');
      suggestions.push('  - Or ensure early returns follow guard clause pattern');
    } else if (metrics.returnCount > 3) {
      suggestions.push('💡 Consider consolidating return statements for better readability');
    }

    // General suggestions based on level
    if (level === 'Critical') {
      suggestions.push('');
      suggestions.push('🚨 **Immediate Action Required:**');
      suggestions.push('This function should be refactored as soon as possible to improve');
      suggestions.push('maintainability, testability, and reduce the risk of bugs.');
    } else if (level === 'High') {
      suggestions.push('');
      suggestions.push('⚠️ **Recommended Action:**');
      suggestions.push('Schedule time to refactor this function in the next sprint.');
    }

    if (suggestions.length === 0) {
      suggestions.push('💡 Consider splitting this function into smaller helper functions');
      suggestions.push('  - Improves readability and testability');
      suggestions.push('  - Makes code easier to maintain');
    }

    return suggestions.join('\n');
  }
}
