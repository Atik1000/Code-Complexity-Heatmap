import { ComplexityMetrics, FunctionInfo } from '../types';
import { ScoreCalculator } from '../utils/scoreCalculator';

/**
 * Python Parser using regex-based approach
 * Note: For production, consider using tree-sitter or python-ast
 */
export class PythonParser {
  private scoreCalculator: ScoreCalculator;

  constructor(scoreCalculator: ScoreCalculator) {
    this.scoreCalculator = scoreCalculator;
  }

  /**
   * Parse Python code and extract function information
   */
  parse(code: string, filePath: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = code.split('\n');

    // Find function definitions
    const functionRegex = /^(\s*)def\s+(\w+)\s*\((.*?)\):/;
    const classMethodRegex = /^(\s*)def\s+(\w+)\s*\((.*?)\):/;

    let currentFunction: {
      name: string;
      startLine: number;
      indentLevel: number;
      code: string[];
    } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = functionRegex.exec(line);

      if (match) {
        // Save previous function if exists
        if (currentFunction) {
          const functionInfo = this.analyzeFunction(
            currentFunction.name,
            currentFunction.startLine,
            i,
            currentFunction.code.join('\n'),
            filePath
          );
          functions.push(functionInfo);
        }

        // Start new function
        const indent = match[1];
        const functionName = match[2];
        currentFunction = {
          name: functionName,
          startLine: i + 1, // 1-based line numbers
          indentLevel: indent.length,
          code: [line]
        };
      } else if (currentFunction) {
        // Check if we're still in the function
        const lineIndent = line.match(/^(\s*)/)?.[1].length || 0;
        const isEmptyLine = line.trim() === '';
        const isComment = line.trim().startsWith('#');

        if (isEmptyLine || isComment || lineIndent > currentFunction.indentLevel) {
          currentFunction.code.push(line);
        } else {
          // Function ended
          const functionInfo = this.analyzeFunction(
            currentFunction.name,
            currentFunction.startLine,
            i,
            currentFunction.code.join('\n'),
            filePath
          );
          functions.push(functionInfo);
          currentFunction = null;
        }
      }
    }

    // Handle last function
    if (currentFunction) {
      const functionInfo = this.analyzeFunction(
        currentFunction.name,
        currentFunction.startLine,
        lines.length,
        currentFunction.code.join('\n'),
        filePath
      );
      functions.push(functionInfo);
    }

    return functions;
  }

  /**
   * Analyze a Python function and calculate metrics
   */
  private analyzeFunction(
    name: string,
    startLine: number,
    endLine: number,
    code: string,
    filePath: string
  ): FunctionInfo {
    const metrics = this.calculateMetrics(code);
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
   * Calculate complexity metrics for Python function
   */
  private calculateMetrics(code: string): ComplexityMetrics {
    let cyclomaticComplexity = 1;
    let nestedDepth = 0;
    let maxNestedDepth = 0;
    let conditionCount = 0;
    let loopCount = 0;
    let returnCount = 0;

    const lines = code.split('\n');
    const functionLength = lines.length;

    // Extract parameters from function definition
    const paramMatch = code.match(/def\s+\w+\s*\((.*?)\):/);
    const params = paramMatch ? paramMatch[1].split(',').filter(p => p.trim() && p.trim() !== 'self') : [];
    const parameterCount = params.length;

    // Track indentation for nesting
    const baseIndent = lines[0]?.match(/^(\s*)/)?.[1].length || 0;

    for (const line of lines) {
      const trimmed = line.trim();
      const currentIndent = line.match(/^(\s*)/)?.[1].length || 0;
      const relativeIndent = Math.floor((currentIndent - baseIndent) / 4); // Assuming 4 spaces per indent
      
      maxNestedDepth = Math.max(maxNestedDepth, relativeIndent);

      // Conditions
      if (trimmed.startsWith('if ') || trimmed.startsWith('elif ')) {
        cyclomaticComplexity++;
        conditionCount++;
      }

      // Loops
      if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
        cyclomaticComplexity++;
        loopCount++;
      }

      // Returns
      if (trimmed.startsWith('return ')) {
        returnCount++;
      }

      // Logical operators in conditions
      const andOrCount = (trimmed.match(/\s(and|or)\s/g) || []).length;
      cyclomaticComplexity += andOrCount;
      conditionCount += andOrCount;

      // Exception handling
      if (trimmed.startsWith('except ')) {
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
