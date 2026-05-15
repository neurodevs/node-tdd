import AbstractModuleTest from '../../impl/AbstractModuleTest.js'
import assert from '../../utilities/assert.js'
import test from '../../utilities/decorators.js'

export default class StaticTestInheritsAbstractModuleTestProperlyTest extends AbstractModuleTest {
    @test('checking if cwd is set')
    protected static canCreateStaticTestInheritsAbstractModuleTestProperly() {
        assert.isEqual(this.cwd, process.cwd())
        this.resolvePath('hello')
    }
}
