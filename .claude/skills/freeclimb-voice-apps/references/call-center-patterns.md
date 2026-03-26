# Call Center Patterns

## Queue-Based Routing

### Enqueue Callers with Hold Music

```typescript
import express from "express"
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Caller hits IVR, selects support → enqueue
app.post("/enqueue-support", (req, res) => {
    res.json([
        { Say: { text: "Please hold while we connect you with a support agent." } },
        {
            Enqueue: {
                queueId: process.env.SUPPORT_QUEUE_ID!,
                waitUrl: `${process.env.BASE_URL}/hold-music`,
                actionUrl: `${process.env.BASE_URL}/dequeued`,
            },
        },
    ])
})

// Hold music while waiting in queue
app.post("/hold-music", (req, res) => {
    res.json([
        {
            Say: {
                text: "All agents are currently assisting other callers. Your call is important to us.",
            },
        },
        { Play: { file: `${process.env.BASE_URL}/static/hold-music.mp3`, loop: 3 } },
        { Say: { text: "Thank you for your patience. An agent will be with you shortly." } },
        { Redirect: { actionUrl: `${process.env.BASE_URL}/hold-music` } },
    ])
})

// Called when caller is dequeued (connected to agent)
app.post("/dequeued", (req, res) => {
    console.log(`Caller ${req.body.callId} dequeued`)
    res.json([{ Say: { text: "You are now connected." } }])
})
```

### Agent Login/Logout

```typescript
// Track available agents in memory (use Redis in production)
const availableAgents = new Set<string>()

// Agent logs in by calling a dedicated number
app.post("/agent-login", (req, res) => {
    const agentNumber = req.body.from
    availableAgents.add(agentNumber)
    console.log(`Agent ${agentNumber} logged in. Available: ${availableAgents.size}`)
    res.json([
        {
            Say: {
                text: `You are now logged in. There are ${availableAgents.size} agents available.`,
            },
        },
        { Hangup: {} },
    ])
})

// Agent logs out
app.post("/agent-logout", (req, res) => {
    availableAgents.delete(req.body.from)
    res.json([{ Say: { text: "You are now logged out. Goodbye." } }, { Hangup: {} }])
})

// Agent takes next call from queue
app.post("/agent-ready", (req, res) => {
    res.json([{ Say: { text: "Connecting you to the next caller." } }, { Dequeue: {} }])
})
```

### Skills-Based Routing (Multiple Queues)

```typescript
app.post("/route-by-skill", (req, res) => {
    const { digits } = req.body

    const queueMap: Record<string, string> = {
        "1": process.env.SALES_QUEUE_ID!,
        "2": process.env.TECH_SUPPORT_QUEUE_ID!,
        "3": process.env.BILLING_QUEUE_ID!,
    }

    const queueId = queueMap[digits]
    if (!queueId) {
        res.json([
            { Say: { text: "Invalid selection." } },
            { Redirect: { actionUrl: `${process.env.BASE_URL}/main-menu` } },
        ])
        return
    }

    res.json([
        { Say: { text: "Please hold." } },
        {
            Enqueue: {
                queueId,
                waitUrl: `${process.env.BASE_URL}/hold-music`,
                actionUrl: `${process.env.BASE_URL}/dequeued`,
            },
        },
    ])
})
```

## Warm Transfer (Conference-Based)

Connect caller to agent, then transfer to specialist without dropping:

