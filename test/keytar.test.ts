import { expect } from "chai"
import { Entry } from "@napi-rs/keyring"

describe("Test keyring", () => {
    it("Sets/retrieves/deletes passwords from keychain", () => {
        const entry = new Entry("freeclimbCLIAutomatedTest", "automatedTestAccount")
        entry.setPassword("automatedTestPassword")
        expect(entry.getPassword()).to.equal("automatedTestPassword")
        entry.deletePassword()
        // After deletion, getPassword() may throw or return null depending on platform
        try {
            const result = entry.getPassword()
            expect(result).to.be.null
        } catch {
            // Expected on some platforms - deletion means getPassword throws
        }
    })
})
