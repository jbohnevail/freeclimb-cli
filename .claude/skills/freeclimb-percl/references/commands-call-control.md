# PerCL Call Control Commands — Full Reference

## Say

Text-to-speech with multiple engine support.

```json
{
    "Say": {
        "text": "string (required) — text or SSML to speak",
        "language": "string — BCP-47 language code (default: en-US)",
        "loop": "number — repeat count (default: 1, 0 = infinite)",
        "privacyMode": "boolean — if true, text is not logged (default: false)"
    }
}
```

**SSML support:**

```json
{
    "Say": {
        "text": "<speak><prosody rate='slow' pitch='low'>Important message.</prosody><break time='500ms'/><emphasis level='strong'>Please listen carefully.</emphasis></speak>"
    }
}
```

**Languages:** en-US, en-GB, en-AU, es-ES, es-MX, fr-FR, fr-CA, de-DE, it-IT, pt-BR, ja-JP, ko-KR, zh-CN, and more.

## Play

Play an audio file.

```json
{
    "Play": {
        "file": "string (required) — URL to audio file (WAV or MP3)",
        "loop": "number — repeat count (default: 1, 0 = infinite)",
        "privacyMode": "boolean — if true, URL is not logged"
    }
}
```

Audio requirements: WAV (8kHz, 16-bit, mono) or MP3. HTTPS URLs recommended.

## PlayEarlyMedia

Play audio before a call is answered (during ringing).

```json
{
    "PlayEarlyMedia": {
        "file": "string (required) — URL to audio file"
    }
}
```

Only valid in `OutDial` scenarios before the callee answers.

## Pause

Pause execution.

```json
{
    "Pause": {
        "length": "number (required) — pause duration in milliseconds"
    }
}
```

## GetDigits

Collect DTMF keypad input from the caller.

```json
{
    "GetDigits": {
        "actionUrl": "string (required) — URL to POST collected digits to",
        "prompts": "array — PerCL commands to play while waiting (Say, Play, Pause)",
        "maxDigits": "number — max digits to collect (default: unlimited)",
        "minDigits": "number — min digits required (default: 0)",
        "digitTimeoutMs": "number — ms to wait between digits (default: 5000)",
        "initialTimeoutMs": "number — ms to wait for first digit (default: 5000)",
        "flushBuffer": "boolean — clear any buffered digits first (default: false)",
        "finishOnKey": "string — key that ends collection (default: none, e.g., '#')",
        "privacyMode": "boolean — if true, digits not logged"
    }
}
```

**Callback POST body** to `actionUrl`:

```json
{
    "accountId": "AC...",
    "callId": "CA...",
    "from": "+15551234567",
    "to": "+15559876543",
    "digits": "12345",
    "requestType": "inboundCall"
}
```

If caller enters no digits or times out, `digits` will be an empty string.

## GetSpeech

Collect speech input via speech recognition.

```json
{
    "GetSpeech": {
        "actionUrl": "string (required) — URL to POST recognition result",
        "grammarFile": "string — URL to GRXML grammar file",
        "grammarType": "string — 'URL' or 'BUILTIN'",
        "grammarRule": "string — rule within grammar to use",
        "prompts": "array — PerCL commands to play while waiting",
        "noInputTimeoutMs": "number — ms to wait for speech start (default: 5000)",
        "recognitionTimeoutMs": "number — max ms for recognition (default: 15000)",
        "confidenceThreshold": "number — 0.0–1.0 minimum confidence (default: 0.5)",
        "sensitivityLevel": "number — 0.0–1.0 background noise sensitivity",
        "speechCompleteTimeoutMs": "number — ms of silence indicating speech end",
        "privacyMode": "boolean"
    }
}
```

**Callback POST body** includes `recognitionResult`, `confidence`, and `reason`.

## SendDigits

Send DTMF tones into the call (e.g., navigating an external IVR).

```json
{
    "SendDigits": {
        "digits": "string (required) — digits to send (0-9, *, #, w for 500ms pause)",
        "pauseMs": "number — ms between each digit (default: 500)"
    }
}
```

## Hangup

End the current call.

```json
{
    "Hangup": {
        "reason": "string — optional reason for logging"
    }
}
```

## Reject

Reject an incoming call without answering (no billing).

```json
{
    "Reject": {
        "reason": "string — optional reason for logging"
    }
}
```

Only valid for inbound calls that haven't been answered.

## Redirect

Send call execution to a new webhook URL.

```json
{
    "Redirect": {
        "actionUrl": "string (required) — URL to GET next PerCL commands from"
    }
}
```

Use `Redirect` to chain multi-step call flows without nesting.

## Sms

Send an SMS during an active call.

```json
{
    "Sms": {
        "to": "string (required) — destination number in E.164",
        "from": "string (required) — FreeClimb number in E.164",
        "text": "string (required) — message body",
        "notificationUrl": "string — URL for delivery status callbacks"
    }
}
```

## OutDial

Initiate an outbound call leg (e.g., connecting a caller to an agent).

```json
{
    "OutDial": {
        "destination": "string (required) — number to dial in E.164",
        "callingNumber": "string (required) — caller ID in E.164",
        "actionUrl": "string (required) — URL for call control after connect",
        "callConnectUrl": "string (required) — URL called when destination answers",
        "ifMachine": "string — 'redirect' or 'hangup' (default: none)",
        "ifMachineUrl": "string — URL if answering machine detected",
        "timeout": "number — ring timeout in seconds (default: 30)",
        "privacyMode": "boolean",
        "statusCallbackUrl": "string — URL for call status events"
    }
}
```

**`ifMachine` values:**

- `"redirect"` — POST to `ifMachineUrl` for PerCL commands
- `"hangup"` — automatically hang up
- Not set — treat machine answer same as human
