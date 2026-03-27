import http from "http"
import { EventEmitter } from "events"
import { forwardRequest, isForwardError, type ForwardResponse } from "./forwarder.js"
import type { WebhookEvent } from "./event-display.js"

export interface ProxyServerOptions {
    /** Port the proxy listens on (receives webhooks from the tunnel) */
    proxyPort: number
    /** Port of the user's local application */
    targetPort: number
}

export interface ProxyEvents {
    webhook: [event: WebhookEvent, response: ForwardResponse]
    error: [error: Error]
    listening: [port: number]
}

export class WebhookProxyServer extends EventEmitter {
    private server: http.Server | null = null
    private readonly targetPort: number
    private readonly proxyPort: number

    constructor(options: ProxyServerOptions) {
        super()
        this.targetPort = options.targetPort
        this.proxyPort = options.proxyPort
    }

    async start(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res)
            })

            this.server.on("error", (err: Error) => {
                this.emit("error", err)
                reject(err)
            })

            this.server.listen(this.proxyPort, () => {
                const addr = this.server?.address()
                const port = typeof addr === "object" && addr ? addr.port : this.proxyPort
                this.emit("listening", port)
                resolve(port)
            })
        })
    }

    async stop(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.server) {
                this.server.close(() => resolve())
            } else {
                resolve()
            }
        })
    }

    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        let rawBody = ""

        req.on("data", (chunk: Buffer) => {
            rawBody += chunk.toString()
        })

        req.on("end", async () => {
            let body: Record<string, unknown> = {}
            try {
                body = rawBody ? JSON.parse(rawBody) : {}
            } catch {
                // Not JSON — forward raw
                body = { _raw: rawBody }
            }

            const event: WebhookEvent = {
                timestamp: new Date(),
                method: req.method || "POST",
                path: req.url || "/",
                body,
                requestType: body.requestType as string | undefined,
                from: body.from as string | undefined,
                to: body.to as string | undefined,
                callId: body.callId as string | undefined,
                messageId: body.messageId as string | undefined,
            }

            const headers: Record<string, string> = {}
            for (const [key, value] of Object.entries(req.headers)) {
                if (typeof value === "string") headers[key] = value
            }

            const result = await forwardRequest(
                this.targetPort,
                event.method,
                event.path,
                headers,
                body,
            )

            this.emit("webhook", event, result)

            if (isForwardError(result)) {
                res.writeHead(502, { "Content-Type": "application/json" })
                res.end(JSON.stringify({ error: "Target application unavailable" }))
            } else {
                res.writeHead(result.statusCode, { "Content-Type": "application/json" })
                const responseBody =
                    typeof result.body === "string" ? result.body : JSON.stringify(result.body)
                res.end(responseBody)
            }
        })

        req.on("error", (err: Error) => {
            this.emit("error", err)
            res.writeHead(500)
            res.end()
        })
    }
}
