import { ComplexityMetrics, FunctionInfo } from '../types';
import { ScoreCalculator } from '../utils/scoreCalculator';

/**
 * PHP Parser using regex-based approach
 * Supports PHP and Laravel code
 */
export class PHPParser {
  private scoreCalculator: ScoreCalculator;

  constructor(scoreCalculator: ScoreCalculator) {
    this.scoreCalculator = scoreCalculator;
  }

  /**
   * Parse PHP code and extract function information
   */
  parse(code: string, filePath: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = code.split('\n');

    // Match function/method definitions
    // Matches: function name(...), public function name(...), private function name(...), etc.
    const functionRegex = /^\s*(?:public|private|protected|static|\s)*function\s+(\w+)\s*\((.*?)\)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = functionRegex.exec(line);

      if (match) {
        const functionName = match[1];
        const params = match[2];
        const startLine = i + 1;

        // Find the end of the function by tracking braces
        const endLine = this.findFunctionEnd(lines, i);
        
        if (endLine > startLine) {
          const functionCode = lines.slice(i, endLine).join('\n');
          const functionInfo = this.analyzeFunction(
            functionName,
            startLine,
            endLine,
            functionCode,
            params,
            filePath
          );
          functions.push(functionInfo);
        }
      }
    }

    return functions;
  }

  /**
   * Find the end of a function by tracking opening and closing braces
   */
  private findFunctionEnd(lines: string[], startIndex: number): number {
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Count braces (ignoring those in strings/comments for simplicity)
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundOpenBrace = true;
        } else if (char === '}') {
          braceCount--;
          if (foundOpenBrace && braceCount === 0) {
            return i + 1; // Return 1-based line number
          }
        }
      }
    }

    return startIndex + 1; // Fallback
  }

  /**
   * Analyze a PHP function and calculate metrics
   */
  private analyzeFunction(
    name: string,
    startLine: number,
    endLine: number,
    code: string,
    params: string,
    filePath: string
  ): FunctionInfo {
    const metrics = this.calculateMetrics(code, params);
    const complexity = this.scoreCalculator.calculateScore(metrics);

    return {
      name,
      startLine,
      endLine,
      startColumn: 0,
      endColumn: 0,
      complexity,
      filePath
    };
  }

  /**
   * Calculate complexity metrics for PHP function
   */
  private calculateMetrics(code: string, params: string): ComplexityMetrics {
    let cyclomaticComplexity = 1;
    let nestedDepth = 0;
    let currentDepth = 0;
    let maxNestedDepth = 0;
    let conditionCount = 0;
    let loopCount = 0;
    let returnCount = 0;

    const lines = code.split('\n');
    const functionLength = lines.length;

    // Count parameters
    const paramList = params.split(',').filter(p => p.trim());
    const parameterCount = paramList.length;

    for (const line of lines) {
      const trimmed = line.trim();

      // Track nesting depth with braces
      for (const char of line) {
        if (char === '{') {
          currentDepth++;
          maxNestedDepth = Math.max(maxNestedDepth, currentDepth);
        } else if (char === '}') {
          currentDepth--;
        }
      }

      // Conditional statements
      if (trimmed.match(/\bif\s*\(/)) {
        cyclomaticComplexity++;
        conditionCount++;
      }
      if (trimmed.match(/\belseif\s*\(/)) {
        cyclomaticComplexity++;
        conditionCount++;
      }

      // Loops
      if (trimmed.match(/\b(for|foreach|while)\s*\(/)) {
        cyclomaticComplexity++;
        loopCount++;
      }

      // Switch cases
      if (trimmed.match(/\bcase\s+/)) {
        cyclomaticComplexity++;
        conditionCount++;
      }

      // Returns
      if (trimmed.match(/\breturn\b/)) {
        returnCount++;
      }

      // Logical operators
      const andOrCount = (trimmed.match(/(\&\&|\|\|)/g) || []).length;
      cyclomaticComplexity += andOrCount;
      conditionCount += andOrCount;

      // Ternary operators
      const ternaryCount = (trimmed.match(/\?/g) || []).length;
      cyclomaticComplexity += ternaryCount;
      conditionCount += ternaryCount;

      // Exception handling
      if (trimmed.match(/\bcatch\s*\(/)) {
        cyclomaticComplexity++;
      }
    }

    return {
      cyclomaticComplexity,
      functionLength,
      nestedDepth: maxNestedDepth,
      conditionCount,
      loopCount,
      parameterCount,
      returnCount
    };
  }
}
