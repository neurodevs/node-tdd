import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import AbstractModuleTest from '../../impl/AbstractModuleTest.js'

const {
    default: AbstractSpruceTest,
    test,
    assert,
} = require('@sprucelabs/test-utils')

export default class AbstractModuleTestClassTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    @test()
    protected static async extendsAbstractSpruceTest() {
        assert.isInstanceOf(
            new AbstractModuleTest(),
            AbstractSpruceTest,
            'Did not extend AbstractSpruceTest!'
        )
    }
}
