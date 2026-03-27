import { createApiAxios } from "../http.js"

export interface TempAppUrls {
    voiceUrl: string
    smsUrl: string
    statusCallbackUrl: string
    callConnectUrl: string
}

function buildWebhookUrls(tunnelUrl: string): TempAppUrls {
    return {
        voiceUrl: `${tunnelUrl}/voice`,
        smsUrl: `${tunnelUrl}/sms`,
        statusCallbackUrl: `${tunnelUrl}/status`,
        callConnectUrl: `${tunnelUrl}/call-connect`,
    }
}

export async function createTempApp(tunnelUrl: string): Promise<{ applicationId: string; alias: string }> {
    const client = await createApiAxios()
    const alias = `fc-cli-dev-${Date.now()}`
    const urls = buildWebhookUrls(tunnelUrl)

    const response = await client.post("/Applications", {
        alias,
        ...urls,
    })

    return {
        applicationId: response.data.applicationId,
        alias,
    }
}

export async function updateAppUrls(applicationId: string, tunnelUrl: string): Promise<void> {
    const client = await createApiAxios()
    const urls = buildWebhookUrls(tunnelUrl)

    await client.post(`/Applications/${applicationId}`, urls)
}

export async function deleteTempApp(applicationId: string): Promise<void> {
    const client = await createApiAxios()
    await client.delete(`/Applications/${applicationId}`)
}
