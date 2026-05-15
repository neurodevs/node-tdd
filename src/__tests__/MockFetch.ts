import assert from '../utilities/assert.js'

export default class MockFetch {
    private requestLog: RequestObject[] = []

    private responses: Record<string, Response> = {
        '*': new Response(
            JSON.stringify({
                success: true,
            }),
            { status: 200 }
        ),
    }

    public buildFetch(): typeof fetch {
        return async (url: string | URL | Request, init?: RequestInit) => {
            this.requestLog.push({ url, init })
            const key = this.generateResponseKey(url, init)
            return (this.responses[key] ?? this.responses['*']).clone()
        }
    }

    public assertWasCalled(url?: string | URL, init?: RequestInit) {
        assert.isTruthy(this.wasCalled, 'Expected fetch() to have been called.')

        if (url) {
            const lastUrl = this.lastUrl
            assert.isEqual(
                lastUrl,
                url,
                `Expected fetch() to have been called with URL "${url}", but it was called with "${lastUrl}".`
            )
        }

        if (init) {
            assert.isEqualDeep(
                this.lastInit,
                init,
                `Expected fetch() to have been called with init "${JSON.stringify(init)}", but it was called with "${JSON.stringify(
                    this.lastInit
                )}".`
            )
        }
    }

    private get lastInit() {
        return this.requestLog[this.requestLog.length - 1].init
    }

    private get wasCalled() {
        return this.requestLog.length > 0
    }

    private get urlsCalled() {
        return this.requestLog.map((req) => req.url)
    }

    private get lastUrl() {
        return this.urlsCalled[this.urlsCalled.length - 1]
    }

    public assertMadeRequests(expected: ExpectedRequest[]) {
        const expectedAsObjects = expected.map((req) => {
            if (typeof req === 'string' || req instanceof URL) {
                return { url: req, init: undefined }
            }

            return req
        })

        assert.isEqualDeep(
            this.requestLog,
            expectedAsObjects,
            `Expected fetch() to have been called with URL and init combinations as specified.`
        )
    }

    public setResponse(
        response: Response,
        url?: string | URL | Request,
        init?: RequestInit
    ) {
        const key = this.generateResponseKey(url, init)
        this.responses[key] = response
    }

    private generateResponseKey(
        url: string | URL | undefined | Request,
        init: RequestInit | undefined
    ) {
        return `${url?.toString() ?? '*'}${init ? JSON.stringify(init) : ''}`
    }
}

export interface RequestObject {
    url: string | URL | Request
    init?: RequestInit
}

export type ExpectedRequest = string | URL | RequestObject
