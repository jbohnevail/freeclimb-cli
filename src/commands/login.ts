import { Command } from "@oclif/core"
import * as readline from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { Entry } from "@napi-rs/keyring"
import chalk from "chalk"
import { cred } from "../credentials.js"
import * as Errors from "../errors.js"
import { FreeClimbApi, FreeClimbResponse, FreeClimbErrorResponse } from "../freeclimb.js"

const ACCOUNT_ENTRY = new Entry("FreeClimb", "accountId")
const APIKEY_ENTRY = new Entry("FreeClimb", "apiKey")

async function prompt(message: string): Promise<string> {
    const rl = readline.createInterface({ input: stdin, output: stdout })
    const answer = await rl.question(message + " ")
    rl.close()
    return answer
}

async function confirm(message: string): Promise<boolean> {
    const answer = await prompt(message)
    return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"
}

export class login extends Command {
    static description = `Log in to FreeClimb with your credentials. Alternatively you can set the ACCOUNT_ID and API_KEY environment variables. To learn how to put them in a file, run freeclimb data -h`

    async run() {
        const fcApi = new FreeClimbApi(``, true, this)
        const verifyResponse = (response: FreeClimbResponse) => {
            const resp =
                "\n<---Your ACCOUNT_ID and API_KEY have been verified through Freeclimb.---> \n\nWhat Can I Do Next?\n\n  To check account information run: \n\t freeclimb accounts:get \n\n  To see all commands available through the api, run freeclimb with the help flag: \n\t freeclimb --help \n\n"
            this.log(chalk.green(resp))
        }
        const verifyErrorResponse = (error: FreeClimbErrorResponse) => {
            const respError =
                "\n<---Inputted ACCOUNT_ID and API_KEY where not valid. Please try again.-->\n"
            this.log(chalk.red(respError))
        }

        this.log("You can find your Account ID and API Key at https://www.freeclimb.com/dashboard")
        const confirmation = await confirm(
            "If you are already logged in to the FreeClimb CLI on this computer, you will first be logged out of that account. Would you like to continue? [y/N]",
        )

        if (confirmation) {
            const accountId = await prompt("-> The Account ID of your FreeClimb Account")
            const apiKey = await prompt("-> Your API Key for your FreeClimb Account")
            await cred.removeCredentials()
            try {
                ACCOUNT_ENTRY.setPassword(accountId)
                APIKEY_ENTRY.setPassword(apiKey)
            } catch (error: unknown) {
                const err = new Errors.SetPasswordError((error as Error).message)
                this.error(err.message, { exit: err.code })
            }
            await fcApi.apiCall("GET", {}, verifyResponse, verifyErrorResponse)
            if (/^AC[0-9a-fA-F]{40}$/gm.exec(accountId) === null) {
                this.warn(
                    chalk.yellow(
                        "Your Account ID has been saved, but it does not appear to match the correct Account ID format",
                    ),
                )
            }
            if (/^[0-9a-fA-F]{40}$/gm.exec(apiKey) === null) {
                this.warn(
                    chalk.yellow(
                        "Your API Key has been saved, but it does not appear to match the correct API Key format",
                    ),
                )
            }
        } else {
            const err = new Errors.LoginCancelled()
            this.error(err.message, { exit: err.code })
        }
    }
}
