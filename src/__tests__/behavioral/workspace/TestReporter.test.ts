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
}
