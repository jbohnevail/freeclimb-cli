/**
 * Category 2: Command Execution Performance
 *
 * Measures CLI overhead for commands using a mock HTTP server.
 * Isolates CLI processing time from network latency.
 */

import { execFileSync } from "node:child_process"

import { BenchmarkConfig } from "../config"
import { MetricComparison, compareMetrics } from "../utils/stats"
import { VersionBuild } from "../utils/version-manager"

export interface CommandExecutionResults {
    [metric: string]: MetricComparison
}

function runCommand(
    binPath: string,
    args: string[],
    env: Record<string, string>,
): { durationMs: number; exitCode: number; stdout: string } {
    const start = process.hrtime.bigint()
    let stdout = ""
    let exitCode = 0

    try {
        stdout = execFileSync("node", [binPath, ...args], {
            encoding: "utf-8",
            env: { ...process.env, ...env },
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 30_000,
        })
    } catch (error_: unknown) {
        const error = error_ as { status?: number; stdout?: string }
        stdout = error.stdout || ""
        exitCode = error.status || 1
    }

    const end = process.hrtime.bigint()
    return {
        durationMs: Number(end - start) / 1_000_000,
        exitCode,
        stdout,
    }
}

function collectCommandTimings(
    binPath: string,
    args: string[],
    env: Record<string, string>,
    iterations: number,
): number[] {
    const samples: number[] = []
    // 1 warmup run
    runCommand(binPath, args, env)

    for (let i = 0; i < iterations; i++) {
        const { durationMs } = runCommand(binPath, args, env)
        samples.push(durationMs)
    }

    return samples
}

export function runCommandExecutionBenchmarks(
    oldBuild: VersionBuild,
    newBuild: VersionBuild,
    config: BenchmarkConfig,
    mockBaseUrl: string,
): CommandExecutionResults {
    const results: CommandExecutionResults = {}
    const env = {
        ACCOUNT_ID: "ACtest1234567890",
        API_KEY: "testkey1234567890",
        FREECLIMB_CLI_BASE_URL: mockBaseUrl,
    }

    const commands: { args: string[]; iterations: number; name: string }[] = [
        { args: ["accounts:get"], iterations: config.iterations.commandExec, name: "accounts:get" },
        { args: ["calls:list"], iterations: config.iterations.commandExec, name: "calls:list" },
        {
            args: [
                "sms:send",
                "--from",
                "+15551234567",
                "--to",
                "+15559876543",
                "--text",
                "test benchmark message",
            ],
            iterations: config.iterations.commandExec,
            name: "sms:send",
        },
        {
            args: ["incoming-numbers:list"],
            iterations: config.iterations.commandExec,
            name: "incoming-numbers:list",
        },
        {
            args: ["applications:list"],
            iterations: config.iterations.commandExec,
            name: "applications:list",
        },
    ]

    for (const cmd of commands) {
        console.log(`  [command-execution] ${cmd.name}...`)
        const oldSamples = collectCommandTimings(oldBuild.binPath, cmd.args, env, cmd.iterations)
        const newSamples = collectCommandTimings(newBuild.binPath, cmd.args, env, cmd.iterations)
        results[cmd.name] = compareMetrics(oldSamples, newSamples)
    }

    // Error path (500 response)
    console.log("  [command-execution] Error path (500)...")
    const errorEnv = {
        ...env,
        FREECLIMB_CLI_BASE_URL: mockBaseUrl.replace(
            "/apiserver",
            "/apiserver?_benchmark_error=true",
        ),
    }
    // For error path, we need to trigger a 500. Since the mock server checks query params,
    // we construct the URL differently or accept the error behavior.
    const oldError = collectCommandTimings(
        oldBuild.binPath,
        ["accounts:get"],
        errorEnv,
        config.iterations.commandExec,
    )
    const newError = collectCommandTimings(
        newBuild.binPath,
        ["accounts:get"],
        errorEnv,
        config.iterations.commandExec,
    )
    results["Error path (500)"] = compareMetrics(oldError, newError)

    return results
}
