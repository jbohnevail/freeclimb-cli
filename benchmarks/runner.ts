/**
 * Benchmark Runner — Main orchestrator for freeclimb-cli A/B benchmarks.
 *
 * Usage:
 *   pnpm benchmark                     # All suites
 *   pnpm benchmark --suite startup     # Single suite
 *   pnpm benchmark --old main --new work/main
 *   pnpm benchmark --iterations 10     # Quick run
 *   pnpm benchmark --ci                # CI mode
 */

import { Command } from "commander"

import { BenchmarkConfig, CI_CONFIG, DEFAULT_CONFIG, scaleIterations } from "./config"
import { runCommandExecutionBenchmarks } from "./suites/command-execution.bench"
import { runDevExBenchmarks } from "./suites/devex.bench"
import { runMcpServerBenchmarks } from "./suites/mcp-server.bench"
import { runMemoryBenchmarks } from "./suites/memory.bench"
// Suite imports
import { runStartupBenchmarks } from "./suites/startup.bench"
import { runTokenConsumptionBenchmarks } from "./suites/token-consumption.bench"
import { MockServer, createMockServer } from "./utils/mock-server"
import {
    BenchmarkReport,
    createReport,
    printSummary,
    writeJsonReport,
    writeMarkdownReport,
} from "./utils/reporter"
import { VersionBuild, cleanupWorktrees, prepareVersion } from "./utils/version-manager"

const VALID_SUITES = [
    "startup",
    "command-execution",
    "memory",
    "mcp-server",
    "token-consumption",
    "devex",
] as const

type SuiteName = (typeof VALID_SUITES)[number]

interface RunnerOptions {
    ci: boolean
    iterations?: string
    keepBuilds: boolean
    new: string
    old: string
    outputDir?: string
    suite?: string
}

