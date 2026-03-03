// @ts-nocheck
import * as vscode from 'vscode';
import { ComplexityCalculator } from './analyzer/complexityCalculator';
import { HeatmapDecorator } from './heatmap/decorator';
import { ComplexityHoverProvider } from './heatmap/hoverProvider';
import { SidebarProvider } from './panel/sidebarProvider';
import { RefactorAdvisor } from './suggestions/refactorAdvisor';
import { FileAnalysis } from './types';

/**
 * Extension manager class
 */
class CodeHeatmapExtension {
  private complexityCalculator: ComplexityCalculator;
  private decorator: HeatmapDecorator;
  private hoverProvider: ComplexityHoverProvider;
  private sidebarProvider: SidebarProvider;
  private refactorAdvisor: RefactorAdvisor;
  private analysisCache: Map<string, FileAnalysis> = new Map();
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.complexityCalculator = new ComplexityCalculator();
    this.decorator = new HeatmapDecorator();
    this.hoverProvider = new ComplexityHoverProvider();
    this.sidebarProvider = new SidebarProvider();
    this.refactorAdvisor = new RefactorAdvisor();

    this.initialize(context);
  }

  /**
   * Initialize the extension
   */
  private initialize(context: vscode.ExtensionContext): void {
    // Register tree view provider
    const treeView = vscode.window.createTreeView('codeHeatmapView', {
      treeDataProvider: this.sidebarProvider,
      showCollapseAll: true
    });
    this.disposables.push(treeView);

    // Register hover provider for supported languages
    const selector = [
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'typescriptreact' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'python' },
      { scheme: 'file', language: 'php' },
      { scheme: 'file', language: 'go' }
    ];
    
    this.disposables.push(
      vscode.languages.registerHoverProvider(selector, this.hoverProvider)
    );

    // Register commands
    this.registerCommands(context);

    // Set up event listeners
    this.setupEventListeners();

    // Scan active editor if exists
    if (vscode.window.activeTextEditor) {
      this.scanDocument(vscode.window.activeTextEditor.document);
    }
  }

  /**
   * Register extension commands
   */
  private registerCommands(context: vscode.ExtensionContext): void {
    // Scan current file
    this.disposables.push(
      vscode.commands.registerCommand('codeHeatmap.scanFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this.scanDocument(editor.document, true);
          vscode.window.showInformationMessage('Code complexity scan completed!');
        } else {
          vscode.window.showWarningMessage('No active editor found.');
        }
      })
    );

    // Scan entire workspace
    this.disposables.push(
      vscode.commands.registerCommand('codeHeatmap.scanWorkspace', async () => {
        await this.scanWorkspace();
      })
    );

    // Show complexity report
    this.disposables.push(
      vscode.commands.registerCommand('codeHeatmap.showReport', () => {
        this.showComplexityReport();
      })
    );

    // Clear highlights
    this.disposables.push(
      vscode.commands.registerCommand('codeHeatmap.clearHighlights', () => {
        this.clearAllHighlights();
        vscode.window.showInformationMessage('Complexity highlights cleared.');
      })
    );

    // Jump to function (called from sidebar)
    this.disposables.push(
      vscode.commands.registerCommand('codeHeatmap.jumpToFunction', (functionInfo) => {
        this.jumpToFunction(functionInfo);
      })
    );

    // Enable AI suggestions
    this.disposables.push(
      vscode.commands.registerCommand('codeHeatmap.enableAI', async () => {
        await this.setupAISuggestions();
      })
    );

    // Check Ollama status
    this.disposables.push(
      vscode.commands.registerCommand('codeHeatmap.checkOllama', async () => {
        await this.checkOllamaStatus();
      })
    );
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    const config = vscode.workspace.getConfiguration('codeHeatmap');

    // On active editor change
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && config.get('scanOnOpen', true)) {
          this.scanDocument(editor.document);
        }
      })
    );

    // On document save
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(document => {
        if (config.get('scanOnSave', true)) {
          this.scanDocument(document, true);
        }
      })
    );

    // On document close
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument(document => {
        const filePath = document.uri.fsPath;
        this.analysisCache.delete(filePath);
        this.hoverProvider.clearFunctions(filePath);
      })
    );

    // On configuration change
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('codeHeatmap')) {
          this.complexityCalculator.updateThresholds();
          // Re-scan active editor
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            this.scanDocument(editor.document, true);
          }
        }
      })
    );
  }

  /**
   * Scan a document for complexity
   */
  private scanDocument(document: vscode.TextDocument, force: boolean = false): void {
    const config = vscode.workspace.getConfiguration('codeHeatmap');
    
    if (!config.get('enabled', true)) {
      return;
    }

    const filePath = document.uri.fsPath;
    const languageId = document.languageId;

    // Check if language is supported
    const supportedLanguages = ['javascript', 'typescript', 'typescriptreact', 'javascriptreact', 'python', 'php', 'go'];
    if (!supportedLanguages.includes(languageId)) {
      return;
    }

    // Check cache if not forced
    if (!force && this.analysisCache.has(filePath)) {
      const cachedAnalysis = this.analysisCache.get(filePath)!;
      this.applyAnalysis(document, cachedAnalysis);
      return;
    }

    // Analyze document
    const code = document.getText();
    const analysis = this.complexityCalculator.analyzeFile(code, filePath, languageId);

    if (!analysis) {
      return;
    }

    // Cache and apply analysis
    this.analysisCache.set(filePath, analysis);
    this.applyAnalysis(document, analysis);

    // Update sidebar
    this.sidebarProvider.updateFileAnalysis(analysis);
  }

  /**
   * Apply analysis to document
   */
  private applyAnalysis(document: vscode.TextDocument, analysis: FileAnalysis): void {
    const editor = vscode.window.visibleTextEditors.find(
      e => e.document.uri.fsPath === document.uri.fsPath
    );

    if (editor) {
      // Apply decorations
      this.decorator.applyDecorations(editor, analysis.functions);
    }

    // Update hover provider
    this.hoverProvider.updateFunctions(analysis.filePath, analysis.functions);
  }

  /**
   * Scan entire workspace
   */
  private async scanWorkspace(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeHeatmap');
    
    if (!config.get('enabled', true)) {
      vscode.window.showWarningMessage('Code Heatmap is disabled in settings.');
      return;
    }

    // Clear existing data
    this.sidebarProvider.clearAll();
    this.analysisCache.clear();

    // Find all supported files
    const files = await vscode.workspace.findFiles(
      '**/*.{js,ts,jsx,tsx,py,php,go}',
      '**/node_modules/**'
    );

    if (files.length === 0) {
      vscode.window.showInformationMessage('No supported files found in workspace.');
      return;
    }

    // Show progress
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Scanning workspace for complexity...',
      cancellable: false
    }, async (progress) => {
      let processed = 0;
      
      for (const fileUri of files) {
        const document = await vscode.workspace.openTextDocument(fileUri);
        this.scanDocument(document, true);
        
        processed++;
        progress.report({
          message: `${processed}/${files.length} files`,
          increment: (1 / files.length) * 100
        });
      }
    });

    const workspaceAnalysis = this.sidebarProvider.getWorkspaceAnalysis();
    if (workspaceAnalysis) {
      vscode.window.showInformationMessage(
        `Workspace scan complete! Technical Debt Score: ${workspaceAnalysis.technicalDebtScore}`
      );
    }
  }

  /**
   * Show complexity report
   */
  private showComplexityReport(): void {
    const workspaceAnalysis = this.sidebarProvider.getWorkspaceAnalysis();

    if (!workspaceAnalysis || workspaceAnalysis.totalFunctions === 0) {
      vscode.window.showInformationMessage('No complexity data available. Scan files first.');
      return;
    }

    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
      'complexityReport',
      'Code Complexity Report',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getReportHtml(workspaceAnalysis);
  }

  /**
   * Generate HTML for complexity report
   */
  private getReportHtml(workspaceAnalysis: any): string {
    const debtStatus = workspaceAnalysis.technicalDebtScore <= 10 ? 'Healthy' :
                      workspaceAnalysis.technicalDebtScore <= 20 ? 'Moderate' : 'High';
    
    const statusColor = workspaceAnalysis.technicalDebtScore <= 10 ? 'green' :
                       workspaceAnalysis.technicalDebtScore <= 20 ? 'orange' : 'red';

    let functionsHtml = '';
    const allFunctions = workspaceAnalysis.files.flatMap((f: FileAnalysis) => f.functions);
    const topComplexFunctions = allFunctions
      .sort((a: any, b: any) => b.complexity.score - a.complexity.score)
      .slice(0, 20);

    for (const func of topComplexFunctions) {
      const levelColor = func.complexity.level === 'Low' ? 'green' :
                        func.complexity.level === 'Medium' ? 'yellow' :
                        func.complexity.level === 'High' ? 'orange' : 'red';
      
      functionsHtml += `
        <tr>
          <td>${func.name}</td>
          <td>${func.filePath.split('/').pop()}</td>
          <td style="color: ${levelColor}; font-weight: bold;">${func.complexity.score}</td>
          <td>${func.complexity.level}</td>
          <td>${func.complexity.metrics.cyclomaticComplexity}</td>
          <td>${func.complexity.metrics.functionLength}</td>
        </tr>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Complexity Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #0078d4;
      padding-bottom: 10px;
    }
    .summary {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .metric {
      display: inline-block;
      margin: 10px 20px 10px 0;
    }
    .metric-label {
      font-size: 14px;
      color: #666;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #0078d4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #0078d4;
      color: white;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <h1>📊 Code Complexity Report</h1>
  
  <div class="summary">
    <div class="metric">
      <div class="metric-label">Technical Debt Score</div>
      <div class="metric-value" style="color: ${statusColor}">
        ${workspaceAnalysis.technicalDebtScore}
      </div>
      <div class="metric-label">${debtStatus}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Total Functions</div>
      <div class="metric-value">${workspaceAnalysis.totalFunctions}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Average Complexity</div>
      <div class="metric-value">${workspaceAnalysis.averageComplexity}</div>
    </div>
    
    <div class="metric">
      <div class="metric-label">Files Analyzed</div>
      <div class="metric-value">${workspaceAnalysis.files.length}</div>
    </div>
  </div>

  <h2>Top 20 Most Complex Functions</h2>
  <table>
    <thead>
      <tr>
        <th>Function Name</th>
        <th>File</th>
        <th>Score</th>
        <th>Level</th>
        <th>Cyclomatic</th>
        <th>Lines</th>
      </tr>
    </thead>
    <tbody>
      ${functionsHtml}
    </tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Clear all highlights
   */
  private clearAllHighlights(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      this.decorator.clearDecorations(editor);
    }
  }

  /**
   * Jump to function location
   */
  private jumpToFunction(functionInfo: any): void {
    const uri = vscode.Uri.file(functionInfo.filePath);
    const range = new vscode.Range(
      functionInfo.startLine - 1,
      functionInfo.startColumn,
      functionInfo.endLine - 1,
      functionInfo.endColumn
    );

    vscode.window.showTextDocument(uri, {
      selection: range,
      viewColumn: vscode.ViewColumn.One
    });
  }

  /**
   * Setup AI suggestions
   */
  private async setupAISuggestions(): Promise<void> {
    const choice = await vscode.window.showQuickPick([
      {
        label: '$(desktop-download) Ollama (Local, Free)',
        description: 'Run AI models locally on your machine - completely free',
        value: 'ollama'
      },
      {
        label: '$(cloud) Google Gemini (Cloud, Free Tier)',
        description: 'Use Google\'s Gemini API - free tier available',
        value: 'gemini'
      }
    ], {
      placeHolder: 'Choose an AI provider for code suggestions'
    });

    if (!choice) return;

    const config = vscode.workspace.getConfiguration('codeHeatmap');

    if (choice.value === 'ollama') {
      const installed = await vscode.window.showInformationMessage(
        'Do you have Ollama installed?',
        'Yes, it\'s running',
        'No, install it',
        'Cancel'
      );

      if (installed === 'No, install it') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai'));
        vscode.window.showInformationMessage(
          'After installing Ollama, run: ollama pull codellama'
        );
        return;
      } else if (installed === 'Yes, it\'s running') {
        await config.update('ai.provider', 'ollama', vscode.ConfigurationTarget.Global);
        await config.update('ai.enabled', true, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('✅ Ollama AI suggestions enabled!');
      }
    } else if (choice.value === 'gemini') {
      const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Google Gemini API key',
        placeHolder: 'Get free API key at: https://makersuite.google.com/app/apikey',
        password: true
      });

      if (apiKey) {
        await config.update('ai.geminiApiKey', apiKey, vscode.ConfigurationTarget.Global);
        await config.update('ai.provider', 'gemini', vscode.ConfigurationTarget.Global);
        await config.update('ai.enabled', true, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('✅ Gemini AI suggestions enabled!');
      }
    }
  }

  /**
   * Check Ollama status
   */
  private async checkOllamaStatus(): Promise<void> {
    const { LLMProvider } = await import('../ai/llmProvider');
    const llm = new LLMProvider();

    const available = await llm.isOllamaAvailable();
    
    if (available) {
      const models = await llm.getOllamaModels();
      vscode.window.showInformationMessage(
        `✅ Ollama is running! Available models: ${models.join(', ') || 'none - run: ollama pull codellama'}`
      );
    } else {
      const action = await vscode.window.showWarningMessage(
        '❌ Ollama is not running or not installed',
        'Install Ollama',
        'Start Ollama'
      );

      if (action === 'Install Ollama') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai'));
      }
    }
  }

  /**
   * Dispose extension resources
   */
  dispose(): void {
    this.decorator.dispose();
    this.disposables.forEach(d => d.dispose());
    this.analysisCache.clear();
  }
}

let extension: CodeHeatmapExtension | undefined;

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Code Complexity Heatmap extension is now active!');
  
  extension = new CodeHeatmapExtension(context);
  
  context.subscriptions.push({
    dispose: () => {
      if (extension) {
        extension.dispose();
      }
    }
  });
}

/**
 * Deactivate the extension
 */
export function deactivate() {
  if (extension) {
    extension.dispose();
    extension = undefined;
  }
}
