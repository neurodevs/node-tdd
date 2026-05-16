import AbstractModuleTest from '../../../utilities/AbstractModuleTest.js'
import test, { suite } from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'
import TestDecoratorResolver from '../../../utilities/TestDecoratorResolver.js'

let beforeAllCount = 0
let beforeEachCount = 0
let afterEachCount = 0

let willCallBeforeAllCount = 0
let willCallBeforeAllCount2 = 0
let didCallBeforeAllCount = 0
let didCallBeforeAllCount2 = 0

let willCallBeforeEachCount = 0
let willCallBeforeEachCount2 = 0

let didCallBeforeEachCount = 0
let didCallBeforeEachCount2 = 0

let willCallAfterEachCount = 0
let willCallAfterEachCount2 = 0

let didCallAfterEachCount = 0
let didCallAfterEachCount2 = 0

let willCallAfterAllCount = 0
let willCallAfterAllCount2 = 0

let didCallAfterAllCount = 0
let didCallAfterAllCount2 = 0

let willCallBeforeEachTest: any
let didCallBeforeEachTest: any
let willCallAfterEachTest: any
let didCallAfterEachTest: any

let willCallAfterAllTest: any
let didCallAfterAllTest: any
let willCallBeforeAllTest: any
let didCallBeforeAllTest: any

@suite()
export default class TestOnInstanceTest extends AbstractModuleTest {
    private wasInstancePropertySet = false
    private beforeEachCount = 0
    private static instanceToCheckAfterEach?: TestOnInstanceTest

    protected static async beforeAll() {
        assert.isEqual(
            willCallBeforeAllCount,
            1,
            'willCallBeforeAllCount missmatch'
        )
        assert.isEqual(
            willCallBeforeAllCount2,
            1,
            'willCallBeforeAllCount2 missmatch'
        )
        assert.isEqual(didCallBeforeAllCount, 0, 'didCallBeforeAll missmatch')
        assert.isEqual(
            didCallBeforeAllCount2,
            0,
            'didCallBeforeAll missmatched'
        )
        beforeAllCount += 1

        assert.isEqual(this, TestOnInstanceTest)
    }

    protected async beforeEach() {
        beforeEachCount += 1

        assert.isEqual(
            willCallBeforeEachCount,
            beforeEachCount,
            'willCallBeforeEach not called first'
        )

        assert.isEqual(
            willCallBeforeEachCount2,
            beforeEachCount,
            'willCallBeforeEach not called second time'
        )

        assert.isEqual(
            didCallBeforeEachCount,
            beforeEachCount - 1,
            'afterBeforeEach called too soon'
        )

        assert.isEqual(
            didCallBeforeEachCount2,
            beforeEachCount - 1,
            'afterBeforeEach called too soon'
        )

        this.beforeEachCount++
        assert.isInstanceOf(this, TestOnInstanceTest)
    }

    protected async afterEach() {
        afterEachCount += 1

        assert.isEqual(
            willCallAfterEachCount,
            afterEachCount,
            'beforeAfterEach not called first'
        )

        assert.isEqual(
            willCallAfterEachCount2,
            afterEachCount,
            'beforeAfterEach not called second time'
        )

        assert.isEqual(
            didCallAfterEachCount,
            afterEachCount - 1,
            'afterAfterEach called too soon'
        )

        assert.isEqual(
            didCallAfterEachCount2,
            afterEachCount - 1,
            'afterAfterEach called too soon'
        )

        assert.isEqual(
            willCallAfterAllCount,
            0,
            'beforeAfterAll called too soon'
        )
        assert.isEqual(
            willCallAfterAllCount2,
            0,
            'beforeAfterAll called too soon'
        )

        assert.isInstanceOf(this, TestOnInstanceTest)
        if (TestOnInstanceTest.instanceToCheckAfterEach) {
            assert.isEqual(this, TestOnInstanceTest.instanceToCheckAfterEach)
        }
    }

