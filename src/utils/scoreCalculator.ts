import { ComplexityMetrics, ComplexityScore, ComplexityLevel, ComplexityThresholds } from '../types';
import * as vscode from 'vscode';

/**
 * Calculate complexity score based on multiple metrics
 */
export class ScoreCalculator {
  private thresholds: ComplexityThresholds;

  constructor() {
    this.thresholds = this.loadThresholds();
  }

  /**
   * Calculate the complexity score using the formula:
   * Score = (CyclomaticComplexity * 2) + (NestedDepth * 3) + (FunctionLength / 10) + (ConditionCount * 2)
   */
  calculateScore(metrics: ComplexityMetrics): ComplexityScore {
    const score = 
      (metrics.cyclomaticComplexity * 2) +
      (metrics.nestedDepth * 3) +
      (metrics.functionLength / 10) +
      (metrics.conditionCount * 2);

    const level = this.determineLevel(score);

    return {
      score: Math.round(score * 10) / 10, // Round to 1 decimal place
      level,
      metrics
    };
  }

  /**
   * Determine complexity level based on score
   */
  private determineLevel(score: number): ComplexityLevel {
    if (score <= this.thresholds.low) {
      return ComplexityLevel.Low;
    } else if (score <= this.thresholds.medium) {
      return ComplexityLevel.Medium;
    } else if (score <= this.thresholds.high) {
      return ComplexityLevel.High;
    } else {
      return ComplexityLevel.Critical;
    }
  }

  /**
   * Calculate technical debt score for a collection of complexity scores
   */
  calculateTechnicalDebt(scores: number[]): number {
    if (scores.length === 0) {
      return 0;
    }
    
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 10) / 10;
  }

  /**
   * Get technical debt status
   */
  getTechnicalDebtStatus(score: number): string {
    if (score <= 10) {
      return 'Healthy';
    } else if (score <= 20) {
      return 'Moderate';
    } else {
      return 'High Technical Debt';
    }
  }

  /**
   * Load thresholds from configuration
   */
  private loadThresholds(): ComplexityThresholds {
    const config = vscode.workspace.getConfiguration('codeHeatmap');
    return {
      low: config.get('thresholds.low', 10),
      medium: config.get('thresholds.medium', 20),
      high: config.get('thresholds.high', 35)
    };
  }

  /**
   * Update thresholds from configuration
   */
  updateThresholds(): void {
    this.thresholds = this.loadThresholds();
  }
}
