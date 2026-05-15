import assert from '../../utilities/assert.js'
import test, { suite } from '../../utilities/decorators.js'
import AbstractBeforeAllLevelOneTest from '../support/AbstractLevelOneTest.js'

@suite()
export default class TestOnInstanceWithTwoLevelsOfInheritenceTest extends AbstractBeforeAllLevelOneTest {
    @test()
    protected async canCreateTestOnInstanceWithTwoLevelsOfInheritence() {
        assert.isTrue(
            TestOnInstanceWithTwoLevelsOfInheritenceTest.wasBeforeAllLevelTwoCalled,
            'beforeAll was not called on level two class'
        )

        assert.isTrue(this.wasBeforeEachLevelTwoCalled)
    }
}
