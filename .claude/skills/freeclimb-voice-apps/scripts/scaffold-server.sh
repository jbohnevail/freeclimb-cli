#!/usr/bin/env bash
# Generates a minimal FreeClimb webhook server project.
# Usage: bash .claude/skills/freeclimb-voice-apps/scripts/scaffold-server.sh <project-name>
# Creates: <project-name>/package.json, tsconfig.json, src/server.ts, .env.example

set -euo pipefail

PROJECT_DIR="${1:?Usage: scaffold-server.sh <project-name>}"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

if [ -d "$PROJECT_DIR" ]; then
    echo "ERROR: Directory '$PROJECT_DIR' already exists."
    exit 1
fi

echo "Scaffolding FreeClimb webhook server: $PROJECT_DIR"

mkdir -p "$PROJECT_DIR/src"

# package.json
cat > "$PROJECT_DIR/package.json" <<PACKAGE_EOF
{
    "name": "$PROJECT_NAME",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "tsx watch src/server.ts",
        "build": "tsc",
        "start": "node dist/server.js"
    },
    "dependencies": {
        "express": "^4.21.0"
    },
    "devDependencies": {
        "@types/express": "^5.0.0",
        "@types/node": "^22.0.0",
        "tsx": "^4.19.0",
        "typescript": "^5.7.0"
    }
}
PACKAGE_EOF

# tsconfig.json
cat > "$PROJECT_DIR/tsconfig.json" << 'TSCONFIG_EOF'
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "outDir": "dist",
        "rootDir": "src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
    },
    "include": ["src"]
}
TSCONFIG_EOF

# .env.example
cat > "$PROJECT_DIR/.env.example" << 'ENV_EOF'
# FreeClimb credentials
FREECLIMB_ACCOUNT_ID=AC...
FREECLIMB_API_KEY=...

# Server config
PORT=3000
BASE_URL=https://your-ngrok-url.ngrok.io
ENV_EOF

# src/server.ts
cat > "$PROJECT_DIR/src/server.ts" << 'SERVER_EOF'
import express from "express"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT ?? 3000

// Inbound call handler — FreeClimb POSTs here when a call arrives
app.post("/voice", (req, res) => {
    console.log(`Inbound call from ${req.body.from} to ${req.body.to}`)
    res.json([
        { Say: { text: "Welcome! This is your FreeClimb application." } },
        { Hangup: {} },
    ])
})

// Fallback handler — called on 5xx/timeout from voiceUrl
app.post("/fallback", (req, res) => {
    console.error(`Fallback triggered for call ${req.body.callId}`)
    res.json([
        { Say: { text: "We are experiencing technical difficulties. Please try again later." } },
        { Hangup: {} },
    ])
})

// Status callback — called on every call status change
app.post("/status", (req, res) => {
    console.log(`Call ${req.body.callId} → ${req.body.callStatus}`)
    res.sendStatus(200)
})

app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`)
    console.log(`Configure your FreeClimb application voiceUrl to: <your-base-url>/voice`)
})
SERVER_EOF

echo ""
echo "Created $PROJECT_DIR/"
echo "  package.json"
echo "  tsconfig.json"
echo "  .env.example"
echo "  src/server.ts"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_DIR"
echo "  npm install"
echo "  npm run dev"
echo "  # In another terminal: ngrok http 3000"
