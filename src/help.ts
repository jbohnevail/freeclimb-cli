import { Help, Interfaces } from "@oclif/core"
import chalk from "chalk"

const { bold } = chalk

export default class FreeClimbHelpClass extends Help {
    protected formatTopics(topics: Interfaces.Topic[]): string {
        if (topics.length === 0) return ""
        const body = topics
            .map((c) => {
                const description = c.description ? this.render(c.description.split("\n")[0]) : ""
                return `  ${c.name}${description ? `  ${description}` : ""}`
            })
            .join("\n")
        return [
            bold("TOPICS"),
            "To learn about the available commands in a topic, type:",
            `  $ freeclimb [TOPIC]\n`,
            body,
        ].join("\n")
    }
}
