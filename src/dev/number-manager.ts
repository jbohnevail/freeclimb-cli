import { createApiAxios } from "../http.js"

export interface NumberInfo {
    phoneNumberId: string
    phoneNumber: string
    applicationId: string | null
    alias: string | null
}

export async function getNumber(phoneNumberId: string): Promise<NumberInfo> {
    const client = await createApiAxios()
    const response = await client.get(`/IncomingPhoneNumbers/${phoneNumberId}`)
    return {
        phoneNumberId: response.data.phoneNumberId,
        phoneNumber: response.data.phoneNumber,
        applicationId: response.data.applicationId || null,
        alias: response.data.alias || null,
    }
}

export async function assignNumber(
    phoneNumberId: string,
    applicationId: string,
): Promise<string | null> {
    const current = await getNumber(phoneNumberId)
    const previousApplicationId = current.applicationId

    const client = await createApiAxios()
    await client.post(`/IncomingPhoneNumbers/${phoneNumberId}`, {
        applicationId,
    })

    return previousApplicationId
}

export async function restoreNumber(
    phoneNumberId: string,
    previousApplicationId: string | null,
): Promise<void> {
    if (previousApplicationId === null) return

    const client = await createApiAxios()
    await client.post(`/IncomingPhoneNumbers/${phoneNumberId}`, {
        applicationId: previousApplicationId,
    })
}
