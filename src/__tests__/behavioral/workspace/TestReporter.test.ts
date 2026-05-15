import AbstractModuleTest from '../../../impl/AbstractModuleTest.js'
import test from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'
import TestReporter, {
    TestReporterOptions,
} from '../../../workspace/TestReporter.js'

export default class TestReporterTest extends AbstractModuleTest {
    @test()
    protected static async canInstantiateTestReporter() {
        const reporter = this.TestReporter()
        assert.isTruthy(reporter)
    }

    @test()
    protected static async canInstantiateWithOptions() {
        const reporter = this.TestReporter({
            cwd: this.cwd,
            watchMode: 'off',
            status: 'ready',
            isDebugging: false,
        })
        assert.isTruthy(reporter)
    }

    @test()
    protected static async hasStartMethod() {
        const reporter = this.TestReporter()
        assert.isFunction(reporter.start)
    }

    @test()
    protected static async hasDestroyMethod() {
        const reporter = this.TestReporter()
        assert.isFunction(reporter.destroy)
    }

    @test()
    protected static async hasUpdateResultsMethod() {
        const reporter = this.TestReporter()
        assert.isFunction(reporter.updateResults)
    }

    @test()
    protected static async hasSetStatusMethod() {
        const reporter = this.TestReporter()
        assert.isFunction(reporter.setStatus)
    }

    @test()
    protected static async hasResetMethod() {
        const reporter = this.TestReporter()
        assert.isFunction(reporter.reset)
    }

    @test()
    protected static async hasAppendErrorMethod() {
        const reporter = this.TestReporter()
        assert.isFunction(reporter.appendError)
    }

    @test()
    protected static async throwsIfUpdateResultsCalledBeforeStart() {
        const reporter = this.TestReporter()
        assert.doesThrow(() => {
            reporter.updateResults({ totalTestFiles: 0 })
        })
    }

    @test()
    protected static async doesNotDestroyOnUncaughtException() {
        const reporter = this.TestReporter()
        let destroyCalled = false
        let killHandler: ((payload: { code: any }) => void) | undefined

        const fakeWidget: any = new Proxy(
            {},
            {
                get: (_t, prop: string) => {
                    if (prop === 'getFrame') {
                        return () => ({
                            left: 0,
                            top: 0,
                            width: 100,
                            height: 50,
                        })
                    }
                    if (prop === 'getChildById') {
                        return () => null
                    }
                    if (prop === 'getRows') {
                        return () => [{}]
                    }
                    if (prop === 'getFocusedWidget') {
                        return () => null
                    }
                    if (prop === 'on') {
                        return (event: string, handler: any) => {
                            if (event === 'kill') {
                                killHandler = handler
                            }
                        }
                    }
                    return () => fakeWidget
                },
            }
        )

        reporter.widgets = { Widget: () => fakeWidget }
        reporter.destroy = async () => {
            destroyCalled = true
        }

        await reporter.start()

        assert.isTruthy(killHandler, 'kill handler must be registered')

        killHandler!({
            code: new Error('terminal-kit mouse boundary crash'),
        })
        assert.isFalse(
            destroyCalled,
            'uncaughtException must not destroy the UI'
        )

        killHandler!({ code: 0 })
        assert.isTrue(
            destroyCalled,
            'real exit signal must still destroy the UI'
        )

        clearInterval(reporter.updateInterval)
    }

    @test()
    protected static async grabsInputToResetMouseStateAfterCrash() {
        const reporter = this.TestReporter()
        let destroyCalled = false
        let grabInputCalled = false
        let killHandler: ((payload: { code: any }) => void) | undefined

        const fakeTerm = {
            grabInput: () => {
                grabInputCalled = true
            },
        }

        const fakeWidget: any = new Proxy(
            {},
            {
                get: (_t, prop: string) => {
                    if (prop === 'getFrame') {
                        return () => ({
                            left: 0,
                            top: 0,
                            width: 100,
                            height: 50,
                        })
                    }
                    if (prop === 'getChildById') {
                        return () => null
                    }
                    if (prop === 'getRows') {
                        return () => [{}]
                    }
                    if (prop === 'getFocusedWidget') {
                        return () => null
                    }
                    if (prop === 'term') {
                        return fakeTerm
                    }
                    if (prop === 'on') {
                        return (event: string, handler: any) => {
                            if (event === 'kill') {
                                killHandler = handler
                            }
                        }
                    }
                    return () => fakeWidget
                },
            }
        )

        reporter.widgets = { Widget: () => fakeWidget }
        reporter.destroy = async () => {
            destroyCalled = true
        }

        await reporter.start()

        assert.isTruthy(killHandler, 'kill handler must be registered')

        killHandler!({
            code: new Error('terminal-kit mouse boundary crash'),
        })
        assert.isTrue(
            destroyCalled,
            'uncaughtException must not destroy the UI'
        )

        killHandler!({ code: 0 })
        assert.isTrue(
            destroyCalled,
            'real exit signal must still destroy the UI'
        )

        assert.isTrue(
            grabInputCalled,
            'grabInput must be called to reset mouse state after terminal crash'
        )

        clearInterval(reporter.updateInterval)
    }

    @test()
    protected static async errorLogIsCreatedWithFocusableSetToFalse() {
        const reporter = this.TestReporter() as any
        let capturedTextOptions: any

        const fakeCell = { getFrame: () => ({ width: 100, height: 50 }) }

        reporter.orientation = 'landscape'

        reporter.bottomLayout = {
            getRows: () => [{ id: 'row_1' }],
            addColumn: () => {},
            setColumnWidth: () => {},
            updateLayout: () => {},
            getChildById: (id: string) => {
                return id === 'errors' ? fakeCell : null
            },
        }

        reporter.widgets = {
            Widget: (type: string, options: any) => {
                if (type === 'text') {
                    capturedTextOptions = options
                }
                return {
                    on: () => {},
                    getFrame: () => ({ width: 100, height: 50 }),
                }
            },
        }

        reporter.dropInErrorLog()

        assert.isFalse(
            capturedTextOptions?.focusable,
            'errorLog must be created with focusable: false to prevent UI lockup on click'
        )
    }

    private static TestReporter(options?: TestReporterOptions) {
        return new TestReporter(options) as any
    }
}
