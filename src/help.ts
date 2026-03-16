import Help from "@oclif/help"
import * as Config from "@oclif/config"
import indent from "indent-string"
import chalk from "chalk"
import { getWelcomeBanner } from "./ui/banner"
import { BrandColors, supportsColor } from "./ui/theme"
import { box, getBoxChars } from "./ui/chars"

const { bold } = chalk

// Use brand colors when available
const primary = supportsColor() ? chalk.hex(BrandColors.orange) : chalk.cyan
const dim = chalk.dim

import { renderList } from "@oclif/help/lib/list"

export default class FreeClimbHelpClass extends Help {
    // Override the root help to show our branded banner
    showRootHelp(): void {
        // Show the branded welcome banner
        console.log(getWelcomeBanner())
    }

    protected formatTopics(topics: Config.Topic[]): string {
        if (topics.length === 0) return ""

        // Group topics by category
        const coreTopics = ["calls", "sms", "applications", "incoming-numbers"]
        const accountTopics = ["accounts", "logs"]
        const advancedTopics = [
            "conferences",
            "conference-participants",
            "call-queues",
            "queue-members",
            "recordings",
            "available-numbers",
        ]
        const integrationTopics = ["mcp"]
        const allKnown = [...coreTopics, ...accountTopics, ...advancedTopics, ...integrationTopics]

        const categorizedTopics = {
            "Core Commands": topics.filter((t) => coreTopics.includes(t.name)),
            "Account & Logs": topics.filter((t) => accountTopics.includes(t.name)),
            "Advanced Features": topics.filter((t) => advancedTopics.includes(t.name)),
            Integrations: topics.filter((t) => integrationTopics.includes(t.name)),
            Other: topics.filter((t) => !allKnown.includes(t.name)),
        }

        let output = ""
        const chars = getBoxChars()

        for (const [category, categoryTopics] of Object.entries(categorizedTopics)) {
            if (categoryTopics.length === 0) continue

            const body = renderList(
                categoryTopics.map((c) => [
                    primary(c.name),
                    c.description && this.render(c.description.split("\n")[0]),
                ]),
                {
                    spacer: "\n",
                    stripAnsi: this.opts.stripAnsi,
                    maxWidth: this.opts.maxWidth - 2,
                }
            )

            // Category header with box drawing
            const categoryHeader = supportsColor()
                ? `${chars.teeRight}${chars.horizontal} ${primary(category.toUpperCase())} ${chars.horizontal.repeat(Math.max(0, 30 - category.length))}${chars.teeLeft}`
                : `${chars.teeRight}${chars.horizontal} ${category.toUpperCase()} ${chars.horizontal.repeat(Math.max(0, 30 - category.length))}${chars.teeLeft}`

            output += `\n${categoryHeader}\n`
            output += indent(body, 2)
            output += "\n"
        }

        output += `\n${dim("To learn about the available commands in a topic, type:")}\n`
        output += indent(`$ ${primary("freeclimb [TOPIC]")}\n`, 2)

        return output
    }

    protected formatCommands(commands: Config.Command[]): string {
        if (commands.length === 0) return ""

        const chars = getBoxChars()

        const body = renderList(
            commands.map((c) => {
                const description = c.description ? c.description.split("\n")[0] : ""
                return [primary(c.id), description]
            }),
            {
                spacer: "\n",
                stripAnsi: this.opts.stripAnsi,
                maxWidth: this.opts.maxWidth - 2,
            }
        )

        // Commands header with box drawing
        const header = supportsColor()
            ? `${chars.topLeft}${chars.horizontal} ${primary("COMMANDS")} ${chars.horizontal.repeat(20)}${chars.topRight}`
            : `${chars.topLeft}${chars.horizontal} COMMANDS ${chars.horizontal.repeat(20)}${chars.topRight}`

        return [header, indent(body, 2)].join("\n")
    }
}
