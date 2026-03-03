# Change Log

All notable changes to the "code-complexity-heatmap" extension will be documented in this file.

## [0.2.0] - 2026-03-03

### Added
- 🤖 **AI-Powered Refactoring Suggestions**
  - Ollama integration (free, local AI models)
  - Google Gemini API support (free tier)
  - Context-aware refactoring recommendations
  - New command: "Enable AI Suggestions"
  - New command: "Check Ollama Status"
- 🌐 **Multi-Language Support**
  - PHP support (including Laravel, Symfony, WordPress)
  - Go/Golang support
  - React JSX support
  - React TSX support
- 🎨 **Enhanced Visual Highlighting**
  - Improved color opacity for better visibility
  - Whole-line highlighting (previously partial)
  - Thicker borders (2px instead of 1px)
  - More vibrant color scheme
- 💡 **Better Refactoring Suggestions**
  - Severity-based categorization (Critical, Warning, Tips)
  - Specific actionable recommendations
  - Code examples and patterns
  - Urgency levels for high complexity functions
- 📚 **Documentation**
  - Comprehensive AI setup guide
  - Example files for PHP and Go
  - Updated README with AI features

### Changed
- Improved hover tooltip formatting
- Enhanced metrics display with emojis
- Better rule-based suggestions with detailed explanations

### Fixed
- Background color highlighting now visible in all themes
- React JSX/TSX files now properly supported

## [0.1.0] - 2026-03-02

### Added
- Initial release
- Code complexity analysis for JavaScript, TypeScript, and Python
- Visual heatmap with color-coded complexity levels
- Hover tooltips with detailed metrics
- Sidebar panel with complexity overview
- Technical debt score calculation
- Refactoring suggestions
- Commands for scanning files and workspace
- Configurable complexity thresholds
- Automatic scanning on save and file open
