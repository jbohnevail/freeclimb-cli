/**
 * All mock data, commands, and outputs for demo compositions.
 * Values match what the actual CLI commands produce.
 */

// === Banner (matches getWelcomeBanner() in src/ui/banner.ts) ===

export const BANNER_LINES = [
    " ███████╗██████╗ ███████╗███████╗ ██████╗██╗     ██╗███╗   ███╗██████╗ ",
    " ██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝██║     ██║████╗ ████║██╔══██╗",
    " █████╗  ██████╔╝█████╗  █████╗  ██║     ██║     ██║██╔████╔██║██████╔╝",
    " ██╔══╝  ██╔══██╗██╔══╝  ██╔══╝  ██║     ██║     ██║██║╚██╔╝██║██╔══██╗",
    " ██║     ██║  ██║███████╗███████╗╚██████╗███████╗██║██║ ╚═╝ ██║██████╔╝",
    " ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝╚══════╝╚═╝╚═╝     ╚═╝╚═════╝ ",
]

export const BANNER_TAGLINE = { word1: "developers", word2: "agents" }

export const BANNER_COMMANDS = [
    {
        name: "freeclimb calls",
        subcommands: "make | list | get",
        pad: "      ",
        description: "Make and manage calls",
    },
    {
        name: "freeclimb sms",
        subcommands: "send | list | get",
        pad: "        ",
        description: "Send and manage SMS",
    },
    {
        name: "freeclimb applications",
        subcommands: "list | create",
        pad: "   ",
        description: "Manage applications",
    },
    {
        name: "freeclimb incoming-numbers",
        subcommands: "buy | list",
        pad: "  ",
        description: "Manage phone numbers",
    },
    {
        name: "freeclimb logs",
        subcommands: "list | filter",
        pad: "           ",
        description: "View account logs",
    },
    {
        name: "freeclimb mcp",
        subcommands: "start | config",
        pad: "           ",
        description: "AI agent integration",
    },
    {
        name: "freeclimb api",
        subcommands: "<endpoint>",
        pad: "               ",
        description: "Authenticated API request",
    },
]

export const BANNER_TRY_HINT = "try: freeclimb calls:list --json"

export const BANNER_LEARN_MORE_URL = "https://docs.freeclimb.com/docs/freeclimb-cli-quickstart"

// === QuickStart ===

export const QS_INSTALL_CMD = "npm install -g freeclimb-cli"
export const QS_INSTALL_OUTPUT = ["added 142 packages in 4.2s"]

export const QS_BANNER_CMD = "freeclimb"

export const QS_STATUS_CMD = "freeclimb status"
export const QS_STATUS_SPINNER_TEXT = "Fetching account status..."

// Status dashboard rendered by borderedBox() with width=55
export const QS_STATUS_WIDTH = 55
export const QS_STATUS_TITLE = "FreeClimb Account Status"
export const QS_ACCOUNT_ID = "AC1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c"

// Quick actions — matches status.ts quickActions() call
export const QS_QUICK_ACTIONS = [
    { command: "freeclimb incoming-numbers:list", description: "View phone numbers" },
    { command: "freeclimb applications:list", description: "View applications" },
    { command: "freeclimb calls:list", description: "View recent calls" },
    { command: "freeclimb diagnose", description: "Check connectivity" },
]

// === StatusDashboard (diagnose) ===

export const SD_DIAGNOSE_CMD = "freeclimb diagnose"

// Check names and results match diagnose.ts checkCredentials/checkConnectivity/etc
export const SD_CHECKS = [
    { name: "Credentials", result: "Credentials configured via environment variables" },
    { name: "API Connectivity", result: "API Connectivity: API reachable (142ms)" },
    { name: "Authentication", result: "Authentication: Authentication successful" },
    { name: "Account Status", result: "Account Status: Account active (trial)" },
]

// diagnose spinner.succeed() outputs: `${name}: ${message}`
// So the full resolve text is already in result above.
// But the first check doesn't duplicate the name — let me fix:
// Actually looking at diagnose.ts line 115: spinner.succeed(`${name}: ${message}`)
// So it's always "Name: Message"

export const SD_SUMMARY_WIDTH = 50

// === ApiWorkflow ===

export const AW_CALLS_CMD = "freeclimb calls:list"

// formatCallsList uses formatTable with these columns:
export const AW_CALLS_COLUMNS = [
    { header: "Call ID", width: 24 },
    { header: "From", width: 15 },
    { header: "To", width: 15 },
    { header: "Status", width: 12 },
    { header: "Direction", width: 10 },
    { header: "Created", width: 22 },
]

export const AW_CALLS_ROWS = [
    [
        "CA8f2a9b3c4d5e6f7a8b9c0d",
        "+15551234567",
        "+15559876543",
        "completed",
        "inbound",
        "2026-03-17T14:20:00Z",
    ],
    [
        "CA1b2c3d4e5f6a7b8c9d0e1f",
        "+15551234567",
        "+15558765432",
        "ringing",
        "outbound",
        "2026-03-17T14:18:30Z",
    ],
    [
        "CA9e8d7c6b5a4f3e2d1c0b9a",
        "+15557654321",
        "+15551234567",
        "failed",
        "inbound",
        "2026-03-17T14:15:12Z",
    ],
]

// sms:send with --json flag — shows wrapJsonOutput envelope
export const AW_SMS_CMD =
    'freeclimb sms:send --to +15559876543 --from +15551234567 --text "Hello!" --json'
export const AW_SMS_JSON = `{
  "success": true,
  "data": {
    "messageId": "SM4a5b6c7d8e9f0a1b2c3d4e",
    "from": "+15551234567",
    "to": "+15559876543",
    "text": "Hello!",
    "status": "queued",
    "direction": "outbound"
  },
  "metadata": {
    "timestamp": "2026-03-17T14:23:01Z"
  }
}`

// api command — human format shows "200 OK" in green + plain JSON
export const AW_API_CMD = "freeclimb api /Calls --method GET"
export const AW_API_STATUS = "200 OK"
export const AW_API_JSON = `{
  "total": 47,
  "calls": [
    {
      "callId": "CA8f2a9b3c4d5e6f7a8b9c0d",
      "from": "+15551234567",
      "to": "+15559876543",
      "status": "completed"
    }
  ]
}`

// === AgentIntegration ===

export const AI_MCP_CMD = "freeclimb mcp:start"
// mcp:start is silent (console.log stubbed), but we show the protocol traffic
// Title bar indicates "mcp protocol" view
export const AI_MCP_INIT = ['{"jsonrpc":"2.0","method":"initialize","id":1}']
export const AI_MCP_INIT_RESPONSE = '{"jsonrpc":"2.0","result":{"tools":15},"id":1}'

export const AI_AGENT_CONNECT = "[agent] Connected: Claude via MCP"

export const AI_TOOL_CALL_1 =
    '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_calls","arguments":{"limit":3}},"id":2}'
export const AI_TOOL_RESPONSE_1 = `{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      { "callId": "CA8f2a9b3c", "status": "completed", "duration": 45 },
      { "callId": "CA1b2c3d4e", "status": "completed", "duration": 12 },
      { "callId": "CA9e8d7c6b", "status": "failed", "duration": 0 }
    ]
  },
  "id": 2
}`

export const AI_TOOL_CALL_2 =
    '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"send_sms","arguments":{"to":"+15559876543","text":"Confirmed"}},"id":3}'
export const AI_TOOL_RESPONSE_2 = `{
  "jsonrpc": "2.0",
  "result": { "messageId": "SM7f8e9d0c", "status": "queued" },
  "id": 3
}`
