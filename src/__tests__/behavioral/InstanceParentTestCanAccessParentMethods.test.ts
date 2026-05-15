import assert from '../../utilities/assert.js'
import test, { suite } from '../../utilities/decorators.js'
import AbstractStaticTest from '../support/AbstractStaticTest.js'

@suite()
export default class InstanceParentTestCanAccessParentMethodsTest extends AbstractStaticTest {
    @test()
    protected async canCreateInstanceParentTestCanAccessParentMethods() {
        assert.isTrue(
            InstanceParentTestCanAccessParentMethodsTest.didCallAnotherStaticMethodInBeforeEach,
            'beforeAll in parent class not referrenced'
        )
    }
}
