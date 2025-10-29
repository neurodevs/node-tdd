import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import assert from '../../functions/assert.js'

const {
    default: AbstractSpruceTest,
    test,
    assert: spruceAssert,
} = require('@sprucelabs/test-utils')

export default class AssertFunctionTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    @test()
    protected static async returnsAssertObjectFromSpruceTestUtils() {
        spruceAssert.isEqualDeep(
            assert,
            spruceAssert,
            'Did not return expected assert object!'
        )
    }
}
