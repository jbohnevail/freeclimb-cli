# FreeClimb CLI - Context for AI Agents

## Quick Reference

FreeClimb is a cloud communications platform API for voice calls, SMS, and phone number management.

### Environment Setup
```bash
export FREECLIMB_ACCOUNT_ID=<your_account_id>
export FREECLIMB_API_KEY=<your_api_key>
export FREECLIMB_OUTPUT_FORMAT=json  # Force JSON output globally
```

### Available Topics

| Topic | Description |
|-------|-------------|
| `calls` | Make, list, get, and update voice calls |
| `sms` | Send and manage SMS messages |
| `applications` | CRUD for FreeClimb applications (webhook endpoints) |
| `incoming-numbers` | Manage purchased phone numbers |
| `available-numbers` | Search for phone numbers to purchase |
| `conferences` | Create and manage conference calls |
| `conference-participants` | Manage participants in conferences |
| `call-queues` | Create and manage call queues |
| `queue-members` | Manage members in call queues |
| `recordings` | Access call recordings |
| `accounts` | View and manage account settings |
| `logs` | Search and filter API logs |

### Utility Commands

| Command | Description |
|---------|-------------|
| `api` | Make authenticated raw API requests with full JSON payloads |
| `describe` | Machine-readable command schema introspection (JSON) |
| `diagnose` | System diagnostics and connectivity check |
| `status` | Account status overview |
| `mcp:start` | Start MCP server for AI agent integration (JSON-RPC over stdio) |

### Important Invariants

1. **Phone numbers must be in E.164 format**: `+12223334444`
2. **Always use `--fields` when listing resources** to avoid overwhelming your context window
3. **Always use `--dry-run` for mutating operations** (create, update, delete) before executing
4. **Always confirm with the user** before executing write/delete commands
5. **Use `freeclimb describe <command>`** to introspect command schemas at runtime instead of parsing --help
6. **Output is auto-JSON** when `FREECLIMB_OUTPUT_FORMAT=json` is set

### Response Size Warning

FreeClimb APIs can return large JSON responses. ALWAYS use `--fields` to limit response size:

```bash
# Bad: returns all fields for every call
freeclimb calls:list

# Good: returns only the fields you need
freeclimb calls:list --fields callId,status,from,to,dateCreated
```

### Error Handling

Errors include structured codes and suggestions:

```json
{
  "success": false,
  "error": {
    "code": 3,
    "message": "...",
    "suggestion": "...",
    "tryCommands": ["freeclimb ..."],
    "docUrl": "https://..."
  }
}
```

### Schema Discovery

Use `freeclimb describe` instead of `--help` for machine-readable command schemas:

```bash
freeclimb describe --all  # Get full schema for all commands
```

### Technology Stack

- **Runtime**: Node.js >= 18
- **Framework**: oclif v4 (`@oclif/core ^4`)
- **Language**: TypeScript 5
- **Credentials**: @napi-rs/keyring (OS keychain)
- **HTTP**: axios
- **Testing**: Mocha + Chai + Nock
