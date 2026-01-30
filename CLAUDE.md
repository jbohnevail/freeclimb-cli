# FreeClimb CLI

TypeScript CLI for the FreeClimb voice/SMS communications API, built with oclif.

## Quick Start

npm test              # Run tests with coverage
npm run lint          # Check code style
npm run lint-write    # Fix lint issues + format
npm run prepack       # Build for distribution

## Directory Structure

src/
├── commands/         # oclif command implementations (auto-generated)
│   ├── accounts/     # Account management
│   ├── applications/ # App CRUD operations
│   ├── calls/        # Call management
│   ├── sms/          # SMS messaging
│   ├── conferences/  # Conference calls
│   ├── call-queues/  # Queue management
│   ├── recordings/   # Recording access
│   ├── logs/         # Log searching
│   └── mcp/          # MCP server command
├── mcp/              # MCP server implementation
├── ui/               # Terminal UI components
├── freeclimb.ts      # API client wrapper
├── credentials.ts    # Secure credential storage (keytar)
├── environment.ts    # Env var configuration
└── errors.ts         # Error hierarchy

test/                 # Mocha/Chai tests with nock mocking
generation/           # Command code generation templates
docs/                 # Auto-generated command docs

## Architecture

### Command Pattern
Commands follow oclif conventions:
- Located at `src/commands/[topic]/[action].ts`
- Extend `Command` base class
- Static `description`, `flags`, `args` properties
- Async `run()` method

### Auto-Generated Code
⚠️ Most command files are AUTO-GENERATED from `generation/` templates.
Edit templates in `generation/commands/`, not the generated files.

### Credential Management
Priority order:
1. keytar (OS keychain) via `freeclimb login`
2. Environment variables: FREECLIMB_ACCOUNT_ID, FREECLIMB_API_KEY
3. .env file (dotenv)

### Error Handling
Hierarchy: FreeClimbError → ParseError, APIError, DefaultFatalError
Use chalk colors for severity levels in output.

### Output Formatting
- Topic-specific formatters in `src/ui/format.ts`
- --json flag for scripted usage
- Pagination with --next cursor

## Testing

Framework: Mocha + Chai + Nock (HTTP mocking)
Coverage: nyc

Run specific test:
npx mocha test/commands/sms/send.test.ts

## MCP Integration

Built-in MCP server exposes 15+ tools for AI agents:
freeclimb mcp:server

Tools: calls, sms, numbers, applications, conferences, queues
