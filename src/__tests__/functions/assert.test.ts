import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import assert from '../../functions/assert.js'

const {
    default: AbstractSpruceTest,
    test,
    assert: assertUtil,
} = require('@sprucelabs/test-utils')

export default class AssertTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    @test()
    protected static async throwsIfIsTrueIsFalse() {
        assertUtil.doesThrow(
            () => {
                assert.isTrue(false)
            },
            undefined,
            'Expected true but got false.'
        )
    }
}