async function main(): Promise<void> {
    const program = new Command()
    program
        .name("benchmark")
        .description("FreeClimb CLI A/B benchmark runner")
        .option(
            "-s, --suite <name>",
            "Run a single suite (startup, command-execution, memory, mcp-server, token-consumption, devex)",
        )
        .option("--old <ref>", "Git ref for old version", DEFAULT_CONFIG.oldRef)
        .option("--new <ref>", "Git ref for new version", DEFAULT_CONFIG.newRef)
        .option(
            "-i, --iterations <factor>",
            "Iteration multiplier (e.g. 0.5 for quick, 2 for thorough)",
        )
        .option("--ci", "CI mode: fewer iterations, JSON only, exit 1 on regression", false)
        .option("--keep-builds", "Keep worktree builds after run", false)
        .option("-o, --output-dir <dir>", "Output directory for results")
        .parse(process.argv)

    const opts = program.opts<RunnerOptions>()

    // Build config
    let config: BenchmarkConfig = opts.ci ? { ...CI_CONFIG } : { ...DEFAULT_CONFIG }
    config.oldRef = opts.old
    config.newRef = opts.new
    config.keepBuilds = opts.keepBuilds
    config.ciMode = opts.ci

    if (opts.outputDir) {
        config.resultsDir = opts.outputDir
    }

    if (opts.iterations) {
        const factor = Number.parseFloat(opts.iterations)
        if (isNaN(factor) || factor <= 0) {
            console.error("Error: --iterations must be a positive number")
            process.exit(1)
        }

        config = scaleIterations(config, factor)
    }

    // Determine which suites to run
    let suitesToRun: SuiteName[]
    if (opts.suite) {
        if (!VALID_SUITES.includes(opts.suite as SuiteName)) {
            console.error(`Error: Unknown suite "${opts.suite}". Valid: ${VALID_SUITES.join(", ")}`)
            process.exit(1)
        }

        suitesToRun = [opts.suite as SuiteName]
    } else {
        suitesToRun = [...VALID_SUITES]
    }

    console.log("========================================")
    console.log("  FreeClimb CLI Benchmark Suite")
    console.log("========================================")
    console.log(`  Old ref: ${config.oldRef}`)
    console.log(`  New ref: ${config.newRef}`)
    console.log(`  Suites:  ${suitesToRun.join(", ")}`)
    console.log(`  CI mode: ${config.ciMode}`)
    console.log("========================================\n")

    // Step 1: Build both versions
    console.log("[1/4] Building versions...\n")
    let oldBuild: VersionBuild
    let newBuild: VersionBuild

    try {
        oldBuild = prepareVersion(config.oldRef, "old")
        newBuild = prepareVersion(config.newRef, "new")
    } catch (error) {
        console.error("Failed to prepare versions:", error)
        process.exit(1)
    }

    console.log(
        `\n  Old: ${oldBuild.version} @ ${oldBuild.commitSha.slice(0, 8)} (${oldBuild.packageManager})`,
    )
    console.log(
        `  New: ${newBuild.version} @ ${newBuild.commitSha.slice(0, 8)} (${newBuild.packageManager})\n`,
    )

    // Step 2: Start mock server
    console.log("[2/4] Starting mock HTTP server...\n")
    let mockServer: MockServer
    try {
        mockServer = await createMockServer()
        console.log(`  Mock server listening on port ${mockServer.port}`)
        console.log(`  Base URL: ${mockServer.baseUrl}\n`)
    } catch (error) {
        console.error("Failed to start mock server:", error)
        process.exit(1)
    }

    // Step 3: Run suites
    console.log("[3/4] Running benchmark suites...\n")
    const report = createReport(
        config.oldRef,
        config.newRef,
        oldBuild.version,
        newBuild.version,
        oldBuild.commitSha,
        newBuild.commitSha,
    )

    for (const suite of suitesToRun) {
        console.log(`\n--- ${suite} ---\n`)
        mockServer.resetCount()

        try {
            switch (suite) {
                case "startup": {
                    report.suites[suite] = runStartupBenchmarks(oldBuild, newBuild, config)
                    break
                }

                case "command-execution": {
                    report.suites[suite] = runCommandExecutionBenchmarks(
                        oldBuild,
                        newBuild,
                        config,
                        mockServer.baseUrl,
                    )
                    break
                }

                case "memory": {
                    report.suites[suite] = runMemoryBenchmarks(
                        oldBuild,
                        newBuild,
                        config,
                        mockServer.baseUrl,
                    )
                    break
                }

                case "mcp-server": {
                    report.suites[suite] = await runMcpServerBenchmarks(
                        oldBuild,
                        newBuild,
                        config,
                        mockServer.baseUrl,
                    )
                    break
                }

                case "token-consumption": {
                    report.suites[suite] = await runTokenConsumptionBenchmarks(
                        oldBuild,
                        newBuild,
                        config,
                        mockServer.baseUrl,
                    )
                    break
                }

                case "devex": {
                    report.suites[suite] = runDevExBenchmarks(oldBuild, newBuild, config)
                    break
                }
            }

            const metricCount = Object.keys(report.suites[suite] || {}).length
            console.log(`  Completed ${suite}: ${metricCount} metrics collected`)
            console.log(`  Mock server handled ${mockServer.requestCount} requests`)
        } catch (error) {
            console.error(`  Error in suite ${suite}:`, error)
            report.suites[suite] = {}
        }
    }

    // Step 4: Generate reports
    console.log("\n[4/4] Generating reports...\n")
    const jsonPath = writeJsonReport(report, config.resultsDir)
    console.log(`  JSON: ${jsonPath}`)

    if (!config.ciMode) {
        const mdPath = writeMarkdownReport(report, config.resultsDir)
        console.log(`  Markdown: ${mdPath}`)
    }

    // Print summary
    printSummary(report)

    // Cleanup
    await mockServer.close()

    if (!config.keepBuilds) {
        cleanupWorktrees()
    }

    // CI mode: exit 1 if regressions detected
    if (config.ciMode) {
        const allMetrics = Object.values(report.suites).flatMap((s) => Object.values(s))
        const regressions = allMetrics.filter(
            (m) => m.verdict === "slower" && Math.abs(m.change) > config.regressionThreshold,
        )
        if (regressions.length > 0) {
            console.error(
                `\nCI FAILURE: ${regressions.length} regression(s) exceed ${config.regressionThreshold}% threshold`,
            )
            process.exit(1)
        }
    }
}

main().catch((error) => {
    console.error("Benchmark runner failed:", error)
    process.exit(1)
})
