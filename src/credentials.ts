import * as keytar from "keytar"

import { env } from "./environment"

function removeAfter(
    credentials: { account: string; password: string }[],
    lastIndex: number
): void {
    for (const cred of credentials.filter((_item, index) => index > lastIndex))
        keytar.deletePassword("FreeClimb", cred.account)
}

export const cred = {
    get accountId() {
        return (async () => {
            try {
                const keyContents = await keytar.findCredentials("FreeClimb")
                const { account } = keyContents[0]
                return account
            } catch {
                return env.accountId
            }
        })()
    },
    get apiKey() {
        return (async () => {
            try {
                const keyContents = await keytar.findCredentials("FreeClimb")
                const { password } = keyContents[0]
                return password
            } catch {
                return env.apiKey
            }
        })()
    },
    async removeCredentials(after: number) {
        const keyContents = await keytar.findCredentials("FreeClimb")
        removeAfter(keyContents, after)
    },
}