    protected static async afterAll() {
        assert.isTruthy(TestOnInstanceTest.instanceToCheckAfterEach)
        assert.isEqual(beforeAllCount, 1, 'willCallBeforeAll not called once')
        assert.isEqual(
            didCallBeforeAllCount,
            1,
            'didCallBeforeAll not called first'
        )
        assert.isEqual(
            didCallBeforeAllCount2,
            1,
            'didCallBeforeAll not called second time'
        )

        assert.isEqual(
            willCallAfterAllCount,
            1,
            'beforeAfterAll was not called'
        )
        assert.isEqual(
            willCallAfterAllCount2,
            1,
            'beforeAfterAll was not called'
        )

        assert.isEqual(this, TestOnInstanceTest)

        assert.isEqual(
            didCallAfterAllCount,
            0,
            'didCallAfterAll called too soon'
        )
        assert.isEqual(
            didCallAfterAllCount2,
            0,
            'didCallAfterAll called too soon'
        )

        assert.isEqual(
            willCallBeforeAllTest,
            TestOnInstanceTest,
            'willCallBeforeAll did not pass test class'
        )

        setTimeout(() => {
            assert.isEqual(
                didCallAfterAllCount,
                1,
                'didCallAfterAll not called'
            )
            assert.isEqual(
                didCallAfterAllCount2,
                1,
                'didCallAfterAll not called'
            )
            assert.isEqual(
                willCallBeforeAllTest,
                TestOnInstanceTest,
                'willCallBeforeAll did not pass test class'
            )
            assert.isEqual(
                didCallBeforeAllTest,
                TestOnInstanceTest,
                'didCallBeforeAll did not pass test class'
            )
            assert.isEqual(
                willCallAfterAllTest,
                TestOnInstanceTest,
                'beforeAfterAll did not pass test class'
            )
            assert.isEqual(
                didCallAfterAllTest,
                TestOnInstanceTest,
                'didCallAfterAll did not pass test class'
            )
        }, 1)

        assert.isEqual(
            willCallBeforeEachTest,
            TestOnInstanceTest.instanceToCheckAfterEach,
            'Did not pass test instance to beforeBeforeEach'
        )

        assert.isEqual(
            didCallBeforeEachTest,
            TestOnInstanceTest.instanceToCheckAfterEach,
            'Did not pass test instance to afterBeforeEach'
        )

        assert.isEqual(
            willCallAfterEachTest,
            TestOnInstanceTest.instanceToCheckAfterEach,
            'Did not pass test instance to beforeAfterEach'
        )

        assert.isEqual(
            didCallAfterEachTest,
            TestOnInstanceTest.instanceToCheckAfterEach,
            'Did not pass test instance to afterAfterEach'
        )
    }

    @test()
    protected async doesCallBeforeAll() {
        assert.isEqual(beforeAllCount, 1, 'Did not call beforeAll')
    }

    @test()
    protected async basicPassingTest() {
        assert.isTrue(true)
        assert.isFalse(false)
        assert.isEqual(5, 5, `Thing's don't equal`)
    }

    @test('can pass variables to test handler from decorator', 'hello', 'world')
    protected async canAccessVarsFromDecorator(hello: string, world: string) {
        assert.isEqual(hello, 'hello')
        assert.isEqual(world, 'world')
    }

    @test()
    protected async calledBeforeAndAfterEach() {
        assert.isEqual(beforeEachCount, 4)
        assert.isEqual(afterEachCount, 3)
    }

    @test()
    protected async asyncWaits() {
        const results = await this.wait(10)
        assert.isTruthy(results)
    }

    @test()
    protected async settingInstanceProperty() {
        this.wasInstancePropertySet = true
    }

    @test()
    protected async shouldBeResetNow() {
        assert.isFalse(this.wasInstancePropertySet)
    }

    @test.skip()
    protected async skippedTestShouldNotRun() {
        assert.fail('This test should not run')
    }

    @test('can wait for 10', 10)
    @test('can wait for 20', 20)
    protected async shouldBeAbleToWait(waitMs: number) {
        const now = Date.now()
        await this.wait(waitMs)
        const after = Date.now()

        assert.isBetweenInclusive(after - now, waitMs * 0.8, waitMs + 20)
    }

