# PerCL Recording & Transcription Commands

## RecordUtterance

Record the caller's speech until silence, a key press, or max length.

```json
{
    "RecordUtterance": {
        "actionUrl": "string (required) — URL to POST recording info to",
        "silenceTimeoutMs": "number — ms of silence to stop recording (default: 3000)",
        "finishOnKey": "string — DTMF key to stop recording (default: any key)",
        "maxLengthSec": "number — max recording length in seconds (default: 60)",
        "playBeep": "boolean — play beep before recording starts (default: true)",
        "autoStart": "boolean — start recording immediately (default: false)",
        "privacyMode": "boolean — if true, recording URL not logged"
    }
}
```

**Callback POST body** to `actionUrl`:

```json
{
    "accountId": "AC...",
    "callId": "CA...",
    "recordingId": "RE...",
    "recordingUrl": "https://api.freeclimb.com/.../Recordings/RE.../Download",
    "recordingSize": 24000,
    "recordingDurationSec": 5,
    "termReason": "finishKey"
}
```

**`termReason` values:** `"finishKey"`, `"timeout"`, `"hangup"`, `"maxLength"`

### Voicemail Example

```json
[
    { "Say": { "text": "Please leave a message after the beep." } },
    {
        "RecordUtterance": {
            "actionUrl": "https://example.com/voicemail-saved",
            "silenceTimeoutMs": 5000,
            "maxLengthSec": 120,
            "finishOnKey": "#",
            "playBeep": true
        }
    }
]
```

## StartRecordCall

Record the entire call (both caller and callee audio).

```json
{ "StartRecordCall": {} }
```

No parameters required. Starts recording immediately. Recording continues until the call ends. Access the recording via the `recordings:list` CLI command or API.

### Usage Notes

- Call recording records both sides of the conversation
- Only one call recording can be active at a time per call
- The recording is available after the call ends
- **Legal notice:** Many jurisdictions require consent for call recording. Comply with local laws.

### Record-and-announce Example

```json
[
    { "Say": { "text": "This call may be recorded for quality assurance." } },
    { "StartRecordCall": {} },
    { "Say": { "text": "Thank you. How can I help you today?" } }
]
```

## TranscribeUtterance

Record and transcribe the caller's speech.

```json
{
    "TranscribeUtterance": {
        "actionUrl": "string (required) — URL to POST transcription results",
        "playBeep": "boolean — play beep before recording (default: true)",
        "record": {
            "silenceTimeoutMs": "number — ms of silence to stop (default: 3000)",
            "maxLengthSec": "number — max recording length (default: 60)",
            "finishOnKey": "string — key to stop recording"
        },
        "prompts": "array — PerCL commands to play before recording (Say, Play, Pause)",
        "privacyMode": "boolean"
    }
}
```

**Callback POST body** to `actionUrl`:

```json
{
    "accountId": "AC...",
    "callId": "CA...",
    "recordingId": "RE...",
    "recordingUrl": "https://...",
    "transcription": "I'd like to schedule an appointment for next Tuesday.",
    "transcriptionStatus": "complete",
    "confidence": 0.92
}
```

**`transcriptionStatus` values:** `"complete"`, `"failed"`, `"partial"`

### Transcription Example

```json
[
    {
        "TranscribeUtterance": {
            "actionUrl": "https://example.com/handle-transcription",
            "prompts": [{ "Say": { "text": "Please describe the issue you're experiencing." } }],
            "record": {
                "silenceTimeoutMs": 5000,
                "maxLengthSec": 30
            }
        }
    }
]
```

## Privacy & PCI Compliance

- Use `privacyMode: true` on any recording that may contain sensitive data (credit card numbers, SSN, account numbers)
- With `privacyMode`, the recording URL is not included in logs or webhooks
- For PCI compliance, pause recording before collecting payment info, or use `privacyMode`
- Recordings are stored securely and accessible only via authenticated API calls
