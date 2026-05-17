import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import test from '../../utilities/decorators.js'
import assert from '../../utilities/assert.js'

export default class AbstractModuleTestClassTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    @test()
    protected static async hasProtectedStaticGenerateIdMethod() {
        const randomId = AbstractModuleTest.generateId()
        assert.isTruthy(randomId, 'generateId did not return an id!')
    }
}
