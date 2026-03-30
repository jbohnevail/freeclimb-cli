import { runCommand } from "@oclif/test"
import { expect } from "chai"
import nock from "nock"
import { cred } from "../src/credentials.js"

describe("Test for login command", function () {
    afterEach(async () => {
        nock.cleanAll()
        await cred.removeCredentials()
    })

    it("Test exit code 2 when --yes flag is missing for non-interactive login", async () => {
        const { error } = await runCommand([
            "login",
            "--accountId",
            "AC1234",
            "--apiKey",
            "key1234",
        ])
        expect(error?.oclif?.exit).to.equal(2)
    })

    it("tests error message when API returns 500 for verification", async () => {
        const testAccountId = "AC1111122222333334444455555666667777788888"
        const testApiKey = "abc123def456abc123def456abc123def456abc12"

        nock("https://www.freeclimb.com")
            .get(`/apiserver/Accounts/${testAccountId}`)
            .reply(500, "error")

        const { stdout } = await runCommand([
            "login",
            "--accountId",
            testAccountId,
            "--apiKey",
            testApiKey,
            "--yes",
        ])
        expect(stdout).to.contain(
            "<---Inputted ACCOUNT_ID and API_KEY where not valid. Please try again.-->",
        )
    })

    it("tests error message when API returns 401 for invalid credentials", async () => {
        const testAccountId = "AC2222233333444445555566666777778888899999"
        const testApiKey = "def456abc123def456abc123def456abc123def45"

        nock("https://www.freeclimb.com")
            .get(`/apiserver/Accounts/${testAccountId}`)
            .reply(401, { error: "Unauthorized" })

        const { stdout } = await runCommand([
            "login",
            "--accountId",
            testAccountId,
            "--apiKey",
            testApiKey,
            "--yes",
        ])
        expect(stdout).to.contain(
            "<---Inputted ACCOUNT_ID and API_KEY where not valid. Please try again.-->",
        )
    })

    it("tests success message when account is verified", async () => {
        const testAccountId = "AC3333344444555556666677777888889999900000"
        const testApiKey = "abc123def456abc123def456abc123def456abc12"
        const testJson = { message: "Response from server" }

        nock("https://www.freeclimb.com")
            .get(`/apiserver/Accounts/${testAccountId}`)
            .reply(200, testJson)

        const { stdout } = await runCommand([
            "login",
            "--accountId",
            testAccountId,
            "--apiKey",
            testApiKey,
            "--yes",
        ])
        expect(stdout).to.contain(
            "<---Your ACCOUNT_ID and API_KEY have been verified through Freeclimb.--->",
        )
    })
})
