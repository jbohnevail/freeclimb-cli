# Webhook Server Templates

## Express.js (TypeScript) — Full Template

```typescript
import express, { Request, Response } from "express"
import crypto from "crypto"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || 3000
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

// Request logging middleware
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    if (req.body?.callId) {
        console.log(`  callId=${req.body.callId} from=${req.body.from} to=${req.body.to}`)
    }
    next()
})

// HMAC signature validation (optional but recommended for production)
function validateSignature(req: Request): boolean {
    const signingSecret = process.env.FREECLIMB_SIGNING_SECRET
    if (!signingSecret) return true // Skip if not configured

    const signature = req.headers["x-freeclimb-signature"] as string
    if (!signature) return false

    const body = JSON.stringify(req.body)
    const expected = crypto.createHmac("sha256", signingSecret).update(body).digest("hex")

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// Inbound call handler
app.post("/voice", (req: Request, res: Response) => {
    if (!validateSignature(req)) {
        res.status(403).json({ error: "Invalid signature" })
        return
    }

    const { from, to, direction } = req.body
    console.log(`Incoming call: ${from} → ${to} (${direction})`)

    res.json([
        { Say: { text: "Welcome. Thank you for calling." } },
        {
            GetDigits: {
                actionUrl: `${BASE_URL}/menu`,
                prompts: [{ Say: { text: "Press 1 for sales. Press 2 for support." } }],
                maxDigits: 1,
                minDigits: 1,
                initialTimeoutMs: 8000,
                flushBuffer: true,
            },
        },
    ])
})

// Menu handler
app.post("/menu", (req: Request, res: Response) => {
    const { digits } = req.body

    switch (digits) {
        case "1":
            res.json([
                { Say: { text: "Connecting you to sales." } },
                { Redirect: { actionUrl: `${BASE_URL}/sales` } },
            ])
            break
        case "2":
            res.json([
                { Say: { text: "Connecting you to support." } },
                { Redirect: { actionUrl: `${BASE_URL}/support` } },
            ])
            break
        default:
            res.json([
                { Say: { text: "Invalid selection. Please try again." } },
                { Redirect: { actionUrl: `${BASE_URL}/voice` } },
            ])
    }
})

// Fallback handler (set as voiceFallbackUrl on application)
app.post("/fallback", (_req: Request, res: Response) => {
    res.json([
        { Say: { text: "We are experiencing technical difficulties. Please try again later." } },
        { Hangup: {} },
    ])
})

// Status callback handler
app.post("/status", (req: Request, res: Response) => {
    const { callId, callStatus, callDurationSec } = req.body
    console.log(`Call ${callId}: ${callStatus} (${callDurationSec || 0}s)`)
    res.sendStatus(200)
})

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
    console.log(`FreeClimb webhook server running on port ${PORT}`)
    console.log(`Base URL: ${BASE_URL}`)
})
```

### package.json

```json
{
    "name": "freeclimb-webhook-server",
    "scripts": {
        "dev": "tsx watch src/server.ts",
        "build": "tsc",
        "start": "node dist/server.js"
    },
    "dependencies": {
        "express": "^4.18.0"
    },
    "devDependencies": {
        "@types/express": "^4.17.0",
        "tsx": "^4.0.0",
        "typescript": "^5.0.0"
    }
}
```

### tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "commonjs",
        "outDir": "dist",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
    },
    "include": ["src"]
}
```

## Next.js API Routes (for Vercel)

### `app/api/voice/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const body = await req.json()
    console.log(`Call from ${body.from} to ${body.to}`)

    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

    return NextResponse.json([
        { Say: { text: "Welcome to our service." } },
        {
            GetDigits: {
                actionUrl: `${baseUrl}/api/menu`,
                prompts: [{ Say: { text: "Press 1 for sales. Press 2 for support." } }],
                maxDigits: 1,
                minDigits: 1,
                flushBuffer: true,
            },
        },
    ])
}
```

### `app/api/menu/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const body = await req.json()
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

    switch (body.digits) {
        case "1":
            return NextResponse.json([
                { Say: { text: "Connecting to sales." } },
                { Redirect: { actionUrl: `${baseUrl}/api/sales` } },
            ])
        case "2":
            return NextResponse.json([
                { Say: { text: "Connecting to support." } },
                { Redirect: { actionUrl: `${baseUrl}/api/support` } },
            ])
        default:
            return NextResponse.json([
                { Say: { text: "Invalid selection." } },
                { Redirect: { actionUrl: `${baseUrl}/api/voice` } },
            ])
    }
}
```

### `app/api/status/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const body = await req.json()
    console.log(`Call ${body.callId}: ${body.callStatus}`)
    return NextResponse.json({ ok: true })
}
```

### `app/api/fallback/route.ts`

```typescript
import { NextResponse } from "next/server"

export async function POST() {
    return NextResponse.json([
        { Say: { text: "We are experiencing issues. Please try again later." } },
        { Hangup: {} },
    ])
}
```

## Environment Variables

```bash
# Required
FREECLIMB_ACCOUNT_ID=AC...
FREECLIMB_API_KEY=...

# Server
BASE_URL=https://your-domain.com   # or ngrok URL for dev
PORT=3000

# Optional
FREECLIMB_SIGNING_SECRET=...       # For HMAC webhook validation

# Phone numbers (used in PerCL)
FREECLIMB_NUMBER=+15551234567
OPERATOR_NUMBER=+15559876543
```

## ngrok Setup for Local Development

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, expose it
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your FreeClimb application:
freeclimb applications:update AP... --voiceUrl "https://abc123.ngrok.io/voice"
```

For stable URLs during development, use a reserved ngrok domain:

```bash
ngrok http --domain=your-name.ngrok-free.app 3000
```

## Error Handling Best Practices

```typescript
// Wrap handlers with error catching
function perclHandler(handler: (req: Request, res: Response) => void) {
    return (req: Request, res: Response) => {
        try {
            handler(req, res)
        } catch (error) {
            console.error("Handler error:", error)
            // Always return valid PerCL, even on error
            res.json([{ Say: { text: "An error occurred. Please try again." } }, { Hangup: {} }])
        }
    }
}

app.post(
    "/voice",
    perclHandler((req, res) => {
        // Your logic here
        res.json([{ Say: { text: "Hello!" } }])
    }),
)
```
