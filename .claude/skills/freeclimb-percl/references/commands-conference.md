# PerCL Conference Commands

## CreateConference

Create a new conference room and add the current caller.

```json
{
    "CreateConference": {
        "actionUrl": "string (required) — URL for conference status callbacks",
        "alias": "string — human-readable conference name",
        "playBeep": "string — 'always', 'never', 'entryOnly', 'exitOnly' (default: 'always')",
        "record": "boolean — record the conference (default: false)",
        "waitUrl": "string — URL returning PerCL to play while waiting (hold music)",
        "statusCallbackUrl": "string — URL for conference lifecycle events"
    }
}
```

**Callback POST body** to `actionUrl`:

```json
{
    "accountId": "AC...",
    "callId": "CA...",
    "conferenceId": "CF...",
    "status": "empty",
    "requestType": "conferenceStatus"
}
```

**Conference statuses:** `"empty"`, `"populated"`, `"inProgress"`, `"terminated"`

### Hold Music Example

Return PerCL from `waitUrl` to play while waiting for other participants:

```json
[
    { "Say": { "text": "Please hold while we connect your party." } },
    { "Play": { "file": "https://example.com/hold-music.mp3", "loop": 0 } }
]
```

## AddToConference

Add a call to an existing conference.

```json
{
    "AddToConference": {
        "conferenceId": "string (required) — conference ID to join",
        "callId": "string (required) — call to add",
        "talk": "boolean — participant can speak (default: true)",
        "listen": "boolean — participant can hear (default: true)",
        "startConfOnEnter": "boolean — start conference when this participant joins (default: true)",
        "leaveConferenceUrl": "string — URL called when participant leaves",
        "notificationUrl": "string — URL for participant status events",
        "dtmfPassThrough": "boolean — forward DTMF to conference (default: false)",
        "callControl": "boolean — allow DTMF-based call control (default: false)",
        "callControlSequence": "string — DTMF sequence for self-removal (default: none)",
        "callControlUrl": "string — URL for call control events"
    }
}
```

### Silent Monitoring

Add a supervisor who can listen but not talk:

```json
{
    "AddToConference": {
        "conferenceId": "CF...",
        "callId": "CA...",
        "talk": false,
        "listen": true,
        "startConfOnEnter": false
    }
}
```

## RemoveFromConference

Remove a participant from a conference.

```json
{
    "RemoveFromConference": {
        "callId": "string (required) — call to remove"
    }
}
```

## TerminateConference

End the conference and disconnect all participants.

```json
{
    "TerminateConference": {
        "conferenceId": "string (required) — conference to terminate"
    }
}
```

## SetListen

Toggle whether a participant can hear the conference.

```json
{
    "SetListen": {
        "callId": "string (required)",
        "listen": "boolean (required)"
    }
}
```

## SetTalk

Toggle whether a participant can speak in the conference.

```json
{
    "SetTalk": {
        "callId": "string (required)",
        "talk": "boolean (required)"
    }
}
```

## SetDTMFPassThrough

Toggle whether DTMF tones from a participant are forwarded to the conference.

```json
{
    "SetDTMFPassThrough": {
        "callId": "string (required)",
        "dtmfPassThrough": "boolean (required)"
    }
}
```

## Queue Commands

### Enqueue

Place the current call into a queue.

```json
{
    "Enqueue": {
        "queueId": "string (required) — queue to place call in",
        "waitUrl": "string (required) — URL returning PerCL for hold experience",
        "actionUrl": "string (required) — URL called when call is dequeued",
        "notificationUrl": "string — URL for queue position updates"
    }
}
```

**Hold experience** (`waitUrl` response):

```json
[
    { "Say": { "text": "You are caller number 3 in the queue. Please hold." } },
    { "Play": { "file": "https://example.com/hold-music.mp3", "loop": 0 } }
]
```

### Dequeue

Remove a call from a queue (used by agent-side logic).

```json
{ "Dequeue": {} }
```

Dequeue is typically returned by the agent's webhook when they're ready to take the next call.

## Conference + Queue Patterns

### Warm Transfer via Conference

1. Agent creates conference: `CreateConference`
2. Agent is added: `AddToConference`
3. Agent dials target: `OutDial` with `callConnectUrl` returning `AddToConference`
4. Agent announces caller, then drops: `RemoveFromConference`

### Queue-Based Call Center

1. Caller hits IVR → `Enqueue` (with `waitUrl` for hold music)
2. Agent webhook checks for queued calls
3. Agent ready → `Dequeue` to connect caller
4. Post-call wrap-up via `statusCallbackUrl`
