export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ValidationError"
    }
}

export function rejectControlChars(input: string, fieldName: string): void {
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i)
        if (code < 0x20 && code !== 0x0a && code !== 0x0d && code !== 0x09) {
            throw new ValidationError(
                `Invalid control character (0x${code.toString(16)}) found in ${fieldName}`
            )
        }
    }
}

export function validateResourceId(id: string, fieldName: string): void {
    if (!id || id.trim().length === 0) {
        throw new ValidationError(`${fieldName} cannot be empty`)
    }

    if (id.includes("?")) {
        throw new ValidationError(
            `${fieldName} contains invalid character '?'. Query parameters should not be embedded in resource IDs.`
        )
    }

    if (id.includes("#")) {
        throw new ValidationError(
            `${fieldName} contains invalid character '#'. Fragment identifiers should not be embedded in resource IDs.`
        )
    }

    if (id.includes("%")) {
        throw new ValidationError(
            `${fieldName} contains pre-encoded character '%'. Pass raw values; encoding is handled automatically.`
        )
    }

    if (/\.\.[\\/]/.test(id) || id.startsWith("../") || id.startsWith("..\\")) {
        throw new ValidationError(
            `${fieldName} contains path traversal sequence. Resource IDs must not include directory navigation.`
        )
    }

    rejectControlChars(id, fieldName)
}

export function validatePhoneNumber(number: string, fieldName: string): void {
    rejectControlChars(number, fieldName)

    if (!/^\+?\d+$/.test(number)) {
        throw new ValidationError(
            `${fieldName} must be a valid phone number in E.164 format (e.g., +12223334444)`
        )
    }
}

export function validateUrl(url: string, fieldName: string): void {
    rejectControlChars(url, fieldName)

    try {
        const parsed = new URL(url)
        if (!parsed.protocol) throw new Error("no protocol")
    } catch {
        throw new ValidationError(`${fieldName} is not a valid URL`)
    }
}

export function sanitizeInput(input: string): string {
    let result = ""
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i)
        if (code >= 0x20 || code === 0x0a || code === 0x0d || code === 0x09) {
            result += input[i]
        }
    }
    return result
}

export function validateArgs(
    args: Record<string, string>,
    argDefs: Array<{ name: string; type?: string }>
): void {
    for (const def of argDefs) {
        const value = args[def.name]
        if (value === undefined || value === null) continue

        rejectControlChars(value, def.name)

        if (def.type === "resourceId") {
            validateResourceId(value, def.name)
        } else if (def.type === "phone") {
            validatePhoneNumber(value, def.name)
        } else if (def.type === "url") {
            validateUrl(value, def.name)
        }
    }
}

export function filterFields<T extends Record<string, unknown>>(
    data: T,
    fields: string[]
): Partial<T> {
    if (fields.length === 0) return data

    const result: Record<string, unknown> = {}
    for (const field of fields) {
        const trimmed = field.trim()
        if (trimmed in data) {
            result[trimmed] = data[trimmed]
        }
    }
    return result as Partial<T>
}

export function filterFieldsDeep(data: unknown, fields: string[]): unknown {
    if (fields.length === 0) return data

    if (Array.isArray(data)) {
        return data.map((item) => {
            if (typeof item === "object" && item !== null) {
                return filterFields(item as Record<string, unknown>, fields)
            }
            return item
        })
    }

    if (typeof data === "object" && data !== null) {
        const record = data as Record<string, unknown>
        const result: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(record)) {
            if (Array.isArray(value)) {
                result[key] = filterFieldsDeep(value, fields)
            } else if (fields.includes(key)) {
                result[key] = value
            }
        }
        return result
    }

    return data
}
