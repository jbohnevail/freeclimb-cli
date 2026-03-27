import { expect } from "chai"
import http from "http"
import { WebhookProxyServer } from "../../src/proxy/server.js"
import type { WebhookEvent } from "../../src/proxy/event-display.js"
import type { ForwardResponse } from "../../src/proxy/forwarder.js"

describe("WebhookProxyServer", () => {
    let proxy: WebhookProxyServer
    let targetServer: http.Server
    let targetPort: number

    beforeEach((done) => {
        // Create a simple target server that echoes PerCL
        targetServer = http.createServer((req, res) => {
            let body = ""
            req.on("data", (chunk: Buffer) => {
                body += chunk.toString()
            })
            req.on("end", () => {
                res.writeHead(200, { "Content-Type": "application/json" })
                res.end(JSON.stringify([{ Say: { text: "Hello" } }, { Hangup: {} }]))
            })
        })
        targetServer.listen(0, () => {
            const addr = targetServer.address()
            targetPort = typeof addr === "object" && addr ? addr.port : 0
            done()
        })
    })

    afterEach(async () => {
        await proxy?.stop()
        await new Promise<void>((resolve) => targetServer.close(() => resolve()))
    })

    it("should start and accept connections", async () => {
        proxy = new WebhookProxyServer({ proxyPort: 0, targetPort })
        const port = await proxy.start()
        expect(port).to.be.a("number")
        expect(port).to.be.greaterThan(0)
    })

    it("should forward webhooks and emit events", (done) => {
        proxy = new WebhookProxyServer({ proxyPort: 0, targetPort })

        proxy.start().then((port) => {
            proxy.on("webhook", (event: WebhookEvent, response: ForwardResponse) => {
                expect(event.method).to.equal("POST")
                expect(event.path).to.equal("/voice")
                expect(event.body).to.deep.include({ requestType: "inboundCall" })
                expect(response).to.have.property("statusCode", 200)
                done()
            })

            const postData = JSON.stringify({ requestType: "inboundCall", from: "+15551234567" })
            const req = http.request(
                {
                    hostname: "localhost",
                    port,
                    path: "/voice",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(postData),
                    },
                },
                () => {},
            )
            req.write(postData)
            req.end()
        })
    })

    it("should return 502 when target is unreachable", (done) => {
        // Point to a port nothing listens on
        proxy = new WebhookProxyServer({ proxyPort: 0, targetPort: 59999 })

        proxy.start().then((port) => {
            proxy.on("webhook", (_event: WebhookEvent, response: ForwardResponse) => {
                expect(response).to.have.property("error")
                done()
            })

            const postData = JSON.stringify({ requestType: "inboundCall" })
            const req = http.request(
                {
                    hostname: "localhost",
                    port,
                    path: "/voice",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(postData),
                    },
                },
                (res) => {
                    expect(res.statusCode).to.equal(502)
                },
            )
            req.write(postData)
            req.end()
        })
    })
})
