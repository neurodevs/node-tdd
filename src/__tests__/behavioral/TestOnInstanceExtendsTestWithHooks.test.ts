import test, { suite } from '../../utilities/decorators.js'
import assert from '../../utilities/assert.js'
import AbstractTestOnInstanceWithHooksTest from '../support/AbstractTestOnInstanceWithHooks.js'
import TestDecoratorResolver from '../../utilities/TestDecoratorResolver.js'

@suite()
export default class TestOnInstanceExtendsTestWithHooks extends AbstractTestOnInstanceWithHooksTest {
    @test()
    protected async doesCallBeforeAll() {
        assert.isEqual(
            TestOnInstanceExtendsTestWithHooks.beforeAllCount,
            1,
            'Did not call beforeAll'
        )
    }

    @test()
    protected async basicPassingTest() {
        assert.isTrue(true)
    }
}

TestDecoratorResolver.onWillCallBeforeAll(() => {
    TestOnInstanceExtendsTestWithHooks.beforeBeforeAllCount++
})

TestDecoratorResolver.onWillCallBeforeAll(() => {
    TestOnInstanceExtendsTestWithHooks.beforeBeforeAllCount2++
})

TestDecoratorResolver.onDidCallBeforeAll(() => {
    TestOnInstanceExtendsTestWithHooks.afterBeforeAllCount++
})

TestDecoratorResolver.onDidCallBeforeAll(() => {
    TestOnInstanceExtendsTestWithHooks.afterBeforeAllCount2++
})

TestDecoratorResolver.onWillCallBeforeEach(() => {
    TestDecoratorResolver.getActiveTest().beforeBeforeEach++
})

TestDecoratorResolver.onWillCallBeforeEach(() => {
    TestDecoratorResolver.getActiveTest().beforeBeforeEach2++
})

TestDecoratorResolver.onDidCallBeforeEach(() => {
    TestDecoratorResolver.getActiveTest().afterBeforeEach++
})

TestDecoratorResolver.onDidCallBeforeEach(() => {
    TestDecoratorResolver.getActiveTest().afterBeforeEach2++
})

TestDecoratorResolver.onWillCallAfterEach(() => {
    TestDecoratorResolver.getActiveTest().beforeAfterEach++
})

TestDecoratorResolver.onWillCallAfterEach(() => {
    TestDecoratorResolver.getActiveTest().beforeAfterEach2++
})

TestDecoratorResolver.onDidCallAfterEach(() => {
    TestDecoratorResolver.getActiveTest().afterAfterEach++
})

TestDecoratorResolver.onDidCallAfterEach(() => {
    TestDecoratorResolver.getActiveTest().afterAfterEach2++
})

TestDecoratorResolver.onWillCallAfterAll(() => {
    TestOnInstanceExtendsTestWithHooks.beforeAfterAll++
})

TestDecoratorResolver.onWillCallAfterAll(() => {
    TestOnInstanceExtendsTestWithHooks.beforeAfterAll2++
})

TestDecoratorResolver.onDidCallAfterAll(() => {
    TestOnInstanceExtendsTestWithHooks.afterAfterAll++
})

TestDecoratorResolver.onDidCallAfterAll(() => {
    TestOnInstanceExtendsTestWithHooks.afterAfterAll2++
})
