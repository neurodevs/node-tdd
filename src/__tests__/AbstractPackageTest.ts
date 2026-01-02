import AbstractModuleTest from '../impl/AbstractModuleTest.js'

export default abstract class AbstractPackageTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }
}
