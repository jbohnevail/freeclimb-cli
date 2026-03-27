export interface SourceBinding {
    $source: string
    params?: Record<string, unknown>
}

export interface DashboardSpec {
    elements: Record<
        string,
        {
            children?: string[]
            props: Record<string, unknown>
            type: string
        }
    >
    root: string
    state?: Record<string, unknown>
}

export type PresetName = "calls" | "queues" | "sms" | "health"

export const PRESET_NAMES: PresetName[] = ["calls", "queues", "sms", "health"]

export function isSourceBinding(value: unknown): value is SourceBinding {
    return (
        typeof value === "object" &&
        value !== null &&
        "$source" in value &&
        typeof (value as SourceBinding).$source === "string"
    )
}
