import fs from "node:fs"
import http from "node:http"
import path from "node:path"

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures", "api-responses")

type RouteHandler = (
    req: http.IncomingMessage,
    params: Record<string, string>,
    query: URLSearchParams,
) => { body: unknown; status: number }

interface Route {
    handler: RouteHandler
    method: string
    paramNames: string[]
    pattern: RegExp
}

function loadFixture(name: string): unknown {
    const filePath = path.join(FIXTURES_DIR, `${name}.json`)
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"))
    }

    return { error: `Fixture ${name} not found` }
}

function buildRoutes(): Route[] {
    return [
        // GET /apiserver/Accounts/:id
        {
            handler(_req, _params, query) {
                if (query.get("_benchmark_error") === "true") {
                    return { body: loadFixture("error-500"), status: 500 }
                }

                return { body: loadFixture("account-get"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)$/,
        },
        // GET /apiserver/Accounts/:id/Calls
        {
            handler(_req, _params, query) {
                if (query.get("_benchmark_error") === "true") {
                    return { body: loadFixture("error-500"), status: 500 }
                }

                if (query.get("_benchmark_large") === "true") {
                    return { body: loadFixture("calls-list-large"), status: 200 }
                }

                return { body: loadFixture("calls-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Calls$/,
        },
        // GET /apiserver/Accounts/:id/Calls/:callId
        {
            handler() {
                return { body: loadFixture("call-get"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId", "callId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Calls\/([^/]+)$/,
        },
        // POST /apiserver/Accounts/:id/Messages
        {
            handler() {
                return { body: loadFixture("sms-send"), status: 200 }
            },
            method: "POST",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Messages$/,
        },
        // GET /apiserver/Accounts/:id/IncomingPhoneNumbers
        {
            handler() {
                return { body: loadFixture("incoming-numbers-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/IncomingPhoneNumbers$/,
        },
        // GET /apiserver/Accounts/:id/Applications
        {
            handler() {
                return { body: loadFixture("applications-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Applications$/,
        },
        // GET /apiserver/Accounts/:id/AvailablePhoneNumbers
        {
            handler() {
                return { body: loadFixture("available-numbers-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/AvailablePhoneNumbers$/,
        },
        // GET /apiserver/Accounts/:id/Queues
        {
            handler() {
                return { body: loadFixture("queues-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Queues$/,
        },
        // GET /apiserver/Accounts/:id/Conferences
        {
            handler() {
                return { body: loadFixture("conferences-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Conferences$/,
        },
        // GET /apiserver/Accounts/:id/Recordings
        {
            handler() {
                return { body: loadFixture("recordings-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Recordings$/,
        },
        // GET /apiserver/Accounts/:id/Logs
        {
            handler() {
                return { body: loadFixture("logs-list"), status: 200 }
            },
            method: "GET",
            paramNames: ["accountId"],
            pattern: /^\/apiserver\/Accounts\/([^/]+)\/Logs$/,
        },
    ]
}

export interface MockServer {
    baseUrl: string
    close: () => Promise<void>
    port: number
    requestCount: number
    resetCount: () => void
}

export function createMockServer(): Promise<MockServer> {
    return new Promise((resolve, reject) => {
        const routes = buildRoutes()
        let requestCount = 0

        const server = http.createServer((req, res) => {
            requestCount++
            const url = new URL(req.url || "/", `http://localhost`)
            const method = (req.method || "GET").toUpperCase()

            // Find matching route
            for (const route of routes) {
                if (route.method !== method) continue
                const match = url.pathname.match(route.pattern)
                if (!match) continue

                const params: Record<string, string> = {}
                for (const [i, name] of route.paramNames.entries()) {
                    params[name] = match[i + 1]
                }

                const { body, status } = route.handler(req, params, url.searchParams)
                res.writeHead(status, { "Content-Type": "application/json" })
                res.end(JSON.stringify(body))
                return
            }

            // Catch-all: return 404
            res.writeHead(404, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: "Not found", method, path: url.pathname }))
        })

        server.listen(0, "127.0.0.1", () => {
            const addr = server.address()
            if (!addr || typeof addr === "string") {
                reject(new Error("Failed to get server address"))
                return
            }

            const { port } = addr
            resolve({
                baseUrl: `http://127.0.0.1:${port}/apiserver`,
                close: () =>
                    new Promise<void>((res) => {
                        server.close(() => res())
                    }),
                port,
                get requestCount() {
                    return requestCount
                },
                resetCount() {
                    requestCount = 0
                },
            })
        })

        server.on("error", reject)
    })
}
