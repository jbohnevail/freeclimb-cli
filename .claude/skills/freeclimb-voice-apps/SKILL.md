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

The pattern works with any HTTP framework — you just return a JSON array from a POST handler. The examples below use Express.js but Fastify, Hono, Next.js API routes, etc. all work identically.

### The 4 Key URLs

| URL                 | Purpose                               | Set on                 |
| ------------------- | ------------------------------------- | ---------------------- |
| `voiceUrl`          | Called when an inbound call arrives   | Application            |
| `voiceFallbackUrl`  | Called if `voiceUrl` fails            | Application            |
| `callConnectUrl`    | Called when an OutDial callee answers | OutDial command        |
| `statusCallbackUrl` | Called on call status changes         | Application or command |

## Gotchas

These will burn you in production:

1. **FreeClimb retries failed webhooks — your handler MUST be idempotent** — or you'll process calls twice. Use `callId` as a deduplication key.
2. **Response must be `Content-Type: application/json`** — forgetting this returns HTML error pages that FreeClimb can't parse, hanging the call silently.
3. **`voiceFallbackUrl` is only called on 5xx/timeout, NOT on invalid PerCL** — bad JSON silently drops the call. Validate your PerCL output.
4. **ngrok free tier URLs change every restart** — update your application config each time or use a stable subdomain.
5. **`req.body` is empty if you forget `express.json()` middleware** — your PerCL handlers then fail silently with undefined fields.
6. **`statusCallbackUrl` fires for EVERY status change** (queued→ringing→inProgress→completed) — filter by `callStatus` or you'll flood your logs.
7. **`dateCreated` is UTC** — business hours logic must account for timezone conversion.
8. **Webhook timeout is ~5 seconds** — if your handler does slow work (DB queries, external APIs), the call hangs. Return PerCL fast, do async work separately.

## Setup

If `.claude/skills/freeclimb-voice-apps/config.json` exists, use its values for base URL, phone number, and application ID. If it doesn't exist, ask the user for:

- **Base URL** — ngrok URL or production domain
- **FreeClimb phone number** — E.164 format
- **Application ID** — starts with `AP`

Save to `.claude/skills/freeclimb-voice-apps/config.json`:

```json
{
    "baseUrl": "https://abc123.ngrok.io",
    "freeclimbNumber": "+15551234567",
    "applicationId": "AP..."
}
```

## Development Workflow

### 1. Scaffold a webhook server

```bash
bash .claude/skills/freeclimb-voice-apps/scripts/scaffold-server.sh my-ivr
```

Creates: `package.json`, `tsconfig.json`, `src/server.ts`, `.env.example`. Or see `references/webhook-server-templates.md` for copy-paste templates.

### 2. Expose locally with ngrok

```bash
ngrok http 3000
# Copy the HTTPS URL
```

### 3. Provision via CLI

```bash
freeclimb applications:create --alias "My IVR" --voiceUrl "https://abc123.ngrok.io/voice" --dry-run
freeclimb applications:create --alias "My IVR" --voiceUrl "https://abc123.ngrok.io/voice"

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
    "requestType": "inboundCall"
}
```

**`requestType` values:** `inboundCall`, `outboundCall`, `getDigits` (includes `digits`), `getSpeech` (includes `recognitionResult`), `record` (includes `recordingId`, `recordingUrl`), `conferenceStatus`, `queueWait`, `machineDetected`

## Reference Files

| Reference                                | Contents                                     |
| ---------------------------------------- | -------------------------------------------- |
| `references/ivr-patterns.md`             | IVR menus, multi-level routing, speech menus |
| `references/call-center-patterns.md`     | Queue routing, agent management, transfers   |
| `references/recording-transcription.md`  | Voicemail, call recording, transcription     |
| `references/outbound-patterns.md`        | Click-to-call, reminders, campaigns          |
| `references/webhook-server-templates.md` | Express.js and Next.js server templates      |
