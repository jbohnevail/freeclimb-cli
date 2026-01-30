import ora, { Ora, Options as OraOptions } from "ora"
import { BrandColors, isTTY, supportsColor } from "./theme"
import { icons } from "./chars"

// Spinner animation frames (braille dots pattern)
const SPINNER_FRAMES = ["\u280b", "\u2819", "\u2839", "\u2838", "\u283c", "\u2834", "\u2826", "\u2827", "\u2807", "\u280f"]

export interface SpinnerOptions {
    text?: string
    color?: string
    stream?: NodeJS.WriteStream
}

export interface Spinner {
    start: (text?: string) => Spinner
    stop: () => Spinner
    succeed: (text?: string) => Spinner
    fail: (text?: string) => Spinner
    warn: (text?: string) => Spinner
    info: (text?: string) => Spinner
    text: string
    isSpinning: boolean
}

// Create a styled spinner with FreeClimb theming
export function createSpinner(options: SpinnerOptions = {}): Spinner {
    // If not a TTY or no color support, return a simple logger
    if (!isTTY() || !supportsColor()) {
        return createSimpleSpinner(options)
    }

    const oraOptions: OraOptions = {
        text: options.text || "",
        color: "yellow", // Use yellow as ora doesn't support hex
        spinner: {
            interval: 80,
            frames: SPINNER_FRAMES,
        },
        stream: options.stream || process.stderr,
    }

    const spinner = ora(oraOptions)

    // Override success/fail/warn/info to use our icons
    const originalSucceed = spinner.succeed.bind(spinner)
    const originalFail = spinner.fail.bind(spinner)
    const originalWarn = spinner.warn.bind(spinner)
    const originalInfo = spinner.info.bind(spinner)

    spinner.succeed = (text?: string) => {
        return originalSucceed(text)
    }

    spinner.fail = (text?: string) => {
        return originalFail(text)
    }

    spinner.warn = (text?: string) => {
        return originalWarn(text)
    }

    spinner.info = (text?: string) => {
        return originalInfo(text)
    }

    return spinner
}

// Simple spinner for non-TTY environments (just logs text)
function createSimpleSpinner(options: SpinnerOptions): Spinner {
    let currentText = options.text || ""
    let spinning = false
    const stream = options.stream || process.stderr

    const spinner: Spinner = {
        get text() {
            return currentText
        },
        set text(value: string) {
            currentText = value
        },
        get isSpinning() {
            return spinning
        },
        start(text?: string) {
            if (text) currentText = text
            spinning = true
            // In non-TTY, just log the starting text
            if (currentText) {
                stream.write(`... ${currentText}\n`)
            }
            return spinner
        },
        stop() {
            spinning = false
            return spinner
        },
        succeed(text?: string) {
            spinning = false
            const msg = text || currentText
            if (msg) {
                stream.write(`${icons.success()} ${msg}\n`)
            }
            return spinner
        },
        fail(text?: string) {
            spinning = false
            const msg = text || currentText
            if (msg) {
                stream.write(`${icons.error()} ${msg}\n`)
            }
            return spinner
        },
        warn(text?: string) {
            spinning = false
            const msg = text || currentText
            if (msg) {
                stream.write(`${icons.warning()} ${msg}\n`)
            }
            return spinner
        },
        info(text?: string) {
            spinning = false
            const msg = text || currentText
            if (msg) {
                stream.write(`${icons.info()} ${msg}\n`)
            }
            return spinner
        },
    }

    return spinner
}

// Helper to wrap an async operation with a spinner
export async function withSpinner<T>(
    text: string,
    operation: () => Promise<T>,
    options: {
        successText?: string | ((result: T) => string)
        failText?: string | ((error: Error) => string)
    } = {}
): Promise<T> {
    const spinner = createSpinner({ text })
    spinner.start()

    try {
        const result = await operation()

        const successMsg =
            typeof options.successText === "function"
                ? options.successText(result)
                : options.successText || text

        spinner.succeed(successMsg)
        return result
    } catch (error) {
        const failMsg =
            typeof options.failText === "function"
                ? options.failText(error as Error)
                : options.failText || `Failed: ${text}`

        spinner.fail(failMsg)
        throw error
    }
}

// Create multiple spinners that run sequentially
export async function runChecks<T>(
    checks: Array<{
        text: string
        run: () => Promise<T>
        successText?: string | ((result: T) => string)
        failText?: string | ((error: Error) => string)
    }>
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
    const results: Array<{ success: boolean; result?: T; error?: Error }> = []

    for (const check of checks) {
        try {
            const result = await withSpinner(check.text, check.run, {
                successText: check.successText,
                failText: check.failText,
            })
            results.push({ success: true, result })
        } catch (error) {
            results.push({ success: false, error: error as Error })
        }
    }

    return results
}
