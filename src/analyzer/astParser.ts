import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ComplexityMetrics, FunctionInfo } from '../types';
import { ScoreCalculator } from '../utils/scoreCalculator';

/**
 * AST Parser for JavaScript and TypeScript files
 */
export class ASTParser {
  private scoreCalculator: ScoreCalculator;

  constructor(scoreCalculator: ScoreCalculator) {
    this.scoreCalculator = scoreCalculator;
  }

  /**
   * Parse a file and extract function information with complexity metrics
   */
  parse(code: string, filePath: string, language: 'javascript' | 'typescript'): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: language === 'typescript' 
          ? ['typescript', 'jsx', 'decorators-legacy']
          : ['jsx', 'flow', 'decorators-legacy']
      });

      traverse(ast, {
        FunctionDeclaration: (path) => {
          const functionInfo = this.analyzeFunctionNode(path, code, filePath);
          if (functionInfo) {
            functions.push(functionInfo);
          }
        },
        FunctionExpression: (path) => {
          const functionInfo = this.analyzeFunctionNode(path, code, filePath);
          if (functionInfo) {
            functions.push(functionInfo);
          }
        },
        ArrowFunctionExpression: (path) => {
          const functionInfo = this.analyzeFunctionNode(path, code, filePath);
          if (functionInfo) {
            functions.push(functionInfo);
          }
        },
        ObjectMethod: (path) => {
          const functionInfo = this.analyzeFunctionNode(path, code, filePath);
          if (functionInfo) {
            functions.push(functionInfo);
          }
        },
        ClassMethod: (path) => {
          const functionInfo = this.analyzeFunctionNode(path, code, filePath);
          if (functionInfo) {
            functions.push(functionInfo);
          }
        }
      });
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
    }

    return functions;
  }

  /**
   * Analyze a function node and extract complexity metrics
   */
  private analyzeFunctionNode(
    path: NodePath<any>,
    code: string,
    filePath: string
  ): FunctionInfo | null {
    const node = path.node;
    
    if (!node.loc) {
      return null;
    }

    const name = this.getFunctionName(node, path);
    const metrics = this.calculateMetrics(path);
    const complexity = this.scoreCalculator.calculateScore(metrics);

    return {
      name,
      startLine: node.loc.start.line,
      endLine: node.loc.end.line,
      startColumn: node.loc.start.column,
      endColumn: node.loc.end.column,
      complexity,
      filePath
    };
  }

  /**
   * Get function name from node
   */
  private getFunctionName(node: any, path: NodePath<any>): string {
    // Direct function name
    if (node.id && node.id.name) {
      return node.id.name;
    }

    // Class method
    if (node.key && t.isIdentifier(node.key)) {
      return node.key.name;
    }

    // Variable declaration: const funcName = () => {}
    if (path.parent && t.isVariableDeclarator(path.parent) && path.parent.id && t.isIdentifier(path.parent.id)) {
      return path.parent.id.name;
    }

    // Object property: { funcName: () => {} }
    if (path.parent && t.isObjectProperty(path.parent) && path.parent.key && t.isIdentifier(path.parent.key)) {
      return path.parent.key.name;
    }

    // Assignment: obj.funcName = () => {}
    if (path.parent && t.isAssignmentExpression(path.parent)) {
      const left = path.parent.left;
      if (t.isMemberExpression(left) && t.isIdentifier(left.property)) {
        return left.property.name;
      }
    }

    return '<anonymous>';
  }

  /**
   * Calculate complexity metrics for a function
   */
  private calculateMetrics(path: NodePath<any>): ComplexityMetrics {
    let cyclomaticComplexity = 1; // Base complexity
    let nestedDepth = 0;
    let maxNestedDepth = 0;
    let conditionCount = 0;
    let loopCount = 0;
    let returnCount = 0;

    const node = path.node;
    const functionLength = node.loc ? (node.loc.end.line - node.loc.start.line + 1) : 0;
    const parameterCount = node.params ? node.params.length : 0;

    // Traverse function body to calculate metrics
    path.traverse({
      enter(innerPath) {
        const innerNode = innerPath.node;

        // Track nesting depth
        if (
          t.isIfStatement(innerNode) ||
          t.isForStatement(innerNode) ||
          t.isWhileStatement(innerNode) ||
          t.isDoWhileStatement(innerNode) ||
          t.isSwitchStatement(innerNode) ||
          t.isTryStatement(innerNode)
        ) {
          nestedDepth++;
          maxNestedDepth = Math.max(maxNestedDepth, nestedDepth);
        }

        // Cyclomatic complexity and condition count
        if (t.isIfStatement(innerNode)) {
          cyclomaticComplexity++;
          conditionCount++;
        } else if (t.isSwitchCase(innerNode) && innerNode.test) {
          cyclomaticComplexity++;
        } else if (t.isConditionalExpression(innerNode)) {
          cyclomaticComplexity++;
          conditionCount++;
        } else if (t.isLogicalExpression(innerNode) && (innerNode.operator === '&&' || innerNode.operator === '||')) {
          cyclomaticComplexity++;
          conditionCount++;
        }

        // Loop count
        if (
          t.isForStatement(innerNode) ||
          t.isWhileStatement(innerNode) ||
          t.isDoWhileStatement(innerNode) ||
          t.isForInStatement(innerNode) ||
          t.isForOfStatement(innerNode)
        ) {
          cyclomaticComplexity++;
          loopCount++;
        }

        // Return count
        if (t.isReturnStatement(innerNode)) {
          returnCount++;
        }
      },
      exit(innerPath) {
        const innerNode = innerPath.node;
        
        // Decrease nesting depth when exiting
        if (
          t.isIfStatement(innerNode) ||
          t.isForStatement(innerNode) ||
          t.isWhileStatement(innerNode) ||
          t.isDoWhileStatement(innerNode) ||
          t.isSwitchStatement(innerNode) ||
          t.isTryStatement(innerNode)
        ) {
          nestedDepth--;
        }
      }
    });

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
