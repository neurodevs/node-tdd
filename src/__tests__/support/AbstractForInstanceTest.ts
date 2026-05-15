import assert from '../../utilities/assert.js'

export default abstract class AbstractForInstanceTest {
    protected static wasBeforeAllCalled = false
    public static async beforeAll() {
        assert.isFalse(
            this.wasBeforeAllCalled,
            'beforeAll in parent class not referrenced'
        )
        this.wasBeforeAllCalled = true
    }
}
