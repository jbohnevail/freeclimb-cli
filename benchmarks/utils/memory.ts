import { execFileSync } from "node:child_process"
import path from "node:path"

export interface MemorySnapshot {
    arrayBuffers: number
    external: number
    heapTotal: number
    heapUsed: number
    rss: number
}

/**
 * Spawn a CLI command in a subprocess and measure its peak memory usage.
 * Uses a wrapper script that reports process.memoryUsage() at exit.
 */
export function measureCommandMemory(
    binPath: string,
    args: string[],
    env: Record<string, string>,
): MemorySnapshot {
    const wrapperScript = `
    const origExit = process.exit;
    let peakRss = 0;
    let peakHeapUsed = 0;
    let lastUsage = process.memoryUsage();

    const interval = setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.rss > peakRss) peakRss = usage.rss;
      if (usage.heapUsed > peakHeapUsed) peakHeapUsed = usage.heapUsed;
      lastUsage = usage;
    }, 10);

    process.exit = function(code) {
      clearInterval(interval);
      const final = process.memoryUsage();
      if (final.rss > peakRss) peakRss = final.rss;
      if (final.heapUsed > peakHeapUsed) peakHeapUsed = final.heapUsed;
      process.stdout.write("\\n__MEMORY__" + JSON.stringify({
        rss: peakRss,
        heapTotal: final.heapTotal,
        heapUsed: peakHeapUsed,
        external: final.external,
        arrayBuffers: final.arrayBuffers || 0
      }) + "__MEMORY__\\n");
      origExit.call(process, code);
    };

    // Also capture on normal exit
    process.on("beforeExit", () => {
      clearInterval(interval);
      const final = process.memoryUsage();
      if (final.rss > peakRss) peakRss = final.rss;
      process.stdout.write("\\n__MEMORY__" + JSON.stringify({
        rss: peakRss,
        heapTotal: final.heapTotal,
        heapUsed: final.heapUsed > peakHeapUsed ? final.heapUsed : peakHeapUsed,
        external: final.external,
        arrayBuffers: final.arrayBuffers || 0
      }) + "__MEMORY__\\n");
    });
  `

    const nodeArgs = [
        "-e",
        wrapperScript + `\nrequire("${binPath.replaceAll("\\", "/")}")`,
        ...args,
    ]

    try {
        const output = execFileSync("node", nodeArgs, {
            encoding: "utf-8",
            env: { ...process.env, ...env },
            maxBuffer: 10 * 1024 * 1024,
            timeout: 30_000,
        })

        return parseMemoryOutput(output)
    } catch (error_: unknown) {
        // Command may exit with non-zero but still output memory data
        const error = error_ as { stderr?: string; stdout?: string }
        if (error.stdout) {
            return parseMemoryOutput(error.stdout)
        }

        return { arrayBuffers: 0, external: 0, heapTotal: 0, heapUsed: 0, rss: 0 }
    }
}

function parseMemoryOutput(output: string): MemorySnapshot {
    const match = output.match(/__MEMORY__(.+?)__MEMORY__/)
    if (match) {
        return JSON.parse(match[1]) as MemorySnapshot
    }

    return { arrayBuffers: 0, external: 0, heapTotal: 0, heapUsed: 0, rss: 0 }
}

/**
 * Convert bytes to megabytes with 2 decimal places.
 */
export function bytesToMB(bytes: number): number {
    return Math.round((bytes / (1024 * 1024)) * 100) / 100
}

/**
 * Measure memory for a CLI command multiple times and return RSS samples in MB.
 */
export function collectMemorySamples(
    binPath: string,
    args: string[],
    env: Record<string, string>,
    iterations: number,
): { heapUsed: number[]; rss: number[] } {
    const rssSamples: number[] = []
    const heapSamples: number[] = []

    for (let i = 0; i < iterations; i++) {
        const snapshot = measureCommandMemory(binPath, args, env)
        rssSamples.push(bytesToMB(snapshot.rss))
        heapSamples.push(bytesToMB(snapshot.heapUsed))
    }

    return { heapUsed: heapSamples, rss: rssSamples }
}
