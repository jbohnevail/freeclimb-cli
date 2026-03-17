import { expect } from "chai"
import { runCommand } from "@oclif/test"

const describeType = process.env.RUNNER_OS === "Windows" ? describe.skip : describe

describeType("Autocomplete", () => {
    it("displays autocomplete setup instructions", async () => {
        const { stdout } = await runCommand(["autocomplete"])
        expect(stdout).to.contain("Setup Instructions for FREECLIMB CLI")
    })
})
