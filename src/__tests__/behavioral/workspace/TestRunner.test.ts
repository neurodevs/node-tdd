import AbstractModuleTest from '../../../impl/AbstractModuleTest.js'
import test from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'
import TestRunner from '../../../workspace/TestRunner.js'
import CommandServiceImpl from '../../../workspace/CommandService.js'

export default class TestRunnerTest extends AbstractModuleTest {
    private static runner: TestRunner

    protected static async beforeEach() {
        await super.beforeEach()
        const commandService = new CommandServiceImpl(this.cwd)
        this.runner = new TestRunner({ cwd: this.cwd, commandService })
    }

    @test()
    protected static async canInstantiateTestRunner() {
        assert.isTruthy(this.runner)
    }

    @test()
    protected static async hasHasFailedTestsMethod() {
        assert.isFunction(this.runner.hasFailedTests)
    }

    @test()
    protected static async hasHasSkippedTestsMethod() {
        assert.isFunction(this.runner.hasSkippedTests)
    }

    @test()
    protected static async hasKillMethod() {
        assert.isFunction(this.runner.kill)
    }

    @test()
    protected static async hasRunMethod() {
        assert.isFunction(this.runner.run)
    }

    @test()
    protected static async hasFailedTestsReturnsFalseByDefault() {
        assert.isFalse(this.runner.hasFailedTests())
    }

    @test()
    protected static async hasSkippedTestsReturnsFalseByDefault() {
        assert.isFalse(this.runner.hasSkippedTests())
    }

    @test()
    protected static async emitsDidUpdateEvent() {
        let emitted = false
        this.runner.on('did-update', () => {
            emitted = true
        })
        assert.isFalse(emitted)
        this.runner.emit('did-update', { results: { totalTestFiles: 0 } })
        assert.isTrue(emitted)
    }

    @test()
    protected static async emitsDidErrorEvent() {
        let errorMessage = ''
        this.runner.on('did-error', (payload: { message: string }) => {
            errorMessage = payload.message
        })
        this.runner.emit('did-error', { message: 'test error' })
        assert.isEqual(errorMessage, 'test error')
    }

    @test()
    protected static async passesNodeNoWarningsToCommandService() {
        let capturedEnv: Record<string, any> | undefined

        const commandService = new CommandServiceImpl(this.cwd)
        commandService.execute = async (_cmd: string, options?: any) => {
            capturedEnv = options?.env
            return { stdout: '' }
        }

        const runner = new TestRunner({ cwd: this.cwd, commandService })
        await runner.run()

        assert.isEqual(capturedEnv?.NODE_NO_WARNINGS, '1')
    }
}
