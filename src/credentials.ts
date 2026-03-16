import { Entry } from "@napi-rs/keyring"
import { env } from "./environment"

const SERVICE_NAME = "FreeClimb"
const ACCOUNT_KEY = "accountId"
const API_KEY_KEY = "apiKey"

export const cred = {
    async removeCredentials() {
        try {
            new Entry(SERVICE_NAME, ACCOUNT_KEY).deletePassword()
        } catch {
            // ignore if not found
        }
        try {
            new Entry(SERVICE_NAME, API_KEY_KEY).deletePassword()
        } catch {
            // ignore if not found
        }
    },
    get accountId() {
        return (async () => {
            try {
                return new Entry(SERVICE_NAME, ACCOUNT_KEY).getPassword()
            } catch {
                return env.accountId
            }
        })()
    },
    get apiKey() {
        return (async () => {
            try {
                return new Entry(SERVICE_NAME, API_KEY_KEY).getPassword()
            } catch {
                return env.apiKey
            }
        })()
    },
    async setCredentials(accountId: string, apiKey: string) {
        new Entry(SERVICE_NAME, ACCOUNT_KEY).setPassword(accountId)
        new Entry(SERVICE_NAME, API_KEY_KEY).setPassword(apiKey)
    },
}
