import { Command } from "@oclif/core"
import chalk from "chalk"
import { cred } from "../credentials.js"

export class logout extends Command {
    static description = `Remove your saved FreeClimb Account ID and API Key from this computer's keychain. This will not remove them from environment variables or config files that you have manually edited.`

    async run() {
        await cred.removeCredentials()
        this.log(
            chalk.green("Successfully removed the saved Account ID and API Key from this computer"),
        )
    }
}
