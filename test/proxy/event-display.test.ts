import { expect } from "chai"
import {
    formatIncoming,
    formatResponse,
    formatError,
    formatJsonEvent,
    type WebhookEvent,
} from "../../src/proxy/event-display.js"

describe("Event Display", () => {
    const baseEvent: WebhookEvent = {
        timestamp: new Date("2024-01-15T12:34:56Z"),
        method: "POST",
        path: "/voice",
        body: { requestType: "inboundCall", from: "+15551234567" },
        requestType: "inboundCall",
        from: "+15551234567",
    }

    describe("formatIncoming", () => {
        it("should include method, path, and event info", () => {
            const output = formatIncoming(baseEvent)
            expect(output).to.include("POST")
            expect(output).to.include("/voice")
            expect(output).to.include("inboundCall")
        })
    })

    describe("formatResponse", () => {
        it("should show status code and latency", () => {
            const output = formatResponse(baseEvent, {
                statusCode: 200,
                body: [{ Say: { text: "Hello" } }],
                latencyMs: 23,
            })
            expect(output).to.include("200")
            expect(output).to.include("23ms")
        })

        it("should extract PerCL command names", () => {
            const output = formatResponse(baseEvent, {
                statusCode: 200,
                body: [{ Say: { text: "Hello" } }, { Pause: { length: 1000 } }, { Hangup: {} }],
                latencyMs: 10,
            })
            expect(output).to.include("Say")
            expect(output).to.include("Pause")
            expect(output).to.include("Hangup")
        })
    })

    describe("formatError", () => {
        it("should show ECONNREFUSED with port hint", () => {
            const output = formatError(baseEvent, { error: "connect ECONNREFUSED", code: "ECONNREFUSED" }, 3000)
            expect(output).to.include("ECONNREFUSED")
            expect(output).to.include("3000")
        })
    })

    describe("formatJsonEvent", () => {
        it("should produce valid JSON", () => {
            const output = formatJsonEvent(baseEvent, {
                statusCode: 200,
                body: [{ Say: {} }],
                latencyMs: 10,
            })
            const parsed = JSON.parse(output)
            expect(parsed).to.have.property("timestamp")
            expect(parsed).to.have.property("method", "POST")
            expect(parsed).to.have.property("path", "/voice")
            expect(parsed.response).to.have.property("statusCode", 200)
        })
    })
})
