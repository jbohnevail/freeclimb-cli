import chalk from "chalk"
import stripAnsi from "strip-ansi"
import { BrandColors, supportsColor, isTTY, getTerminalWidth, truncate } from "./theme"
import { box, getBoxChars, icons, horizontalRule } from "./chars"

// Create a bordered section header
export function sectionHeader(title: string, width?: number): string {
    const termWidth = width || Math.min(getTerminalWidth(), 60)
    const chars = getBoxChars()

    // Build the top border with title
    const paddedTitle = ` ${title} `
    const titleWidth = paddedTitle.length
    const remainingWidth = Math.max(0, termWidth - titleWidth - 2)

    let topBorder: string
    if (supportsColor()) {
        topBorder = `${chars.topLeft}${chars.horizontal}${chalk.hex(BrandColors.orange).bold(paddedTitle)}${chars.horizontal.repeat(remainingWidth)}${chars.topRight}`
    } else {
        topBorder = `${chars.topLeft}${chars.horizontal}${paddedTitle}${chars.horizontal.repeat(remainingWidth)}${chars.topRight}`
    }

    return topBorder
}

// Create a bordered box with optional title
export function borderedBox(content: string | string[], title?: string, width?: number): string {
    const termWidth = width || Math.min(getTerminalWidth(), 60)
    const chars = getBoxChars()
    const innerWidth = termWidth - 2 // Account for left and right borders

    const lines: string[] = []

    // Top border (with or without title)
    if (title) {
        lines.push(sectionHeader(title, termWidth))
    } else {
        lines.push(`${chars.topLeft}${chars.horizontal.repeat(innerWidth)}${chars.topRight}`)
    }

    // Content lines
    const contentLines = Array.isArray(content) ? content : content.split("\n")
    for (const line of contentLines) {
        const strippedLine = stripAnsi(line)
        const padding = Math.max(0, innerWidth - strippedLine.length)
        lines.push(`${chars.vertical}${line}${" ".repeat(padding)}${chars.vertical}`)
    }

    // Bottom border
    lines.push(`${chars.bottomLeft}${chars.horizontal.repeat(innerWidth)}${chars.bottomRight}`)

    return lines.join("\n")
}

// Create a section separator within a box
export function sectionSeparator(title?: string, width?: number): string {
    const termWidth = width || Math.min(getTerminalWidth(), 60)
    const innerWidth = termWidth - 2
    const chars = getBoxChars()

    if (title) {
        return horizontalRule(title, innerWidth)
    }

    return `${chars.teeRight}${chars.horizontal.repeat(innerWidth)}${chars.teeLeft}`
}

// Display aligned key-value pairs
export interface KeyValuePair {
    key: string
    value: string
    valueColor?: "success" | "warning" | "error" | "info" | "default"
}

export function keyValue(pairs: KeyValuePair[], keyWidth?: number): string[] {
    // Calculate max key width
    const maxKeyLen = keyWidth || Math.max(...pairs.map((p) => p.key.length))

    return pairs.map((pair) => {
        const paddedKey = pair.key.padEnd(maxKeyLen)
        let formattedValue = pair.value

        if (supportsColor() && pair.valueColor) {
            switch (pair.valueColor) {
                case "success":
                    formattedValue = chalk.hex(BrandColors.lime)(pair.value)
                    break
                case "warning":
                    formattedValue = chalk.hex(BrandColors.orange)(pair.value)
                    break
                case "error":
                    formattedValue = chalk.red(pair.value)
                    break
                case "info":
                    formattedValue = chalk.hex(BrandColors.navy)(pair.value)
                    break
            }
        }

        if (supportsColor()) {
            return `  ${chalk.bold(paddedKey)}  ${formattedValue}`
        }

        return `  ${paddedKey}  ${formattedValue}`
    })
}

// Status badge component
export type StatusType = "active" | "pending" | "failed" | "suspended" | "closed" | "trial" | "full" | "unknown"

export function statusBadge(status: string): string {
    const normalizedStatus = status.toLowerCase() as StatusType

    if (!supportsColor()) {
        return status.toUpperCase()
    }

    switch (normalizedStatus) {
        case "active":
        case "full":
            return `${icons.active()} ${chalk.hex(BrandColors.lime).bold(status.toUpperCase())}`
        case "pending":
            return `${icons.pending()} ${chalk.hex(BrandColors.orange)(status.toUpperCase())}`
        case "trial":
            return chalk.hex(BrandColors.orange).bold(status.toUpperCase())
        case "failed":
        case "suspended":
        case "closed":
            return `${icons.error()} ${chalk.red.bold(status.toUpperCase())}`
        default:
            return status.toUpperCase()
    }
}

// Simple status indicator (just the icon and text)
export function statusIndicator(status: "pass" | "fail" | "warn" | "info", text: string): string {
    const icon = {
        pass: icons.success(),
        fail: icons.error(),
        warn: icons.warning(),
        info: icons.info(),
    }[status]

    const colorFn = supportsColor()
        ? {
              pass: chalk.hex(BrandColors.lime),
              fail: chalk.red,
              warn: chalk.hex(BrandColors.orange),
              info: chalk.dim,
          }[status]
        : (s: string) => s

    return `${icon} ${colorFn(text)}`
}

// Render a simple progress bar
export function progressBar(current: number, total: number, width = 20): string {
    const percentage = Math.min(1, Math.max(0, current / total))
    const filled = Math.round(percentage * width)
    const empty = width - filled

    const filledChar = "\u2588"
    const emptyChar = "\u2591"

    let bar = filledChar.repeat(filled) + emptyChar.repeat(empty)

    if (supportsColor()) {
        bar = chalk.hex(BrandColors.lime)(filledChar.repeat(filled)) + chalk.dim(emptyChar.repeat(empty))
    }

    const percentText = `${Math.round(percentage * 100)}%`

    return `${bar} ${percentText}`
}

// Render a quick actions section
export function quickActions(actions: Array<{ command: string; description: string }>): string[] {
    const lines: string[] = []

    if (supportsColor()) {
        lines.push(chalk.dim("Quick Actions:"))
    } else {
        lines.push("Quick Actions:")
    }

    for (const action of actions) {
        const cmd = supportsColor()
            ? chalk.hex(BrandColors.orange)(action.command)
            : action.command
        const desc = supportsColor() ? chalk.dim(action.description) : action.description
        lines.push(`  ${cmd}  ${desc}`)
    }

    return lines
}

// Empty state message
export function emptyState(message: string, suggestion?: string): string {
    const lines: string[] = []

    if (supportsColor()) {
        lines.push(chalk.dim(message))
        if (suggestion) {
            lines.push("")
            lines.push(chalk.dim(`Try: ${chalk.hex(BrandColors.orange)(suggestion)}`))
        }
    } else {
        lines.push(message)
        if (suggestion) {
            lines.push("")
            lines.push(`Try: ${suggestion}`)
        }
    }

    return lines.join("\n")
}
