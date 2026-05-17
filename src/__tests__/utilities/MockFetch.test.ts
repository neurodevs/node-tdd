import generateId from '@neurodevs/generate-id'

import assert from '../../utilities/assert.js'
import test, { suite } from '../../utilities/decorators.js'
import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import MockFetch, { ExpectedRequest } from '../MockFetch.js'

@suite()
export default class MockFetchTest extends AbstractModuleTest {
    private mock = new MockFetch()
    private fetch = this.mock.buildFetch()
    private url = generateId()

    @test()
    protected async throwsIfNotCalled() {
        assert.doesThrow(() => this.assertFetchWasCalled(), 'expected')
    }

    @test()
    protected async passesIfCalled() {
        await this.callFetch()
        this.assertFetchWasCalled()
    }

    @test()
    protected async throwsIfUrlDoesNotMatch() {
        await this.callFetch()
        assert.doesThrow(
            () => this.assertFetchWasCalled(generateId()),
            'Expected fetch() to have been called with URL'
        )
    }

    @test()
    protected async canAssertMultipleCalls() {
        await this.callFetch()
        const url1 = this.url

        this.randomizeUrl()
        await this.callFetch()

        const expected = [url1, this.url]
        this.assertMadeRequests(expected)
    }

    @test()
    protected async assertMultipleFailsIfSecondUrlDoesNotMatch() {
        await this.callFetch()
        const url1 = this.url

        this.randomizeUrl()
        await this.callFetch()

        const expected = [url1, generateId()]
        assert.doesThrow(
            () => this.assertMadeRequests(expected),
            'Expected fetch() to have been called with URL'
        )
    }

    @test()
    protected async assertCalledThrowsIfDoesNotMatchSecondUrl() {
        await this.callFetch()
        const url = this.url
        this.randomizeUrl()
        await this.callFetch()

        assert.doesThrow(
            () => this.assertFetchWasCalled(url),
            'Expected fetch() to have been called with URL'
        )
    }

    @test()
    protected async throwsIfInitDoesNotMatch() {
        await this.callFetch({
            method: 'POST',
        })

        assert.doesThrow(
            () =>
                this.assertFetchWasCalled(this.url, {
                    method: 'GET',
                }),
            'Expected fetch() to have been called with init'
        )
    }

    @test()
    protected async passesIfMethodMatches() {
        await this.callFetch({
            method: 'POST',
        })

        this.assertFetchWasCalled(this.url, {
            method: 'POST',
        })
    }

    @test()
    protected async passesIfHeadersMatch() {
        await this.callFetch({
            headers: {
                'Content-Type': 'application/json',
            },
        })

        this.assertFetchWasCalled(this.url, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    @test()
    protected async throwsIfHeadersDoNotMatch() {
        await this.callFetch({
            headers: {
                'Content-Type': 'application/json',
            },
        })

        assert.doesThrow(() =>
            this.assertFetchWasCalled(this.url, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            })
        )
    }

    @test()
    protected async doesNotThrowIfMultipleRequestsMatch() {
        await this.callFetch({
            method: 'POST',
        })

        await this.callFetch({
            method: 'GET',
        })

        this.assertMadeRequests([
            { url: this.url, init: { method: 'POST' } },
            { url: this.url, init: { method: 'GET' } },
        ])
    }

    @test()
    protected async getBackGeneric200Response() {
        const expected = new Response(
            JSON.stringify({
                success: true,
            }),
            { status: 200 }
        )
        await this.assertFetchResponseEquals(expected)
    }

    @test()
    protected async canSetResponseForAllRequests() {
        const expected = new Response('Hello, World!', {
            status: 404,
        })

        this.setResponse(expected)
        await this.assertFetchResponseEquals(expected)
    }

    @test()
    protected async defaultResponseDoesNotThrowWhenGettingJson() {
        const response = await this.callFetch()
        await response.json()
    }

    @test()
    protected async canSetResponseByUrl() {
        const expected1 = new Response('Response for URL 1', {})
        const expected2 = new Response('Response for URL 2', {})

        const url1 = generateId()
        const url2 = generateId()

        this.setResponse(expected1, url1)
        this.setResponse(expected2, url2)

        this.url = url1
        await this.assertFetchResponseEquals(expected1)

        this.url = url2
        await this.assertFetchResponseEquals(expected2)
    }

    @test()
    protected async canSetResponseByInit() {
        const expected1 = new Response('Special POST Response 1', {})
        const expected2 = new Response('Special POST Response 2', {})

        this.setResponse(expected1, this.url, { method: 'POST' })
        this.setResponse(expected2, this.url, { method: 'GET' })

        await this.assertFetchResponseEquals(expected1, { method: 'POST' })
        await this.assertFetchResponseEquals(expected2, { method: 'GET' })
    }

    private setResponse(
        expected: Response,
        url?: string | URL,
        init?: RequestInit
    ) {
        this.mock.setResponse(expected, url, init)
    }

    private async assertFetchResponseEquals(
        expected: Response,
        init?: RequestInit
    ) {
        const response = await this.callFetch(init)
        assert.isEqualDeep(
            (await response.text()) + ': ' + response.status,
            (await expected.text()) + ': ' + expected.status,
            'fetch() did not return the expected response.'
        )
    }

    private assertMadeRequests(expected: ExpectedRequest[]) {
        this.mock.assertMadeRequests(expected)
    }

    private randomizeUrl() {
        this.url = generateId()
    }

    private async callFetch(init?: RequestInit) {
        return await this.fetch(this.url, init)
    }

    private assertFetchWasCalled(url?: string | URL, init?: RequestInit) {
        this.mock.assertWasCalled(url, init)
    }
}
