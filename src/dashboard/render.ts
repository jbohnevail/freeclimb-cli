import React from "react"
import { render, Box } from "ink"
import { JSONUIProvider } from "@json-render/ink"
import { createStateStore } from "@json-render/core"
import { getTerminalWidth } from "../ui/theme.js"
import { TerminalWidthProvider } from "../ui/ink/terminal-context.js"
import { FreeclimbRenderer } from "./catalog.js"
import { DashboardDataManager } from "./data.js"
import type { DashboardSpec } from "./types.js"

interface DashboardAppProps {
    spec: DashboardSpec
    width: number
}

function DashboardApp({ spec, width }: DashboardAppProps): React.ReactElement {
    return React.createElement(
        TerminalWidthProvider,
        { value: width },
        React.createElement(
            Box,
            { flexDirection: "column", width },
            React.createElement(FreeclimbRenderer, { spec } as any),
        ),
    )
}

export interface RenderOptions {
    once?: boolean
    refreshMs: number
    spec: DashboardSpec
}

export async function renderDashboard({
    spec,
    refreshMs,
    once,
}: RenderOptions): Promise<void> {
    const width = getTerminalWidth()
    const stateStore = createStateStore(spec.state || {})

    const dataManager = new DashboardDataManager((updates) => {
        for (const { path, value } of updates) {
            stateStore.set(path, value)
        }
    })

    const instance = render(
        React.createElement(
            JSONUIProvider as any,
            { initialState: spec.state || {} },
            React.createElement(DashboardApp, { spec, width }),
        ),
    )

    const cleanup = () => {
        dataManager.stop()
        instance.unmount()
    }

    process.on("SIGINT", () => {
        cleanup()
        process.exit(0)
    })

    process.on("SIGTERM", () => {
        cleanup()
        process.exit(0)
    })

    if (once) {
        try {
            await dataManager.start(spec, refreshMs)
            await new Promise((resolve) => setTimeout(resolve, 100))
        } finally {
            cleanup()
        }
    } else {
        await dataManager.start(spec, refreshMs)
        await instance.waitUntilExit()
    }
}
