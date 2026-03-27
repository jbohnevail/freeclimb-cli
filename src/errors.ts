import chalk from "chalk"

import { errorWithSuggestions, returnFormat } from "./error-messages"
import { parse } from "./parse-errors"

export abstract class FreeClimbError {
    code: number

    message: string

    constructor(newMessage: string, newCode: number) {
        this.message = chalk.red(newMessage)
        this.code = newCode
    }
}

export class ParseError extends FreeClimbError {
    constructor(error: unknown) {
        super(parse(error), 2)
    }
}
export class FreeClimbAPIError extends FreeClimbError {
    constructor(errorMessage: {
        code?: number
        error?: { code: number; message: string; url: string }
        message?: string
        status?: number
        url?: string
    }) {
        if (errorMessage.status) {
            super(invalidSuggestion(), 2)
        } else if (errorMessage.error) {
            super(errorWithSuggestions(errorMessage.error), 3)
        } else if (errorMessage.code) {
            super(
                errorWithSuggestions({
                    code: errorMessage.code,
                    message: errorMessage.message,
                    url: errorMessage.url,
                }),
                3
            )
        } else {
            super(JSON.stringify(errorMessage, null, 2), 3)
        }
    }
}

export class UndefinedResponseError extends FreeClimbError {
    constructor() {
        super(
            returnFormat(
                1020,
                "Reponse Undefined",
                "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                "Re-run the command. If error persists, something went wrong on FreeClimb's end. Our engineers are hard at work resolving this problem."
            ),
            3
        )
    }
}

export class DefaultFatalError extends FreeClimbError {
    constructor(error: unknown) {
        super(
            returnFormat(
                1021,
                "Program Error",
                "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                `Please contact vail \n${error}`
            ),
            4
        )
    }
}
export class NoNextPage extends FreeClimbError {
    constructor() {
        super(
            returnFormat(
                1003,
                "No Next Page Output",
                "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                "Run your initial command without the –next flag."
            ),
            3
        )
    }
}

export class NoTimestamp extends FreeClimbError {
    constructor() {
        super(
            returnFormat(
                1019,
                "Invalid Use of Timestamp",
                "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                "You can not use tail and timestamp pql"
            ),
            2
        )
    }
}

export class OutOfRange extends FreeClimbError {
    constructor(param: string, bound: number, direction: string) {
        super(
            returnFormat(
                1004,
                "Out of Bounds",
                "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                `Enter a ${param} ${direction} than or equal to ${bound}. Example: -${param} 10`
            ),
            2
        )
    }
}

export class SetPasswordError extends FreeClimbError {
    constructor(errorMessage: string) {
        super(
            returnFormat(
                1005,
                "Keytar Error",
                "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                `Re-run the login command. /nIf the error persists, please contact support@freeclimb.com`
            ),
            4
        )
    }
}

function invalidSuggestion() {
    return `${returnFormat(
        1014,
        "Invalid Payload",
        "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
        "Make sure that all necessary flags and arguments have been formatted and/or spelled correctly."
    )}`
}

export class LoginCancelled extends FreeClimbError {
    constructor() {
        super(
            returnFormat(
                1006,
                "Login Cancelled - No Credential Change",
                "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                "Re-run the login command and agree to credential reset."
            ),
            2
        )
    }
}

export class SinceFormatError extends FreeClimbError {
    constructor(errorMessage: { message: string; name: string }) {
        if (errorMessage.name === "Incorrect Format - Invalid Unit") {
            super(
                returnFormat(
                    1015,
                    errorMessage.name,
                    "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                    `Since is not compatible with the unit ${errorMessage.message}\n\n\t\tValid units of time include: \nw[weeks], d[day], h[hour], m[minute], s[second], ms[millisecond], ns[nanosecond]\n`
                ),
                2
            )
        } else if (errorMessage.name === "Incorrect Format - Missing Number or Unit") {
            super(
                returnFormat(
                    1016,
                    errorMessage.name,
                    "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                    `${errorMessage.message} is missing a unit of time or number. For every time interval, a unit of time must be included. Ex 2h30m`
                ),
                2
            )
        } else {
            super(
                returnFormat(
                    1017,
                    "Since Format Error",
                    "https://docs.freeclimb.com/reference/error-and-warning-dictionary",
                    "Check the formatting of since flag"
                ),
                2
            )
        }
    }
}
