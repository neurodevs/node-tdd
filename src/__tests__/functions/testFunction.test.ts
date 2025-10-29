import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import assert from '../../functions/assert.js'
import test from '../../functions/test.js'

const {
    default: AbstractSpruceTest,
    test: spruceTest,
    assert,
    //@ts-ignore
} = require('@sprucelabs/test-utils')

export default class TestFunctionTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    @test()
    protected static async returnsTestObjectFromSpruceTestUtils() {
        assert.isEqualDeep(
            test,
            spruceTest,
            'Did not return expected test object!'
        )
    }
}
