import assert from '../../utilities/assert.js'
import AbstractModuleTest from '../../impl/AbstractModuleTest.js'

export default abstract class AbstractTestOnInstanceWithHooksTest extends AbstractModuleTest {
    public static beforeAllCount = 0
    public beforeEachCount = 0
    public afterEachCount = 0

    public static beforeBeforeAllCount = 0
    public static beforeBeforeAllCount2 = 0
    public static afterBeforeAllCount = 0
    public static afterBeforeAllCount2 = 0

    public beforeBeforeEach = 0
    public beforeBeforeEach2 = 0

    public afterBeforeEach = 0
    public afterBeforeEach2 = 0

    public beforeAfterEach = 0
    public beforeAfterEach2 = 0

    public afterAfterEach = 0
    public afterAfterEach2 = 0

    public static beforeAfterAll = 0
    public static beforeAfterAll2 = 0

    public static afterAfterAll = 0
    public static afterAfterAll2 = 0

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
    }

    protected async beforeEach() {
        this.beforeEachCount += 1

        assert.isEqual(
            this.beforeBeforeEach,
            this.beforeEachCount,
            'beforeBeforeEach not called first'
        )

        assert.isEqual(
            this.beforeBeforeEach2,
            this.beforeEachCount,
            'beforeBeforeEach not called second time'
        )

        assert.isEqual(
            this.afterBeforeEach,
            this.beforeEachCount - 1,
            'afterBeforeEach called too soon'
        )

        assert.isEqual(
            this.afterBeforeEach2,
            this.beforeEachCount - 1,
            'afterBeforeEach called too soon'
        )

        this.beforeEachCount++
    }

    protected async afterEach() {
        this.afterEachCount += 1

        assert.isEqual(
            this.beforeAfterEach,
            this.afterEachCount,
            'beforeAfterEach not called first'
        )

        assert.isEqual(
            this.beforeAfterEach2,
            this.afterEachCount,
            'beforeAfterEach not called second time'
        )

        assert.isEqual(
            this.afterAfterEach,
            this.afterEachCount - 1,
            'afterAfterEach called too soon'
        )

        assert.isEqual(
            this.afterAfterEach2,
            this.afterEachCount - 1,
            'afterAfterEach called too soon'
        )
    }

    protected static async afterAll() {
        assert.isEqual(this.beforeAllCount, 1, 'beforeAll not called once')
        assert.isEqual(
            this.afterBeforeAllCount,
            1,
            'afterBeforeAll not called first'
        )
        assert.isEqual(
            this.afterBeforeAllCount2,
            1,
            'afterBeforeAll not called second time'
        )

        assert.isEqual(this.beforeAfterAll, 1, 'beforeAfterAll was not called')
        assert.isEqual(this.beforeAfterAll2, 1, 'beforeAfterAll was not called')

        assert.isEqual(this.afterAfterAll, 0, 'afterAfterAll called too soon')
        assert.isEqual(this.afterAfterAll2, 0, 'afterAfterAll called too soon')

        setTimeout(() => {
            assert.isEqual(this.afterAfterAll, 1, 'afterAfterAll not called')
            assert.isEqual(this.afterAfterAll2, 1, 'afterAfterAll not called')
        }, 10)
    }
}
