import AbstractModuleTest from './utilities/AbstractModuleTest.test.js'

export default abstract class AbstractPackageTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }
}
