/**
 * Statistical functions for benchmark analysis.
 */

export interface Stats {
    max: number
    mean: number
    median: number
    min: number
    p95: number
    samples: number
    stddev: number
    unit: string
}

export function computeStats(values: number[], unit: string = "ms"): Stats {
    if (values.length === 0) {
        return { max: 0, mean: 0, median: 0, min: 0, p95: 0, samples: 0, stddev: 0, unit }
    }

    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length

    const sum = sorted.reduce((a, b) => a + b, 0)
    const mean = sum / n

    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]

    const p95Index = Math.ceil(n * 0.95) - 1
    const p95 = sorted[Math.min(p95Index, n - 1)]

    const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n
    const stddev = Math.sqrt(variance)

    return {
        max: sorted[n - 1],
        mean,
        median,
        min: sorted[0],
        p95,
        samples: n,
        stddev,
        unit,
    }
}

export function percentChange(oldVal: number, newVal: number): number {
    if (oldVal === 0) return newVal === 0 ? 0 : 100
    return ((newVal - oldVal) / oldVal) * 100
}

export type Verdict = "faster" | "n/a" | "new" | "same" | "slower"

export function computeVerdict(oldStats: Stats, newStats: Stats, threshold: number = 5): Verdict {
    if (oldStats.samples === 0 && newStats.samples === 0) return "n/a"
    if (oldStats.samples === 0) return "new"

    const change = percentChange(oldStats.mean, newStats.mean)

    if (Math.abs(change) < threshold) return "same"
    return change < 0 ? "faster" : "slower"
}

export interface MetricComparison {
    change: number
    new: Stats
    old: Stats
    verdict: Verdict
}

export function compareMetrics(
    oldSamples: number[],
    newSamples: number[],
    unit: string = "ms",
    threshold: number = 5,
): MetricComparison {
    const oldStats = computeStats(oldSamples, unit)
    const newStats = computeStats(newSamples, unit)
    const change = percentChange(oldStats.mean, newStats.mean)
    const verdict = computeVerdict(oldStats, newStats, threshold)

    return { change, new: newStats, old: oldStats, verdict }
}

/**
 * Confidence interval (95%) for the mean using t-distribution approximation.
 */
export function confidenceInterval95(stats: Stats): { high: number; low: number } {
    if (stats.samples < 2) return { high: stats.mean, low: stats.mean }
    // Approximate t-value for 95% CI with large-ish samples
    const tValue = stats.samples > 30 ? 1.96 : 2.045
    const margin = tValue * (stats.stddev / Math.sqrt(stats.samples))
    return { high: stats.mean + margin, low: stats.mean - margin }
}
