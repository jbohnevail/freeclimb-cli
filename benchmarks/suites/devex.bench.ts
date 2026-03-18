/**
 * Category 6: Developer Experience
 *
 * Measures build time, test suite time, bundle size, dependency count,
 * node_modules size, and source line count.
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { BenchmarkConfig } from "../config"
import { MetricComparison, compareMetrics } from "../utils/stats"
import {
    VersionBuild,
    countDependencies,
    countSourceLines,
    getLibSize,
    getNodeModulesSize,
} from "../utils/version-manager"

export interface DevExResults {
    [metric: string]: MetricComparison
}

function measureBuildTime(worktreePath: string, iterations: number): number[] {
    const samples: number[] = []

    for (let i = 0; i < iterations; i++) {
        // Clean build artifacts
        const libDir = path.join(worktreePath, "lib")
        const buildInfoFile = path.join(worktreePath, "tsconfig.tsbuildinfo")
        if (fs.existsSync(libDir)) {
            fs.rmSync(libDir, { force: true, recursive: true })
        }

        if (fs.existsSync(buildInfoFile)) {
            fs.rmSync(buildInfoFile, { force: true })
        }

        const start = process.hrtime.bigint()
        try {
            execSync("npx tsc -b", {
                cwd: worktreePath,
                encoding: "utf-8",
                stdio: "pipe",
                timeout: 120_000,
            })
        } catch {
            // Build may have warnings but still succeed
        }

        const end = process.hrtime.bigint()
        samples.push(Number(end - start) / 1_000_000)
    }

    return samples
}

function measureTestTime(
    worktreePath: string,
    pm: "npm" | "pnpm" | "yarn",
    iterations: number,
): number[] {
    const samples: number[] = []
    const testCmd = pm === "pnpm" ? "pnpm test" : pm === "yarn" ? "yarn test" : "npm test"

    for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint()
        try {
            execSync(testCmd, {
                cwd: worktreePath,
                encoding: "utf-8",
                env: {
                    ...process.env,
                    ACCOUNT_ID: "ACtest1234567890",
                    API_KEY: "testkey1234567890",
                    NODE_ENV: "test",
                },
                stdio: "pipe",
                timeout: 300_000,
            })
        } catch {
            // Tests may fail but we still record the time
        }

        const end = process.hrtime.bigint()
        samples.push(Number(end - start) / 1_000_000)
    }

    return samples
}

export function runDevExBenchmarks(
    oldBuild: VersionBuild,
    newBuild: VersionBuild,
    config: BenchmarkConfig,
): DevExResults {
    const results: DevExResults = {}

    // Build time
    console.log("  [devex] Build time (clean tsc -b)...")
    const oldBuildTimes = measureBuildTime(oldBuild.worktreePath, config.iterations.buildTime)
    const newBuildTimes = measureBuildTime(newBuild.worktreePath, config.iterations.buildTime)
    results["Build time (tsc -b)"] = compareMetrics(oldBuildTimes, newBuildTimes)

    // Rebuild after build time (to restore lib/ for other measurements)
    try {
        execSync("npx tsc -b", {
            cwd: oldBuild.worktreePath,
            stdio: "pipe",
            timeout: 120_000,
        })
        execSync("npx tsc -b", {
            cwd: newBuild.worktreePath,
            stdio: "pipe",
            timeout: 120_000,
        })
    } catch {
        // ignore
    }

    // lib/ bundle size
    console.log("  [devex] Bundle size (lib/)...")
    const oldLibSize = getLibSize(oldBuild.worktreePath)
    const newLibSize = getLibSize(newBuild.worktreePath)
    results["lib/ bundle size (MB)"] = compareMetrics([oldLibSize], [newLibSize], "MB")

    // node_modules/ size
    console.log("  [devex] node_modules/ size...")
    const oldNmSize = getNodeModulesSize(oldBuild.worktreePath)
    const newNmSize = getNodeModulesSize(newBuild.worktreePath)
    results["node_modules/ size (MB)"] = compareMetrics([oldNmSize], [newNmSize], "MB")

    // Dependency count
    console.log("  [devex] Dependency count...")
    const oldDeps = countDependencies(oldBuild.worktreePath)
    const newDeps = countDependencies(newBuild.worktreePath)
    results["Dependency count (package.json)"] = compareMetrics([oldDeps], [newDeps], "deps")

    // Source line count
    console.log("  [devex] Source line count...")
    const oldLines = countSourceLines(oldBuild.worktreePath)
    const newLines = countSourceLines(newBuild.worktreePath)
    results["Source lines (src/**/*.ts)"] = compareMetrics([oldLines], [newLines], "lines")

    // Test suite time (optional — can be slow)
    if (config.iterations.testSuite > 0) {
        console.log("  [devex] Test suite time...")
        const oldTestTimes = measureTestTime(
            oldBuild.worktreePath,
            oldBuild.packageManager,
            config.iterations.testSuite,
        )
        const newTestTimes = measureTestTime(
            newBuild.worktreePath,
            newBuild.packageManager,
            config.iterations.testSuite,
        )
        results["Test suite time"] = compareMetrics(oldTestTimes, newTestTimes)
    }

    return results
}
