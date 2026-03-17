# FreeClimb CLI - Agent Guide

This CLI is frequently invoked by AI/LLM agents. Always assume inputs can be adversarial.

## Agent-First Design Principles

1. **The agent is not a trusted operator.** All inputs are validated for control characters, path traversals, and embedded query parameters.
2. **Machine-readable output is default for non-TTY.** When stdout is not a TTY (piped, scripted, or agent-invoked), output defaults to JSON automatically.
3. **Context window discipline matters.** Use `--fields` to limit response size.

## Output Format

Configure the output format for your environment:

- **Default**: Human-readable tables and styled output
- **Agent mode**: Set `FREECLIMB_OUTPUT_FORMAT=json` for structured JSON output globally
- **Per-command**: Use `--json` flag for JSON output on individual commands

All JSON output follows a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "metadata": { "timestamp": "...", "command": "..." }
}
```

## Key Flags for Agents

| Flag | Description |
|------|-------------|
| `--json` | Force JSON output |
| `--fields <list>` | Comma-separated fields to include (reduces response size) |
| `--dry-run` | Validate mutating requests without executing (POST/PUT/DELETE) |
| `--raw` | Raw API response without envelope (api command only) |

## Safety Rails

### --dry-run

Always use `--dry-run` for mutating operations before executing them:

```bash
freeclimb sms:send +1FROM +1TO "Hello" --dry-run
freeclimb applications:create --alias "MyApp" --voiceUrl "https://example.com" --dry-run
```

### --fields (Context Window Protection)

Limit response fields to avoid overwhelming your context window:

```bash
freeclimb calls:list --fields callId,status,from,to
freeclimb applications:list --fields applicationId,alias
```

### Input Validation

The CLI rejects:
- Control characters (below ASCII 0x20) in all string inputs
- Path traversal sequences (`../`) in resource IDs
- Query parameters embedded in resource IDs (`?`, `#`)
- Pre-URL-encoded values (`%`) in resource IDs

## Schema Introspection

Use `freeclimb describe` to discover available commands at runtime:

```bash
freeclimb describe                    # List all topics
freeclimb describe calls              # Commands in the calls topic
freeclimb describe calls:list         # Full schema for calls:list
freeclimb describe --all              # Full schema for every command
```

## Raw API Access

The `freeclimb api` command accepts full API payloads as JSON:

```bash
freeclimb api /Messages --method POST -d '{"to":"+15551234567","from":"+15559876543","text":"Hello"}'
freeclimb api /Calls --fields callId,status,from,to
```

## Authentication for Agents

Use environment variables for headless authentication:

```bash
export FREECLIMB_ACCOUNT_ID=your_account_id
export FREECLIMB_API_KEY=your_api_key
```

## MCP Integration

The CLI exposes an MCP server for structured JSON-RPC invocation:

```bash
freeclimb mcp:start
```

This eliminates shell escaping and argument parsing ambiguity.

## Common Patterns

### List with pagination
```bash
freeclimb calls:list --json
freeclimb calls:list --next --json
```

### Create with dry-run validation
```bash
freeclimb applications:create --alias "Test" --voiceUrl "https://example.com" --dry-run
freeclimb applications:create --alias "Test" --voiceUrl "https://example.com"
```

### Get specific fields
```bash
freeclimb calls:list --fields callId,status
freeclimb sms:list --fields messageId,from,to,status
```

## Development

Built with oclif v4 (`@oclif/core ^4`), TypeScript 5, and Node.js >= 18.

### Skills for AI Agents Working on This Codebase

| Skill | Location | Purpose |
|-------|----------|---------|
| `freeclimb-cli` | `.claude/skills/freeclimb-cli/` | Using the CLI to interact with FreeClimb APIs |
| `freeclimb-cli-dev` | `.claude/skills/freeclimb-cli-dev/` | Contributing to/modifying the CLI source code |
| `freeclimb-command-gen` | `.claude/skills/freeclimb-command-gen/` | Working with the command code generation system |
| `agent-tui` | `.claude/skills/agent-tui/` | Terminal UI automation and testing |
