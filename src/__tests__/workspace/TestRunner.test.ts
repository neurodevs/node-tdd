import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import test from '../../utilities/decorators.js'
import assert from '../../utilities/assert.js'
import TestRunner from '../../workspace/TestRunner.js'
import CommandServiceImpl from '../../workspace/CommandService.js'
import {
    END_DIVIDER,
    START_DIVIDER,
} from '../../jest-json-reporter/JsonReporter.js'

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
    protected static async coalescesDidUpdateEventsWhileStreaming() {
        const totalChunks = 10
        const commandService = new CommandServiceImpl(this.cwd)

        commandService.execute = async (_cmd: string, options?: any) => {
            for (let i = 0; i < totalChunks; i++) {
                await options?.onData?.(
                    this.jsonChunk({
                        status: 'onRunStart',
                        results: { numTotalTestSuites: 3 },
                    })
                )
            }
            return { stdout: '' }
        }

        const runner = new TestRunner({ cwd: this.cwd, commandService })

        let emitCount = 0
        runner.on('did-update', () => {
            emitCount++
        })

        await runner.run()

        assert.isBelow(
            emitCount,
            totalChunks,
            'did-update must be coalesced so the stdout pipe is not starved by a redraw per chunk'
        )
    }

    @test()
    protected static async alwaysEmitsFinalDidUpdateWithCompleteResults() {
        const commandService = new CommandServiceImpl(this.cwd)

        commandService.execute = async (_cmd: string, options?: any) => {
            await options?.onData?.(
                this.jsonChunk({
                    status: 'onRunStart',
                    results: { numTotalTestSuites: 7 },
                })
            )
            return { stdout: '' }
        }

        const runner = new TestRunner({ cwd: this.cwd, commandService })

        let lastResults: any
        runner.on('did-update', (payload: { results: any }) => {
            lastResults = payload.results
        })

        await runner.run()

        assert.isEqual(
            lastResults?.totalTestFiles,
            7,
            'a final did-update must be flushed even when the throttle has not fired'
        )
    }

    @test()
    protected static async flushesFinalDidUpdateWhenCommandFails() {
        const commandService = new CommandServiceImpl(this.cwd)

        commandService.execute = async (_cmd: string, options?: any) => {
            await options?.onData?.(
                this.jsonChunk({
                    status: 'onRunStart',
                    results: { numTotalTestSuites: 4 },
                })
            )
            throw new Error('jest exited non-zero')
        }

        const runner = new TestRunner({ cwd: this.cwd, commandService })

        let lastResults: any
        runner.on('did-update', (payload: { results: any }) => {
            lastResults = payload.results
        })

        const results = await runner.run()

        assert.isEqual(
            lastResults?.totalTestFiles,
            4,
            'results parsed before the failure must still reach listeners'
        )
        assert.isEqual(results.totalTestFiles, 4)
    }

    private static jsonChunk(payload: Record<string, any>) {
        return `${START_DIVIDER}${JSON.stringify(payload)}${END_DIVIDER}`
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
