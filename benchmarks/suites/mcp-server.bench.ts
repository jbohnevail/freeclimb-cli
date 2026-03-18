/**
 * Category 4: MCP Server Performance
 *
 * Spawns the MCP server, sends JSON-RPC over stdin, and measures response times.
 * Gracefully skips if the version doesn't have an MCP server.
 */

import { execFileSync, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { BenchmarkConfig } from "../config"
import { MetricComparison, compareMetrics, computeStats } from "../utils/stats"
import { VersionBuild } from "../utils/version-manager"

export interface McpServerResults {
    [metric: string]: MetricComparison
}

function hasMcpCommand(build: VersionBuild): boolean {
    // Check if the built version has an MCP command
    const mcpDir = path.join(build.worktreePath, "lib", "commands", "mcp")
    const mcpFile = path.join(build.worktreePath, "src", "mcp")
    return fs.existsSync(mcpDir) || fs.existsSync(mcpFile)
}

function sendJsonRpc(
    proc: ReturnType<typeof spawn>,
    method: string,
    params: Record<string, unknown> = {},
    id: number = 1,
): Promise<{ durationMs: number; result: unknown }> {
    return new Promise((resolve, reject) => {
        const request = JSON.stringify({
            id,
            jsonrpc: "2.0",
            method,
            params,
        })

        const start = process.hrtime.bigint()
        let buffer = ""

        const onData = (data: Buffer) => {
            buffer += data.toString()
            // Try to parse complete JSON-RPC responses
            const lines = buffer.split("\n")
            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) continue
                try {
                    const parsed = JSON.parse(trimmed)
                    if (parsed.id === id) {
                        const end = process.hrtime.bigint()
                        proc.stdout?.removeListener("data", onData)
                        resolve({
                            durationMs: Number(end - start) / 1_000_000,
                            result: parsed.result || parsed.error,
                        })
                        return
                    }
                } catch {
                    // Incomplete JSON, continue buffering
                }
            }
        }

        proc.stdout?.on("data", onData)

        // Send the request
        proc.stdin?.write(request + "\n")

        // Timeout
        setTimeout(() => {
            proc.stdout?.removeListener("data", onData)
            reject(new Error(`JSON-RPC timeout for method ${method}`))
        }, 10_000)
    })
}

async function spawnMcpServer(
    build: VersionBuild,
    env: Record<string, string>,
): Promise<ReturnType<typeof spawn>> {
    const proc = spawn("node", [build.binPath, "mcp:start"], {
        env: { ...process.env, ...env },
        stdio: ["pipe", "pipe", "pipe"],
    })

    // Wait a moment for server to initialize
    await new Promise((res) => setTimeout(res, 500))

    return proc
}

export async function runMcpServerBenchmarks(
    oldBuild: VersionBuild,
    newBuild: VersionBuild,
    config: BenchmarkConfig,
    mockBaseUrl: string,
): Promise<McpServerResults> {
    const results: McpServerResults = {}
    const env = {
        ACCOUNT_ID: "ACtest1234567890",
        API_KEY: "testkey1234567890",
        FREECLIMB_CLI_BASE_URL: mockBaseUrl,
    }

    const oldHasMcp = hasMcpCommand(oldBuild)
    const newHasMcp = hasMcpCommand(newBuild)

    if (!oldHasMcp && !newHasMcp) {
        console.log("  [mcp-server] Neither version has MCP server — skipping suite.")
        return results
    }

    if (!oldHasMcp) {
        console.log("  [mcp-server] Old version lacks MCP — benchmarking new only.")
    }

    if (!newHasMcp) {
        console.log("  [mcp-server] New version lacks MCP — benchmarking old only.")
    }

    // Server startup → initialize response
    console.log("  [mcp-server] Server startup time...")
    const oldStartup = oldHasMcp
        ? await collectMcpStartupTimes(oldBuild, env, config.iterations.mcpStartup)
        : []
    const newStartup = newHasMcp
        ? await collectMcpStartupTimes(newBuild, env, config.iterations.mcpStartup)
        : []
    results["Server startup (initialize)"] = compareMetrics(oldStartup, newStartup)

    // tools/list response time
    if (oldHasMcp || newHasMcp) {
        console.log("  [mcp-server] tools/list response time...")
        const oldToolsList = oldHasMcp
            ? await collectMcpMethodTimes(
                  oldBuild,
                  env,
                  "tools/list",
                  {},
                  config.iterations.mcpToolsList,
              )
            : []
        const newToolsList = newHasMcp
            ? await collectMcpMethodTimes(
                  newBuild,
                  env,
                  "tools/list",
                  {},
                  config.iterations.mcpToolsList,
              )
            : []
        results["tools/list response"] = compareMetrics(oldToolsList, newToolsList)
    }

    return results
}

async function collectMcpStartupTimes(
    build: VersionBuild,
    env: Record<string, string>,
    iterations: number,
): Promise<number[]> {
    const samples: number[] = []

    for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint()
        let proc: ReturnType<typeof spawn> | null = null

        try {
            proc = await spawnMcpServer(build, env)
            const { durationMs } = await sendJsonRpc(proc, "initialize", {
                capabilities: {},
                clientInfo: { name: "benchmark", version: "1.0.0" },
                protocolVersion: "2024-11-05",
            })
            samples.push(durationMs)
        } catch {
            // Skip failed attempts
        } finally {
            if (proc) {
                proc.kill()
                await new Promise((res) => setTimeout(res, 100))
            }
        }
    }

    return samples
}

async function collectMcpMethodTimes(
    build: VersionBuild,
    env: Record<string, string>,
    method: string,
    params: Record<string, unknown>,
    iterations: number,
): Promise<number[]> {
    const samples: number[] = []
    let proc: ReturnType<typeof spawn> | null = null

    try {
        proc = await spawnMcpServer(build, env)

        // Initialize first
        await sendJsonRpc(proc, "initialize", {
            capabilities: {},
            clientInfo: { name: "benchmark", version: "1.0.0" },
            protocolVersion: "2024-11-05",
        })

        // Collect samples
        for (let i = 0; i < iterations; i++) {
            try {
                const { durationMs } = await sendJsonRpc(proc, method, params, i + 2)
                samples.push(durationMs)
            } catch {
                // Skip failed attempts
            }
        }
    } catch {
        // Server might not support MCP protocol
    } finally {
        if (proc) {
            proc.kill()
            await new Promise((res) => setTimeout(res, 100))
        }
    }

    return samples
}
