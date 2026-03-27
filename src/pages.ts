export class Page {
    private isPaginated = false

    private nextId?: string

    private pageNumber: number

    constructor(output: string) {
        const uri = /"nextPageUri": (?:[\S\s]*cursor=)?([\dA-Za-z]+)/g.exec(output)
        const pageNum = /"page":\s*(\d+)/g.exec(output)
        if (uri !== null) {
            // otherwise each call to output would overwrite the next ID
            this.nextId = uri[1]
            this.isPaginated = true
        }

        this.pageNumber = pageNum === null ? 0 : Number.parseInt(pageNum[1], 10)
    }

    /**
     * @returns undefined if the command does not support multiple page output
     * @returns null if the command supports multiple page output, but there is not currently an additional page
     * @returns the identifer of the next page otherwise
     */
    get next(): Next {
        if (this.isPaginated) {
            return this.nextId === "null" ? null : this.nextId
        }

        return undefined
    }

    get num(): number {
        return this.pageNumber
    }
}

export type Next = null | string | undefined