```typescript
// Step 1: Agent initiates transfer — create conference
app.post("/initiate-transfer", (req, res) => {
    res.json([
        {
            CreateConference: {
                actionUrl: `${process.env.BASE_URL}/conference-status`,
                alias: `transfer-${Date.now()}`,
                playBeep: "never",
                statusCallbackUrl: `${process.env.BASE_URL}/conference-events`,
            },
        },
    ])
})

// Step 2: Conference created — add the caller
app.post("/conference-status", (req, res) => {
    const { conferenceId, callId } = req.body
    // Store mapping of conferenceId → participants
    res.json([{ AddToConference: { conferenceId, callId, talk: true, listen: true } }])
})

// Step 3: Dial the transfer target
app.post("/dial-specialist", (req, res) => {
    const { conferenceId } = req.body
    res.json([
        {
            OutDial: {
                destination: process.env.SPECIALIST_NUMBER!,
                callingNumber: req.body.to,
                actionUrl: `${process.env.BASE_URL}/outdial-status`,
                callConnectUrl: `${process.env.BASE_URL}/specialist-joined?confId=${conferenceId}`,
                timeout: 30,
            },
        },
    ])
})

// Step 4: Specialist answers — add to conference
app.post("/specialist-joined", (req, res) => {
    const conferenceId = req.query.confId as string
    res.json([
        {
            AddToConference: {
                conferenceId,
                callId: req.body.callId,
                talk: true,
                listen: true,
            },
        },
    ])
})

// Step 5: Original agent can now drop out
// (Agent presses * or their app calls RemoveFromConference via API)
```

## Silent Monitoring

Supervisor listens to agent-caller conversation without being heard:

```typescript
app.post("/monitor-call", (req, res) => {
    const conferenceId = req.query.confId as string
    res.json([
        {
            AddToConference: {
                conferenceId,
                callId: req.body.callId,
                talk: false, // Can't speak
                listen: true, // Can hear
                startConfOnEnter: false, // Don't announce entry
            },
        },
    ])
})

// Supervisor can switch to "whisper" mode (talk to agent only)
// by updating via API: SetTalk + routing audio
```

## Wrap-Up via statusCallbackUrl

```typescript
app.post("/call-status", (req, res) => {
    const { callId, callStatus, callDurationSec } = req.body

    if (callStatus === "completed") {
        // Log call metrics
        console.log(`Call ${callId} completed. Duration: ${callDurationSec}s`)

        // Trigger wrap-up workflow
        // - Update CRM
        // - Send follow-up email
        // - Mark agent as available
    }

    res.sendStatus(200)
})
```

## Complete Call Center Server

```typescript
import express from "express"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const BASE = process.env.BASE_URL!

app.post("/voice", (req, res) => {
    res.json([
        { Say: { text: "Thank you for calling Acme Support." } },
        {
            GetDigits: {
                actionUrl: `${BASE}/route`,
                prompts: [
                    {
                        Say: {
                            text: "Press 1 for technical support. Press 2 for billing. Press 0 for an operator.",
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

app.post("/route", (req, res) => {
    const queues: Record<string, string> = {
        "1": process.env.TECH_QUEUE_ID!,
        "2": process.env.BILLING_QUEUE_ID!,
    }

    if (req.body.digits === "0") {
        res.json([
            {
                OutDial: {
                    destination: process.env.OPERATOR_NUMBER!,
                    callingNumber: req.body.to,
                    actionUrl: `${BASE}/call-ended`,
                    callConnectUrl: `${BASE}/connected`,
                    timeout: 30,
                },
            },
        ])
        return
    }

    const queueId = queues[req.body.digits]
    if (!queueId) {
        res.json([
            { Say: { text: "Invalid selection." } },
            { Redirect: { actionUrl: `${BASE}/voice` } },
        ])
        return
    }

    res.json([
        { Say: { text: "Please hold." } },
        {
            Enqueue: {
                queueId,
                waitUrl: `${BASE}/hold`,
                actionUrl: `${BASE}/dequeued`,
            },
        },
    ])
})

app.post("/hold", (_req, res) => {
    res.json([
        { Say: { text: "Please continue to hold." } },
        { Play: { file: `${BASE}/static/hold.mp3`, loop: 2 } },
        { Redirect: { actionUrl: `${BASE}/hold` } },
    ])
})

app.post("/dequeued", (_req, res) => {
    res.json([{ Say: { text: "You are now connected." } }])
})

app.post("/connected", (_req, res) => {
    res.json([{ Say: { text: "Caller connected." } }])
})

app.post("/call-ended", (_req, res) => {
    res.json([{ Hangup: {} }])
})

app.listen(3000, () => console.log("Call center server on port 3000"))
```
