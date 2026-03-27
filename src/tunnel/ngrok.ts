import { EventEmitter } from "events"
import ngrok from "@ngrok/ngrok"

export class NgrokTunnel extends EventEmitter {
    private listener: ngrok.Listener | null = null
    private _url = ""

    get url(): string {
        return this._url
    }

    async start(port: number): Promise<string> {
        this.listener = await ngrok.forward({
            addr: port,
            authtoken_from_env: true,
        })

        this._url = this.listener.url() || ""

        if (!this._url) {
            throw new Error("ngrok did not return a tunnel URL")
        }

        return this._url
    }

    async stop(): Promise<void> {
        if (this.listener) {
            await this.listener.close()
            this.listener = null
        }
    }
}
