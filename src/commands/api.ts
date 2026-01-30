import { Command, flags } from "@oclif/command"
import chalk from "chalk"
import axios from "axios"
import { cred } from "../credentials"
import { Environment } from "../environment"
import { wrapJsonOutput } from "../ui/format"

export class Api extends Command {
    static description = `Make authenticated API requests to FreeClimb.

This command allows you to make raw API requests with automatic
authentication. Useful for accessing endpoints not covered by
other CLI commands.

The endpoint can be:
  - A path starting with / (e.g., /Calls)
  - A full URL (e.g., https://www.freeclimb.com/apiserver/Accounts/.../Calls)

For account-scoped endpoints, the account ID is automatically included.
`

    static args = [
        {
            name: "endpoint",
            description: "API endpoint path (e.g., /Calls, /Messages)",
            required: true,
        },
    ]

    static flags = {
        method: flags.string({
            char: "X",
            description: "HTTP method",
            options: ["GET", "POST", "PUT", "DELETE"],
            default: "GET",
        }),
        data: flags.string({
            char: "d",
            description: "JSON data for POST/PUT requests",
        }),
        param: flags.string({
            char: "p",
            description: "Query parameter (format: key=value, can be repeated)",
            multiple: true,
        }),
        json: flags.boolean({
            description: "Output as JSON (for scripting/agents)",
            default: false,
        }),
        raw: flags.boolean({
            description: "Output raw response without wrapping",
            default: false,
        }),
        help: flags.help({ char: "h" }),
    }

    static examples = [
        "$ freeclimb api /Calls",
        "$ freeclimb api /Calls --method GET",
        "$ freeclimb api /Calls -p status=completed -p to=+15551234567",
        '$ freeclimb api /Messages --method POST -d \'{"to":"+15551234567","from":"+15559876543","text":"Hello"}\'',
        "$ freeclimb api /IncomingPhoneNumbers --json",
    ]

    async run() {
        const { args, flags } = this.parse(Api)

        const accountId = await cred.accountId
        const apiKey = await cred.apiKey

        if (!accountId || !apiKey) {
            this.error(
                chalk.red("Not logged in. Run 'freeclimb login' to authenticate."),
                { exit: 1 }
            )
        }

        const baseUrl =
            Environment.getString("FREECLIMB_CLI_BASE_URL") ||
            "https://www.freeclimb.com/apiserver"

        // Build URL
        let url = args.endpoint
        if (url.startsWith("/")) {
            url = `${baseUrl}/Accounts/${accountId}${url}`
        }

        // Parse query parameters
        const params: Record<string, string> = {}
        if (flags.param) {
            for (const p of flags.param) {
                const [key, ...valueParts] = p.split("=")
                if (key && valueParts.length > 0) {
                    params[key] = valueParts.join("=")
                }
            }
        }

        // Parse body data
        let data: unknown = undefined
        if (flags.data) {
            try {
                data = JSON.parse(flags.data)
            } catch {
                this.error(chalk.red("Invalid JSON in --data flag"), { exit: 1 })
            }
        }

        try {
            const response = await axios({
                url,
                method: flags.method as "GET" | "POST" | "PUT" | "DELETE",
                auth: { username: accountId, password: apiKey },
                params: Object.keys(params).length > 0 ? params : undefined,
                data,
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (flags.raw) {
                this.log(JSON.stringify(response.data, null, 2))
            } else if (flags.json) {
                this.log(
                    JSON.stringify(
                        wrapJsonOutput(response.data, {
                            command: `api ${args.endpoint}`,
                        }),
                        null,
                        2
                    )
                )
            } else {
                // Human-readable output with status
                this.log(chalk.green(`${response.status} ${response.statusText}`))
                this.log("")
                this.log(JSON.stringify(response.data, null, 2))
            }
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status
                const statusText = error.response.statusText
                const data = error.response.data

                if (flags.json || flags.raw) {
                    this.log(
                        JSON.stringify(
                            {
                                error: true,
                                status,
                                statusText,
                                data,
                            },
                            null,
                            2
                        )
                    )
                    this.exit(1)
                } else {
                    this.error(
                        chalk.red(`${status} ${statusText}\n${JSON.stringify(data, null, 2)}`),
                        { exit: 1 }
                    )
                }
            } else {
                this.error(chalk.red(`Request failed: ${error.message}`), { exit: 1 })
            }
        }
    }
}
