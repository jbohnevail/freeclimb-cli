import axios from "axios"

export interface ForwardResult {
    statusCode: number
    body: unknown
    headers: Record<string, string>
    latencyMs: number
}

export interface ForwardError {
    error: string
    code: string
}

export type ForwardResponse = ForwardResult | ForwardError

export function isForwardError(r: ForwardResponse): r is ForwardError {
    return "error" in r
}

export async function forwardRequest(
    targetPort: number,
    method: string,
    path: string,
    headers: Record<string, string>,
    body: unknown,
): Promise<ForwardResponse> {
    const start = Date.now()
    try {
        const response = await axios({
            method: method as any,
            url: `http://localhost:${targetPort}${path}`,
            headers,
            data: body,
            timeout: 30_000,
            // Accept any status — we want to capture 4xx/5xx from the user's app too
            validateStatus: () => true,
        })
        // Capture response headers for transparent forwarding
        const responseHeaders: Record<string, string> = {}
        for (const [key, value] of Object.entries(response.headers)) {
            if (typeof value === "string") responseHeaders[key] = value
        }

        return {
            statusCode: response.status,
            body: response.data,
            headers: responseHeaders,
            latencyMs: Date.now() - start,
        }
    } catch (err: unknown) {
        const error = err as { code?: string; message?: string }
        return {
            error: error.message || "Unknown error",
            code: error.code || "UNKNOWN",
        }
    }
}
