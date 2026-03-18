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

## What is PerCL?

PerCL (Performance Command Language) is FreeClimb's JSON scripting language for controlling live phone calls. Your webhook server receives HTTP POST requests from FreeClimb and responds with a JSON array of PerCL commands.

```json
[
    { "Say": { "text": "Welcome to our service." } },
    { "Pause": { "length": 500 } },
    {
        "GetDigits": {
            "actionUrl": "https://example.com/menu",
            "prompts": [{ "Say": { "text": "Press 1 for sales, 2 for support." } }],
            "maxDigits": 1,
            "minDigits": 1,
            "flushBuffer": true
        }
    }
]
```

## Execution Model

- Commands execute **sequentially** from first to last
- The call **auto-hangs-up** when the array is exhausted (unless redirected)
- `Redirect` sends execution to a new URL, enabling multi-step flows
- `GetDigits` and `GetSpeech` pause execution waiting for input, then POST results to `actionUrl`
- Nested commands (like `prompts` inside `GetDigits`) execute inline

## Quick Reference — All 24 Commands

### Call Control (12)

| Command          | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `Say`            | Text-to-speech (standard, neural, or ElevenLabs engines) |
| `Play`           | Play an audio file from URL                              |
| `PlayEarlyMedia` | Play audio before call connects                          |
| `Pause`          | Pause execution (milliseconds)                           |
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

## Top 5 Commands — Full Examples

### Say

```json
{
    "Say": {
        "text": "Hello, thank you for calling.",
        "language": "en-US",
        "loop": 1,
        "privacyMode": false
    }
}
```

Supports SSML: `"text": "<speak><prosody rate='slow'>Welcome</prosody></speak>"`

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

FreeClimb POSTs `digits` field to `actionUrl`.

### Play

```json
{
    "Play": {
        "file": "https://example.com/audio/greeting.wav",
        "loop": 1,
        "privacyMode": false
    }
}
```

### Redirect

```json
{
    "Redirect": {
        "actionUrl": "https://example.com/next-step"
    }
}
```

### Hangup

```json
{
    "Hangup": {
        "reason": "Call complete"
    }
}
```

## Safety Rules

1. **Never hardcode credentials** in PerCL responses — use environment variables
2. **Validate DTMF input** — check `digits` value before acting on it
3. **Use `privacyMode: true`** for sensitive data (account numbers, SSN, payment info)
4. **Always provide fallback** — handle empty/invalid input with retry or default action
5. **Set reasonable timeouts** — `digitTimeoutMs` and `initialTimeoutMs` prevent hung calls

## Progressive Disclosure

For full command schemas and advanced patterns, see the reference files:

| Reference                             | Contents                                     |
| ------------------------------------- | -------------------------------------------- |
| `references/commands-call-control.md` | Full schema for all 12 call control commands |
| `references/commands-recording.md`    | Recording and transcription commands         |
| `references/commands-conference.md`   | All 7 conference management commands         |
| `references/percl-patterns.md`        | Composable snippets for common call flows    |
