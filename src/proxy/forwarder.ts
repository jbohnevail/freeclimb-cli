import axios from "axios"

export interface ForwardResult {
    statusCode: number
    body: unknown
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
            headers: {
                "content-type": headers["content-type"] || "application/json",
                // Forward select headers, skip hop-by-hop ones
                ...(headers["x-request-id"] ? { "x-request-id": headers["x-request-id"] } : {}),
            },
            data: body,
            timeout: 30_000,
            // Accept any status — we want to capture 4xx/5xx from the user's app too
            validateStatus: () => true,
        })
        return {
            statusCode: response.status,
            body: response.data,
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
