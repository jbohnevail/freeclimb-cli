import React from "react"
import { Box, Text } from "ink"
import { BrandColors, supportsColor, getTerminalWidth } from "../theme"

export interface TableColumn {
    header: string
    key: string
    width?: number
}

export interface TableProps {
    columns: TableColumn[]
    rows: Record<string, unknown>[]
    title?: string
}

const STATUS_COLORS: Record<string, string> = {
    active: BrandColors.lime,
    completed: BrandColors.lime,
    answered: BrandColors.lime,
    delivered: BrandColors.lime,
    sent: BrandColors.lime,
    queued: BrandColors.orange,
    pending: BrandColors.orange,
    ringing: BrandColors.orange,
    "in-progress": BrandColors.orange,
    inprogress: BrandColors.orange,
    failed: "#ff0000",
    busy: "#ff0000",
    "no-answer": "#ff0000",
    noanswer: "#ff0000",
    canceled: "#ff0000",
    cancelled: "#ff0000",
}

function getStatusColor(value: string): string | undefined {
    if (!supportsColor()) return undefined
    const normalized = value.toLowerCase().replace(/[_\s]/g, "-")
    return STATUS_COLORS[normalized]
}

function truncateText(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text
    if (maxLen <= 1) return "\u2026"
    return text.slice(0, maxLen - 1) + "\u2026"
}

function computeColumnWidths(
    rows: Record<string, unknown>[],
    columns: TableColumn[],
): number[] {
    const termWidth = getTerminalWidth()
    const rawWidths = columns.map((col) => {
        const headerLen = col.header.length
        const maxDataLen = rows.length > 0
            ? Math.max(...rows.map((row) => String(row[col.key] ?? "").length))
            : 0
        return col.width || Math.max(headerLen, maxDataLen, 10)
    })

    // Shrink proportionally if wider than terminal
    const totalRaw = rawWidths.reduce((a, b) => a + b, 0)
    const overhead = (columns.length - 1) * 2 + 4 // gaps + borders
    const available = termWidth - overhead

    if (totalRaw > available && available > columns.length) {
        return rawWidths.map((w) => Math.max(6, Math.floor((w / totalRaw) * available)))
    }

    return rawWidths
}

export function Table({ rows, columns, title }: TableProps): React.ReactElement {
    if (rows.length === 0) {
        return <Text dimColor>No data available</Text>
    }

    const colWidths = computeColumnWidths(rows, columns)
    const borderColor = supportsColor() ? BrandColors.lightTeal : undefined

    return (
        <Box
            borderColor={borderColor}
            borderStyle="round"
            flexDirection="column"
            paddingX={1}
        >
            {title && (
                <Box marginBottom={0}>
                    <Text bold color={supportsColor() ? BrandColors.orange : undefined}>
                        {title}
                    </Text>
                </Box>
            )}

            {/* Header row */}
            <Box>
                {columns.map((col, i) => (
                    <Box key={col.key} width={colWidths[i] + 2}>
                        <Text bold>{col.header.padEnd(colWidths[i])}</Text>
                    </Box>
                ))}
            </Box>

            {/* Separator */}
            <Box>
                <Text dimColor>
                    {columns.map((_, i) => "\u2500".repeat(colWidths[i])).join("  ")}
                </Text>
            </Box>

            {/* Data rows */}
            {rows.map((row, rowIdx) => (
                <Box key={rowIdx}>
                    {columns.map((col, i) => {
                        const val = String(row[col.key] ?? "")
                        const display = truncateText(val, colWidths[i]).padEnd(colWidths[i])
                        const isStatus = col.key.toLowerCase() === "status"
                        const statusColor = isStatus ? getStatusColor(val) : undefined

                        return (
                            <Box key={col.key} width={colWidths[i] + 2}>
                                <Text color={statusColor}>{display}</Text>
                            </Box>
                        )
                    })}
                </Box>
            ))}
        </Box>
    )
}
