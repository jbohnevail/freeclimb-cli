---
name: freeclimb-cli
description: >
    Interact with the FreeClimb voice/SMS communications API via the CLI.
    Use when: making calls, sending SMS, managing phone numbers, applications,
    conferences, queues, recordings, or account settings through the FreeClimb CLI.
    Also use when: the user mentions FreeClimb, needs to interact with FreeClimb APIs,
    asks about available CLI commands, or wants to automate telephony workflows.
    Do NOT use for: modifying the CLI source code (use freeclimb-cli-dev instead).
---

# FreeClimb CLI

## Setup

```bash
export FREECLIMB_ACCOUNT_ID=<account_id>
export FREECLIMB_API_KEY=<api_key>
export FREECLIMB_OUTPUT_FORMAT=json
```

## Gotchas

1. **`--dry-run` on GET commands is a no-op** — it only works on POST/PUT/DELETE. Don't assume it validates reads.
2. **`--fields` with a typo silently returns the field as empty, not an error** — verify field names with `freeclimb describe <command>`.
3. **`--next` pagination resets if you change any filter parameter between pages** — keep filters identical across pages.
4. **`freeclimb describe` returns the CLI schema, NOT the API schema** — they can differ on optional fields and naming.
5. **`incoming-numbers:buy` is immediate and non-reversible** — there's no undo. Always `--dry-run` first.
6. **`api` command with `--raw` bypasses all validation** — agent inputs are NOT sanitized in raw mode.
7. **Always `--dry-run` before mutating operations** (create/update/delete) and confirm with the user before executing.
8. **Always `--fields` on list commands** to limit response size and protect context windows.
9. **Phone numbers must be E.164 format**: `+12223334444`

## On-Demand Hook

When this skill is active, a PreToolUse hook warns when running mutating CLI commands without `--dry-run`. See `.claude/skills/freeclimb-cli/hooks.json`.

## Schema Discovery

```bash
freeclimb describe              # List all topics
freeclimb describe calls        # Commands in a topic
freeclimb describe calls:list   # Full schema for one command
freeclimb describe --all        # Every command's schema
```

## Key Flags

| Flag             | Effect                              |
| ---------------- | ----------------------------------- |
| `--json`         | Force JSON output                   |
| `--fields f1,f2` | Limit response fields               |
| `--dry-run`      | Validate without executing          |
| `--raw`          | Raw API response (api command only) |

## Common Workflows

### SMS

```bash
freeclimb sms:send +1FROM +1TO "message" --dry-run
freeclimb sms:send +1FROM +1TO "message"
freeclimb sms:list --fields messageId,from,to,status --json
```

### Calls

```bash
freeclimb calls:make +1FROM +1TO APP_ID --dry-run
freeclimb calls:make +1FROM +1TO APP_ID
freeclimb calls:list --fields callId,status,from,to,dateCreated --json
```

### Applications

```bash
freeclimb applications:list --fields applicationId,alias --json
freeclimb applications:create --alias "MyApp" --voiceUrl "https://example.com/voice" --dry-run
freeclimb applications:create --alias "MyApp" --voiceUrl "https://example.com/voice"
```

### Numbers

```bash
freeclimb available-numbers:list --fields phoneNumber,region --json
freeclimb incoming-numbers:buy --phoneNumber "+15551234567" --dry-run
freeclimb incoming-numbers:list --fields phoneNumberId,phoneNumber,alias --json
```

### Conferences

```bash
freeclimb conferences:create --alias "standup" --dry-run
freeclimb conference-participants:list CONF_ID --fields callId,talk,listen --json
```

### Raw API

```bash
freeclimb api /Calls --fields callId,status
freeclimb api /Messages --method POST -d '{"to":"+15551234567","from":"+15559876543","text":"Hello"}'
freeclimb api /Calls -p status=completed -p to=+15551234567
```

### Account & Diagnostics

```bash
freeclimb accounts:get --json
freeclimb diagnose
freeclimb status
```

## MCP Integration

For structured JSON-RPC invocation (eliminates shell escaping):

```bash
freeclimb mcp:start
freeclimb mcp:config  # Print Claude Desktop config
```

## Pagination

```bash
freeclimb calls:list --json          # First page
freeclimb calls:list --next --json   # Next page
```

## Error Handling

JSON-mode errors include structured suggestions:

```json
{
    "success": false,
    "error": { "code": 3, "message": "...", "suggestion": "..." }
}
```

## Input Validation

The CLI rejects:

- Control characters (below ASCII 0x20) in string inputs
- Path traversal (`../`) in resource IDs
- Query parameters (`?`, `#`) embedded in IDs
- Pre-URL-encoded values (`%`) in IDs

## Companion Skills

| Skill                  | Use For                              |
| ---------------------- | ------------------------------------ |
| `freeclimb-percl`      | PerCL command reference and examples |
| `freeclimb-voice-apps` | Building complete voice applications |
| `freeclimb-dashboards` | Monitoring and analytics dashboards  |
| `freeclimb-cli-dev`    | Developing/modifying the CLI itself  |

## Quick Provisioning Workflow

```bash
# 1. Create the application
freeclimb applications:create --alias "My App" --voiceUrl "https://your-server.com/voice" --dry-run
freeclimb applications:create --alias "My App" --voiceUrl "https://your-server.com/voice"

# 2. Find an available number
freeclimb available-numbers:list --fields phoneNumber,region --json

# 3. Buy and assign it
freeclimb incoming-numbers:buy --phoneNumber "+15551234567" --applicationId "AP..." --dry-run
freeclimb incoming-numbers:buy --phoneNumber "+15551234567" --applicationId "AP..."

# 4. Verify
freeclimb applications:list --fields applicationId,alias,voiceUrl --json
freeclimb incoming-numbers:list --fields phoneNumber,applicationId --json
```
