import AbstractModuleTest from '../../../impl/AbstractModuleTest.js'
import test from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'
import TestReporter from '../../../workspace/TestReporter.js'

export default class TestReporterTest extends AbstractModuleTest {
    @test()
    protected static async canInstantiateTestReporter() {
        const reporter = new TestReporter()
        assert.isTruthy(reporter)
    }

    @test()
    protected static async canInstantiateWithOptions() {
        const reporter = new TestReporter({
            cwd: this.cwd,
            watchMode: 'off',
            status: 'ready',
            isDebugging: false,
        })
        assert.isTruthy(reporter)
    }

    @test()
    protected static async hasStartMethod() {
        const reporter = new TestReporter()
        assert.isFunction(reporter.start)
    }

    @test()
    protected static async hasDestroyMethod() {
        const reporter = new TestReporter()
        assert.isFunction(reporter.destroy)
    }

    @test()
    protected static async hasUpdateResultsMethod() {
        const reporter = new TestReporter()
        assert.isFunction(reporter.updateResults)
    }

    @test()
    protected static async hasSetStatusMethod() {
        const reporter = new TestReporter()
        assert.isFunction(reporter.setStatus)
    }

    @test()
    protected static async hasResetMethod() {
        const reporter = new TestReporter()
        assert.isFunction(reporter.reset)
    }

    @test()
    protected static async hasAppendErrorMethod() {
        const reporter = new TestReporter()
        assert.isFunction(reporter.appendError)
    }

    @test()
    protected static async throwsIfUpdateResultsCalledBeforeStart() {
        const reporter = new TestReporter()
        assert.doesThrow(() => {
            reporter.updateResults({ totalTestFiles: 0 })
        })
    }

    @test()
    protected static async errorLogIsCreatedWithFocusableSetToFalse() {
        const reporter = new TestReporter() as any
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

        assert.isTrue(false)

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
}
