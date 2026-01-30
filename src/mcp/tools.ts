/**
 * MCP Tool Definitions for FreeClimb CLI
 *
 * These tools expose FreeClimb API functionality to AI agents via MCP protocol.
 */

// Tool definitions
export const tools = {
    // Call management
    make_call: {
        name: "make_call",
        description:
            "Make an outbound phone call from a FreeClimb number to a destination number",
        inputSchema: {
            type: "object" as const,
            properties: {
                to: {
                    type: "string",
                    description: "Destination phone number in E.164 format (e.g., +15551234567)",
                },
                from: {
                    type: "string",
                    description: "FreeClimb phone number to call from in E.164 format",
                },
                applicationId: {
                    type: "string",
                    description: "Application ID to handle the call",
                },
                timeout: {
                    type: "number",
                    description: "Call timeout in seconds (optional, default 30)",
                },
            },
            required: ["to", "from", "applicationId"],
        },
    },

    list_calls: {
        name: "list_calls",
        description: "List recent phone calls for the account",
        inputSchema: {
            type: "object" as const,
            properties: {
                status: {
                    type: "string",
                    description:
                        "Filter by call status: queued, ringing, inProgress, canceled, completed, failed, busy, noAnswer",
                    enum: [
                        "queued",
                        "ringing",
                        "inProgress",
                        "canceled",
                        "completed",
                        "failed",
                        "busy",
                        "noAnswer",
                    ],
                },
                to: {
                    type: "string",
                    description: "Filter by destination phone number",
                },
                from: {
                    type: "string",
                    description: "Filter by source phone number",
                },
            },
            required: [],
        },
    },

    get_call: {
        name: "get_call",
        description: "Get details for a specific call by its ID",
        inputSchema: {
            type: "object" as const,
            properties: {
                callId: {
                    type: "string",
                    description: "The call ID to look up",
                },
            },
            required: ["callId"],
        },
    },

    // SMS management
    send_sms: {
        name: "send_sms",
        description: "Send an SMS message from a FreeClimb number",
        inputSchema: {
            type: "object" as const,
            properties: {
                to: {
                    type: "string",
                    description: "Destination phone number in E.164 format",
                },
                from: {
                    type: "string",
                    description: "FreeClimb phone number to send from in E.164 format",
                },
                text: {
                    type: "string",
                    description: "The SMS message text (max 160 characters for single SMS)",
                },
            },
            required: ["to", "from", "text"],
        },
    },

    list_sms: {
        name: "list_sms",
        description: "List recent SMS messages for the account",
        inputSchema: {
            type: "object" as const,
            properties: {
                to: {
                    type: "string",
                    description: "Filter by destination phone number",
                },
                from: {
                    type: "string",
                    description: "Filter by source phone number",
                },
            },
            required: [],
        },
    },

    get_sms: {
        name: "get_sms",
        description: "Get details for a specific SMS message by its ID",
        inputSchema: {
            type: "object" as const,
            properties: {
                messageId: {
                    type: "string",
                    description: "The message ID to look up",
                },
            },
            required: ["messageId"],
        },
    },

    // Phone number management
    list_numbers: {
        name: "list_numbers",
        description: "List all phone numbers owned by the account",
        inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
        },
    },

    get_number: {
        name: "get_number",
        description: "Get details for a specific phone number",
        inputSchema: {
            type: "object" as const,
            properties: {
                phoneNumberId: {
                    type: "string",
                    description: "The phone number ID to look up",
                },
            },
            required: ["phoneNumberId"],
        },
    },

    search_available_numbers: {
        name: "search_available_numbers",
        description: "Search for phone numbers available to purchase",
        inputSchema: {
            type: "object" as const,
            properties: {
                areaCode: {
                    type: "string",
                    description: "Filter by area code (e.g., 415)",
                },
                country: {
                    type: "string",
                    description: "Two-letter country code (default: US)",
                },
                smsEnabled: {
                    type: "boolean",
                    description: "Filter for SMS-enabled numbers",
                },
                voiceEnabled: {
                    type: "boolean",
                    description: "Filter for voice-enabled numbers",
                },
            },
            required: [],
        },
    },

    // Application management
    list_applications: {
        name: "list_applications",
        description: "List all applications in the account",
        inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
        },
    },

    get_application: {
        name: "get_application",
        description: "Get details for a specific application",
        inputSchema: {
            type: "object" as const,
            properties: {
                applicationId: {
                    type: "string",
                    description: "The application ID to look up",
                },
            },
            required: ["applicationId"],
        },
    },

    // Account information
    get_account: {
        name: "get_account",
        description: "Get account information and current status",
        inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
        },
    },

    // Logs
    list_logs: {
        name: "list_logs",
        description: "List recent logs for the account",
        inputSchema: {
            type: "object" as const,
            properties: {
                maxItems: {
                    type: "number",
                    description: "Maximum number of log entries to return (default: 100)",
                },
            },
            required: [],
        },
    },

    filter_logs: {
        name: "filter_logs",
        description: "Filter logs using PQL (FreeClimb Query Language)",
        inputSchema: {
            type: "object" as const,
            properties: {
                pql: {
                    type: "string",
                    description: 'PQL query string (e.g., "level = \\"ERROR\\"")',
                },
                maxItems: {
                    type: "number",
                    description: "Maximum number of log entries to return",
                },
            },
            required: ["pql"],
        },
    },

    // Recordings
    list_recordings: {
        name: "list_recordings",
        description: "List all recordings in the account",
        inputSchema: {
            type: "object" as const,
            properties: {
                callId: {
                    type: "string",
                    description: "Filter by call ID",
                },
            },
            required: [],
        },
    },

    // Conferences
    list_conferences: {
        name: "list_conferences",
        description: "List all conferences in the account",
        inputSchema: {
            type: "object" as const,
            properties: {
                status: {
                    type: "string",
                    description: "Filter by conference status",
                    enum: ["empty", "populated", "inProgress", "terminated"],
                },
            },
            required: [],
        },
    },

    // Queues
    list_queues: {
        name: "list_queues",
        description: "List all call queues in the account",
        inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
        },
    },
}

export type ToolName = keyof typeof tools
