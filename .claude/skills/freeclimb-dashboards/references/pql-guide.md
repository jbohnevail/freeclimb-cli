# FreeClimb PQL (Query Language) Guide

PQL is FreeClimb's query language for filtering logs. Used with `freeclimb logs:filter --pql "..."`.

## Syntax

### Basic Comparison

```
field = "value"
field != "value"
```

### String Matching

```
field CONTAINS "substring"
field STARTS_WITH "prefix"
field ENDS_WITH "suffix"
```

### Logical Operators

```
condition1 AND condition2
condition1 OR condition2
NOT condition
```

### Grouping

```
(condition1 OR condition2) AND condition3
```

## Available Fields

| Field       | Type   | Description                                    |
| ----------- | ------ | ---------------------------------------------- |
| `level`     | string | Log level: `ERROR`, `WARNING`, `INFO`, `DEBUG` |
| `message`   | string | Log message text                               |
| `requestId` | string | Associated request ID                          |
| `callId`    | string | Associated call ID                             |
| `accountId` | string | Account ID                                     |
| `timestamp` | string | ISO 8601 timestamp                             |

## Common Queries

### All Errors

```bash
freeclimb logs:filter --pql 'level = "ERROR"' --json
```

### Errors and Warnings

```bash
freeclimb logs:filter --pql 'level = "ERROR" OR level = "WARNING"' --json
```

### Errors for a Specific Call

```bash
freeclimb logs:filter --pql 'level = "ERROR" AND callId = "CA..."' --json
```

### Timeout Errors

```bash
freeclimb logs:filter --pql 'level = "ERROR" AND message CONTAINS "timeout"' --json
```

### Webhook Failures

```bash
freeclimb logs:filter --pql 'message CONTAINS "webhook" AND level = "ERROR"' --json
```

### Authentication Errors

```bash
freeclimb logs:filter --pql 'message CONTAINS "auth" AND level = "ERROR"' --json
```

### Specific Request Investigation

```bash
freeclimb logs:filter --pql 'requestId = "RQ..."' --json
```

### Queue-Related Issues

```bash
freeclimb logs:filter --pql 'message CONTAINS "queue" AND (level = "ERROR" OR level = "WARNING")' --json
```

### Conference Issues

```bash
freeclimb logs:filter --pql 'message CONTAINS "conference" AND level = "ERROR"' --json
```

## Monitoring Queries

### Error Rate Check

```bash
# Count errors in recent logs
freeclimb logs:filter --pql 'level = "ERROR"' --maxItems 100 --json | jq '.data | length'
```

### Top Error Messages

```bash
freeclimb logs:filter --pql 'level = "ERROR"' --json | jq '[.data[].message] | group_by(.) | map({message: .[0], count: length}) | sort_by(-.count) | .[:5]'
```

### Warning Trends

```bash
freeclimb logs:filter --pql 'level = "WARNING"' --maxItems 50 --json | jq '.data | group_by(.message) | map({message: .[0].message, count: length})'
```

## Tips

- String values must be double-quoted: `level = "ERROR"` not `level = ERROR`
- Field names are case-sensitive
- PQL does not support date range filtering — use `--maxItems` to limit results
- Combine with `jq` for client-side date filtering and aggregation
- When using in bash, wrap the PQL in single quotes to avoid shell interpolation
