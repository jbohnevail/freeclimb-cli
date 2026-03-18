# FreeClimb CLI - Agent Guide

## Git Remotes — READ THIS FIRST

- `origin` = `FreeClimbAPI/freeclimb-cli` (upstream, READ-ONLY)
- `work` = `jbohnevail/freeclimb-cli` (fork, push here)
- **NEVER create PRs against FreeClimbAPI/freeclimb-cli**
- Always: `git push work <branch>` and PRs target `jbohnevail/freeclimb-cli`

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

| Flag              | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `--json`          | Force JSON output                                              |
| `--fields <list>` | Comma-separated fields to include (reduces response size)      |
| `--dry-run`       | Validate mutating requests without executing (POST/PUT/DELETE) |
| `--raw`           | Raw API response without envelope (api command only)           |

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

## MCP Setup (Auto-Discovery)

| Agent           | Config File                | Auto-discovered |
| --------------- | -------------------------- | --------------- |
| Claude Code     | `.mcp.json`                | Yes             |
| Cursor          | `.cursor/mcp.json`         | Yes             |
| VS Code Copilot | `.vscode/mcp.json`         | Yes             |
| Claude Desktop  | Run `freeclimb mcp:config` | Manual          |

Prerequisites: `npm run setup` + set `FREECLIMB_ACCOUNT_ID` and `FREECLIMB_API_KEY` env vars.

## Common Patterns

```bash
freeclimb calls:list --json                                                             # List (JSON)
freeclimb calls:list --next --json                                                      # Paginate
freeclimb calls:list --fields callId,status                                             # Limit fields
freeclimb applications:create --alias "Test" --voiceUrl "https://example.com" --dry-run # Validate first
freeclimb applications:create --alias "Test" --voiceUrl "https://example.com"           # Then execute
```

## Voice Application Skills

The CLI includes companion skills for building complete voice applications:

| Skill                  | Location                               | Use For                                                                                                                            |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `freeclimb-percl`      | `.claude/skills/freeclimb-percl/`      | PerCL command reference — the JSON scripting language for controlling live calls (Say, GetDigits, Record, Conference, Queue, etc.) |
| `freeclimb-voice-apps` | `.claude/skills/freeclimb-voice-apps/` | Building webhook servers, IVRs, call centers, voicemail, outbound campaigns — includes Express.js and Next.js templates            |
| `freeclimb-dashboards` | `.claude/skills/freeclimb-dashboards/` | Monitoring dashboards, analytics, CLI-based reports — includes React + Shadcn UI template                                          |

### Typical Voice App Workflow

1. **Design the call flow** — load `freeclimb-percl` for PerCL command reference
2. **Build the webhook server** — load `freeclimb-voice-apps` for templates and patterns
3. **Provision resources** — use CLI commands (`applications:create`, `incoming-numbers:buy`)
4. **Monitor** — load `freeclimb-dashboards` for reporting and real-time monitoring

### MCP Tools for Agents

The MCP server (`freeclimb mcp:start`) includes tools for agents without skill access:

| Tool             | Purpose                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `generate_percl` | Generate valid PerCL JSON for common patterns (greeting, menu, voicemail, transfer, queue, record) |
| `update_call`    | Update an active call — hang up or redirect mid-call                                               |

## Development

Built with oclif v4, TypeScript 5, Node.js >= 18.

| Command                        | Purpose                 |
| ------------------------------ | ----------------------- |
| `npm install --ignore-scripts` | Install dependencies    |
| `npx tsc --noEmit`             | Type check              |
| `npm test`                     | Run tests with coverage |
| `npm run prepack`              | Build for distribution  |

Most commands in `src/commands/` are auto-generated — edit templates in `generation/commands/`, not generated files.
