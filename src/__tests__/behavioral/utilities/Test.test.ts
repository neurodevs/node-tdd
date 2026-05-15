import AbstractModuleTest from '../../../impl/AbstractModuleTest.js'
import test from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'

let beforeAllCount = 0
let beforeEachCount = 0
let afterEachCount = 0

export default class Test extends AbstractModuleTest {
    protected static async beforeAll() {
        beforeAllCount += 1
    }

    protected static async beforeEach() {
        beforeEachCount += 1
    }

    protected static async afterEach() {
        afterEachCount += 1
    }

    @test()
    protected static async doesCallBeforeAll() {
        assert.isEqual(beforeAllCount, 1)
    }

    @test()
    protected static async basicPassingTest() {
        assert.isTrue(true)
        assert.isFalse(false)
        assert.isEqual(5, 5, `Thing's don't equal`)
    }

    @test('can pass variables to test handler from decorator', 'hello', 'world')
    protected static async canAccessVarsFromDecorator(
        hello: string,
        world: string
    ) {
        assert.isEqual(hello, 'hello')
        assert.isEqual(world, 'world')
    }

    @test()
    protected static async calledBeforeAndAfterEach() {
        assert.isEqual(beforeEachCount, 4)
        assert.isEqual(afterEachCount, 3)
    }

    @test()
    protected static async asyncWaits() {
        const results = await this.wait(10)
        assert.isTruthy(results)
    }

    @test.todo('can create a TODO test')
    protected static async todo() {
        assert.fail('This test should not run')
    }
}
