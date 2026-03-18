# IVR Patterns

## Simple Menu (GetDigits + Switch)

```typescript
import express from "express"
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Main menu
app.post("/voice", (req, res) => {
    res.json([
        { Say: { text: "Welcome to Acme Corp." } },
        {
            GetDigits: {
                actionUrl: `${process.env.BASE_URL}/menu`,
                prompts: [
                    {
                        Say: {
                            text: "Press 1 for sales. Press 2 for support. Press 3 for billing. Press 0 for the operator.",
                        },
                    },
                ],
                maxDigits: 1,
                minDigits: 1,
                initialTimeoutMs: 8000,
                flushBuffer: true,
            },
        },
    ])
})

// Menu handler
app.post("/menu", (req, res) => {
    const { digits } = req.body

    switch (digits) {
        case "1":
            res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/sales` } }])
            break
        case "2":
            res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/support` } }])
            break
        case "3":
            res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/billing` } }])
            break
        case "0":
            res.json([
                { Say: { text: "Connecting you to an operator." } },
                {
                    OutDial: {
                        destination: process.env.OPERATOR_NUMBER!,
                        callingNumber: req.body.to,
                        actionUrl: `${process.env.BASE_URL}/call-ended`,
                        callConnectUrl: `${process.env.BASE_URL}/connected`,
                        timeout: 30,
                    },
                },
            ])
            break
        default:
            res.json([
                { Say: { text: "Invalid selection." } },
                { Redirect: { actionUrl: `${process.env.BASE_URL}/voice` } },
            ])
    }
})
```

## Multi-Level Menus (Redirect Chains)

Each menu level is a separate endpoint. Use `Redirect` to chain them:

```typescript
// Level 1: Department selection
app.post("/voice", (req, res) => {
    res.json([
        {
            GetDigits: {
                actionUrl: `${process.env.BASE_URL}/dept`,
                prompts: [{ Say: { text: "Press 1 for sales. Press 2 for support." } }],
                maxDigits: 1,
                minDigits: 1,
                flushBuffer: true,
            },
        },
    ])
})

// Level 2: Support sub-menu
app.post("/support", (req, res) => {
    res.json([
        {
            GetDigits: {
                actionUrl: `${process.env.BASE_URL}/support-action`,
                prompts: [
                    {
                        Say: {
                            text: "Press 1 for technical support. Press 2 for account issues. Press 9 to return to the main menu.",
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

app.post("/support-action", (req, res) => {
    switch (req.body.digits) {
        case "1":
            res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/tech-support` } }])
            break
        case "2":
            res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/account-support` } }])
            break
        case "9":
            res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/voice` } }])
            break
        default:
            res.json([
                { Say: { text: "Invalid option." } },
                { Redirect: { actionUrl: `${process.env.BASE_URL}/support` } },
            ])
    }
})
```

## Speech-Enabled Menus (GetSpeech)

```typescript
app.post("/voice", (req, res) => {
    res.json([
        {
            GetSpeech: {
                actionUrl: `${process.env.BASE_URL}/speech-handler`,
                grammarType: "BUILTIN",
                grammarFile: "BOOLEAN",
                prompts: [
                    { Say: { text: "Would you like to speak with an agent? Say yes or no." } },
                ],
                noInputTimeoutMs: 5000,
                recognitionTimeoutMs: 10000,
            },
        },
    ])
})

app.post("/speech-handler", (req, res) => {
    const { recognitionResult, confidence } = req.body

    if (confidence < 0.5 || !recognitionResult) {
        res.json([
            { Say: { text: "I didn't catch that." } },
            { Redirect: { actionUrl: `${process.env.BASE_URL}/voice` } },
        ])
        return
    }

    if (recognitionResult.toLowerCase().includes("yes")) {
        res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/connect-agent` } }])
    } else {
        res.json([{ Say: { text: "Thank you. Goodbye." } }, { Hangup: {} }])
    }
})
```

## Input Validation with Retries

Track retry count via query parameter:

```typescript
app.post("/collect-pin", (req, res) => {
    const attempt = parseInt(req.query.attempt as string) || 1
    const MAX_ATTEMPTS = 3

    if (attempt > MAX_ATTEMPTS) {
        res.json([{ Say: { text: "Too many failed attempts. Goodbye." } }, { Hangup: {} }])
        return
    }

    const prompt =
        attempt === 1 ? "Please enter your 4-digit PIN." : "Invalid PIN. Please try again."

    res.json([
        {
            GetDigits: {
                actionUrl: `${process.env.BASE_URL}/verify-pin?attempt=${attempt}`,
                prompts: [{ Say: { text: prompt } }],
                maxDigits: 4,
                minDigits: 4,
                privacyMode: true,
                flushBuffer: true,
            },
        },
    ])
})

app.post("/verify-pin", (req, res) => {
    const attempt = parseInt(req.query.attempt as string) || 1
    const { digits } = req.body

    if (isValidPin(digits)) {
        res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/authenticated` } }])
    } else {
        res.json([
            {
                Redirect: {
                    actionUrl: `${process.env.BASE_URL}/collect-pin?attempt=${attempt + 1}`,
                },
            },
        ])
    }
})
```

## Business Hours Routing

```typescript
app.post("/voice", (req, res) => {
    const hour = new Date().getHours()
    const isBusinessHours = hour >= 9 && hour < 17
    const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5

    if (isBusinessHours && isWeekday) {
        res.json([{ Redirect: { actionUrl: `${process.env.BASE_URL}/main-menu` } }])
    } else {
        res.json([
            {
                Say: {
                    text: "Our office is currently closed. Business hours are Monday through Friday, 9 AM to 5 PM Eastern.",
                },
            },
            { Redirect: { actionUrl: `${process.env.BASE_URL}/after-hours` } },
        ])
    }
})

app.post("/after-hours", (req, res) => {
    res.json([
        {
            GetDigits: {
                actionUrl: `${process.env.BASE_URL}/after-hours-action`,
                prompts: [
                    {
                        Say: {
                            text: "Press 1 to leave a voicemail. Press 2 for our emergency line.",
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
```
