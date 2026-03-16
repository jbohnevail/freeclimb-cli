import { Command, Flags } from "@oclif/core"
import { confirm, password } from "@inquirer/prompts"
import chalk from "chalk"
import { cred } from "../credentials"
import * as Errors from "../errors"
import { FreeClimbApi, FreeClimbResponse, FreeClimbErrorResponse } from "../freeclimb"

export class login extends Command {
    static description = `Log in to FreeClimb with your credentials. Alternatively you can set the ACCOUNT_ID and API_KEY environment variables. To learn how to put them in a file, run freeclimb data -h`

    static flags = {
        help: Flags.help({ char: "h" }),
    }

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

        await this.parse(login)
        this.log("You can find your Account ID and API Key at https://www.freeclimb.com/dashboard")
        const confirmation: boolean = await confirm({
            message:
                "If you are already logged in to the FreeClimb CLI on this computer, you will first be logged out of that account. Would you like to continue?",
            default: false,
        })

        if (confirmation) {
            const accountId = await password({
                message: "-> The Account ID of your FreeClimb Account",
            })

            const apiKey = await password({
                message: "-> Your API Key for your FreeClimb Account",
            })
            await cred.removeCredentials()
            try {
                await cred.setCredentials(accountId, apiKey)
            } catch (error: any) {
                const err = new Errors.SetPasswordError(error.message)
                this.error(err.message, { exit: err.code })
            }
            await fcApi.apiCall("GET", {}, verifyResponse, verifyErrorResponse)
            if (/^AC[0-9a-fA-F]{40}$/gm.exec(accountId) === null) {
                this.warn(
                    chalk.yellow(
                        "Your Account ID has been saved, but it does not appear to match the correct Account ID format"
                    )
                )
            }
            if (/^[0-9a-fA-F]{40}$/gm.exec(apiKey) === null) {
                this.warn(
                    chalk.yellow(
                        "Your API Key has been saved, but it does not appear to match the correct API Key format"
                    )
                )
            }
        } else {
            const err = new Errors.LoginCancelled()
            this.error(err.message, { exit: err.code })
        }
    }
}
