import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'

export default abstract class AbstractStaticTest extends AbstractModuleTest {
    protected static didCallAnotherStaticMethodInBeforeEach = false
    protected static didSetInBeforeAll: boolean

    protected static async beforeAll() {
        await super.beforeAll()
        this.callAnotherStaticMethod()
        this.didSetInBeforeAll = true
    }

    private static callAnotherStaticMethod() {
        this.didCallAnotherStaticMethodInBeforeEach = true
    }
}
