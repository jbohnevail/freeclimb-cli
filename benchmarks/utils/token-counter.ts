/**
 * Token counting utility using tiktoken (cl100k_base encoding).
 * Lazily initializes the encoder on first use.
 */

let encoder: { encode: (text: string) => number[]; free: () => void } | null = null

async function getEncoder(): Promise<{ encode: (text: string) => number[] }> {
    if (encoder) return encoder

    try {
        const tiktoken = await import("tiktoken")
        encoder = tiktoken.encoding_for_model("gpt-4") as unknown as typeof encoder
        return encoder!
    } catch {
        // Fallback: rough approximation (4 chars per token)
        console.warn("[token-counter] tiktoken not available, using approximation")
        return {
            encode(text: string) {
                const approxTokens = Math.ceil(text.length / 4)
                return new Array(approxTokens).fill(0)
            },
        }
    }
}

/**
 * Count tokens in a string using cl100k_base encoding.
 */
export async function countTokens(text: string): Promise<number> {
    const enc = await getEncoder()
    return enc.encode(text).length
}

/**
 * Count tokens for multiple strings and return individual + total counts.
 */
export async function countTokensBatch(
    items: { label: string; text: string }[],
): Promise<{ counts: { label: string; tokens: number }[]; total: number }> {
    const enc = await getEncoder()
    const counts = items.map(({ label, text }) => ({
        label,
        tokens: enc.encode(text).length,
    }))
    const total = counts.reduce((sum, c) => sum + c.tokens, 0)
    return { counts, total }
}

/**
 * Clean up the encoder when done.
 */
export function freeEncoder(): void {
    if (encoder) {
        try {
            encoder.free()
        } catch {
            // ignore
        }

        encoder = null
    }
}
