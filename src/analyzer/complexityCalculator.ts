import { FunctionInfo, FileAnalysis } from '../types';
import { ScoreCalculator } from '../utils/scoreCalculator';
import { ASTParser } from './astParser';
import { PythonParser } from './pythonParser';

/**
 * Main complexity calculator that handles multiple languages
 */
export class ComplexityCalculator {
  private scoreCalculator: ScoreCalculator;
  private jsParser: ASTParser;
  private pythonParser: PythonParser;

  constructor() {
    this.scoreCalculator = new ScoreCalculator();
    this.jsParser = new ASTParser(this.scoreCalculator);
    this.pythonParser = new PythonParser(this.scoreCalculator);
  }

  /**
   * Analyze a file and return complexity information
   */
  analyzeFile(code: string, filePath: string, languageId: string): FileAnalysis | null {
    let functions: FunctionInfo[] = [];
    let language = languageId;

    switch (languageId) {
      case 'javascript':
        functions = this.jsParser.parse(code, filePath, 'javascript');
        break;
      case 'typescript':
      case 'typescriptreact':
      case 'javascriptreact':
        functions = this.jsParser.parse(code, filePath, 'typescript');
        language = 'typescript';
        break;
      case 'python':
        functions = this.pythonParser.parse(code, filePath);
        break;
      default:
        return null;
    }

    if (functions.length === 0) {
      return {
        filePath,
        language,
        functions: [],
        averageComplexity: 0,
        totalFunctions: 0
      };
    }

    const totalComplexity = functions.reduce((sum, fn) => sum + fn.complexity.score, 0);
    const averageComplexity = totalComplexity / functions.length;

    return {
      filePath,
      language,
      functions,
      averageComplexity: Math.round(averageComplexity * 10) / 10,
      totalFunctions: functions.length
    };
  }

  /**
   * Get the score calculator instance
   */
  getScoreCalculator(): ScoreCalculator {
    return this.scoreCalculator;
  }

  /**
   * Update thresholds
   */
  updateThresholds(): void {
    this.scoreCalculator.updateThresholds();
  }
}
