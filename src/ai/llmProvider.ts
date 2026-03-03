import * as vscode from 'vscode';
import { FunctionInfo } from '../types';

/**
 * LLM Provider for AI-powered code suggestions
 * Supports: Ollama (free, local), Gemini (free tier), and fallback to rule-based
 */
export class LLMProvider {
  private ollamaBaseUrl = 'http://localhost:11434';
  private geminiApiKey: string | undefined;

  constructor() {
    this.loadConfig();
  }

  /**
   * Load configuration
   */
  private loadConfig(): void {
    const config = vscode.workspace.getConfiguration('codeHeatmap');
    this.geminiApiKey = config.get('ai.geminiApiKey');
  }

  /**
   * Get AI-powered refactoring suggestions
   */
  async getSuggestions(functionInfo: FunctionInfo, code: string): Promise<string | null> {
    const config = vscode.workspace.getConfiguration('codeHeatmap');
    const enabled = config.get('ai.enabled', false);
    
    if (!enabled) {
      return null;
    }

    const provider = config.get<string>('ai.provider', 'ollama');

    try {
      switch (provider) {
        case 'ollama':
          return await this.getOllamaSuggestions(functionInfo, code);
        case 'gemini':
          return await this.getGeminiSuggestions(functionInfo, code);
        default:
          return null;
      }
    } catch (error) {
      console.error('LLM suggestion error:', error);
      return null;
    }
  }

  /**
   * Get suggestions from Ollama (local, free)
   */
  private async getOllamaSuggestions(functionInfo: FunctionInfo, code: string): Promise<string | null> {
    const config = vscode.workspace.getConfiguration('codeHeatmap');
    const model = config.get<string>('ai.ollamaModel', 'codellama');

    const prompt = this.buildPrompt(functionInfo, code);

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.response || null;
    } catch (error) {
      // Ollama not running or not available
      vscode.window.showWarningMessage(
        'Ollama is not running. Install Ollama or switch to Gemini in settings.',
        'Install Ollama',
        'Settings'
      ).then(selection => {
        if (selection === 'Install Ollama') {
          vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai'));
        } else if (selection === 'Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'codeHeatmap.ai');
        }
      });
      return null;
    }
  }

  /**
   * Get suggestions from Google Gemini (free tier)
   */
  private async getGeminiSuggestions(functionInfo: FunctionInfo, code: string): Promise<string | null> {
    if (!this.geminiApiKey) {
      vscode.window.showWarningMessage(
        'Gemini API key not configured. Add it in settings.',
        'Get API Key',
        'Settings'
      ).then(selection => {
        if (selection === 'Get API Key') {
          vscode.env.openExternal(vscode.Uri.parse('https://makersuite.google.com/app/apikey'));
        } else if (selection === 'Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'codeHeatmap.ai.geminiApiKey');
        }
      });
      return null;
    }

    const prompt = this.buildPrompt(functionInfo, code);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return suggestion || null;
    } catch (error) {
      console.error('Gemini API error:', error);
      vscode.window.showErrorMessage('Gemini API request failed. Check your API key.');
      return null;
    }
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(functionInfo: FunctionInfo, code: string): string {
    const { name, complexity } = functionInfo;
    const { score, level, metrics } = complexity;

    return `You are a code refactoring expert. Analyze this ${level} complexity function and provide specific, actionable refactoring suggestions.

Function: ${name}
Complexity Score: ${score} (${level})
Metrics:
- Cyclomatic Complexity: ${metrics.cyclomaticComplexity}
- Nesting Depth: ${metrics.nestedDepth}
- Function Length: ${metrics.functionLength} lines
- Parameters: ${metrics.parameterCount}
- Conditions: ${metrics.conditionCount}
- Loops: ${metrics.loopCount}

Code:
\`\`\`
${code}
\`\`\`

Provide:
1. Top 3 specific refactoring techniques (with code examples if possible)
2. Estimated complexity reduction
3. Benefits of refactoring

Keep response concise and actionable (max 400 words).`;
  }

  /**
   * Check if Ollama is available
   */
  async isOllamaAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available Ollama models
   */
  async getOllamaModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json() as any;
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }
}
