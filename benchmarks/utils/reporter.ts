import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { MetricComparison, Stats, Verdict, confidenceInterval95 } from "./stats"

export interface SuiteResults {
    [metric: string]: MetricComparison
}

export interface BenchmarkReport {
    meta: {
        arch: string
        cpus: number
        newCommit: string
        newRef: string
        newVersion: string
        nodeVersion: string
        oldCommit: string
        oldRef: string
        oldVersion: string
        platform: string
        timestamp: string
    }
    suites: {
        [suiteName: string]: SuiteResults
    }
}

export function createReport(
    oldRef: string,
    newRef: string,
    oldVersion: string,
    newVersion: string,
    oldCommit: string,
    newCommit: string,
): BenchmarkReport {
    return {
        meta: {
            arch: os.arch(),
            cpus: os.cpus().length,
            newCommit,
            newRef,
            newVersion,
            nodeVersion: process.version,
            oldCommit,
            oldRef,
            oldVersion,
            platform: `${os.platform()} ${os.release()}`,
            timestamp: new Date().toISOString(),
        },
        suites: {},
    }
}

export function writeJsonReport(report: BenchmarkReport, outputDir: string): string {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    const filePath = path.join(outputDir, "latest.json")
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2))
    return filePath
}

export function writeMarkdownReport(report: BenchmarkReport, outputDir: string): string {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    const lines: string[] = []

    lines.push(
        "# FreeClimb CLI Benchmark Results",
        "",
        `**Date:** ${report.meta.timestamp}`,
        `**Platform:** ${report.meta.platform} (${report.meta.arch})`,
        `**Node:** ${report.meta.nodeVersion}`,
        `**CPUs:** ${report.meta.cpus}`,
        "",
        "| Version | Ref | Commit | Package Version |",
        "|---------|-----|--------|-----------------|",
    )
    lines.push(
        `| Old | \`${report.meta.oldRef}\` | \`${report.meta.oldCommit.slice(0, 8)}\` | ${report.meta.oldVersion} |`,
    )
    lines.push(
        `| New | \`${report.meta.newRef}\` | \`${report.meta.newCommit.slice(0, 8)}\` | ${report.meta.newVersion} |`,
        "",
    )

    for (const [suiteName, metrics] of Object.entries(report.suites)) {
        lines.push(
            `## ${formatSuiteName(suiteName)}`,
            "",
            "| Metric | Old (mean ± stddev) | New (mean ± stddev) | Change | Verdict |",
            "|--------|--------------------:|--------------------:|-------:|:-------:|",
        )

        for (const [metricName, comparison] of Object.entries(metrics)) {
            const oldStr = formatStats(comparison.old)
            const newStr = formatStats(comparison.new)
            const changeStr = formatChange(comparison.change)
            const verdictStr = formatVerdict(comparison.verdict)

            lines.push(`| ${metricName} | ${oldStr} | ${newStr} | ${changeStr} | ${verdictStr} |`)
        }

        lines.push("")
    }

    // Summary
    lines.push("## Summary", "")
    const allMetrics = Object.values(report.suites).flatMap((s) => Object.values(s))
    const faster = allMetrics.filter((m) => m.verdict === "faster").length
    const slower = allMetrics.filter((m) => m.verdict === "slower").length
    const same = allMetrics.filter((m) => m.verdict === "same").length
    const total = allMetrics.length

    lines.push(`- **Total metrics:** ${total}`)
    lines.push(`- **Faster:** ${faster} (${pct(faster, total)})`)
    lines.push(`- **Slower:** ${slower} (${pct(slower, total)})`)
    lines.push(`- **Same:** ${same} (${pct(same, total)})`, "")

    if (slower > 0) {
        lines.push("### Regressions", "")
        for (const [suiteName, metrics] of Object.entries(report.suites)) {
            for (const [metricName, comparison] of Object.entries(metrics)) {
                if (comparison.verdict === "slower") {
                    lines.push(
                        `- **${suiteName} / ${metricName}**: ${formatChange(comparison.change)}`,
                    )
                }
            }
        }

        lines.push("")
    }

    const filePath = path.join(outputDir, "latest.md")
    fs.writeFileSync(filePath, lines.join("\n"))
    return filePath
}

function formatSuiteName(name: string): string {
    return name
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
}

function formatStats(stats: Stats): string {
    if (stats.samples === 0) return "n/a"
    const ci = confidenceInterval95(stats)
    return `${fmt(stats.mean)} ± ${fmt(stats.stddev)} ${stats.unit}`
}

function formatChange(change: number): string {
    const sign = change > 0 ? "+" : ""
    return `${sign}${change.toFixed(1)}%`
}

function formatVerdict(verdict: Verdict): string {
    switch (verdict) {
        case "faster": {
            return "**faster**"
        }

        case "slower": {
            return "***slower***"
        }

        case "same": {
            return "same"
        }

        case "new": {
            return "new"
        }

        case "n/a": {
            return "n/a"
        }
    }
}

function fmt(n: number): string {
    if (n >= 1000) return n.toFixed(0)
    if (n >= 100) return n.toFixed(1)
    if (n >= 1) return n.toFixed(2)
    return n.toFixed(3)
}

function pct(count: number, total: number): string {
    if (total === 0) return "0%"
    return `${((count / total) * 100).toFixed(0)}%`
}

/**
 * Print a compact summary to stdout.
 */
export function printSummary(report: BenchmarkReport): void {
    console.log("\n========================================")
    console.log("  BENCHMARK SUMMARY")
    console.log("========================================\n")
    console.log(
        `  Old: ${report.meta.oldRef} (${report.meta.oldVersion}) @ ${report.meta.oldCommit.slice(0, 8)}`,
    )
    console.log(
        `  New: ${report.meta.newRef} (${report.meta.newVersion}) @ ${report.meta.newCommit.slice(0, 8)}`,
    )
    console.log("")

    for (const [suiteName, metrics] of Object.entries(report.suites)) {
        console.log(`  --- ${formatSuiteName(suiteName)} ---`)
        for (const [metricName, comparison] of Object.entries(metrics)) {
            const changeStr = formatChange(comparison.change)
            const { verdict } = comparison
            const prefix = verdict === "faster" ? "  [+]" : verdict === "slower" ? "  [!]" : "  [ ]"
            console.log(`${prefix} ${metricName}: ${changeStr} (${verdict})`)
        }

        console.log("")
    }

    const allMetrics = Object.values(report.suites).flatMap((s) => Object.values(s))
    const regressions = allMetrics.filter((m) => m.verdict === "slower")
    if (regressions.length > 0) {
        console.log(`  WARNING: ${regressions.length} regression(s) detected!`)
    } else {
        console.log("  No regressions detected.")
    }

    console.log("\n========================================\n")
}
