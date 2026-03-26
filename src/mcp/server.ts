/**
 * FreeClimb MCP Server
 *
 * Exposes FreeClimb CLI functionality as an MCP server for AI agents.
 * Uses the official @modelcontextprotocol/sdk for protocol compliance.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { createApiAxios } from "../http.js"
import { tools, ToolName } from "./tools.js"

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "../../package.json")
const { version: CLI_VERSION } = JSON.parse(readFileSync(pkgPath, "utf-8"))

// Generate PerCL JSON for common call flow patterns
function generatePerclPattern(
    pattern: string,
    text?: string,
    actionUrl?: string,
    options?: Record<string, unknown>,
): unknown[] {
    switch (pattern) {
        case "greeting": {
            return [{ Say: { text: text || "Thank you for calling. Goodbye." } }, { Hangup: {} }]
        }

        case "menu": {
            return [
                {
                    GetDigits: {
                        actionUrl: actionUrl || "https://example.com/menu-handler",
                        prompts: [
                            {
                                Say: {
                                    text:
                                        text ||
                                        "Press 1 for sales. Press 2 for support. Press 0 for an operator.",
                                },
                            },
                        ],
                        maxDigits: (options?.maxDigits as number) || 1,
                        minDigits: 1,
                        initialTimeoutMs: 8000,
                        flushBuffer: true,
                    },
                },
            ]
        }

        case "voicemail": {
            return [
                {
                    Say: {
                        text:
                            text ||
                            "Please leave a message after the beep. Press pound when finished.",
                    },
                },
                {
                    RecordUtterance: {
                        actionUrl: actionUrl || "https://example.com/voicemail-saved",
                        silenceTimeoutMs: 5000,
                        maxLengthSec: (options?.maxLengthSec as number) || 120,
                        finishOnKey: (options?.finishOnKey as string) || "#",
                        playBeep: true,
                    },
                },
            ]
        }

        case "transfer": {
            return [
                { Say: { text: text || "Transferring your call. Please hold." } },
                {
                    OutDial: {
                        destination: (options?.destination as string) || "+15551234567",
                        callingNumber: (options?.callingNumber as string) || "+15559876543",
                        actionUrl: actionUrl || "https://example.com/transfer-status",
                        callConnectUrl:
                            (options?.callConnectUrl as string) || "https://example.com/connected",
                        timeout: 30,
                    },
                },
            ]
        }

        case "queue": {
            return [
                { Say: { text: text || "Please hold while we connect you with an agent." } },
                {
                    Enqueue: {
                        queueId: (options?.queueId as string) || "QU...",
                        waitUrl: (options?.waitUrl as string) || "https://example.com/hold-music",
                        actionUrl: actionUrl || "https://example.com/dequeued",
                    },
                },
            ]
        }

        case "record": {
            return [
                {
                    Say: {
                        text:
                            text || "This call may be recorded for quality and training purposes.",
                    },
                },
                { StartRecordCall: {} },
            ]
        }

        default: {
            throw new Error(
                `Unknown pattern: ${pattern}. Supported: greeting, menu, voicemail, transfer, queue, record`,
            )
        }
    }
}

// Tool handler
async function handleToolCall(name: ToolName, args: Record<string, unknown>): Promise<unknown> {
    const client = await createApiAxios()

    switch (name) {
        // Call management
        case "make_call": {
            return (
                await client.post("/Calls", {
                    to: args.to,
                    from: args.from,
                    applicationId: args.applicationId,
                    timeout: args.timeout || 30,
                })
            ).data
        }

        case "list_calls": {
            return (
                await client.get("/Calls", {
                    params: {
                        to: args.to,
                        from: args.from,
                        status: args.status,
                    },
                })
            ).data
        }

        case "get_call": {
            return (await client.get(`/Calls/${args.callId}`)).data
        }

        // SMS management
        case "send_sms": {
            return (
                await client.post("/Messages", {
                    to: args.to,
                    from: args.from,
                    text: args.text,
                })
            ).data
        }

        case "list_sms": {
            return (
                await client.get("/Messages", {
                    params: {
                        to: args.to,
                        from: args.from,
                    },
                })
            ).data
        }

        case "get_sms": {
            return (await client.get(`/Messages/${args.messageId}`)).data
        }

        // Phone number management
        case "list_numbers": {
            return (await client.get("/IncomingPhoneNumbers")).data
        }

        case "get_number": {
            return (await client.get(`/IncomingPhoneNumbers/${args.phoneNumberId}`)).data
        }

        case "search_available_numbers": {
            return (
                await client.get("/AvailablePhoneNumbers", {
                    params: {
                        areaCode: args.areaCode,
                        country: args.country || "US",
                        smsEnabled: args.smsEnabled,
                        voiceEnabled: args.voiceEnabled,
                    },
                })
            ).data
        }

        // Application management
        case "list_applications": {
            return (await client.get("/Applications")).data
        }

        case "get_application": {
            return (await client.get(`/Applications/${args.applicationId}`)).data
        }

        // Account information
        case "get_account": {
            return (await client.get("")).data
        }

        // Logs
        case "list_logs": {
            return (
                await client.get("/Logs", {
                    params: {
                        maxItems: args.maxItems || 100,
                    },
                })
            ).data
        }

        case "filter_logs": {
            return (
                await client.post("/Logs", {
                    pql: args.pql,
                })
            ).data
        }

        // Recordings
        case "list_recordings": {
            return (
                await client.get("/Recordings", {
                    params: {
                        callId: args.callId,
                    },
                })
            ).data
        }

        // Conferences
        case "list_conferences": {
            return (
                await client.get("/Conferences", {
                    params: {
                        status: args.status,
                    },
                })
            ).data
        }

        // Queues
        case "list_queues": {
            return (await client.get("/Queues")).data
        }

        // Call update
        case "update_call": {
            return (
                await client.put(`/Calls/${args.callId}`, {
                    status: args.status,
                })
            ).data
        }

        // PerCL generation (local, no API call)
        case "generate_percl": {
            return generatePerclPattern(
                args.pattern as string,
                args.text as string | undefined,
                args.actionUrl as string | undefined,
                args.options as Record<string, unknown> | undefined,
            )
        }

        default: {
            throw new Error(`Unknown tool: ${name}`)
        }
    }
}

export async function startMcpServer(): Promise<void> {
    const server = new Server(
        {
            name: "freeclimb",
            version: CLI_VERSION,
        },
        {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
        },
    )

    // List tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: Object.values(tools).map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    }))

    // Call tools
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            const toolResult = await handleToolCall(
                request.params.name as ToolName,
                (request.params.arguments as Record<string, unknown>) || {},
            )
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(toolResult, null, 2),
                    },
                ],
            }
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(
                            {
                                error: error.message || "Unknown error",
                                details: error.response?.data,
                            },
                            null,
                            2,
                        ),
                    },
                ],
                isError: true,
            }
        }
    })

    // List resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: [
            {
                uri: "freeclimb://account",
                name: "Account Info",
                description: "Current FreeClimb account information and status",
                mimeType: "application/json",
            },
            {
                uri: "freeclimb://numbers",
                name: "Phone Numbers",
                description: "All phone numbers owned by this account",
                mimeType: "application/json",
            },
            {
                uri: "freeclimb://applications",
                name: "Applications",
                description: "All applications configured in this account",
                mimeType: "application/json",
            },
        ],
    }))

    // Read resources
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const client = await createApiAxios()
        let data: unknown

        switch (request.params.uri) {
            case "freeclimb://account": {
                ;({ data } = await client.get(""))
                break
            }
            case "freeclimb://numbers": {
                ;({ data } = await client.get("/IncomingPhoneNumbers"))
                break
            }
            case "freeclimb://applications": {
                ;({ data } = await client.get("/Applications"))
                break
            }
            default: {
                throw new Error(`Unknown resource: ${request.params.uri}`)
            }
        }

        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "application/json",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        }
    })

    // List prompts
    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
        prompts: [
            {
                name: "send-sms",
                description: "Guide through sending an SMS message via FreeClimb",
                arguments: [
                    { name: "to", description: "Destination phone number", required: true },
                    { name: "message", description: "Message text to send", required: true },
                ],
            },
            {
                name: "make-call",
                description: "Guide through making a phone call via FreeClimb",
                arguments: [
                    { name: "to", description: "Destination phone number", required: true },
                    {
                        name: "applicationId",
                        description: "Application to handle the call",
                        required: true,
                    },
                ],
            },
            {
                name: "diagnose",
                description:
                    "Run FreeClimb CLI diagnostics to check connectivity and authentication",
            },
        ],
    }))

    // Get prompts
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        switch (request.params.name) {
            case "send-sms": {
                return {
                    description: "Send an SMS message via FreeClimb",
                    messages: [
                        {
                            role: "user" as const,
                            content: {
                                type: "text" as const,
                                text: `Send an SMS to ${request.params.arguments?.to || "<number>"} with the message: "${request.params.arguments?.message || "<message>"}". First, use the list_numbers tool to find an available FreeClimb number to send from, then use send_sms.`,
                            },
                        },
                    ],
                }
            }
            case "make-call": {
                return {
                    description: "Make a phone call via FreeClimb",
                    messages: [
                        {
                            role: "user" as const,
                            content: {
                                type: "text" as const,
                                text: `Make a phone call to ${request.params.arguments?.to || "<number>"} using application ${request.params.arguments?.applicationId || "<appId>"}. First, use list_numbers to find an available FreeClimb number, then use make_call.`,
                            },
                        },
                    ],
                }
            }
            case "diagnose": {
                return {
                    description: "Run FreeClimb CLI diagnostics",
                    messages: [
                        {
                            role: "user" as const,
                            content: {
                                type: "text" as const,
                                text: "Run diagnostics on the FreeClimb CLI setup. Use the get_account tool to verify connectivity and authentication, then report the account status.",
                            },
                        },
                    ],
                }
            }
            default: {
                throw new Error(`Unknown prompt: ${request.params.name}`)
            }
        }
    })

    // Connect via stdio transport
    const transport = new StdioServerTransport()
    await server.connect(transport)
}

// Generate MCP config for claude_desktop_config.json
export function generateMcpConfig(): string {
    const config = {
        mcpServers: {
            freeclimb: {
                command: "freeclimb",
                args: ["mcp", "start"],
                env: {
                    FREECLIMB_ACCOUNT_ID: "<YOUR_ACCOUNT_ID>",
                    FREECLIMB_API_KEY: "<YOUR_API_KEY>",
                },
            },
        },
    }

    return JSON.stringify(config, null, 2)
}
