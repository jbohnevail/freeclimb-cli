import { Help } from "@oclif/core"
import type { Topic } from "@oclif/core/interfaces"
import chalk from "chalk"

const { bold } = chalk

function indent(str: string, count: number): string {
    return str.replace(/^/gm, " ".repeat(count))
}

function renderList(items: [string, string | undefined][]): string {
    const maxLen = Math.max(...items.map(([name]) => name.length))
    return items.map(([name, desc]) => `${name.padEnd(maxLen)}  ${desc || ""}`).join("\n")
}

export default class FreeClimbHelpClass extends Help {
    protected formatTopics(topics: Topic[]): string {
        if (topics.length === 0) return ""
        const body = renderList(
            topics.map((c) => [c.name, c.description && this.render(c.description.split("\n")[0])]),
        )
        return [
            bold("TOPICS"),
            "To learn about the available commands in a topic, type:",
            indent("$ freeclimb [TOPIC]\n", 2),
            indent(body, 2),
        ].join("\n")
    }
}
