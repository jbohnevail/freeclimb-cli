# FreeClimb Metrics Catalog

Every available metric organized by entity, with the exact CLI command and JSON fields.

## Calls

### Active Calls

```bash
freeclimb calls:list --status inProgress --fields callId,from,to,direction,dateCreated --json
```

Fields: `callId`, `from`, `to`, `direction` (inbound/outbound), `dateCreated`, `status`

### Call Volume by Status

```bash
freeclimb calls:list --fields callId,status --json
```

Statuses: `queued`, `ringing`, `inProgress`, `canceled`, `completed`, `failed`, `busy`, `noAnswer`

### Completed Calls with Duration

```bash
freeclimb calls:list --status completed --fields callId,from,to,duration,dateCreated --json
```

`duration` is in seconds.

### Failed Calls

```bash
freeclimb calls:list --status failed --fields callId,from,to,dateCreated --json
```

### Calls by Direction

```bash
freeclimb calls:list --fields callId,direction,status --json
```

Group by `direction`: `inbound` or `outbound`.

### Specific Call Details

```bash
freeclimb calls:get CA... --json
```

Returns full call record including `startTime`, `endTime`, `duration`, `status`, `parentCallId`.

## SMS Messages

### Message Volume

```bash
freeclimb sms:list --fields messageId,status,direction,dateCreated --json
```

Statuses: `queued`, `sending`, `sent`, `receiving`, `received`, `failed`

### Failed Messages

```bash
freeclimb sms:list --fields messageId,status,from,to,dateCreated --json
```

Filter client-side for `status === "failed"`.

### Messages by Number

```bash
freeclimb sms:list --from +15551234567 --fields messageId,to,status,dateCreated --json
```

## Conferences

### Active Conferences

```bash
freeclimb conferences:list --status inProgress --fields conferenceId,alias,dateCreated --json
```

### Conference History

```bash
freeclimb conferences:list --fields conferenceId,alias,status,dateCreated --json
```

Statuses: `empty`, `populated`, `inProgress`, `terminated`

### Conference Participants

```bash
freeclimb conference-participants:list CF... --fields callId,talk,listen --json
```

## Queues

### Queue Status

```bash
freeclimb call-queues:list --fields queueId,alias,currentSize,maxSize --json
```

`currentSize` = number of callers currently waiting.

### Queue Members

```bash
freeclimb queue-members:list QU... --fields callId,dateEnqueued,waitTime --json
```

## Recordings

### Recording Volume

```bash
freeclimb recordings:list --fields recordingId,callId,duration,dateCreated --json
```

### Recordings for a Call

```bash
freeclimb recordings:list --callId CA... --fields recordingId,duration --json
```

## Logs

### All Logs

```bash
freeclimb logs:list --maxItems 100 --json
```

### Filtered Logs (PQL)

```bash
freeclimb logs:filter --pql 'level = "ERROR"' --json
freeclimb logs:filter --pql 'level = "WARNING" AND message CONTAINS "timeout"' --json
```

See `references/pql-guide.md` for full PQL syntax.

### Error Count by Type

```bash
freeclimb logs:filter --pql 'level = "ERROR"' --json | jq '[.data[]] | group_by(.message) | map({message: .[0].message, count: length}) | sort_by(-.count) | .[:10]'
```

## Account

### Account Status

```bash
freeclimb accounts:get --fields accountId,status,type --json
```

### Phone Number Inventory

```bash
freeclimb incoming-numbers:list --fields phoneNumberId,phoneNumber,alias,applicationId --json
```

### Application Configuration

```bash
freeclimb applications:list --fields applicationId,alias,voiceUrl,statusCallbackUrl --json
```

## Derived Metrics

These metrics require computation from raw data:

| Metric                | Calculation                                          |
| --------------------- | ---------------------------------------------------- |
| Call success rate     | `completed / (completed + failed + busy + noAnswer)` |
| Average call duration | `sum(duration) / count(completed calls)`             |
| Queue wait time       | `avg(waitTime)` from queue members                   |
| Peak concurrent calls | Track `inProgress` count over time                   |
| SMS delivery rate     | `sent / (sent + failed)`                             |
| Error rate            | `ERROR logs / total logs` per time window            |
