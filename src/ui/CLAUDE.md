# UI Components

Terminal UI system for CLI output.

## Files
- banner.ts: CLI greeting/header
- format.ts: Topic-specific output formatters
- spinner.ts: Loading indicators (ora)
- select.ts: Interactive selection prompts
- components.ts: Reusable UI elements
- theme.ts: Color theming (chalk)
- chars.ts: Unicode character utilities

## Usage Pattern
1. Get formatter: getFormatterForTopic(topic)
2. Format data for display
3. Use spinner for async operations
