#!/usr/bin/env npx tsx
/**
 * Validates PerCL JSON: checks command names, required fields, common mistakes.
 * Usage: npx tsx .claude/skills/freeclimb-percl/scripts/validate-percl.ts '<percl-json>'
 * Example: npx tsx .claude/skills/freeclimb-percl/scripts/validate-percl.ts '[{"Say":{"text":"Hello"}},{"GetDigits":{"maxDigits":1}}]'
 */

const VALID_COMMANDS = new Set([
    "Say",
    "Play",
    "PlayEarlyMedia",
    "Pause",
    "GetDigits",
    "GetSpeech",
    "SendDigits",
    "Hangup",
    "Reject",
    "Redirect",
    "Sms",
    "OutDial",
    "RecordUtterance",
    "StartRecordCall",
    "TranscribeUtterance",
    "CreateConference",
    "AddToConference",
    "RemoveFromConference",
    "TerminateConference",
    "SetListen",
    "SetTalk",
    "SetDTMFPassThrough",
    "Enqueue",
    "Dequeue",
])

const REQUIRED_FIELDS: Record<string, string[]> = {
    Say: ["text"],
    Play: ["file"],
    Redirect: ["actionUrl"],
    OutDial: ["destination", "callingNumber", "callConnectUrl"],
    GetDigits: ["actionUrl"],
    GetSpeech: ["actionUrl", "grammarFile"],
    RecordUtterance: ["actionUrl"],
    Sms: ["to", "from", "text"],
    Enqueue: ["queueId", "waitUrl"],
    Dequeue: [],
    AddToConference: ["conferenceId"],
    CreateConference: ["actionUrl"],
}

const TERMINAL_COMMANDS = new Set(["Redirect", "Hangup", "Reject"])

interface Warning {
    index: number
    command: string
    message: string
    severity: "error" | "warning"
}

function validate(input: string): void {
    let percl: unknown[]
    try {
        percl = JSON.parse(input)
    } catch {
        console.error("ERROR: Invalid JSON — could not parse input.")
        console.error("  Hint: Wrap the argument in single quotes to prevent shell interpolation.")
        process.exit(1)
    }

    if (!Array.isArray(percl)) {
        console.error("ERROR: PerCL must be a JSON array, got " + typeof percl)
        process.exit(1)
    }

    if (percl.length === 0) {
        console.error("WARNING: Empty PerCL array — the call will hang up immediately.")
        process.exit(0)
    }

    const warnings: Warning[] = []

    for (let i = 0; i < percl.length; i++) {
        const entry = percl[i]
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
            warnings.push({
                index: i,
                command: "?",
                message: "Entry is not an object",
                severity: "error",
            })
            continue
        }

        const keys = Object.keys(entry)
        if (keys.length !== 1) {
            warnings.push({
                index: i,
                command: "?",
                message: `Each PerCL entry must have exactly 1 key (the command name), found ${keys.length}: ${keys.join(", ")}`,
                severity: "error",
            })
            continue
        }

        const commandName = keys[0]
        const params = (entry as Record<string, unknown>)[commandName]

        // Check valid command name
        if (!VALID_COMMANDS.has(commandName)) {
            warnings.push({
                index: i,
                command: commandName,
                message: `Unknown command "${commandName}". Valid commands: ${[...VALID_COMMANDS].join(", ")}`,
                severity: "error",
            })
            continue
        }

        // Check required fields
        const required = REQUIRED_FIELDS[commandName]
        if (required && typeof params === "object" && params !== null) {
            for (const field of required) {
                if (!(field in (params as Record<string, unknown>))) {
                    warnings.push({
                        index: i,
                        command: commandName,
                        message: `Missing required field "${field}"`,
                        severity: "error",
                    })
                }
            }
        }

        // Pause: check for seconds-instead-of-milliseconds mistake
        if (commandName === "Pause" && typeof params === "object" && params !== null) {
            const length = (params as Record<string, unknown>).length
            if (typeof length === "number" && length > 0 && length < 100) {
                warnings.push({
                    index: i,
                    command: "Pause",
                    message: `length=${length} is likely in seconds, not milliseconds. Use ${length * 1000} for ${length} seconds.`,
                    severity: "warning",
                })
            }
        }

        // GetDigits: warn about missing actionUrl (required but easy to forget)
        if (commandName === "GetDigits" && typeof params === "object" && params !== null) {
            if (!("actionUrl" in (params as Record<string, unknown>))) {
                warnings.push({
                    index: i,
                    command: "GetDigits",
                    message: "Missing actionUrl — collected digits will be silently discarded!",
                    severity: "error",
                })
            }
        }

        // OutDial: warn about missing callConnectUrl
        if (commandName === "OutDial" && typeof params === "object" && params !== null) {
            if (!("callConnectUrl" in (params as Record<string, unknown>))) {
                warnings.push({
                    index: i,
                    command: "OutDial",
                    message:
                        "Missing callConnectUrl — you won't be able to control the connected call",
                    severity: "warning",
                })
            }
        }

        // Detect dead code after terminal commands
        if (TERMINAL_COMMANDS.has(commandName) && i < percl.length - 1) {
            warnings.push({
                index: i,
                command: commandName,
                message: `Commands after ${commandName} (indices ${i + 1}-${percl.length - 1}) will never execute`,
                severity: "warning",
            })
        }
    }

    // Output results
    if (warnings.length === 0) {
        console.log(`OK: ${percl.length} command(s), no issues found.`)
        process.exit(0)
    }

    const errors = warnings.filter((w) => w.severity === "error")
    const warns = warnings.filter((w) => w.severity === "warning")

    for (const w of warnings) {
        const prefix = w.severity === "error" ? "ERROR" : "WARNING"
        console.log(`[${prefix}] Command #${w.index} (${w.command}): ${w.message}`)
    }

    console.log(
        `\n${errors.length} error(s), ${warns.length} warning(s) in ${percl.length} command(s).`,
    )
    process.exit(errors.length > 0 ? 1 : 0)
}

const input = process.argv[2]
if (!input) {
    console.error("Usage: npx tsx validate-percl.ts '<percl-json>'")
    console.error('Example: npx tsx validate-percl.ts \'[{"Say":{"text":"Hello"}}]\'')
    process.exit(1)
}

validate(input)
