import { expect } from "chai"

// Login command requires interactive stdin prompts (readline) which cannot be
// tested with runCommand. These tests are skipped until a stdin mock is added.
describe.skip("Test for login command", function () {
    it("tests warning for an incorrect account id length")
    it("tests warning for an incorrect auth token length")
    it("tests for response when account is verified")
})
