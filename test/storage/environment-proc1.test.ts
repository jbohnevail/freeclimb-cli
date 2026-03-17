import { expect } from "chai"
import { Environment } from "../../src/environment.js"

describe("First process - Environment Test", () => {
    Environment.setString("TEST_TEMPORARY_ENVIRONMENT_VARIABLE", "Test Value (temporary)")
    it("can access the temp value in the current process", () => {
        expect(process.env.TEST_TEMPORARY_ENVIRONMENT_VARIABLE).to.equal("Test Value (temporary)")
    })
    it("can access the temp value through the environment class", () => {
        expect(Environment.getString("TEST_TEMPORARY_ENVIRONMENT_VARIABLE")).to.equal(
            "Test Value (temporary)",
        )
    })
    const env = new Environment()
    env.setStringPersist("TEST_PERSISTENT_ENVIRONMENT_VARIABLE", "Test Value (persistent)")
    it("does not set the persistent environment variable in the current process", () => {
        expect(process.env.TEST_PERSISTENT_ENVIRONMENT_VARIABLE).to.be.undefined
    })
})
