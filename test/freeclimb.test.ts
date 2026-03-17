import { expect } from "chai"
import nock from "nock"
import { FreeClimbApi } from "../src/freeclimb.js"

describe("FreeClimbApi class", () => {
    const errorResponse = { errorCause: "intentional" }
    const errorResponseReturn = `"errorCause": "intentional"`
    const errorer = { error: (message: string, _: unknown) => console.error(message) }

    it("executes the custom callback", async () => {
        nock("https://www.freeclimb.com")
            .get(`/apiserver/AutomatedTestEndpoint`)
            .reply(400, errorResponse)

        let capturedError = ""
        await new FreeClimbApi("AutomatedTestEndpoint", false, console).apiCall(
            "GET",
            {},
            () => "this callback is never run",
            (err) => {
                capturedError = `Here is a custom error callback, and this is the error data:${JSON.stringify(
                    err.response.data,
                )}`
                console.error(capturedError)
            },
        )
        expect(capturedError).to.contain(
            `Here is a custom error callback, and this is the error data:${JSON.stringify(
                errorResponse,
            )}`,
        )
    })

    it("executes the default callback", async () => {
        nock("https://www.freeclimb.com")
            .get(`/apiserver/AutomatedTestEndpoint`)
            .reply(400, errorResponse)

        let capturedStderr = ""
        const mockErrorer = {
            error: (message: string, _: unknown) => {
                capturedStderr += message
            },
        }
        await new FreeClimbApi("AutomatedTestEndpoint", false, mockErrorer).apiCall(
            "GET",
            {},
            () => "this callback is never run",
        )
        expect(capturedStderr).to.contain(errorResponseReturn)
    })
})
