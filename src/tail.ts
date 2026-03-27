export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function processInput(timeStr: string) {
    const regexp = /(?<number>\d+)(?<unit>[A-Za-z]+)/g
    const replacedStr = timeStr.replace(/^((?<number>\d+)(?<units>[A-Za-z]+) *)+$/g, "")

    if (replacedStr.length > 0) {
        const err = new Error(`${replacedStr}`)
        err.name = "Incorrect Format - Missing Number or Unit"
        throw err
    }

    const finalOutput = []
    let match: RegExpExecArray | null
    while ((match = regexp.exec(timeStr.toLowerCase())) !== null) {
        const { groups } = match
        if (groups) {
            finalOutput.push({ number: groups.number, unit: groups.unit })
        }
    }

    return finalOutput
}

function convertTime(unit: string, time: number) {
    switch (unit) {
        case "w": {
            return time * 604_800_000_000
        }

        case "d": {
            return time * 86_400_000_000
        }

        case "h": {
            return time * 3_600_000_000
        }

        case "m": {
            return time * 60_000_000
        }

        case "s": {
            return time * 1_000_000
        }

        case "ms": {
            return time * 1000
        }

        case "us": {
            return time
        }

        default: {
            const err = new Error(unit)
            err.name = "Incorrect Format - Invalid Unit"
            throw err
        }
    }
}

export function calculateSinceTimestamp(since: string) {
    let total = 0
    const timeSeperation = processInput(since)
    for (const timeSegment of timeSeperation) {
        const time = Number.parseInt(timeSegment.number, 10)
        total += convertTime(timeSegment.unit, time)
    }

    return total
}
