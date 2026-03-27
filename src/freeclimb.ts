import axios from "axios"

import { cred } from "./credentials"
import { Environment } from "./environment"
import * as Errors from "./errors"

type Errorer = { error(message: string, exitCode: { exit: number }): void }

type Body = { data: Record<string, any> }
type Query = { params: Record<string, any> }

type AxiosMethodType =
    | "DELETE"
    | "GET"
    | "HEAD"
    | "LINK"
    | "OPTIONS"
    | "PATCH"
    | "POST"
    | "PUT"
    | "UNLINK"
    | "delete"
    | "get"
    | "head"
    | "link"
    | "options"
    | "patch"
    | "post"
    | "put"
    | "unlink"
    | undefined

export type FreeClimbErrorResponse = { response: Body }

export type FreeClimbResponse = { status: number } & Body

export class FreeClimbApi {
    private authenticate: boolean

    private baseUrl: string

    private endpoint: string

    private errorHandler: Errorer

    constructor(endpoint: string, authenticate: boolean, errorHandler: Errorer) {
        this.endpoint = endpoint.length > 0 ? `/${endpoint}` : ""
        this.authenticate = authenticate
        this.errorHandler = errorHandler
        this.baseUrl =
            Environment.getString("FREECLIMB_CLI_BASE_URL") || "https://www.freeclimb.com/apiserver"
    }

    async apiCall(
        method: AxiosMethodType,
        requestContent: any,
        onSuccess: (response: FreeClimbResponse) => void,
        onError = (error: any) => {
            let err: Errors.FreeClimbError
            if (error.message && error.code) {
                err = error
            } else if (error.response) {
                err = new Errors.FreeClimbAPIError(error.response.data)
            } else {
                err = new Errors.DefaultFatalError(error)
            }

            this.errorHandler.error(err.message, { exit: err.code })
        }
    ) {
        const accountId = await cred.accountId
        const apiKey = await cred.apiKey
        await axios(
            `${this.baseUrl}${this.authenticate ? `/Accounts/${accountId}` : ``}${this.endpoint}`,
            {
                auth: { password: apiKey, username: accountId },
                data: (requestContent as Body) ? (requestContent as Body).data : undefined,
                method,
                params: (requestContent as Query) ? (requestContent as Query).params : undefined,
            }
        )
            .then(onSuccess)
            .catch(onError)
    }
}
