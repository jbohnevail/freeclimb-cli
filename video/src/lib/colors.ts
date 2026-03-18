/**
 * Brand color constants matching src/ui/theme.ts
 */

export const BRAND = {
    darkTeal: "#004e63",
    lightTeal: "#26697a",
    orange: "#fa660a",
    lime: "#c2ff18",
    red: "#f85149",
    dimText: "#8b949e",
    termBg: "#0d1117",
    termSurface: "#161b22",
    border: "#30363d",
    text: "#e6edf3",
    white: "#ffffff",
    promptGreen: "#27c93f",
    cyan: "#00d4ff",
    yellow: "#e3b341",
} as const

export const STATUS_COLORS: Record<string, string> = {
    completed: BRAND.lime,
    active: BRAND.lime,
    healthy: BRAND.lime,
    delivered: BRAND.lime,
    passed: BRAND.lime,
    ringing: BRAND.orange,
    pending: BRAND.orange,
    queued: BRAND.orange,
    warning: BRAND.orange,
    trial: BRAND.orange,
    failed: BRAND.red,
    error: BRAND.red,
}
