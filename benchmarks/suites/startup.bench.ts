/**
 * Category 1: CLI Startup Performance
 *
 * Measures cold start, warm start, help rendering, topic help, and plugin load times.
 */

import { execFileSync } from "node:child_process"

import { BenchmarkConfig, TOPICS } from "../config"
import { MetricComparison, compareMetrics } from "../utils/stats"
import { VersionBuild } from "../utils/version-manager"

export interface StartupResults {
    [metric: string]: MetricComparison
}

function runCli(binPath: string, args: string[], env: Record<string, string>): number {
    const start = process.hrtime.bigint()
    try {
        execFileSync("node", [binPath, ...args], {
            encoding: "utf-8",
            env: { ...process.env, ...env },
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 30_000,
        })
    } catch {
        // --version and --help may exit with code 0 or non-zero depending on version
    }

    const end = process.hrtime.bigint()
    return Number(end - start) / 1_000_000
}

function collectTimings(
    binPath: string,
    args: string[],
    env: Record<string, string>,
    iterations: number,
    warmup: number = 0,
): number[] {
    // Warmup runs
    for (let i = 0; i < warmup; i++) {
        runCli(binPath, args, env)
    }

    const samples: number[] = []
    for (let i = 0; i < iterations; i++) {
        samples.push(runCli(binPath, args, env))
    }

    return samples
}

export function runStartupBenchmarks(
    oldBuild: VersionBuild,
    newBuild: VersionBuild,
    config: BenchmarkConfig,
): StartupResults {
    const results: StartupResults = {}
    const env = {
        ACCOUNT_ID: "ACtest1234567890",
        API_KEY: "testkey1234567890",
    }

    console.log("  [startup] Cold start (--version)...")
    const oldCold = collectTimings(oldBuild.binPath, ["--version"], env, config.iterations.startup)
    const newCold = collectTimings(newBuild.binPath, ["--version"], env, config.iterations.startup)
    results["Cold start (--version)"] = compareMetrics(oldCold, newCold)

    console.log("  [startup] Warm start (--version)...")
    const oldWarm = collectTimings(
        oldBuild.binPath,
        ["--version"],
        env,
        config.iterations.warmStartup,
        3,
    )
    const newWarm = collectTimings(
        newBuild.binPath,
        ["--version"],
        env,
        config.iterations.warmStartup,
        3,
    )
    results["Warm start (--version)"] = compareMetrics(oldWarm, newWarm)

    console.log("  [startup] --help rendering...")
    const oldHelp = collectTimings(oldBuild.binPath, ["--help"], env, config.iterations.help)
    const newHelp = collectTimings(newBuild.binPath, ["--help"], env, config.iterations.help)
    results["--help rendering"] = compareMetrics(oldHelp, newHelp)

    console.log("  [startup] Topic help pages...")
    for (const topic of TOPICS) {
        const oldTopic = collectTimings(
            oldBuild.binPath,
            [topic, "--help"],
            env,
            config.iterations.topicHelp,
        )
        const newTopic = collectTimings(
            newBuild.binPath,
            [topic, "--help"],
            env,
            config.iterations.topicHelp,
        )
        results[`${topic} --help`] = compareMetrics(oldTopic, newTopic)
    }

    console.log("  [startup] Plugin load time...")
    const oldPlugin = collectPluginLoadTimes(oldBuild.binPath, env, config.iterations.pluginLoad)
    const newPlugin = collectPluginLoadTimes(newBuild.binPath, env, config.iterations.pluginLoad)
    results["Plugin load time"] = compareMetrics(oldPlugin, newPlugin)

    return results
}

function collectPluginLoadTimes(
    binPath: string,
    env: Record<string, string>,
    iterations: number,
): number[] {
    // Plugin load time is measured via DEBUG=oclif:* stderr output
    // Fallback: just measure --version time as proxy for plugin loading
    const samples: number[] = []
    const debugEnv = { ...env, DEBUG: "oclif:*" }

    for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint()
        try {
            execFileSync("node", [binPath, "--version"], {
                encoding: "utf-8",
                env: { ...process.env, ...debugEnv },
                stdio: ["pipe", "pipe", "pipe"],
                timeout: 30_000,
            })
        } catch {
            // ignore
        }

        const end = process.hrtime.bigint()
        samples.push(Number(end - start) / 1_000_000)
    }

    return samples
}
