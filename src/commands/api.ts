import { Command, flags } from "@oclif/command"
import chalk from "chalk"
import axios from "axios"
import { cred } from "../credentials"
import { Environment } from "../environment"
import { wrapJsonOutput } from "../ui/format"
import { getOutputFormat } from "../agent-config"
import { rejectControlChars, filterFieldsDeep } from "../validation"

export class Api extends Command {
    static description = `Make authenticated API requests to FreeClimb.

This command allows you to make raw API requests with automatic
authentication. Useful for accessing endpoints not covered by
other CLI commands. Accepts the full API payload via --data as JSON.

The endpoint can be:
  - A path starting with / (e.g., /Calls) - recommended
  - A full FreeClimb URL (e.g., https://www.freeclimb.com/apiserver/Accounts/.../Calls)

For account-scoped endpoints, the account ID is automatically included.
Full URLs are restricted to FreeClimb domains for credential safety.
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
            description: "JSON data for POST/PUT requests (accepts full API payload)",
        }),
        param: flags.string({
            char: "p",
            description: "Query parameter (format: key=value, can be repeated)",
            multiple: true,
        }),
        fields: flags.string({
            description:
                "Comma-separated list of fields to include in the response. Limits output to protect context windows when used by agents.",
        }),
        json: flags.boolean({
            description:
                "Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.",
            default: false,
        }),
        raw: flags.boolean({
            description: "Output raw response without wrapping",
            default: false,
        }),
        "dry-run": flags.boolean({
            description:
                "Validate the request without executing it. Shows what would be sent to the API.",
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
        "$ freeclimb api /Calls --fields callId,status,from,to",
        "$ freeclimb api /Messages --method POST --dry-run -d '{\"to\":\"+15551234567\"}'",
    ]

    async run() {
        const { args, flags: cmdFlags } = this.parse(Api)
        const outputFormat = getOutputFormat(cmdFlags.json, cmdFlags.raw)

        rejectControlChars(args.endpoint, "endpoint")

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

        let url = args.endpoint
        if (url.startsWith("/")) {
            url = `${baseUrl}/Accounts/${accountId}${url}`
        } else {
            try {
                const parsed = new URL(url)
                const allowedHosts = ["freeclimb.com", "www.freeclimb.com"]
                const isCustomBase = Environment.getString("FREECLIMB_CLI_BASE_URL") !== ""
                if (isCustomBase) {
                    const baseHost = new URL(baseUrl).hostname
                    allowedHosts.push(baseHost)
                }
                if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
                    this.error(
                        chalk.red(
                            `Refusing to send credentials to non-FreeClimb host: ${parsed.hostname}\n` +
                            "Use a path starting with / for account-scoped endpoints, or set FREECLIMB_CLI_BASE_URL for custom domains."
                        ),
                        { exit: 1 }
                    )
                }
            } catch {
                this.error(chalk.red(`Invalid URL: ${url}`), { exit: 1 })
            }
        }

        const params: Record<string, string> = {}
        if (cmdFlags.param) {
            for (const p of cmdFlags.param) {
                rejectControlChars(p, "param")
                const [key, ...valueParts] = p.split("=")
                if (key && valueParts.length > 0) {
                    params[key] = valueParts.join("=")
                }
            }
        }

        let data: unknown
        if (cmdFlags.data) {
            try {
                data = JSON.parse(cmdFlags.data)
            } catch {
                this.error(chalk.red("Invalid JSON in --data flag"), { exit: 1 })
            }
        }

        if (cmdFlags["dry-run"]) {
            const dryRunOutput = {
                dryRun: true,
                method: cmdFlags.method,
                url,
                params: Object.keys(params).length > 0 ? params : undefined,
                data,
            }
            if (outputFormat === "json" || outputFormat === "raw") {
                this.log(JSON.stringify(dryRunOutput, null, 2))
            } else {
                this.log(chalk.yellow("DRY RUN - No API call will be made"))
                this.log(JSON.stringify(dryRunOutput, null, 2))
            }
            return
        }

        try {
            const response = await axios({
                url,
                method: cmdFlags.method as "GET" | "POST" | "PUT" | "DELETE",
                auth: { username: accountId, password: apiKey },
                params: Object.keys(params).length > 0 ? params : undefined,
                data,
                headers: {
                    "Content-Type": "application/json",
                },
            })

            let responseData = response.data
            if (cmdFlags.fields) {
                responseData = filterFieldsDeep(
                    responseData,
                    cmdFlags.fields.split(",").map((f: string) => f.trim())
                )
            }

            if (outputFormat === "raw") {
                this.log(JSON.stringify(responseData, null, 2))
            } else if (outputFormat === "json") {
                this.log(
                    JSON.stringify(
                        wrapJsonOutput(responseData, {
                            command: `api ${args.endpoint}`,
                        }),
                        null,
                        2
                    )
                )
            } else {
                this.log(chalk.green(`${response.status} ${response.statusText}`))
                this.log("")
                this.log(JSON.stringify(responseData, null, 2))
            }
        } catch (error: any) {
            if (error.response) {
                const { status, statusText, data: errData } = error.response

                if (outputFormat === "json" || outputFormat === "raw") {
                    this.log(
                        JSON.stringify(
                            {
                                error: true,
                                status,
                                statusText,
                                data: errData,
                            },
                            null,
                            2
                        )
                    )
                    this.exit(1)
                } else {
                    this.error(
                        chalk.red(`${status} ${statusText}\n${JSON.stringify(errData, null, 2)}`),
                        { exit: 1 }
                    )
                }
            } else {
                this.error(chalk.red(`Request failed: ${error.message}`), { exit: 1 })
            }
        }
    }
}
