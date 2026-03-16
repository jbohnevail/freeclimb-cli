import { Command, flags } from "@oclif/command"
import chalk from "chalk"
import axios from "axios"
import { cred } from "../credentials"
import { Environment } from "../environment"
import { wrapJsonOutput } from "../ui/format"
import { createSpinner } from "../ui/spinner"
import { borderedBox, keyValue, statusBadge, sectionSeparator, quickActions } from "../ui/components"
import { BrandColors, supportsColor, isTTY } from "../ui/theme"
import { icons, getBoxChars } from "../ui/chars"

interface AccountStatus {
    accountId: string
    type: string
    status: string
    balance?: string
    numbersCount?: number
    applicationsCount?: number
}

export class Status extends Command {
    static description = `Display account overview and health status.

Shows a summary of your FreeClimb account including:
  - Account type and status
  - Current balance (if available)
  - Number of phone numbers owned
  - Number of applications
  - Recent activity summary

Use --json for machine-readable output.
`

    static flags = {
        json: flags.boolean({
            description: "Output as JSON (for scripting/agents)",
            default: false,
        }),
        help: flags.help({ char: "h" }),
    }

    async run() {
        const { flags } = this.parse(Status)

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

        const client = axios.create({
            baseURL: `${baseUrl}/Accounts/${accountId}`,
            auth: { username: accountId, password: apiKey },
        })

        // Show spinner for TTY, silent for non-TTY/JSON
        const spinner = !flags.json && isTTY()
            ? createSpinner({ text: "Fetching account status..." })
            : null

        try {
            spinner?.start()

            // Fetch account info and resources in parallel
            const [accountRes, numbersRes, applicationsRes] = await Promise.all([
                client.get("").catch(() => null),
                client.get("/IncomingPhoneNumbers").catch(() => null),
                client.get("/Applications").catch(() => null),
            ])

            spinner?.stop()

            const accountData = accountRes?.data
            const numbersData = numbersRes?.data
            const applicationsData = applicationsRes?.data

            const status: AccountStatus = {
                accountId,
                type: accountData?.type || "Unknown",
                status: accountData?.status || "Unknown",
                balance: accountData?.balance,
                numbersCount: numbersData?.incomingPhoneNumbers?.length || 0,
                applicationsCount: applicationsData?.applications?.length || 0,
            }

            if (flags.json) {
                this.log(JSON.stringify(wrapJsonOutput(status), null, 2))
                return
            }

            // Render the new bordered UI
            this.renderStatusDashboard(status)
        } catch (error: any) {
            spinner?.fail("Failed to fetch status")

            if (error.response?.status === 401) {
                this.error(
                    chalk.red(
                        "Authentication failed. Run 'freeclimb login' to re-authenticate."
                    ),
                    { exit: 1 }
                )
            }
            this.error(chalk.red(`Failed to fetch account status: ${error.message}`), {
                exit: 1,
            })
        }
    }

    private renderStatusDashboard(status: AccountStatus): void {
        const chars = getBoxChars()
        const width = 55

        this.log("")

        // Build the dashboard content
        const lines: string[] = []

        // Account info section
        const accountInfo = keyValue([
            { key: "Account ID", value: status.accountId },
            { key: "Type", value: statusBadge(status.type) },
            { key: "Status", value: statusBadge(status.status) },
        ], 14)

        // Add balance if available
        if (status.balance) {
            const balanceValue = supportsColor()
                ? chalk.hex(BrandColors.lime)(`$${status.balance}`)
                : `$${status.balance}`
            accountInfo.push(`  ${"Balance".padEnd(14)}  ${balanceValue}`)
        }

        lines.push(...accountInfo)
        lines.push("")

        // Resources section separator
        lines.push(sectionSeparator("Resources", width))
        lines.push("")

        const resourceInfo = keyValue([
            {
                key: "Phone Numbers",
                value: `${status.numbersCount} owned`,
                valueColor: status.numbersCount && status.numbersCount > 0 ? "success" : undefined,
            },
            {
                key: "Applications",
                value: `${status.applicationsCount} configured`,
                valueColor: status.applicationsCount && status.applicationsCount > 0 ? "success" : undefined,
            },
        ], 14)

        lines.push(...resourceInfo)

        // Output the bordered box
        this.log(borderedBox(lines, "FreeClimb Account Status", width))

        // Quick actions (outside the box)
        this.log("")
        const actions = quickActions([
            { command: "freeclimb incoming-numbers:list", description: "View phone numbers" },
            { command: "freeclimb applications:list", description: "View applications" },
            { command: "freeclimb calls:list", description: "View recent calls" },
            { command: "freeclimb diagnose", description: "Check connectivity" },
        ])
        actions.forEach((line) => this.log(line))
        this.log("")
    }
}
