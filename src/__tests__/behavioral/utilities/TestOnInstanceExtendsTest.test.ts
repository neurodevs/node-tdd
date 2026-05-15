import test, { suite } from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'
import AbstractTestOnInstanceTest from '../../support/AbstractTestOnInstanceTest.js'
import TestDecoratorResolver from '../../../utilities/TestDecoratorResolver.js'

@suite()
export default class TestOnInstanceExtendsTest extends AbstractTestOnInstanceTest {
    protected static async beforeAll() {
        assert.isEqual(
            this.beforeBeforeAllCount,
            1,
            'beforeBeforeAll not called first'
        )
        assert.isEqual(
            this.beforeBeforeAllCount2,
            1,
            'beforeBeforeAll not called second time'
        )
        assert.isEqual(
            this.afterBeforeAllCount,
            0,
            'afterBeforeAll called too soon'
        )
        assert.isEqual(
            this.afterBeforeAllCount2,
            0,
            'afterBeforeAll called too soon'
        )
        this.beforeAllCount += 1

        assert.isEqual(this, TestOnInstanceExtendsTest)
    }

    protected async beforeEach() {
        TestOnInstanceExtendsTest.beforeEachCount += 1

        assert.isEqual(
            TestOnInstanceExtendsTest.beforeBeforeEach,
            TestOnInstanceExtendsTest.beforeEachCount,
            'beforeBeforeEach not called first'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.beforeBeforeEach2,
            TestOnInstanceExtendsTest.beforeEachCount,
            'beforeBeforeEach not called second time'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.afterBeforeEach,
            TestOnInstanceExtendsTest.beforeEachCount - 1,
            'afterBeforeEach called too soon'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.afterBeforeEach2,
            TestOnInstanceExtendsTest.beforeEachCount - 1,
            'afterBeforeEach called too soon'
        )

        assert.isInstanceOf(this, TestOnInstanceExtendsTest)
    }

    protected async afterEach() {
        TestOnInstanceExtendsTest.afterEachCount += 1

        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAfterEach,
            TestOnInstanceExtendsTest.afterEachCount,
            'beforeAfterEach not called first'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAfterEach2,
            TestOnInstanceExtendsTest.afterEachCount,
            'beforeAfterEach not called second time'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.afterAfterEach,
            TestOnInstanceExtendsTest.afterEachCount - 1,
            'afterAfterEach called too soon'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.afterAfterEach2,
            TestOnInstanceExtendsTest.afterEachCount - 1,
            'afterAfterEach called too soon'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAfterAll,
            0,
            'beforeAfterAll called too soon'
        )
        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAfterAll2,
            0,
            'beforeAfterAll called too soon'
        )

        assert.isInstanceOf(this, TestOnInstanceExtendsTest)
    }

    protected static async afterAll() {
        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAllCount,
            1,
            'beforeAll not called once'
        )
        assert.isEqual(
            TestOnInstanceExtendsTest.afterBeforeAllCount,
            1,
            'afterBeforeAll not called first'
        )
        assert.isEqual(
            TestOnInstanceExtendsTest.afterBeforeAllCount2,
            1,
            'afterBeforeAll not called second time'
        )

        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAfterAll,
            1,
            'beforeAfterAll was not called'
        )
        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAfterAll2,
            1,
            'beforeAfterAll was not called'
        )

        assert.isEqual(this, TestOnInstanceExtendsTest)

        assert.isEqual(
            TestOnInstanceExtendsTest.afterAfterAll,
            0,
            'afterAfterAll called too soon'
        )
        assert.isEqual(
            TestOnInstanceExtendsTest.afterAfterAll2,
            0,
            'afterAfterAll called too soon'
        )

        setTimeout(() => {
            assert.isEqual(
                TestOnInstanceExtendsTest.afterAfterAll,
                1,
                'afterAfterAll not called'
            )
            assert.isEqual(
                TestOnInstanceExtendsTest.afterAfterAll2,
                1,
                'afterAfterAll not called'
            )
        }, 10)
    }

    @test()
    protected async doesCallBeforeAll() {
        assert.isEqual(
            TestOnInstanceExtendsTest.beforeAllCount,
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
    TestOnInstanceExtendsTest.beforeBeforeAllCount++
})

TestDecoratorResolver.onWillCallBeforeAll(() => {
    TestOnInstanceExtendsTest.beforeBeforeAllCount2++
})

TestDecoratorResolver.onDidCallBeforeAll(() => {
    TestOnInstanceExtendsTest.afterBeforeAllCount++
})

TestDecoratorResolver.onDidCallBeforeAll(() => {
    TestOnInstanceExtendsTest.afterBeforeAllCount2++
})

TestDecoratorResolver.onWillCallBeforeEach(() => {
    TestOnInstanceExtendsTest.beforeBeforeEach++
})

TestDecoratorResolver.onWillCallBeforeEach(() => {
    TestOnInstanceExtendsTest.beforeBeforeEach2++
})

TestDecoratorResolver.onDidCallBeforeEach(() => {
    TestOnInstanceExtendsTest.afterBeforeEach++
})

TestDecoratorResolver.onDidCallBeforeEach(() => {
    TestOnInstanceExtendsTest.afterBeforeEach2++
})

TestDecoratorResolver.onWillCallAfterEach(() => {
    TestOnInstanceExtendsTest.beforeAfterEach++
})

TestDecoratorResolver.onWillCallAfterEach(() => {
    TestOnInstanceExtendsTest.beforeAfterEach2++
})

TestDecoratorResolver.onDidCallAfterEach(() => {
    TestOnInstanceExtendsTest.afterAfterEach++
})

TestDecoratorResolver.onDidCallAfterEach(() => {
    TestOnInstanceExtendsTest.afterAfterEach2++
})

TestDecoratorResolver.onWillCallAfterAll(() => {
    TestOnInstanceExtendsTest.beforeAfterAll++
})

TestDecoratorResolver.onWillCallAfterAll(() => {
    TestOnInstanceExtendsTest.beforeAfterAll2++
})

TestDecoratorResolver.onDidCallAfterAll(() => {
    TestOnInstanceExtendsTest.afterAfterAll++
})

TestDecoratorResolver.onDidCallAfterAll(() => {
    TestOnInstanceExtendsTest.afterAfterAll2++
})
