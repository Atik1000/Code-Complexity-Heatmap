# Code Complexity Heatmap

A Visual Studio Code extension that analyzes source code complexity and highlights complex sections using color-coded heatmaps.

## Features

- **Visual Heatmap**: Color-coded highlighting of functions based on complexity
  - 🟢 Green: Low complexity (0-10)
  - 🟡 Yellow: Medium complexity (11-20)
  - 🟠 Orange: High complexity (21-35)
  - 🔴 Red: Critical complexity (35+)

- **Complexity Metrics**:
  - Cyclomatic Complexity
  - Function Length
  - Nested Depth
  - Condition Count
  - Loop Count
  - Parameter Count
  - Return Statement Count

- **Hover Tooltips**: Detailed complexity information on hover
- **Sidebar Panel**: Overview of all functions sorted by complexity
- **Technical Debt Score**: Project-wide complexity metrics
- **🤖 AI-Powered Suggestions**: Get intelligent refactoring recommendations
  - **Ollama (Free, Local)**: Run AI models locally - completely free
  - **Google Gemini (Free Tier)**: Cloud-based AI with free tier

## Supported Languages

- JavaScript
- TypeScript
- Python

## Usage

1. Open a supported file
2. The extension automatically analyzes and highlights complex code
3. Hover over highlighted sections for detailed metrics
4. Use the sidebar panel to navigate to complex functions
5. Run commands:
   - `Code Heatmap: Scan Current File`
   - `Code Heatmap: Scan Entire Workspace`
   - `Code Heatmap: Show Complexity Report`
   - `Code Heatmap: Enable AI Suggestions` - Set up free AI-powered suggestions
   - `Code Heatmap: Check Ollama Status` - Verify Ollama installation

## 🤖 AI-Powered Suggestions (Free!)

**Basic Settings:**
- `codeHeatmap.enabled`: Enable/disable the extension
- `codeHeatmap.scanOnSave`: Scan files automatically on save
- `codeHeatmap.scanOnOpen`: Scan files automatically on open
- `codeHeatmap.thresholds.*`: Customize complexity thresholds

**AI Settings:**
- `codeHeatmap.ai.enabled`: Enable AI-powered suggestions
- `codeHeatmap.ai.provider`: Choose provider (`ollama` or `gemini`)
- `codeHeatmap.ai.ollamaModel`: Ollama model name (default: `codellama`)
- `codeHeatmap.ai.geminiApiKey`: Your Google Gemini API key
1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull a model**: Run `ollama pull codellama` in terminal
3. **Enable in extension**: Run command `Code Heatmap: Enable AI Suggestions`
4. **That's it!** Hover over complex functions to get AI suggestions

**Why Ollama?**
- ✅ Completely free
- ✅ Runs locally (privacy-friendly)
- ✅ No API keys needed
- ✅ Works offline
- ✅ Fast responses

**Recommended models:**
- `codellama` - Best for code (7B, 13B, 34B)
- `deepseek-coder` - Excellent code understanding
- `codestral` - Great for refactoring

### Option 2: Google Gemini (Free Tier)

1. **Get API key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Enable in extension**: Run command `Code Heatmap: Enable AI Suggestions`
3. **Enter API key**: Paste your Gemini API key
4. **Done!** Free tier includes 15 requests/minute

### How It Works

When you hover over a complex function:
1. **Rule-based suggestions** appear instantly (always available)
2. **AI suggestions** generate in the background (if enabled)
3. Get specific, context-aware refactoring techniques
4. See code examples and estimated complexity reduction

## Configuration

Configure thresholds and behavior in VS Code settings:

- `codeHeatmap.enabled`: Enable/disable the extension
- `codeHeatmap.scanOnSave`: Scan files automatically on save
- `codeHeatmap.scanOnOpen`: Scan files automatically on open
- `codeHeatmap.thresholds.*`: Customize complexity thresholds

## License

MIT
