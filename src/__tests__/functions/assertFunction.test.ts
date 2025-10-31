import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import assert from '../../functions/assert.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

const { test, assert: spruceAssert } = require('@sprucelabs/test-utils')

export default class AssertFunctionTest extends AbstractPackageTest {
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
