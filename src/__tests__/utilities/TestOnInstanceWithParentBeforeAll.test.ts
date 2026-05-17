import test, { suite } from '../../utilities/decorators.js'
import assert from '../../utilities/assert.js'
import AbstractForInstanceTest from '../support/AbstractForInstanceTest.js'

@suite()
export default class TestOnInstanceWithParentBeforeAllTest extends AbstractForInstanceTest {
    @test()
    protected async canCreateTestOnInstanceWithParentBeforeAll() {
        assert.isTrue(
            TestOnInstanceWithParentBeforeAllTest.wasBeforeAllCalled,
            'beforeAll was not called on parent class'
        )
    }
}
