import { Command } from "@oclif/core"

export class data extends Command {
    static description = `Find your data directory. You can store your credentials here in a .env file, after setting permissions appropriately. See https://oclif.io/docs/config for how to change this location.`

    async run() {
        this.log(`FreeClimb CLI Data directory: ${this.config.dataDir}`)
        return this.config.dataDir
    }
}
