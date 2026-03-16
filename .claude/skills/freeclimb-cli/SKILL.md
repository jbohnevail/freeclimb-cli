---
name: freeclimb-cli
version: 0.5.4
metadata:
  requires:
    bins: ["freeclimb"]
---

# FreeClimb CLI Skill

Use the FreeClimb CLI to make voice calls, send SMS messages, and manage phone numbers via the FreeClimb API.

## Setup

Set credentials via environment variables:
```bash
export FREECLIMB_ACCOUNT_ID=<your_account_id>
export FREECLIMB_API_KEY=<your_api_key>
export FREECLIMB_OUTPUT_FORMAT=json
```

## Rules

- Always use `--dry-run` for mutating operations before executing them
- Always confirm with the user before executing write/delete commands
- Always use `--fields` to limit response size and protect your context window
- Use `freeclimb describe` to introspect command schemas instead of parsing `--help`
- Phone numbers must be in E.164 format: `+12223334444`
- Set `FREECLIMB_OUTPUT_FORMAT=json` for structured machine-readable output

## Common Operations

### Send SMS
```bash
freeclimb sms:send +1FROM +1TO "message text" --dry-run
freeclimb sms:send +1FROM +1TO "message text"
```

### List calls with field filtering
```bash
freeclimb calls:list --fields callId,status,from,to,dateCreated --json
```

### Make a call
```bash
freeclimb calls:make +1FROM +1TO APP_ID --dry-run
freeclimb calls:make +1FROM +1TO APP_ID
```

### Manage applications
```bash
freeclimb applications:list --fields applicationId,alias --json
freeclimb applications:create --alias "MyApp" --voiceUrl "https://example.com/voice" --dry-run
```

### Discover commands
```bash
freeclimb describe --all
freeclimb describe calls
freeclimb describe sms:send
```

### Raw API access
```bash
freeclimb api /Calls --fields callId,status,from,to
freeclimb api /Messages --method POST -d '{"to":"+15551234567","from":"+15559876543","text":"Hello"}'
```

## MCP Integration

For structured JSON-RPC tool invocation without shell escaping:
```bash
freeclimb mcp:server
```
