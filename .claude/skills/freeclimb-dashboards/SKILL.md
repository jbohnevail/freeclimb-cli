---
name: freeclimb-dashboards
description: >
    Build monitoring dashboards and analytics for FreeClimb voice/SMS applications.
    Use when: building dashboards, monitoring call metrics, tracking queue depth,
    analyzing call volume, creating reports, viewing active calls, real-time monitoring,
    or building analytics views for FreeClimb data.
    Do NOT use for: PerCL scripting (use freeclimb-percl), voice app development
    (use freeclimb-voice-apps), or CLI usage (use freeclimb-cli).
---

# FreeClimb Monitoring & Analytics

## Gotchas

These will trip you up when building dashboards:

1. **`calls:list` returns max 100 per page** — for "total calls today" you must paginate with `--next` or you'll undercount.
2. **`--status inProgress` is a point-in-time snapshot, not a stream** — calls can start/end between polls. Don't treat poll results as exact.
3. **Queue `currentSize` can be 0 even when callers are waiting** — briefly, during a dequeue race condition. Don't use a single poll as a health check.
4. **`logs:filter` PQL string values MUST be double-quoted** — `level = "ERROR"` works, `level = ERROR` silently returns nothing.
5. **API rate limits are per-account, not per-tool** — a dashboard polling 5 endpoints every 10s eats 30 req/min. Coordinate your polling intervals.
6. **`--fields` doesn't error on invalid field names** — it silently returns empty values. Always verify field names with `freeclimb describe`.

## Data Sources

All dashboard data comes from the FreeClimb API via CLI commands:

| Entity       | Command                                           | Key Fields                          |
| ------------ | ------------------------------------------------- | ----------------------------------- |
| Active calls | `freeclimb calls:list --status inProgress --json` | callId, from, to, dateCreated       |
| Call history | `freeclimb calls:list --json`                     | callId, status, duration, direction |
| Queues       | `freeclimb call-queues:list --json`               | queueId, alias, currentSize         |
| Conferences  | `freeclimb conferences:list --json`               | conferenceId, status, alias         |
| SMS messages | `freeclimb sms:list --json`                       | messageId, status, from, to         |
| Recordings   | `freeclimb recordings:list --json`                | recordingId, callId, duration       |
| Logs         | `freeclimb logs:filter --pql "..." --json`        | level, message, timestamp           |
| Account      | `freeclimb accounts:get --json`                   | status, type, balance               |

## Metrics Script

Source composable bash functions for quick metrics:

```bash
source .claude/skills/freeclimb-dashboards/scripts/fc-metrics.sh
fc_active_calls     # Count of in-progress calls
fc_queue_depth      # Queue sizes across all queues
fc_error_rate       # Error count from recent logs
fc_call_volume      # Total calls in last 100 results by status
```

## CLI Quick Reports

### Active Call Count

```bash
freeclimb calls:list --status inProgress --fields callId --json | jq '.data | length'
```

### Failed Call Rate (Last 100 Calls)

```bash
freeclimb calls:list --fields status --json | jq '[.data[] | select(.status == "failed")] | length'
```

### Queue Depth

```bash
freeclimb call-queues:list --fields queueId,alias,currentSize --json
```

### Error Summary (Last Hour)

```bash
freeclimb logs:filter --pql 'level = "ERROR"' --json | jq '.data | group_by(.message) | map({message: .[0].message, count: length}) | sort_by(-.count)'
```

## Dashboard Patterns

### Polling vs Real-Time

**Polling** (simplest, recommended starting point):

- Call `freeclimb calls:list` every 10-30 seconds
- Use `--fields` to minimize response size
- Cache results client-side to show trends

**Webhook-based** (real-time):

- Set `statusCallbackUrl` on applications
- Receive call events as they happen
- Store in your own database for dashboards

### Field Filtering for Efficiency

Always use `--fields` to reduce API response size:

```bash
# Instead of this (returns all fields):
freeclimb calls:list --json

# Do this (only what you need):
freeclimb calls:list --fields callId,status,from,to,dateCreated,duration --json
```

## Reference Files

| Reference                                | Contents                                                 |
| ---------------------------------------- | -------------------------------------------------------- |
| `references/metrics-catalog.md`          | Every available metric by entity with exact CLI commands |
| `references/dashboard-react-template.md` | React + Shadcn UI dashboard template                     |
| `references/pql-guide.md`                | FreeClimb PQL query language for log filtering           |
