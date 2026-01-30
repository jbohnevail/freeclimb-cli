/**
 * FreeClimb MCP Server
 *
 * Exposes FreeClimb CLI functionality as an MCP server for AI agents.
 * This allows Claude, Copilot, and other AI assistants to directly
 * interact with the FreeClimb API.
 *
 * Note: This is a simplified implementation that uses raw JSON-RPC over stdio.
 * For full MCP SDK support, upgrade TypeScript to v5+ and reinstall dependencies.
 */

import * as readline from "readline"
import axios from "axios"
import { tools, ToolName } from "./tools"
import { cred } from "../credentials"
import { Environment } from "../environment"

const API_BASE_URL =
    Environment.getString("FREECLIMB_CLI_BASE_URL") || "https://www.freeclimb.com/apiserver"

// Create axios instance for API calls
async function createApiClient() {
    const accountId = await cred.accountId
    const apiKey = await cred.apiKey

    return axios.create({
        baseURL: `${API_BASE_URL}/Accounts/${accountId}`,
        auth: {
            username: accountId,
            password: apiKey,
        },
        headers: {
            "Content-Type": "application/json",
        },
    })
}

// Tool handlers
async function handleToolCall(
    name: ToolName,
    args: Record<string, unknown>
): Promise<unknown> {
    const client = await createApiClient()

    switch (name) {
        // Call management
        case "make_call":
            return (
                await client.post("/Calls", {
                    to: args.to,
                    from: args.from,
                    applicationId: args.applicationId,
                    timeout: args.timeout || 30,
                })
            ).data

        case "list_calls":
            return (
                await client.get("/Calls", {
                    params: {
                        to: args.to,
                        from: args.from,
                        status: args.status,
                    },
                })
            ).data

        case "get_call":
            return (await client.get(`/Calls/${args.callId}`)).data

        // SMS management
        case "send_sms":
            return (
                await client.post("/Messages", {
                    to: args.to,
                    from: args.from,
                    text: args.text,
                })
            ).data

        case "list_sms":
            return (
                await client.get("/Messages", {
                    params: {
                        to: args.to,
                        from: args.from,
                    },
                })
            ).data

        case "get_sms":
            return (await client.get(`/Messages/${args.messageId}`)).data

        // Phone number management
        case "list_numbers":
            return (await client.get("/IncomingPhoneNumbers")).data

        case "get_number":
            return (await client.get(`/IncomingPhoneNumbers/${args.phoneNumberId}`)).data

        case "search_available_numbers":
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

        // Application management
        case "list_applications":
            return (await client.get("/Applications")).data

        case "get_application":
            return (await client.get(`/Applications/${args.applicationId}`)).data

        // Account information
        case "get_account": {
            const accountId = await cred.accountId
            return (await client.get(`/Accounts/${accountId}`)).data
        }

        // Logs
        case "list_logs":
            return (
                await client.get("/Logs", {
                    params: {
                        maxItems: args.maxItems || 100,
                    },
                })
            ).data

        case "filter_logs":
            return (
                await client.post("/Logs", {
                    pql: args.pql,
                })
            ).data

        // Recordings
        case "list_recordings":
            return (
                await client.get("/Recordings", {
                    params: {
                        callId: args.callId,
                    },
                })
            ).data

        // Conferences
        case "list_conferences":
            return (
                await client.get("/Conferences", {
                    params: {
                        status: args.status,
                    },
                })
            ).data

        // Queues
        case "list_queues":
            return (await client.get("/Queues")).data

        default:
            throw new Error(`Unknown tool: ${name}`)
    }
}

// JSON-RPC request/response types
interface JsonRpcRequest {
    jsonrpc: "2.0"
    id: number | string
    method: string
    params?: Record<string, unknown>
}

interface JsonRpcResponse {
    jsonrpc: "2.0"
    id: number | string | null
    result?: unknown
    error?: {
        code: number
        message: string
        data?: unknown
    }
}

function sendResponse(response: JsonRpcResponse): void {
    process.stdout.write(JSON.stringify(response) + "\n")
}

async function handleRequest(request: JsonRpcRequest): Promise<void> {
    try {
        let result: unknown

        switch (request.method) {
            case "initialize":
                result = {
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        tools: {},
                    },
                    serverInfo: {
                        name: "freeclimb",
                        version: "0.5.4",
                    },
                }
                break

            case "tools/list":
                result = {
                    tools: Object.values(tools).map((tool) => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                    })),
                }
                break

            case "tools/call": {
                const params = request.params as {
                    name: string
                    arguments?: Record<string, unknown>
                }
                const toolResult = await handleToolCall(
                    params.name as ToolName,
                    params.arguments || {}
                )
                result = {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(toolResult, null, 2),
                        },
                    ],
                }
                break
            }

            default:
                throw new Error(`Unknown method: ${request.method}`)
        }

        sendResponse({
            jsonrpc: "2.0",
            id: request.id,
            result,
        })
    } catch (error: any) {
        sendResponse({
            jsonrpc: "2.0",
            id: request.id,
            error: {
                code: -32603,
                message: error.message || "Internal error",
                data: error.response?.data,
            },
        })
    }
}

export async function startMcpServer(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    })

    rl.on("line", async (line) => {
        try {
            const request = JSON.parse(line) as JsonRpcRequest
            await handleRequest(request)
        } catch (error: any) {
            sendResponse({
                jsonrpc: "2.0",
                id: null,
                error: {
                    code: -32700,
                    message: "Parse error",
                },
            })
        }
    })

    // Keep the process running
    await new Promise<void>(() => {})
}

// Generate MCP config for claude_desktop_config.json
export function generateMcpConfig(): string {
    const config = {
        mcpServers: {
            freeclimb: {
                command: "freeclimb",
                args: ["mcp", "start"],
                env: {
                    FREECLIMB_ACCOUNT_ID: "${FREECLIMB_ACCOUNT_ID}",
                    FREECLIMB_API_KEY: "${FREECLIMB_API_KEY}",
                },
            },
        },
    }

    return JSON.stringify(config, null, 2)
}
