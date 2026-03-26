/**
 * Category 5: Token Consumption
 *
 * Uses tiktoken (cl100k_base) to count tokens in CLI output strings.
 * Measures how token-efficient each version is for AI agent usage.
 */

import { execFileSync } from "node:child_process"

import { BenchmarkConfig, TOPICS } from "../config"
import { MetricComparison, compareMetrics } from "../utils/stats"
import { countTokens, freeEncoder } from "../utils/token-counter"
import { VersionBuild } from "../utils/version-manager"

export interface TokenConsumptionResults {
    [metric: string]: MetricComparison
}

function getCliOutput(binPath: string, args: string[], env: Record<string, string>): string {
    try {
        return execFileSync("node", [binPath, ...args], {
            encoding: "utf-8",
            env: { ...process.env, ...env },
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 30_000,
        })
    } catch (error_: unknown) {
        const error = error_ as { stderr?: string; stdout?: string }
        // Some commands may exit non-zero but still produce output
        return (error.stdout || "") + (error.stderr || "")
    }
}

export async function runTokenConsumptionBenchmarks(
    oldBuild: VersionBuild,
    newBuild: VersionBuild,
    config: BenchmarkConfig,
    mockBaseUrl: string,
): Promise<TokenConsumptionResults> {
    const results: TokenConsumptionResults = {}
    const env = {
        ACCOUNT_ID: "ACtest1234567890",
        API_KEY: "testkey1234567890",
        FREECLIMB_CLI_BASE_URL: mockBaseUrl,
    }

    try {
        // Root --help tokens
        console.log("  [token-consumption] Root --help tokens...")
        const oldRootHelp = getCliOutput(oldBuild.binPath, ["--help"], env)
        const newRootHelp = getCliOutput(newBuild.binPath, ["--help"], env)
        const oldRootTokens = await countTokens(oldRootHelp)
        const newRootTokens = await countTokens(newRootHelp)
        results["--help tokens"] = compareMetrics([oldRootTokens], [newRootTokens], "tokens")

        // Per-topic help tokens
        console.log("  [token-consumption] Topic help tokens...")
        let oldTopicTotal = 0
        let newTopicTotal = 0
        for (const topic of TOPICS) {
            const oldOutput = getCliOutput(oldBuild.binPath, [topic, "--help"], env)
            const newOutput = getCliOutput(newBuild.binPath, [topic, "--help"], env)
            const oldTokens = await countTokens(oldOutput)
            const newTokens = await countTokens(newOutput)
            results[`${topic} --help tokens`] = compareMetrics([oldTokens], [newTokens], "tokens")
            oldTopicTotal += oldTokens
            newTopicTotal += newTokens
        }

        results["All topic help tokens (sum)"] = compareMetrics(
            [oldTopicTotal],
            [newTopicTotal],
            "tokens",
        )

        // calls:list output tokens
        console.log("  [token-consumption] calls:list output tokens...")
        const oldCallsList = getCliOutput(oldBuild.binPath, ["calls:list"], env)
        const newCallsList = getCliOutput(newBuild.binPath, ["calls:list"], env)
        const oldCallsTokens = await countTokens(oldCallsList)
        const newCallsTokens = await countTokens(newCallsList)
        results["calls:list output tokens"] = compareMetrics(
            [oldCallsTokens],
            [newCallsTokens],
            "tokens",
        )

        // accounts:get output tokens
        console.log("  [token-consumption] accounts:get output tokens...")
        const oldAcctGet = getCliOutput(oldBuild.binPath, ["accounts:get"], env)
        const newAcctGet = getCliOutput(newBuild.binPath, ["accounts:get"], env)
        const oldAcctTokens = await countTokens(oldAcctGet)
        const newAcctTokens = await countTokens(newAcctGet)
        results["accounts:get output tokens"] = compareMetrics(
            [oldAcctTokens],
            [newAcctTokens],
            "tokens",
        )

        // Error message tokens
        console.log("  [token-consumption] Error message tokens...")
        const errorEnv = {
            ...env,
            FREECLIMB_CLI_BASE_URL: mockBaseUrl.replace(
                "/apiserver",
                "/apiserver?_benchmark_error=true",
            ),
        }
        const oldError = getCliOutput(oldBuild.binPath, ["accounts:get"], errorEnv)
        const newError = getCliOutput(newBuild.binPath, ["accounts:get"], errorEnv)
        const oldErrorTokens = await countTokens(oldError)
        const newErrorTokens = await countTokens(newError)
        results["Error message tokens"] = compareMetrics(
            [oldErrorTokens],
            [newErrorTokens],
            "tokens",
        )

        // Output character counts (as proxy for verbosity)
        console.log("  [token-consumption] Output sizes...")
        results["--help output chars"] = compareMetrics(
            [oldRootHelp.length],
            [newRootHelp.length],
            "chars",
        )
        results["calls:list output chars"] = compareMetrics(
            [oldCallsList.length],
            [newCallsList.length],
            "chars",
        )
    } finally {
        freeEncoder()
    }

    return results
}
