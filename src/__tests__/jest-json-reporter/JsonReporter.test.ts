import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import test from '../../utilities/decorators.js'
import assert from '../../utilities/assert.js'
import JsonReporter, {
    END_DIVIDER,
    START_DIVIDER,
} from '../../jest-json-reporter/JsonReporter.js'
import JestJsonParser from '../../workspace/JestJsonParser.js'
import onTestFileResult from '../support/onTestFileResult.js'

export default class JsonReporterTest extends AbstractModuleTest {
    private static originalLog: typeof console.log
    private static logged: string[] = []

    protected static async beforeEach() {
        this.logged = []
        this.originalLog = console.log
        console.log = (message: string) => {
            this.logged.push(message)
        }
    }

    protected static async afterEach() {
        console.log = this.originalLog
    }

    @test()
    protected static async onTestFileStartEmitsOnlyThePath() {
        const { test: testInfo } = onTestFileResult('behavioral/Boot.test.js')

        this.Reporter().onTestFileStart(testInfo as any)

        assert.isEqualDeep(this.parseLastLogged(), {
            status: 'onTestFileStart',
            test: { path: testInfo.path },
        })
    }

    @test()
    protected static async onTestCaseResultEmitsOnlyFieldsTheParserReads() {
        const { test: testInfo, testResult } = onTestFileResult(
            'behavioral/Boot.test.js'
        )
        const testCaseResult = testResult.testResults[0]

        this.Reporter().onTestCaseResult(testInfo as any, testCaseResult as any)

        assert.isEqualDeep(this.parseLastLogged(), {
            status: 'onTestCaseResult',
            test: { path: testInfo.path },
            testCaseResult: {
                title: testCaseResult.title,
                status: testCaseResult.status,
                failureMessages: testCaseResult.failureMessages,
                duration: testCaseResult.duration,
            },
        })
    }

    @test()
    protected static async doesNotEmitJestConfigWithTestFileResults() {
        const {
            test: testInfo,
            testResult,
            aggregatedResult,
        } = onTestFileResult('behavioral/Boot.test.js')

        this.Reporter().onTestFileResult(
            testInfo as any,
            testResult as any,
            aggregatedResult as any
        )

        const rendered = this.lastLogged()

        assert.doesNotInclude(
            rendered,
            'cacheDirectory',
            'jest config must not be serialized into reporter output'
        )
        assert.doesNotInclude(
            rendered,
            'moduleNameMapper',
            'jest config must not be serialized into reporter output'
        )
        assert.doesNotInclude(
            rendered,
            '_moduleMap',
            'haste module map must not be serialized into reporter output'
        )
    }

    @test()
    protected static async keepsFieldsTheParserNeedsOnTestFileResult() {
        const {
            test: testInfo,
            testResult,
            aggregatedResult,
        } = onTestFileResult('behavioral/Boot.test.js')

        this.Reporter().onTestFileResult(
            testInfo as any,
            testResult as any,
            aggregatedResult as any
        )

        const parsed = this.parseLastLogged()

        assert.isEqual(parsed.test.path, testInfo.path)
        assert.isEqual(
            parsed.aggregatedResult.numTotalTestSuites,
            aggregatedResult.numTotalTestSuites
        )
        assert.isEqual(
            parsed.aggregatedResult.numPassedTestSuites,
            aggregatedResult.numPassedTestSuites
        )
        assert.isEqual(
            parsed.aggregatedResult.numFailedTestSuites,
            aggregatedResult.numFailedTestSuites
        )
        assert.isEqual(
            parsed.aggregatedResult.testResults.length,
            aggregatedResult.testResults.length
        )
        assert.isEqual(
            parsed.testResult.numFailingTests,
            testResult.numFailingTests
        )
    }

    @test()
    protected static async doesNotEmitAliasEvents() {
        const reporter = this.Reporter()

        reporter.onTestResult()
        reporter.onTestStart()

        assert.isEqual(
            this.logged.length,
            0,
            'onTestResult and onTestStart duplicate onTestFile* and must not be written to stdout'
        )
    }

    @test()
    protected static async trimmedOutputIsStillParsable() {
        const fileName = 'behavioral/Boot.test.js'
        const {
            test: testInfo,
            testResult,
            aggregatedResult,
        } = onTestFileResult(fileName)

        const reporter = this.Reporter()
        reporter.onRunStart(aggregatedResult as any)
        reporter.onTestFileStart(testInfo as any)
        reporter.onTestFileResult(
            testInfo as any,
            testResult as any,
            aggregatedResult as any
        )

        const parser = new JestJsonParser()
        this.logged.forEach((message) => parser.write(message))
        const results = parser.getResults()

        assert.isEqual(
            results.totalTestFiles,
            aggregatedResult.numTotalTestSuites
        )
        assert.isEqual(results.totalPassed, aggregatedResult.numPassedTests)
        assert.isEqual(results.totalFailed, aggregatedResult.numFailedTests)
        assert.isTruthy(
            results.testFiles?.length,
            'parser must still build test files from the trimmed payload'
        )
        const fileWithTests = results.testFiles?.find(
            (file) => (file.tests?.length ?? 0) > 0
        )

        assert.isTruthy(
            fileWithTests,
            'parser must still build individual tests from the trimmed payload'
        )
        assert.isTruthy(
            fileWithTests?.tests?.[0].name,
            'test names must survive the trimmed payload'
        )
    }

    private static Reporter() {
        return new JsonReporter()
    }

    private static lastLogged() {
        return this.logged[this.logged.length - 1]
    }

    private static parseLastLogged() {
        return JSON.parse(
            this.lastLogged()
                .replace(START_DIVIDER, '')
                .replace(END_DIVIDER, '')
                .trim()
        )
    }
}
