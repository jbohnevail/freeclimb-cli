/**
 * This script updates all generated command files to add the --json flag
 * and structured output support. Run this if the main code generation is not available.
 */
const fs = require("fs")
const path = require("path")

const commandsDir = path.join(__dirname, "../src/commands")

// Get all command directories
const topics = fs
    .readdirSync(commandsDir)
    .filter((f) => fs.statSync(path.join(commandsDir, f)).isDirectory())

let updatedCount = 0

topics.forEach((topic) => {
    const topicDir = path.join(commandsDir, topic)
    const commandFiles = fs
        .readdirSync(topicDir)
        .filter((f) => f.endsWith(".ts"))

    commandFiles.forEach((file) => {
        const filePath = path.join(topicDir, file)
        let content = fs.readFileSync(filePath, "utf-8")

        // Skip if already updated
        if (content.includes("wrapJsonOutput")) {
            console.log(`Skipping ${topic}/${file} - already updated`)
            return
        }

        // Add import for format utilities
        content = content.replace(
            'import * as Errors from "../../errors"',
            `import * as Errors from "../../errors"
import { wrapJsonOutput, getFormatterForTopic } from "../../ui/format"`
        )

        // Add --json flag to static flags
        content = content.replace(
            /help: flags\.help\(\{ char: "h" \}\),/g,
            `json: flags.boolean({ description: "Output as JSON (for scripting/agents)", default: false }),
        help: flags.help({ char: "h" }),`
        )

        // Update normalResponse to use conditional output
        const commandName = file.replace(".ts", "")
        const formatterKey = `"${topic}", "${commandName}"`

        // Replace the JSON.stringify in normalResponse
        content = content.replace(
            /out\.out\(JSON\.stringify\(response\.data, null, 2\)\)/g,
            `if (flags.json) {
                out.out(JSON.stringify(wrapJsonOutput(response.data), null, 2))
            } else {
                const formatter = getFormatterForTopic(${formatterKey})
                out.out(formatter ? formatter(response.data) : JSON.stringify(response.data, null, 2))
            }`
        )

        // Handle logs topic special case with maxItem
        if (topic === "logs") {
            content = content.replace(
                /out\.out\(flags\.maxItem\?JSON\.stringify\(response\.data\.logs\.splice\(0, flags\.maxItem\), null, 2\): JSON\.stringify\(response\.data, null, 2\)\)/g,
                `const outputData = flags.maxItem ? { ...response.data, logs: response.data.logs.splice(0, flags.maxItem) } : response.data
            if (flags.json) {
                out.out(JSON.stringify(wrapJsonOutput(outputData), null, 2))
            } else {
                const formatter = getFormatterForTopic(${formatterKey})
                out.out(formatter ? formatter(outputData) : JSON.stringify(outputData, null, 2))
            }`
            )
        }

        fs.writeFileSync(filePath, content)
        console.log(`Updated ${topic}/${file}`)
        updatedCount++
    })
})

console.log(`\nUpdated ${updatedCount} command files`)
