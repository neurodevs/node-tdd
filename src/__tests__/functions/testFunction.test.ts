import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import test from '../../functions/test.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

const { test: spruceTest, assert } = require('@sprucelabs/test-utils')

export default class TestFunctionTest extends AbstractPackageTest {
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
