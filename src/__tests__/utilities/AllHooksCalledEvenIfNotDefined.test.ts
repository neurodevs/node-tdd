import assert from '../../utilities/assert.js'
import test from '../../utilities/decorators.js'
import TestDecoratorResolver from '../../utilities/TestDecoratorResolver.js'
import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'

let beforeBeforeAllCount = 0
let afterBeforeAllCount = 0
let beforeAfterAll = 0

export default class AllHooksCalledEvenIfNotDefinedTest extends AbstractModuleTest {
    protected static async afterAll() {
        assert.isEqual(beforeBeforeAllCount, 1)
        assert.isEqual(afterBeforeAllCount, 1)
        assert.isEqual(beforeAfterAll, 1)
    }

    @test()
    protected static async canCreateAllHooksCalledEvenIfNotDefined() {}
}

TestDecoratorResolver.onWillCallBeforeAll(() => {
    beforeBeforeAllCount++
})

TestDecoratorResolver.onDidCallBeforeAll(() => {
    afterBeforeAllCount++
})

TestDecoratorResolver.onWillCallAfterAll(() => {
    beforeAfterAll++
})
