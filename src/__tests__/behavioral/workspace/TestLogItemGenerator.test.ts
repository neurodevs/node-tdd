import AbstractModuleTest from '../../../utilities/AbstractModuleTest.js'
import test from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'
import TestLogItemGenerator from '../../../workspace/TestLogItemGenerator.js'
import { TestFile } from '../../../workspace/test.types.js'

export default class TestLogItemGeneratorTest extends AbstractModuleTest {
    private static generator: TestLogItemGenerator

    protected static async beforeEach() {
        this.generator = new TestLogItemGenerator()
    }

    @test()
    protected static async generatesExactLogContentForPassedFileWithTests() {
        const file: TestFile = {
            path: 'src/foo/MyTest.test.ts',
            status: 'passed',
            tests: [
                { name: 'can do the thing', status: 'passed', duration: 100 },
                { name: 'handles edge case', status: 'failed', duration: 200 },
            ],
        }

        const result = this.generator.generateLogItemForFile(file, 'running')

        const expected =
            '^b^#^g^w^+  passed   ^   src/foo/MyTest.test.ts ^g(300ms)^\n' +
            '\n' +
            '  ^g√^ ^-can do the thing^ ^g(100ms)^\n' +
            '  ^rx^ ^-handles edge case^ ^r(200ms)^\n' +
            '\n'

        assert.isEqual(result, expected)
    }
}