    @test('can log simple message', ['hey'])
    @test('can log multiple messages', ['hey', 'there'])
    protected async canLog(messages: string[]) {
        let passedMessages: string | undefined

        //@ts-ignore
        process.stderr.write = (message) => {
            passedMessages = message as string
        }

        const expected = messages.join(' ')

        this.log(...messages)

        assert.isEqual(passedMessages, expected)
    }

    @test('simple single parameter', 'test')
    protected passesThroughSimpleParameter(param1: any) {
        assert.isEqual(param1, 'test')
    }

    @test('array singe parameter', [1])
    protected passesThroughARrayParameter(param1: any) {
        assert.isEqualDeep(param1, [1])
    }

    @test()
    protected cwdShouldbeSet() {
        assert.isEqual(this.cwd, process.cwd())
    }

    @test()
    protected async resolvePathShouldWork() {
        await AbstractModuleTest.beforeAll()
        this.assertResolvePathReturnsSameAsStatic(['test'])
        this.assertResolvePathReturnsSameAsStatic(['test', 'behavioral'])
        this.assertResolvePathReturnsSameAsStatic([
            'test',
            'behavioral',
            'TestOnInstance.test.ts',
        ])
        this.assertResolvePathReturnsSameAsStatic(['/ok'])
    }

    @test()
    protected async beforeEachCalledOnSameInstance() {
        assert.isEqual(this.beforeEachCount, 1)
    }

    @test.skip()
    protected static async thisShouldThrowBecauseIsStatic() {}

    @test()
    protected async afterEachCalledAOnSameInsntanceRUN_THIS_LAST() {
        TestOnInstanceTest.instanceToCheckAfterEach = this
    }

    private assertResolvePathReturnsSameAsStatic(parts: string[]) {
        const expected = AbstractModuleTest.resolvePath(...parts)
        const actual = this.resolvePath(...parts)

        assert.isEqual(actual, expected)
    }
}

TestDecoratorResolver.onWillCallBeforeAll((Test) => {
    willCallBeforeAllTest = Test
    willCallBeforeAllCount++
})

TestDecoratorResolver.onWillCallBeforeAll(() => {
    willCallBeforeAllCount2++
})

TestDecoratorResolver.onDidCallBeforeAll((Test) => {
    didCallBeforeAllTest = Test
    didCallBeforeAllCount++
})

TestDecoratorResolver.onDidCallBeforeAll(() => {
    didCallBeforeAllCount2++
})

TestDecoratorResolver.onWillCallBeforeEach((Test) => {
    willCallBeforeEachTest = Test
    willCallBeforeEachCount++
})

TestDecoratorResolver.onWillCallBeforeEach(() => {
    willCallBeforeEachCount2++
})

TestDecoratorResolver.onDidCallBeforeEach((Test) => {
    didCallBeforeEachTest = Test
    didCallBeforeEachCount++
})

TestDecoratorResolver.onDidCallBeforeEach(() => {
    didCallBeforeEachCount2++
})

TestDecoratorResolver.onWillCallAfterEach((Test) => {
    willCallAfterEachTest = Test
    willCallAfterEachCount++
})

TestDecoratorResolver.onWillCallAfterEach(() => {
    willCallAfterEachCount2++
})

TestDecoratorResolver.onDidCallAfterEach((Test) => {
    didCallAfterEachTest = Test
    didCallAfterEachCount++
})

TestDecoratorResolver.onDidCallAfterEach(() => {
    didCallAfterEachCount2++
})

TestDecoratorResolver.onWillCallAfterAll((Test) => {
    willCallAfterAllTest = Test
    willCallAfterAllCount++
})

TestDecoratorResolver.onWillCallAfterAll(() => {
    willCallAfterAllCount2++
})

TestDecoratorResolver.onDidCallAfterAll((Test) => {
    didCallAfterAllCount++
    didCallAfterAllTest = Test
})

TestDecoratorResolver.onDidCallAfterAll(() => {
    didCallAfterAllCount2++
})
