import {
    AssertionResult,
    END_DIVIDER,
    START_DIVIDER,
    retrocycle,
} from '@sprucelabs/jest-json-reporter'
import { escapeRegExp } from 'lodash-es'
import { SpruceTestFile, TestResultStatus, TestResults } from './test.types.js'

interface AggregatedResult {
    numTotalTestSuites: number
    numFailedTestSuites: number
    numPassedTestSuites: number
    numFailedTests: number
    numPassedTests: number
    numTotalTests: number
    numPendingTests: number
    numTodoTests: number
    testResults: TestResult[]
}

interface TestResult {
    testFilePath: string
    failureMessage?: string | null
    numFailingTests: number
    testResults: AssertionResult[]
}

interface TestInfo {
    path: string
}

type JsonParserResult =
    | {
          status: 'onRunStart'
          results: AggregatedResult
      }
    | {
          status: 'onTestCaseResult'
          test: TestInfo
          testCaseResult: AssertionResult
      }
    | {
          status: 'onTestFileStart'
          test: TestInfo
      }
    | {
          status: 'onTestFileResult'
          test: TestInfo
          testResult: TestResult
          aggregatedResult: AggregatedResult
      }

export default class JestJsonParser {
    private testResults: TestResults = { totalTestFiles: 0 }
    private buffer = ''

    public write(data: string) {
        let dataToProcess = this.buffer + data
        let endDividerStartIdx = -1

        do {
            endDividerStartIdx = dataToProcess.search(escapeRegExp(END_DIVIDER))
            if (endDividerStartIdx > -1) {
                let startDividerIdx = Math.max(
                    0,
                    dataToProcess.search(escapeRegExp(START_DIVIDER))
                )
                const endDividerEndIdx = endDividerStartIdx + END_DIVIDER.length
                if (startDividerIdx > endDividerStartIdx) {
                    startDividerIdx = -1
                }
                const firstSegment = dataToProcess.substr(
                    startDividerIdx,
                    endDividerEndIdx - startDividerIdx
                )
                const cleanedSegment = firstSegment
                    .replace(START_DIVIDER, '')
                    .replace(END_DIVIDER, '')
                    .trim()

                const result = retrocycle(
                    JSON.parse(cleanedSegment)
                ) as JsonParserResult

                this.ingestJestResult(result)

                dataToProcess = dataToProcess.substr(endDividerEndIdx)
            }
        } while (endDividerStartIdx > -1)

        this.buffer = dataToProcess
    }

    private ingestJestResult(result: JsonParserResult) {
        const testFiles = this.testResults.testFiles ?? []
        switch (result.status) {
            case 'onRunStart':
                this.testResults = {
                    totalTestFiles: result.results.numTotalTestSuites,
                }
                break

            case 'onTestCaseResult': {
                const relativePath = this.mapAbsoluteJsToRelativeTsPath(
                    result.test.path
                )
                const idx = testFiles.findIndex(
                    (file) => file.path === relativePath
                )
                const test = this.testCaseResultToTest(result.testCaseResult)

                if (idx === -1) {
                    break
                }
                if (!testFiles[idx].tests) {
                    testFiles[idx].tests = []
                }
                testFiles[idx].tests?.push(test)
                break
            }
            case 'onTestFileStart':
                testFiles.push({
                    path: this.pullPathFromTestResponse(result),
                    status: this.pullTestFileStatusFromTestResponse(result),
                })
                break

            case 'onTestFileResult': {
                this.testResults.totalTestFilesComplete =
                    this.pullTestFilesCompleteFromAggregatedResults(
                        result.aggregatedResult
                    )
                this.testResults.totalTestFiles =
                    result.aggregatedResult.numTotalTestSuites
                this.testResults.totalFailed =
                    result.aggregatedResult.numFailedTests
                this.testResults.totalPassed =
                    result.aggregatedResult.numPassedTests
                this.testResults.totalTests =
                    result.aggregatedResult.numTotalTests
                this.testResults.totalSkipped =
                    result.aggregatedResult.numPendingTests
                this.testResults.totalTodo =
                    result.aggregatedResult.numTodoTests

                for (const testResult of result.aggregatedResult.testResults) {
                    const relativePath = this.mapAbsoluteJsToRelativeTsPath(
                        testResult.testFilePath
                    )
                    const idx = testFiles.findIndex(
                        (file) => file.path === relativePath
                    )
                    const file = {
                        ...(testFiles[idx] ?? {}),
                        path: relativePath,
                        status: this.pullTestFileResultStatus(testResult),
                        tests: this.pullTestsFromTestFileResult(testResult),
                    }

                    if (testResult.failureMessage) {
                        file.errorMessage = testResult.failureMessage
                    }

                    if (idx === -1) {
                        testFiles.push(file)
                    } else {
                        testFiles[idx] = file
                    }
                }
                break
            }
        }

        if (testFiles.length > 0) {
            this.testResults.testFiles = testFiles
        }
    }

    private pullTestFilesCompleteFromAggregatedResults(
        aggregatedResult: AggregatedResult
    ) {
        const total =
            aggregatedResult.numFailedTestSuites +
            aggregatedResult.numPassedTestSuites

        return total
    }

    private pullPathFromTestResponse(result: JsonParserResult) {
        let path = ''

        switch (result.status) {
            case 'onTestFileResult':
            case 'onTestFileStart':
                path = result.test.path
                break
        }

        const tsFile = this.mapAbsoluteJsToRelativeTsPath(path)
        return tsFile
    }

    private mapAbsoluteJsToRelativeTsPath(path: string) {
        const partialPath = path.split('__tests__').pop()
        if (!partialPath) {
            throw new Error('INVALID TEST FILE')
        }
        const tsFile = partialPath.substr(1, partialPath.length - 3) + 'ts'
        return tsFile
    }

    private pullTestFileStatusFromTestResponse(
        result: JsonParserResult
    ): SpruceTestFile['status'] {
        switch (result.status) {
            case 'onTestFileResult':
                return this.pullTestFileResultStatus(result.testResult)
            default:
                return 'running'
        }
    }

    private pullTestFileResultStatus(testResult: TestResult): TestResultStatus {
        return testResult.failureMessage || testResult.numFailingTests > 0
            ? 'failed'
            : 'passed'
    }

    private pullTestsFromTestFileResult(
        testResult: TestResult
    ): SpruceTestFile['tests'] {
        return testResult.testResults.map((test: AssertionResult) =>
            this.testCaseResultToTest(test)
        )
    }

    private testCaseResultToTest(test: AssertionResult): {
        name: string
        status: AssertionResult['status']
        errorMessages: string[]
        duration: number
    } {
        return {
            name: test.title,
            status: test.status,
            errorMessages: test.failureMessages,
            duration: test.duration ?? 0,
        }
    }

    public getResults(): TestResults {
        return this.testResults
    }
}
