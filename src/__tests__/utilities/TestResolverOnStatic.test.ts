import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import assert from '../../utilities/assert.js'
import test from '../../utilities/decorators.js'
import TestDecoratorResolver from '../../utilities/TestDecoratorResolver.js'

export default class TestDecoratorResolverOnStaticTest extends AbstractModuleTest {
    @test()
    protected static async canCreateTestDecoratorResolverOnStatic() {
        const active = TestDecoratorResolver.getActiveTest()
        assert.isEqual(active, TestDecoratorResolverOnStaticTest)
    }
}
