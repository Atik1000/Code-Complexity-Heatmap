import { ComplexityScore, RefactoringSuggestion } from '../types';

/**
 * Provides refactoring suggestions based on complexity metrics
 */
export class RefactorAdvisor {
  /**
   * Get refactoring suggestions for a function based on its complexity
   */
  getSuggestions(complexity: ComplexityScore): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];
    const { metrics, score } = complexity;

    // High nesting depth
    if (metrics.nestedDepth > 3) {
      suggestions.push({
        title: 'Reduce Nesting Depth',
        description: `Current nesting depth is ${metrics.nestedDepth}. Extract nested logic into separate helper functions or use early returns to flatten the structure.`,
        priority: metrics.nestedDepth > 4 ? 'high' : 'medium'
      });
    }

    // Long function
    if (metrics.functionLength > 50) {
      suggestions.push({
        title: 'Break Down Large Function',
        description: `Function has ${metrics.functionLength} lines. Split it into smaller, focused functions that each handle a single responsibility.`,
        priority: metrics.functionLength > 100 ? 'high' : 'medium'
      });
    }

    // High cyclomatic complexity
    if (metrics.cyclomaticComplexity > 10) {
      suggestions.push({
        title: 'Simplify Conditional Logic',
        description: `Cyclomatic complexity is ${metrics.cyclomaticComplexity}. Consider using polymorphism, strategy pattern, or lookup tables instead of complex conditionals.`,
        priority: metrics.cyclomaticComplexity > 15 ? 'high' : 'medium'
      });
    }

    // Many conditions
    if (metrics.conditionCount > 5) {
      suggestions.push({
        title: 'Replace Conditionals',
        description: `Function has ${metrics.conditionCount} conditional statements. Consider using object mappings, switch statements, or the strategy pattern.`,
        priority: 'medium'
      });
    }

    // Many parameters
    if (metrics.parameterCount > 4) {
      suggestions.push({
        title: 'Reduce Parameter Count',
        description: `Function has ${metrics.parameterCount} parameters. Group related parameters into an options object or configuration parameter.`,
        priority: 'medium'
      });
    }

    // Many loops
    if (metrics.loopCount > 3) {
      suggestions.push({
        title: 'Optimize Loop Logic',
        description: `Function contains ${metrics.loopCount} loops. Consider extracting loop bodies into separate functions or using higher-order functions (map, filter, reduce).`,
        priority: 'low'
      });
    }

    // Multiple return statements
    if (metrics.returnCount > 3) {
      suggestions.push({
        title: 'Consolidate Return Statements',
        description: `Function has ${metrics.returnCount} return statements. Consider using a single exit point or early returns at the start for validation.`,
        priority: 'low'
      });
    }

    // General suggestion for high complexity
    if (score > 20 && suggestions.length === 0) {
      suggestions.push({
        title: 'Refactor for Simplicity',
        description: 'This function has high complexity. Consider breaking it into smaller, more focused functions.',
        priority: 'high'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  }

  /**
   * Get a quick summary suggestion
   */
  getQuickSuggestion(complexity: ComplexityScore): string {
    const suggestions = this.getSuggestions(complexity);
    
    if (suggestions.length === 0) {
      return 'Code complexity is acceptable.';
    }

    const topSuggestion = suggestions[0];
    return `${topSuggestion.title}: ${topSuggestion.description}`;
  }

  /**
   * Get all suggestions as formatted markdown
   */
  getSuggestionsAsMarkdown(complexity: ComplexityScore): string {
    const suggestions = this.getSuggestions(complexity);

    if (suggestions.length === 0) {
      return '✅ No refactoring suggestions - complexity is acceptable.';
    }

    let markdown = '## 💡 Refactoring Suggestions\n\n';

    for (const suggestion of suggestions) {
      const icon = this.getPriorityIcon(suggestion.priority);
      markdown += `### ${icon} ${suggestion.title}\n\n`;
      markdown += `${suggestion.description}\n\n`;
    }

    return markdown;
  }

  /**
   * Get icon for priority level
   */
  private getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }
}
