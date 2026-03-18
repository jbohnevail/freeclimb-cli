import os from "node:os"
import path from "node:path"

export interface BenchmarkConfig {
    buildCacheDir: string
    ciMode: boolean
    iterations: {
        buildTime: number
        commandExec: number
        help: number
        largePayload: number
        mcpConcurrent: number
        mcpMemory: number
        mcpStartup: number
        mcpToolCall: number
        mcpToolsList: number
        pluginLoad: number
        startup: number
        testSuite: number
        topicHelp: number
        warmStartup: number
    }
    keepBuilds: boolean
    mockServerPort: number
    newLabel: string
    newRef: string
    oldLabel: string
    oldRef: string
    regressionThreshold: number
    resultsDir: string
}

export const DEFAULT_CONFIG: BenchmarkConfig = {
    buildCacheDir: path.join(os.tmpdir(), "fc-bench-cache"),
    ciMode: false,
    iterations: {
        buildTime: 5,
        commandExec: 20,
        help: 30,
        largePayload: 10,
        mcpConcurrent: 10,
        mcpMemory: 5,
        mcpStartup: 20,
        mcpToolCall: 50,
        mcpToolsList: 50,
        pluginLoad: 20,
        startup: 50,
        testSuite: 3,
        topicHelp: 10,
        warmStartup: 50,
    },
    keepBuilds: false,
    mockServerPort: 0, // 0 = random available port
    newLabel: "v0.6.0 (oclif v4)",
    newRef: "work/main",
    oldLabel: "v0.5.4 (oclif v1)",
    oldRef: "main",
    regressionThreshold: 10, // percentage — flag if new is >10% slower
    resultsDir: path.join(__dirname, "results"),
}

export function scaleIterations(config: BenchmarkConfig, factor: number): BenchmarkConfig {
    const scaled = { ...config.iterations }
    for (const key of Object.keys(scaled) as (keyof typeof scaled)[]) {
        scaled[key] = Math.max(1, Math.round(scaled[key] * factor))
    }

    return { ...config, iterations: scaled }
}

export const CI_CONFIG: BenchmarkConfig = scaleIterations({ ...DEFAULT_CONFIG, ciMode: true }, 0.2)

export const TOPICS = [
    "accounts",
    "applications",
    "available-numbers",
    "calls",
    "call-queues",
    "conferences",
    "conference-participants",
    "incoming-numbers",
    "logs",
    "queue-members",
    "recordings",
    "sms",
]

export const BENCHMARK_COMMANDS = [
    { args: [], name: "accounts:get" },
    { args: [], name: "calls:list" },
    {
        args: ["--from", "+15551234567", "--to", "+15559876543", "--text", "test"],
        name: "sms:send",
    },
    { args: [], name: "incoming-numbers:list" },
    { args: [], name: "applications:list" },
]

export const ENV_VARS = {
    ACCOUNT_ID: "ACtest1234567890",
    API_KEY: "testkey1234567890",
    FREECLIMB_CLI_BASE_URL: "", // set dynamically with mock server port
}
