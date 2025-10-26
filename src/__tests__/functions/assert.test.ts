import AbstractSpruceTest, {
    test,
    assert as assertUtil,
} from '@sprucelabs/test-utils'
import assert from '../../functions/assert'

export default class AssertTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    @test()
    protected static async throwsIfIsTrueIsFalse() {
        assertUtil.doesThrow(
            () => {
                assert.isTrue(false)
            },
            undefined,
            'Expected true but got false.'
        )
    }
}
