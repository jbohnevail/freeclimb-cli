# Recording & Transcription Patterns

## Voicemail System

```typescript
import express from "express"
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const BASE = process.env.BASE_URL!

// After-hours or no-answer → voicemail
app.post("/voicemail", (req, res) => {
    res.json([
        {
            Say: {
                text: "You have reached the voicemail of the sales department. Please leave a message after the beep. Press pound when finished.",
            },
        },
        {
            RecordUtterance: {
                actionUrl: `${BASE}/voicemail-saved`,
                silenceTimeoutMs: 5000,
                maxLengthSec: 120,
                finishOnKey: "#",
                playBeep: true,
            },
        },
    ])
})

// Handle saved voicemail
app.post("/voicemail-saved", (req, res) => {
    const { recordingId, recordingUrl, recordingDurationSec, callId, from } = req.body

    console.log(`Voicemail from ${from}:`)
    console.log(`  Recording ID: ${recordingId}`)
    console.log(`  Duration: ${recordingDurationSec}s`)
    console.log(`  URL: ${recordingUrl}`)

    // In production: save to DB, send notification email, etc.

    res.json([{ Say: { text: "Your message has been recorded. Goodbye." } }, { Hangup: {} }])
})
```

## Voicemail with Transcription

```typescript
app.post("/voicemail-transcribed", (req, res) => {
    res.json([
        { Say: { text: "Please leave a message after the beep." } },
        {
            TranscribeUtterance: {
                actionUrl: `${BASE}/transcription-result`,
                playBeep: true,
                record: {
                    silenceTimeoutMs: 5000,
                    maxLengthSec: 60,
                    finishOnKey: "#",
                },
            },
        },
    ])
})

app.post("/transcription-result", (req, res) => {
    const { recordingId, transcription, transcriptionStatus, confidence, from } = req.body

    if (transcriptionStatus === "complete") {
        console.log(`Transcription from ${from} (confidence: ${confidence}):`)
        console.log(`  "${transcription}"`)
        // Send via email, SMS, Slack, etc.
    } else {
        console.log(`Transcription failed for recording ${recordingId}`)
    }

    res.json([{ Say: { text: "Thank you. Goodbye." } }, { Hangup: {} }])
})
```

## Call Recording (Entire Call)

Record both sides of a conversation for quality assurance:

```typescript
app.post("/voice", (req, res) => {
    res.json([
        { Say: { text: "This call may be recorded for quality and training purposes." } },
        { StartRecordCall: {} },
        { Redirect: { actionUrl: `${BASE}/main-menu` } },
    ])
})
```

### Accessing Recordings via CLI

```bash
# List all recordings
freeclimb recordings:list --fields recordingId,callId,dateCreated --json

# List recordings for a specific call
freeclimb recordings:list --callId CA... --json

# Download a recording
freeclimb api /Recordings/RE.../Download --raw > recording.wav
```

## Privacy Mode for Sensitive Data

When collecting credit card numbers or other PCI-sensitive data, use `privacyMode`:

```typescript
app.post("/collect-payment", (req, res) => {
    res.json([
        {
            GetDigits: {
                actionUrl: `${BASE}/process-card`,
                prompts: [
                    {
                        Say: {
                            text: "Please enter your 16-digit credit card number followed by the pound sign.",
                        },
                    },
                ],
                maxDigits: 16,
                minDigits: 16,
                finishOnKey: "#",
                privacyMode: true, // Digits not logged
            },
        },
    ])
})

app.post("/process-card", (req, res) => {
    const { digits } = req.body
    // digits contain the card number — handle securely
    // Never log this value

    res.json([
        {
            GetDigits: {
                actionUrl: `${BASE}/process-cvv`,
                prompts: [{ Say: { text: "Please enter your 3-digit security code." } }],
                maxDigits: 3,
                minDigits: 3,
                privacyMode: true,
            },
        },
    ])
})
```

## Recording with Consent

Some jurisdictions require two-party consent. Announce recording and offer opt-out:

```typescript
app.post("/voice", (req, res) => {
    res.json([
        { Say: { text: "This call will be recorded for quality assurance." } },
        {
            GetDigits: {
                actionUrl: `${BASE}/consent-check`,
                prompts: [
                    {
                        Say: {
                            text: "Press 1 to continue, or press 2 if you do not wish to be recorded.",
                        },
                    },
                ],
                maxDigits: 1,
                minDigits: 1,
                flushBuffer: true,
            },
        },
    ])
})

app.post("/consent-check", (req, res) => {
    if (req.body.digits === "1") {
        res.json([{ StartRecordCall: {} }, { Redirect: { actionUrl: `${BASE}/main-menu` } }])
    } else {
        // Proceed without recording
        res.json([{ Redirect: { actionUrl: `${BASE}/main-menu` } }])
    }
})
```
