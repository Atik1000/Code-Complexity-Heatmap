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
- **Refactoring Suggestions**: AI-powered recommendations for complex code

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

## Configuration

Configure thresholds and behavior in VS Code settings:

- `codeHeatmap.enabled`: Enable/disable the extension
- `codeHeatmap.scanOnSave`: Scan files automatically on save
- `codeHeatmap.scanOnOpen`: Scan files automatically on open
- `codeHeatmap.thresholds.*`: Customize complexity thresholds

## License

MIT
