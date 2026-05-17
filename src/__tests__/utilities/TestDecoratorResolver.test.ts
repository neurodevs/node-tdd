import assert from '../../utilities/assert.js'
import test, { suite } from '../../utilities/decorators.js'
import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'

import TestDecoratorResolver from '../../utilities/TestDecoratorResolver.js'

@suite()
export default class TestDecoratorResolverTest extends AbstractModuleTest {
    protected static counter = 4

    protected static async beforeAll(): Promise<void> {
        await super.beforeAll()

        assert.isEqual(
            this.counter,
            4,
            'beforeAll did not access correct static property'
        )
    }

    protected static async afterAll(): Promise<void> {
        await super.afterAll()

        assert.isEqual(
            this.counter,
            10,
            'afterAll did not access correct static property'
        )
    }

    @test()
    protected async canCreateTestDecoratorResolver() {
        TestDecoratorResolverTest.counter = 10

        const activeTest = TestDecoratorResolver.getActiveTest()

        assert.isInstanceOf(
            activeTest,
            TestDecoratorResolverTest,
            'getActive test is not this on instance test'
        )

        const activeTest2 = TestDecoratorResolver.getActiveTest()

        assert.isEqual(
            activeTest,
            activeTest2,
            'getActiveTest called a second time did not return same instance'
        )
    }
}
