/**
 * High-resolution timer using process.hrtime.bigint().
 * Returns durations in milliseconds with nanosecond precision.
 */

export interface TimingResult {
    durationMs: number
    durationNs: bigint
}

export function startTimer(): bigint {
    return process.hrtime.bigint()
}

export function stopTimer(start: bigint): TimingResult {
    const end = process.hrtime.bigint()
    const durationNs = end - start
    const durationMs = Number(durationNs) / 1_000_000
    return { durationMs, durationNs }
}

/**
 * Time a synchronous or async function, returning both the result and timing.
 */
export async function timeAsync<T>(
    fn: () => Promise<T>,
): Promise<{ result: T; timing: TimingResult }> {
    const start = startTimer()
    const result = await fn()
    const timing = stopTimer(start)
    return { result, timing }
}

export function timeSync<T>(fn: () => T): { result: T; timing: TimingResult } {
    const start = startTimer()
    const result = fn()
    const timing = stopTimer(start)
    return { result, timing }
}

/**
 * Run a function multiple times and collect timing samples.
 */
export async function collectSamples(
    fn: () => Promise<void> | void,
    iterations: number,
    warmup: number = 0,
): Promise<number[]> {
    // Warmup runs (discarded)
    for (let i = 0; i < warmup; i++) {
        await fn()
    }

    const samples: number[] = []
    for (let i = 0; i < iterations; i++) {
        const start = startTimer()
        await fn()
        const { durationMs } = stopTimer(start)
        samples.push(durationMs)
    }

    return samples
}
