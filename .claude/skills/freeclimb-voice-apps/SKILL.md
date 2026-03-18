---
name: freeclimb-voice-apps
description: >
    Build complete voice applications with FreeClimb — IVRs, call centers,
    voicemail, outbound campaigns, and webhook servers.
    Use when: building an IVR, call center, interactive voice response, phone tree,
    phone menu, voice application, webhook server, call routing, auto-attendant,
    voicemail system, pay-by-phone, appointment reminder, or outbound campaign.
    Also use when: the user wants to set up a complete voice app end-to-end,
    needs webhook server templates, or asks about voice app architecture.
    Do NOT use for: PerCL command reference (use freeclimb-percl),
    CLI usage (use freeclimb-cli), or dashboard/monitoring (use freeclimb-dashboards).
---

# Building Voice Applications with FreeClimb

## Architecture Overview

FreeClimb uses a **webhook-based** architecture:

1. A call comes in (or you make an outbound call)
2. FreeClimb sends an HTTP POST to your **webhook server**
3. Your server responds with a JSON array of **PerCL commands**
4. FreeClimb executes those commands on the live call
5. When a command needs input (GetDigits, GetSpeech), FreeClimb POSTs the result to your `actionUrl`

```
Caller → FreeClimb → POST to voiceUrl → Your Server → PerCL JSON → FreeClimb → Caller hears TTS/audio
```

### The 4 Key URLs

| URL                 | Purpose                               | Set on                 |
| ------------------- | ------------------------------------- | ---------------------- |
| `voiceUrl`          | Called when an inbound call arrives   | Application            |
| `voiceFallbackUrl`  | Called if `voiceUrl` fails            | Application            |
| `callConnectUrl`    | Called when an OutDial callee answers | OutDial command        |
| `statusCallbackUrl` | Called on call status changes         | Application or command |

## Development Setup

### 1. Create a webhook server

Use Express.js (TypeScript) — see `references/webhook-server-templates.md` for full templates.

Minimal server:

```typescript
import express from "express"
const app = express()
app.use(express.json())

app.post("/voice", (req, res) => {
    res.json([{ Say: { text: "Hello from FreeClimb!" } }, { Hangup: {} }])
})

app.listen(3000)
```

### 2. Expose locally with ngrok

```bash
ngrok http 3000
# Copy the HTTPS URL, e.g., https://abc123.ngrok.io
```

### 3. Provision via CLI

```bash
# Create an application pointing to your webhook
freeclimb applications:create \
  --alias "My IVR" \
  --voiceUrl "https://abc123.ngrok.io/voice" \
  --voiceFallbackUrl "https://abc123.ngrok.io/fallback" \
  --statusCallbackUrl "https://abc123.ngrok.io/status" \
  --dry-run

# Execute after confirming
freeclimb applications:create \
  --alias "My IVR" \
  --voiceUrl "https://abc123.ngrok.io/voice"

# Find and buy a phone number
freeclimb available-numbers:list --fields phoneNumber,region --json
freeclimb incoming-numbers:buy --phoneNumber "+15551234567" --applicationId "AP..." --dry-run
freeclimb incoming-numbers:buy --phoneNumber "+15551234567" --applicationId "AP..."
```

### 4. Test

Call the purchased number. FreeClimb will POST to your `voiceUrl`.

## Webhook Request Format

Every webhook POST from FreeClimb includes:

```json
{
    "accountId": "AC...",
    "callId": "CA...",
    "from": "+15551234567",
    "to": "+15559876543",
    "callStatus": "inProgress",
    "direction": "inbound",
    "requestType": "inboundCall",
    "conferenceId": null,
    "queueId": null,
    "parentCallId": null
}
```

**`requestType` values:**

- `inboundCall` — new inbound call
- `outboundCall` — outbound call you initiated
- `getDigits` — response from GetDigits (includes `digits` field)
- `getSpeech` — response from GetSpeech (includes `recognitionResult` field)
- `record` — recording completed (includes `recordingId`, `recordingUrl`)
- `conferenceStatus` — conference state change
- `queueWait` — caller waiting in queue (return hold music PerCL)
- `machineDetected` — answering machine detected on OutDial

## Quick-Start Template

A complete Express server that answers with a greeting:

```typescript
import express from "express"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Inbound call handler
app.post("/voice", (req, res) => {
    console.log(`Call from ${req.body.from} to ${req.body.to}`)
    res.json([{ Say: { text: "Welcome to our service. Goodbye." } }, { Hangup: {} }])
})

// Fallback handler
app.post("/fallback", (req, res) => {
    res.json([
        { Say: { text: "We are experiencing technical difficulties. Please try again later." } },
        { Hangup: {} },
    ])
})

// Status callback
app.post("/status", (req, res) => {
    console.log(`Call ${req.body.callId} status: ${req.body.callStatus}`)
    res.sendStatus(200)
})

app.listen(3000, () => console.log("Webhook server on port 3000"))
```

## Safety Rules

1. **Rate-limit webhooks** — FreeClimb retries on failure; use middleware to prevent duplicate processing
2. **Validate DTMF input** — never trust `digits` without checking expected values
3. **Always set `voiceFallbackUrl`** — gracefully handle server errors
4. **Log all requests** — webhook debugging is hard without logs
5. **Use HTTPS** — FreeClimb requires HTTPS for production webhook URLs
6. **Never expose credentials** — use environment variables for account ID and API key

## Reference Files

| Reference                                | Contents                                     |
| ---------------------------------------- | -------------------------------------------- |
| `references/ivr-patterns.md`             | IVR menus, multi-level routing, speech menus |
| `references/call-center-patterns.md`     | Queue routing, agent management, transfers   |
| `references/recording-transcription.md`  | Voicemail, call recording, transcription     |
| `references/outbound-patterns.md`        | Click-to-call, reminders, campaigns          |
| `references/webhook-server-templates.md` | Express.js and Next.js server templates      |
