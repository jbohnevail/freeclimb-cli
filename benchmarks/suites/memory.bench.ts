/**
 * Category 3: Memory & Resource Usage
 *
 * Measures RSS, heap usage, and GC pressure for various commands.
 */

import { BenchmarkConfig } from "../config"
import { collectMemorySamples } from "../utils/memory"
import { MetricComparison, compareMetrics } from "../utils/stats"
import { VersionBuild } from "../utils/version-manager"

export interface MemoryResults {
    [metric: string]: MetricComparison
}

export function runMemoryBenchmarks(
    oldBuild: VersionBuild,
    newBuild: VersionBuild,
    config: BenchmarkConfig,
    mockBaseUrl: string,
): MemoryResults {
    const results: MemoryResults = {}
    const env = {
        ACCOUNT_ID: "ACtest1234567890",
        API_KEY: "testkey1234567890",
        FREECLIMB_CLI_BASE_URL: mockBaseUrl,
    }

    const iterations = Math.max(3, Math.round(config.iterations.commandExec / 2))

    // Peak RSS at startup (--version)
    console.log("  [memory] Peak RSS at startup...")
    const oldStartup = collectMemorySamples(oldBuild.binPath, ["--version"], env, iterations)
    const newStartup = collectMemorySamples(newBuild.binPath, ["--version"], env, iterations)
    results["Peak RSS at startup (MB)"] = compareMetrics(oldStartup.rss, newStartup.rss, "MB")
    results["Heap used at startup (MB)"] = compareMetrics(
        oldStartup.heapUsed,
        newStartup.heapUsed,
        "MB",
    )

    // Heap during calls:list
    console.log("  [memory] Heap during calls:list...")
    const oldCallsList = collectMemorySamples(oldBuild.binPath, ["calls:list"], env, iterations)
    const newCallsList = collectMemorySamples(newBuild.binPath, ["calls:list"], env, iterations)
    results["Peak RSS during calls:list (MB)"] = compareMetrics(
        oldCallsList.rss,
        newCallsList.rss,
        "MB",
    )
    results["Heap used during calls:list (MB)"] = compareMetrics(
        oldCallsList.heapUsed,
        newCallsList.heapUsed,
        "MB",
    )

    // Heap during --help
    console.log("  [memory] Heap during --help...")
    const oldHelp = collectMemorySamples(oldBuild.binPath, ["--help"], env, iterations)
    const newHelp = collectMemorySamples(newBuild.binPath, ["--help"], env, iterations)
    results["Peak RSS during --help (MB)"] = compareMetrics(oldHelp.rss, newHelp.rss, "MB")

    // GC pressure: run 5 commands sequentially, measure heap growth
    console.log("  [memory] GC pressure (sequential commands)...")
    const oldGcSamples = measureGcPressure(oldBuild.binPath, env, 3)
    const newGcSamples = measureGcPressure(newBuild.binPath, env, 3)
    results["Heap growth over 5 runs (MB)"] = compareMetrics(oldGcSamples, newGcSamples, "MB")

    return results
}

function measureGcPressure(
    binPath: string,
    env: Record<string, string>,
    iterations: number,
): number[] {
    const samples: number[] = []

    for (let i = 0; i < iterations; i++) {
        const commands = [["--version"], ["--help"], ["--version"], ["--help"], ["--version"]]

        const memSamples: number[] = []
        for (const args of commands) {
            const result = collectMemorySamples(binPath, args, env, 1)
            memSamples.push(result.heapUsed[0])
        }

        // Growth = last - first
        const growth = memSamples.at(-1) - memSamples[0]
        samples.push(Math.abs(growth))
    }

    return samples
}
