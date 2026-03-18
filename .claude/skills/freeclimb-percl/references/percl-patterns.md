# PerCL Composable Patterns

Reusable PerCL snippets for common call flow scenarios.

## Greeting + Menu

```json
[
    { "Say": { "text": "Thank you for calling Acme Corp." } },
    { "Pause": { "length": 500 } },
    {
        "GetDigits": {
            "actionUrl": "https://example.com/menu-handler",
            "prompts": [
                {
                    "Say": {
                        "text": "Press 1 for sales. Press 2 for support. Press 0 for an operator."
                    }
                }
            ],
            "maxDigits": 1,
            "minDigits": 1,
            "initialTimeoutMs": 8000,
            "digitTimeoutMs": 5000,
            "flushBuffer": true
        }
    }
]
```

## Digit Collection + Validation

Collect a value, then validate server-side and retry on failure:

**Initial prompt:**

```json
[
    {
        "GetDigits": {
            "actionUrl": "https://example.com/validate-account",
            "prompts": [
                {
                    "Say": {
                        "text": "Please enter your 6-digit account number followed by the pound sign."
                    }
                }
            ],
            "maxDigits": 6,
            "minDigits": 6,
            "finishOnKey": "#",
            "privacyMode": true,
            "initialTimeoutMs": 10000
        }
    }
]
```

**Validation handler (retry on invalid):**

```json
[
    { "Say": { "text": "The account number you entered was not found." } },
    {
        "GetDigits": {
            "actionUrl": "https://example.com/validate-account",
            "prompts": [
                { "Say": { "text": "Please try again. Enter your 6-digit account number." } }
            ],
            "maxDigits": 6,
            "minDigits": 6,
            "finishOnKey": "#",
            "privacyMode": true
        }
    }
]
```

## Transfer to Agent

```json
[
    { "Say": { "text": "Transferring you to an agent. Please hold." } },
    {
        "OutDial": {
            "destination": "+15559876543",
            "callingNumber": "+15551234567",
            "actionUrl": "https://example.com/transfer-status",
            "callConnectUrl": "https://example.com/agent-connected",
            "ifMachine": "redirect",
            "ifMachineUrl": "https://example.com/voicemail-fallback",
            "timeout": 30
        }
    }
]
```

## Hold Music Loop

Return from a `waitUrl` endpoint (for conferences or queues):

```json
[
    { "Say": { "text": "Your call is important to us. Please continue to hold." } },
    { "Play": { "file": "https://example.com/hold-music.mp3", "loop": 3 } },
    { "Say": { "text": "Thank you for your patience. An agent will be with you shortly." } },
    { "Redirect": { "actionUrl": "https://example.com/hold-music" } }
]
```

The `Redirect` at the end creates an infinite loop of hold music with periodic messages.

## Voicemail Recording

```json
[
    {
        "Say": {
            "text": "You've reached the voicemail of John Smith. Please leave a message after the beep. Press pound when finished."
        }
    },
    {
        "RecordUtterance": {
            "actionUrl": "https://example.com/save-voicemail",
            "silenceTimeoutMs": 5000,
            "maxLengthSec": 120,
            "finishOnKey": "#",
            "playBeep": true
        }
    }
]
```

## SSML Examples

### Emphasis and Prosody

```json
{
    "Say": {
        "text": "<speak>Your order number is <say-as interpret-as='digits'>12345</say-as>. <break time='500ms'/> <emphasis level='strong'>Please write this down.</emphasis></speak>"
    }
}
```

### Spelling Out Text

```json
{
    "Say": {
        "text": "<speak>Your confirmation code is <say-as interpret-as='characters'>ABCD</say-as>.</speak>"
    }
}
```

### Phone Number Reading

```json
{
    "Say": {
        "text": "<speak>Call us at <say-as interpret-as='telephone'>+15551234567</say-as>.</speak>"
    }
}
```

## Multi-Language Say

```json
[
    { "Say": { "text": "Thank you for calling.", "language": "en-US" } },
    { "Pause": { "length": 500 } },
    { "Say": { "text": "Gracias por llamar.", "language": "es-MX" } },
    { "Pause": { "length": 500 } },
    { "Say": { "text": "Merci d'avoir appelé.", "language": "fr-FR" } }
]
```

## Error Handling Pattern

When `GetDigits` returns empty digits (timeout/no input), redirect to retry with a limit:

```json
[
    { "Say": { "text": "We didn't receive any input." } },
    { "Redirect": { "actionUrl": "https://example.com/menu?attempt=2" } }
]
```

Server-side, check the `attempt` query param and hang up after 3 tries:

```json
[
    { "Say": { "text": "We're sorry, we didn't receive a valid response. Goodbye." } },
    { "Hangup": {} }
]
```

## Conditional Routing (Server-Side)

PerCL itself has no conditionals — all branching is done server-side. Pattern:

1. `GetDigits` → `actionUrl`
2. Server reads `digits` from POST body
3. Server returns different PerCL arrays based on value:

```typescript
// Express handler
app.post("/menu-handler", (req, res) => {
    const { digits } = req.body
    switch (digits) {
        case "1":
            res.json([{ Redirect: { actionUrl: "/sales" } }])
            break
        case "2":
            res.json([{ Redirect: { actionUrl: "/support" } }])
            break
        default:
            res.json([
                { Say: { text: "Invalid selection." } },
                { Redirect: { actionUrl: "/main-menu" } },
            ])
    }
})
```
