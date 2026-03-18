# Outbound Calling Patterns

## Click-to-Call

Connect a web user to a phone number via API-initiated call:

```typescript
import express from "express"
import axios from "axios"

const app = express()
app.use(express.json())

const BASE = process.env.BASE_URL!
const FC_ACCOUNT_ID = process.env.FREECLIMB_ACCOUNT_ID!
const FC_API_KEY = process.env.FREECLIMB_API_KEY!

// Web endpoint: user clicks "Call Me" button
app.post("/api/click-to-call", async (req, res) => {
    const { userPhone, agentPhone } = req.body

    // Step 1: Call the user first
    const response = await axios.post(
        `https://www.freeclimb.com/apiserver/Accounts/${FC_ACCOUNT_ID}/Calls`,
        {
            to: userPhone,
            from: process.env.FREECLIMB_NUMBER,
            applicationId: process.env.APP_ID,
            // FreeClimb will POST to the app's voiceUrl when user answers
        },
        { auth: { username: FC_ACCOUNT_ID, password: FC_API_KEY } },
    )

    res.json({ callId: response.data.callId, status: "calling" })
})

// When user answers, connect them to the agent
app.post("/voice", (req, res) => {
    res.json([
        { Say: { text: "Please hold while we connect you." } },
        {
            OutDial: {
                destination: process.env.AGENT_PHONE!,
                callingNumber: req.body.to,
                actionUrl: `${BASE}/call-ended`,
                callConnectUrl: `${BASE}/connected`,
                timeout: 30,
            },
        },
    ])
})

app.post("/connected", (_req, res) => {
    res.json([{ Say: { text: "You are now connected." } }])
})

app.post("/call-ended", (_req, res) => {
    res.json([{ Hangup: {} }])
})
```

**CLI equivalent:**

```bash
# Initiate an outbound call
freeclimb calls:make +15551234567 +15559876543 AP... --dry-run
freeclimb calls:make +15551234567 +15559876543 AP...
```

## Appointment Reminders

Batch-call patients/customers with an automated reminder:

```typescript
interface Appointment {
    phone: string
    name: string
    date: string
    time: string
}

async function sendReminders(appointments: Appointment[]) {
    for (const appt of appointments) {
        await axios.post(
            `https://www.freeclimb.com/apiserver/Accounts/${FC_ACCOUNT_ID}/Calls`,
            {
                to: appt.phone,
                from: process.env.FREECLIMB_NUMBER,
                applicationId: process.env.REMINDER_APP_ID,
            },
            { auth: { username: FC_ACCOUNT_ID, password: FC_API_KEY } },
        )
        // Stagger calls to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000))
    }
}

// Webhook: when the patient answers
app.post("/reminder-voice", (req, res) => {
    // Look up appointment by the dialed number
    const appointment = lookupAppointment(req.body.to)

    res.json([
        {
            Say: {
                text: `Hello ${appointment.name}. This is a reminder of your appointment on ${appointment.date} at ${appointment.time}.`,
            },
        },
        {
            GetDigits: {
                actionUrl: `${BASE}/reminder-response`,
                prompts: [
                    {
                        Say: {
                            text: "Press 1 to confirm. Press 2 to cancel. Press 3 to reschedule.",
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

app.post("/reminder-response", (req, res) => {
    switch (req.body.digits) {
        case "1":
            res.json([{ Say: { text: "Your appointment is confirmed. Goodbye." } }, { Hangup: {} }])
            break
        case "2":
            // Cancel in your system
            res.json([
                { Say: { text: "Your appointment has been cancelled. Goodbye." } },
                { Hangup: {} },
            ])
            break
        case "3":
            // Transfer to scheduling
            res.json([
                { Say: { text: "Transferring you to our scheduling department." } },
                {
                    OutDial: {
                        destination: process.env.SCHEDULING_NUMBER!,
                        callingNumber: req.body.to,
                        actionUrl: `${BASE}/call-ended`,
                        callConnectUrl: `${BASE}/connected`,
                        timeout: 30,
                    },
                },
            ])
            break
        default:
            res.json([
                { Say: { text: "Invalid selection." } },
                { Redirect: { actionUrl: `${BASE}/reminder-voice` } },
            ])
    }
})
```

## Outbound Campaign (Batch Calling)

```typescript
interface CampaignContact {
    phone: string
    customData: Record<string, string>
}

async function runCampaign(contacts: CampaignContact[], concurrency = 5) {
    const batches: CampaignContact[][] = []
    for (let i = 0; i < contacts.length; i += concurrency) {
        batches.push(contacts.slice(i, i + concurrency))
    }

    for (const batch of batches) {
        await Promise.all(
            batch.map((contact) =>
                axios
                    .post(
                        `https://www.freeclimb.com/apiserver/Accounts/${FC_ACCOUNT_ID}/Calls`,
                        {
                            to: contact.phone,
                            from: process.env.FREECLIMB_NUMBER,
                            applicationId: process.env.CAMPAIGN_APP_ID,
                        },
                        { auth: { username: FC_ACCOUNT_ID, password: FC_API_KEY } },
                    )
                    .catch((err) => console.error(`Failed to call ${contact.phone}:`, err.message)),
            ),
        )
        // Rate limit between batches
        await new Promise((resolve) => setTimeout(resolve, 2000))
    }
}
```

## Answering Machine Detection

Use `ifMachine` on `OutDial` or when making calls:

```typescript
app.post("/outbound-voice", (req, res) => {
    res.json([
        {
            OutDial: {
                destination: req.body.targetNumber,
                callingNumber: process.env.FREECLIMB_NUMBER!,
                actionUrl: `${BASE}/outdial-status`,
                callConnectUrl: `${BASE}/human-answered`,
                ifMachine: "redirect",
                ifMachineUrl: `${BASE}/machine-detected`,
                timeout: 25,
            },
        },
    ])
})

// Human answered — deliver message
app.post("/human-answered", (req, res) => {
    res.json([
        { Say: { text: "Hello, this is an important message from Acme Corp." } },
        {
            GetDigits: {
                actionUrl: `${BASE}/response`,
                prompts: [
                    {
                        Say: {
                            text: "Press 1 to hear more, or press 2 to be removed from our list.",
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

// Answering machine — leave voicemail
app.post("/machine-detected", (req, res) => {
    res.json([
        { Pause: { length: 2000 } }, // Wait for beep
        {
            Say: {
                text: "Hello, this is Acme Corp. Please call us back at 1-800-555-1234. Thank you.",
            },
        },
        { Hangup: {} },
    ])
})
```

## CLI Commands for Outbound Calls

```bash
# Make a single outbound call
freeclimb calls:make +15559876543 +15551234567 AP... --dry-run
freeclimb calls:make +15559876543 +15551234567 AP...

# Check call status
freeclimb calls:get CA... --fields callId,status,duration --json

# List recent outbound calls
freeclimb calls:list --fields callId,status,to,dateCreated --json
```
