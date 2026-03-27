import { EventEmitter } from "events"

export interface Tunnel extends EventEmitter {
    url: string
    start(port: number): Promise<string>
    stop(): Promise<void>
}

export type TunnelProvider = "ngrok" | "cloudflared"

export function createTunnel(provider: TunnelProvider): Tunnel {
    switch (provider) {
        case "ngrok":
            return new NgrokAdapter()
        case "cloudflared":
            return new CloudflaredAdapter()
        default:
            throw new Error(`Unknown tunnel provider: ${provider}`)
    }
}

class NgrokAdapter extends EventEmitter implements Tunnel {
    private _url = ""
    private adapter: any = null

    get url(): string {
        return this._url
    }

    async start(port: number): Promise<string> {
        const { NgrokTunnel } = await import("./ngrok.js")
        const t = new NgrokTunnel()
        this.adapter = t

        this._url = await t.start(port)
        return this._url
    }

    async stop(): Promise<void> {
        if (this.adapter) {
            await this.adapter.stop()
            this.adapter = null
        }
    }
}

class CloudflaredAdapter extends EventEmitter implements Tunnel {
    private _url = ""
    private adapter: any = null

    get url(): string {
        return this._url
    }

    async start(port: number): Promise<string> {
        const { CloudflaredTunnel } = await import("./cloudflared.js")
        const cf = new CloudflaredTunnel()
        this.adapter = cf

        cf.on("error", (err: Error) => this.emit("error", err))
        cf.on("close", () => this.emit("close"))

        this._url = await cf.start(port)
        return this._url
    }

    async stop(): Promise<void> {
        if (this.adapter) {
            await this.adapter.stop()
            this.adapter = null
        }
    }
}
