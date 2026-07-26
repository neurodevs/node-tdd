import {
    AggregatedResult,
    TestContext,
    Reporter,
    Test,
    TestResult,
} from '@jest/reporters'

import { cycle } from './cycle.js'

export declare type Milliseconds = number
export declare type TestStatus =
    | 'passed'
    | 'failed'
    | 'skipped'
    | 'pending'
    | 'todo'
    | 'disabled'
    | 'focused'

declare interface CallSite {
    column: number
    line: number
}

export declare interface AssertionResult {
    ancestorTitles: string[]
    duration?: Milliseconds | null
    failureDetails: unknown[]
    failureMessages: string[]
    fullName: string
    invocations?: number
    location?: CallSite | null
    numPassingAsserts: number
    status: TestStatus
    title: string
}

export const START_DIVIDER =
    '***************************START_JSON_DIVIDER***************************'

export const END_DIVIDER =
    '***************************END_JSON_DIVIDER***************************'

export default class JsonReporter implements Reporter {
    public onTestFileResult(
        test: Test,
        testResult: TestResult,
        aggregatedResult: AggregatedResult
    ) {
        this.render({
            status: 'onTestFileResult',
            test: this.slimTest(test),
            testResult: this.slimTestResult(testResult),
            aggregatedResult: this.slimAggregatedResult(aggregatedResult),
        })
    }

    public onRunStart(results: AggregatedResult) {
        this.render({
            status: 'onRunStart',
            results: this.slimAggregatedResult(results),
        })
    }

    public onRunComplete(
        _contexts: Set<TestContext>,
        results: AggregatedResult
    ) {
        this.render({
            status: 'onRunComplete',
            results: this.slimAggregatedResult(results),
        })
    }

    public onTestCaseResult(test: Test, testCaseResult: AssertionResult) {
        this.render({
            status: 'onTestCaseResult',
            test: this.slimTest(test),
            testCaseResult: this.slimAssertionResult(testCaseResult),
        })
    }

    public onTestFileStart(test: Test) {
        this.render({ status: 'onTestFileStart', test: this.slimTest(test) })
    }

    public getLastError() {
        return undefined
    }

    public onTestResult() {}

    private slimTest(test: Test) {
        return { path: test.path }
    }

    private slimAssertionResult(result: AssertionResult) {
        return {
            title: result.title,
            status: result.status,
            failureMessages: result.failureMessages,
            duration: result.duration ?? null,
        }
    }

    private slimTestResult(testResult: TestResult) {
        return {
            testFilePath: testResult.testFilePath,
            failureMessage: testResult.failureMessage ?? null,
            numFailingTests: testResult.numFailingTests,
            testResults: testResult.testResults.map((result) =>
                this.slimAssertionResult(result as AssertionResult)
            ),
        }
    }

    private slimAggregatedResult(results: AggregatedResult) {
        return {
            numTotalTestSuites: results.numTotalTestSuites,
            numFailedTestSuites: results.numFailedTestSuites,
            numPassedTestSuites: results.numPassedTestSuites,
            numTotalTests: results.numTotalTests,
            numFailedTests: results.numFailedTests,
            numPassedTests: results.numPassedTests,
            numPendingTests: results.numPendingTests,
            numTodoTests: results.numTodoTests,
            testResults: results.testResults.map((testResult) =>
                this.slimTestResult(testResult)
            ),
        }
    }

    private render(obj: Record<string, any>) {
        const string = cycle(obj)
        const toWrite =
            START_DIVIDER + JSON.stringify(string) + END_DIVIDER + '\n'
        console.log(toWrite)
        return toWrite
    }

    public onTestStart() {}
}

export * from './cycle.js'
