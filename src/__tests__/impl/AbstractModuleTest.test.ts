import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import AbstractModuleTest from '../../impl/AbstractModuleTest.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

const {
    default: AbstractSpruceTest,
    test,
    assert,
} = require('@sprucelabs/test-utils')

export default class AbstractModuleTestClassTest extends AbstractPackageTest {
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

    @test()
    protected static async hasProtectedStaticGenerateIdMethod() {
        // @ts-ignore
        const randomId = AbstractModuleTest.generateId()

        assert.isTruthy(randomId, 'generateId did not return an id!')
    }
}
