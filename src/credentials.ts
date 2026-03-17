import { Entry } from "@napi-rs/keyring"
import { env } from "./environment.js"

const ACCOUNT_ENTRY = new Entry("FreeClimb", "accountId")
const APIKEY_ENTRY = new Entry("FreeClimb", "apiKey")

function removeAllCredentials(): void {
    try {
        ACCOUNT_ENTRY.deletePassword()
    } catch {
        /* no stored credential */
    }
    try {
        APIKEY_ENTRY.deletePassword()
    } catch {
        /* no stored credential */
    }
}

export const cred = {
    async removeCredentials() {
        removeAllCredentials()
    },
    get accountId() {
        return (async () => {
            try {
                return ACCOUNT_ENTRY.getPassword()
            } catch {
                return env.accountId
            }
        })()
    },
    get apiKey() {
        return (async () => {
            try {
                return APIKEY_ENTRY.getPassword()
            } catch {
                return env.apiKey
            }
        })()
    },
}
