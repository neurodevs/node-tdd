import AbstractModuleTest from '../../impl/AbstractModuleTest.js'

export default abstract class AbstractBeforeAllLevelTwoTest extends AbstractModuleTest {
    protected static wasBeforeAllLevelTwoCalled = false
    protected wasBeforeEachLevelTwoCalled = false

    protected static async beforeAll() {
        await super.beforeAll()
        this.wasBeforeAllLevelTwoCalled = true
    }

    protected async beforeEach() {
        await super.beforeEach()
        this.wasBeforeEachLevelTwoCalled = true
    }
}
