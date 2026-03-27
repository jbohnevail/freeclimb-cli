import chalk from "chalk"
import { deleteTempApp } from "./app-manager.js"
import { restoreNumber } from "./number-manager.js"
import { readDevState, removeDevState, type DevState } from "./state.js"

type Logger = { log(msg: string): void }

let cleaning = false

export async function performCleanup(
    state: DevState,
    dataDir: string,
    logger: Logger,
    jsonMode: boolean,
): Promise<void> {
    if (cleaning) return
    cleaning = true

    try {
        // Restore number assignments
        for (const assignment of state.numberAssignments) {
            try {
                await restoreNumber(assignment.phoneNumberId, assignment.previousApplicationId)
                if (!jsonMode) {
                    logger.log(
                        chalk.green(`  ✔ Restored ${assignment.phoneNumberId} → ${assignment.previousApplicationId || "none"}`),
                    )
                }
            } catch (err: unknown) {
                const error = err as Error
                if (!jsonMode) {
                    logger.log(chalk.yellow(`  ⚠ Could not restore ${assignment.phoneNumberId}: ${error.message}`))
                }
            }
        }

        // Delete temp application
        if (state.isTemporary) {
            try {
                await deleteTempApp(state.applicationId)
                if (!jsonMode) {
                    logger.log(chalk.green(`  ✔ Deleted temp application ${state.applicationId}`))
                }
            } catch (err: unknown) {
                const error = err as Error
                if (!jsonMode) {
                    logger.log(chalk.yellow(`  ⚠ Could not delete application ${state.applicationId}: ${error.message}`))
                }
            }
        }

        // Remove state file
        removeDevState(dataDir)
    } finally {
        cleaning = false
    }
}

export async function cleanupStaleState(dataDir: string, logger: Logger, jsonMode: boolean): Promise<boolean> {
    const state = readDevState(dataDir)
    if (!state) return false

    if (!jsonMode) {
        logger.log(chalk.yellow(`Found stale dev session from ${state.createdAt}`))
        logger.log(chalk.yellow(`  Application: ${state.applicationId}`))
        logger.log(chalk.dim("  Cleaning up..."))
    }

    await performCleanup(state, dataDir, logger, jsonMode)
    return true
}

export function registerCleanupHandlers(
    getState: () => DevState | null,
    dataDir: string,
    logger: Logger,
    jsonMode: boolean,
    onDone: () => void,
): void {
    const handler = async () => {
        const state = getState()
        if (state) {
            if (!jsonMode) logger.log(chalk.dim("\nCleaning up..."))
            await performCleanup(state, dataDir, logger, jsonMode)
        }
        onDone()
    }

    process.on("SIGINT", handler)
    process.on("SIGTERM", handler)
}
