---
name: freeclimb-percl
description: >
    FreeClimb PerCL (Performance Command Language) reference for building call flows.
    Use when: generating PerCL commands, building call scripts, working with TTS/DTMF/speech
    recognition, call recording commands, queue commands, conference commands, or any
    voice call flow logic. Also use when: the user mentions PerCL, call scripting, voice
    commands, call flow, IVR logic, or needs to return JSON commands from a webhook.
    Do NOT use for: CLI usage (use freeclimb-cli), webhook server setup (use freeclimb-voice-apps),
    or CLI development (use freeclimb-cli-dev).
---

# FreeClimb PerCL Reference

## Mental Model

PerCL is a **sequential instruction tape** — no conditionals, no loops, no variables. FreeClimb reads your JSON array top to bottom and executes each command in order. When the tape ends, the call hangs up.

All branching happens **server-side**: commands like `GetDigits` and `GetSpeech` POST user input to your `actionUrl`, and your server returns a new tape. `Redirect` sends execution to a new URL unconditionally. Your webhook server is the state machine; PerCL is just the output.

```
Caller → FreeClimb → POST voiceUrl → Your Server → [PerCL tape] → FreeClimb executes → (repeat via actionUrl/Redirect)
```

## Gotchas

These are the non-obvious footguns that will cost you debugging time:

1. **`GetDigits` with no `actionUrl` silently drops input** — the digits are collected and thrown away. Always set `actionUrl`.
2. **`Redirect` to a URL that returns non-200 hangs the call** — FreeClimb retries, then the call sits in limbo. Ensure your redirect targets are healthy.
3. **`OutDial` without `callConnectUrl` means you can't control the connected call** — you'll hear audio but have no way to bridge, record, or conference the B-leg.
4. **`Say` with invalid SSML doesn't error — it reads the raw XML tags aloud** — the caller hears "less-than speak greater-than" literally.
5. **`Pause` takes milliseconds, not seconds** — `{ "Pause": { "length": 3 } }` is 3ms (imperceptible), not 3 seconds. Use `3000` for 3s.
6. **`Enqueue` to a full queue silently drops the caller** — always handle queue overflow with a fallback action.
7. **`privacyMode` only prevents logging — it doesn't encrypt** — PCI compliance requires additional measures beyond this flag.
8. **Empty `digits` from `GetDigits` means timeout, not error** — always handle the empty-string case in your `actionUrl` handler.
9. **Commands after `Redirect`, `Hangup`, or `Reject` are never executed** — they're dead code on the tape.

## Quick Reference — All 24 Commands

### Call Control (12)

| Command          | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `Say`            | Text-to-speech (standard, neural, or ElevenLabs engines) |
| `Play`           | Play an audio file from URL                              |
| `PlayEarlyMedia` | Play audio before call connects                          |
| `Pause`          | Pause execution (milliseconds — not seconds!)            |
| `GetDigits`      | Collect DTMF keypad input                                |
| `GetSpeech`      | Speech recognition input                                 |
| `SendDigits`     | Send DTMF tones into the call                            |
| `Hangup`         | End the call                                             |
| `Reject`         | Reject an incoming call (no billing)                     |
| `Redirect`       | Send execution to a new webhook URL                      |
| `Sms`            | Send an SMS during a call                                |
| `OutDial`        | Initiate an outbound call leg                            |

### Recording & Transcription (3)

| Command               | Purpose                            |
| --------------------- | ---------------------------------- |
| `RecordUtterance`     | Record the caller's speech         |
| `StartRecordCall`     | Record the entire call (both legs) |
| `TranscribeUtterance` | Transcribe a recording             |

### Conference (7)

| Command                | Purpose                             |
| ---------------------- | ----------------------------------- |
| `CreateConference`     | Create a new conference room        |
| `AddToConference`      | Add a participant to a conference   |
| `RemoveFromConference` | Remove a participant                |
| `TerminateConference`  | End the conference                  |
| `SetListen`            | Toggle participant's listen ability |
| `SetTalk`              | Toggle participant's talk ability   |
| `SetDTMFPassThrough`   | Toggle DTMF forwarding              |

### Queue (2)

| Command   | Purpose                    |
| --------- | -------------------------- |
| `Enqueue` | Place a call into a queue  |
| `Dequeue` | Remove a call from a queue |

## Complex Commands — Full Examples

### GetDigits

```json
{
    "GetDigits": {
        "actionUrl": "https://example.com/handle-input",
        "prompts": [{ "Say": { "text": "Enter your 5-digit account number." } }],
        "maxDigits": 5,
        "minDigits": 5,
        "digitTimeoutMs": 5000,
        "initialTimeoutMs": 10000,
        "flushBuffer": true,
        "finishOnKey": "#"
    }
}
```

FreeClimb POSTs `digits` field to `actionUrl`. Empty string means timeout — handle it.

### OutDial

```json
{
    "OutDial": {
        "destination": "+15551234567",
        "callingNumber": "+15559876543",
        "callConnectUrl": "https://example.com/connected",
        "actionUrl": "https://example.com/outdial-done",
        "ifMachine": "redirect",
        "ifMachineUrl": "https://example.com/voicemail",
        "timeout": 30
    }
}
```

`callConnectUrl` fires when the B-leg answers — this is where you bridge, record, or conference. Without it, you hear audio but can't control the connected call.

## Validation Script

Validate PerCL JSON before testing against live calls:

```bash
npx tsx .claude/skills/freeclimb-percl/scripts/validate-percl.ts '[{"Say":{"text":"Hello"}},{"GetDigits":{"maxDigits":1}}]'
```

Catches: invalid command names, missing required fields, Pause in seconds instead of ms, missing `actionUrl` on input commands.

## Progressive Disclosure

For full command schemas and advanced patterns, see the reference files:

| Reference                             | Contents                                     |
| ------------------------------------- | -------------------------------------------- |
| `references/commands-call-control.md` | Full schema for all 12 call control commands |
| `references/commands-recording.md`    | Recording and transcription commands         |
| `references/commands-conference.md`   | All 7 conference management commands         |
| `references/percl-patterns.md`        | Composable snippets for common call flows    |
