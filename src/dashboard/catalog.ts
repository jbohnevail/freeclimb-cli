import { defineCatalog } from "@json-render/core"
import {
    schema,
    standardComponentDefinitions,
    standardActionDefinitions,
    standardComponents,
    createRenderer,
} from "@json-render/ink"
import { z } from "zod"
import { CallStatusCard } from "./components/call-status-card.js"
import { QueueDepthGauge } from "./components/queue-depth-gauge.js"
import { LogStream } from "./components/log-stream.js"

const customComponentDefinitions = {
    CallStatusCard: {
        props: z.object({
            callId: z.string(),
            from: z.string(),
            to: z.string(),
            status: z.string(),
            direction: z.string().nullable().default(null),
            duration: z.number().nullable().default(null),
        }),
        description:
            "A FreeClimb call record card showing call ID, from/to numbers, status badge, direction, and duration. Use for individual call details.",
    },
    QueueDepthGauge: {
        props: z.object({
            alias: z.string(),
            currentSize: z.number(),
            maxSize: z.number(),
            averageWaitTime: z.number().nullable().default(null),
        }),
        description:
            "A gauge showing queue fill level as a progress bar with queue name, current/max size, and average wait time. Use for queue monitoring.",
    },
    LogStream: {
        props: z.object({
            entries: z.array(
                z.object({
                    timestamp: z.string(),
                    level: z.string(),
                    message: z.string(),
                }),
            ),
            maxLines: z.number().nullable().default(null),
        }),
        description:
            "A scrollable log view with level-based coloring (error=red, warning=yellow, info=blue). Use for showing recent log entries.",
    },
}

export const freeclimbCatalog = defineCatalog(schema, {
    components: {
        ...standardComponentDefinitions,
        ...customComponentDefinitions,
    },
    actions: standardActionDefinitions,
})

export const FreeclimbRenderer = createRenderer(freeclimbCatalog, {
    ...standardComponents,
    CallStatusCard,
    QueueDepthGauge,
    LogStream,
} as any)

export function getDashboardPrompt(customRules?: string[]): string {
    const rules = [
        "Use FreeClimb brand colors: lightTeal=#26697a, orange=#fa660a, lime=#c2ff18",
        "Use Metric components for KPI cards at the top of dashboards",
        "Use Table for listing resources (calls, SMS, queues)",
        "Use BarChart or Sparkline for visualizing counts by status",
        "Use CallStatusCard for individual call details",
        "Use QueueDepthGauge for queue fill levels",
        "Use LogStream for log entries",
        "Use StatusLine for refresh timestamps and status messages",
        "Wrap sections in Card components with descriptive titles",
        "Use Box with flexDirection='row' to place metrics side by side",
        ...(customRules || []),
    ]

    return freeclimbCatalog.prompt({
        system: "You are a FreeClimb monitoring dashboard generator. Generate terminal UI dashboards for monitoring voice calls, SMS messages, queues, conferences, and system health using the FreeClimb communications API.",
        customRules: rules,
    })
}
