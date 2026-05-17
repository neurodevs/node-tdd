import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import assert from '../../utilities/assert.js'
import test from '../../utilities/decorators.js'
import JestJsonParser from '../../workspace/JestJsonParser.js'
import onTestFileResult from '../support/onTestFileResult.js'

import {
    END_DIVIDER,
    START_DIVIDER,
} from '../../jest-json-reporter/JsonReporter.js'

type JsonResultKeys = 'onRunStart' | 'onTestFileStart' | 'onTestFileResult'

export default class JestJsonParserTest extends AbstractModuleTest {
    private static parser: JestJsonParser

    protected static async beforeEach() {
        await super.beforeEach()
        this.parser = new JestJsonParser()
    }

    @test()
    protected static canCreateJjp() {
        assert.isTruthy(this.parser.write)
    }

    @test()
    protected static generatesEmptyResults() {
        const startRun = this.generateTestResults('onRunStart')

        this.parser.write(startRun)

        const testResults = this.parser.getResults()

        assert.isEqualDeep(testResults, {
            totalTestFiles: 43,
        })
    }

    @test()
    protected static canHandleSelfContainedWrite() {
        const data = this.generateTestResults(
            'onTestFileStart',
            'behavioral/errors/CreatingANewErrorBuilder.test.js'
        )

        this.parser.write(this.generateTestResults('onRunStart'))
        this.parser.write(data)

        const testResults = this.parser.getResults()
        assert.isTruthy(testResults.testFiles)

        assert.isLength(testResults.testFiles, 1)
        assert.isEqualDeep(testResults.testFiles[0], {
            path: `behavioral/errors/CreatingANewErrorBuilder.test.ts`,
            status: 'running',
        })
    }

    @test()
    protected static canHandleSelfContainedWriteWithTwoTests() {
        const data =
            this.generateTestResults(
                'onTestFileStart',
                'behavioral/errors/CreatingANewErrorBuilder.test.js'
            ) +
            this.generateTestResults(
                'onTestFileStart',
                'behavioral/tests/RunningTests.test.js'
            )
        this.parser.write(data)

        const testResults = this.parser.getResults()

        assert.isTruthy(testResults.testFiles)
        assert.isLength(testResults.testFiles, 2)
        assert.isEqualDeep(testResults.testFiles, [
            {
                path: `behavioral/errors/CreatingANewErrorBuilder.test.ts`,
                status: 'running',
            },
            {
                path: `behavioral/tests/RunningTests.test.ts`,
                status: 'running',
            },
        ])
    }

    @test()
    protected static multipleSelfContainedWritesWorks() {
        this.parser.write(
            this.generateTestResults(
                'onTestFileStart',
                `behavioral/errors/CreatingANewErrorBuilder.test.js`
            )
        )

        this.parser.write(
            this.generateTestResults(
                'onTestFileStart',
                `behavioral/tests/RunningTests.test.js`
            )
        )
        const testResults = this.parser.getResults()

        assert.isTruthy(testResults.testFiles)
        assert.isLength(testResults.testFiles, 2)
        assert.isEqualDeep(testResults.testFiles, [
            {
                path: `behavioral/errors/CreatingANewErrorBuilder.test.ts`,
                status: 'running',
            },
            {
                path: `behavioral/tests/RunningTests.test.ts`,
                status: 'running',
            },
        ])
    }

    @test()
    protected static partialWriteReturnsNothing() {
        const data = this.generateTestResults(
            'onTestFileStart',
            'behavioral/errors/KeepingErrorsInSync.test.js'
        ).substr(0, 100)

        this.parser.write(data)

        const testResults = this.parser.getResults()
        assert.isFalsy(testResults.testFiles)
    }

    @test()
    protected static canPartialWriteAcrossTwoWrites() {
        const data = this.generateTestResults(
            'onTestFileStart',
            'behavioral/errors/KeepingErrorsInSync.test.js'
        )

        const firstPart = data.substr(0, 100)
        const secondPart = data.substr(100)

        this.parser.write(firstPart)
        this.parser.write(secondPart)

        const testResults = this.parser.getResults()

        assert.isTruthy(testResults.testFiles)
        assert.isLength(testResults.testFiles, 1)

        assert.isEqualDeep(testResults.testFiles[0], {
            path: `behavioral/errors/KeepingErrorsInSync.test.ts`,
            status: 'running',
        })
    }

    @test()
    protected static canPartialWriteAndSelfContainedAcrossThreeWrites() {
        const data = this.generateTestResults(
            'onTestFileStart',
            'behavioral/errors/KeepingErrorsInSync.test.js'
        )

        const firstPart = data.substr(0, 100)
        const secondPart = data.substr(100)

        this.parser.write(this.generateTestResults('onRunStart'))
        this.parser.write(firstPart)
        this.parser.write(secondPart)
        this.parser.write(
            this.generateTestResults(
                'onTestFileStart',
                'behavioral/tests/CreatingANewErrorBuilder.test.js'
            )
        )

        const testResults = this.parser.getResults()

        assert.isEqualDeep(testResults, {
            totalTestFiles: 43,
            testFiles: [
                {
                    path: 'behavioral/errors/KeepingErrorsInSync.test.ts',
                    status: 'running',
                },
                {
                    path: 'behavioral/tests/CreatingANewErrorBuilder.test.ts',
                    status: 'running',
                },
            ],
        })
    }

    @test()
    protected static canSelfContainedPlusPartial() {
        const firstSelfContained = this.generateTestResults(
            'onTestFileStart',
            `behavioral/errors/KeepingErrorsInSync.test.js`
        )
        const data =
            firstSelfContained +
            this.generateTestResults(
                'onTestFileStart',
                'behavioral/tests/CreatingANewErrorBuilder.test.js'
            )

        const splitIdx = firstSelfContained.length + 500
        const firstPart = data.substr(0, splitIdx)
        const secondPart = data.substr(splitIdx)

        this.parser.write(firstPart)
        this.parser.write(secondPart)

        const testResults = this.parser.getResults()
        assert.isTruthy(testResults.testFiles)
        assert.isLength(testResults.testFiles, 2)

        assert.isEqualDeep(testResults.testFiles[0], {
            path: `behavioral/errors/KeepingErrorsInSync.test.ts`,
            status: 'running',
        })

        assert.isEqualDeep(testResults.testFiles[1], {
            path: 'behavioral/tests/CreatingANewErrorBuilder.test.ts',
            status: 'running',
        })
    }

    @test()
    protected static canHandleGarbageAtFrontOfData() {
        const data =
            'yarn test run\nother garbage' +
            this.generateTestResults(
                'onTestFileStart',
                'behavioral/errors/CreatingANewErrorBuilder.test.js'
            )
        this.parser.write(data)

        const testResults = this.parser.getResults()

        assert.isTruthy(testResults.testFiles)
        assert.isLength(testResults.testFiles, 1)
        assert.isEqualDeep(testResults.testFiles[0], {
            path: `behavioral/errors/CreatingANewErrorBuilder.test.ts`,
            status: 'running',
        })
    }

    @test()
    protected static canHandlesSplitTestRestsWithGarbageInFrontAndDanglingEnd() {
        this.parser.write(
            'yarn run go team ***************************START_JSON_DIVIDER***************************'
        )
        this.parser.write(
            '{"status":"onTestFileStart","test":{"context":{},"duration":40472,"path":"/example/node-tdd/build/__tests__/behavioral/tests/RunningTests.test.js"}}'
        )

        this.parser.write(
            `***************************END_JSON_DIVIDER***************************\n\t\t\t***************************START_JSON_DIVIDER***************************\n\t\t\t{"status":"onTestFileStart","test":{"context":{},"duration":48733,"path":"/example/node-tdd/build/__tests__/behavioral/errors/CreatingANewErrorBuilder.test.js"}}\n\t\t\t***************************END_JSON_DIVIDER***************************\n\t\t\t***************************START_JSON_DIVIDER***************************\n\t\t\t{"status":"onTestFileStart","test":{"context":{},"duration":17443,"path":"/example/node-tdd/build/__tests__/behavioral/watchers/WatchingForChanges.test.js"}}`
        )

        const testResults = this.parser.getResults()

        assert.isTruthy(testResults.testFiles)
        assert.isLength(testResults.testFiles, 2)
    }

    @test()
    protected static canUpdateAsTestsCompletes() {
        const data = this.generateTestResults(
            'onTestFileStart',
            'behavioral/errors/CreatingANewErrorBuilder.test.js'
        )

        this.parser.write(data)

        const completed = this.generateTestResults(
            'onTestFileResult',
            'behavioral/errors/CreatingANewErrorBuilder.test.js'
        )

        this.parser.write(completed)

        const testResults = this.parser.getResults()

        assert.isTruthy(testResults.testFiles)
        assert.isLength(testResults.testFiles, 11)

        assert.doesInclude(testResults, {
            totalTestFiles: 39,
            totalTestFilesComplete: 20,
            totalFailed: 1,
            totalPassed: 181,
            totalTests: 183,
            totalSkipped: 1,
            totalTodo: 0,
        })

        assert.isEqualDeep(testResults.testFiles![0], {
            path: 'behavioral/errors/CreatingANewErrorBuilder.test.ts',
            status: 'running',
        })

        assert.isEqualDeep(testResults.testFiles![1], {
            path: 'implementation/CasualNameUtility.test.ts',
            status: 'passed',
            tests: [
                {
                    name: 'No name returns friend',
                    status: 'passed',
                    errorMessages: [],
                    duration: 2,
                },
                {
                    name: 'Just last name to just last name',
                    status: 'passed',
                    errorMessages: [],
                    duration: 0,
                },
                {
                    name: 'First name only to first name only',
                    status: 'passed',
                    errorMessages: [],
                    duration: 1,
                },
                {
                    name: 'last and first name to First Last initial',
                    status: 'passed',
                    errorMessages: [],
                    duration: 0,
                },
            ],
        })

        const failedFile = testResults.testFiles!.find(
            (f) => f.path === 'behavioral/UpdatingARole.test.ts'
        )
        assert.isTruthy(failedFile)
        assert.isEqual(failedFile!.status, 'failed')
        assert.isTruthy(failedFile!.tests)
        assert.isEqual(failedFile!.tests![0].status, 'failed')
    }

    private static generateTestResults(
        jestStatus: JsonResultKeys,
        testFile?: string
    ): string {
        switch (jestStatus) {
            case 'onRunStart':
                return `${START_DIVIDER}{"status":"onRunStart","results":{"numFailedTestSuites":0,"numFailedTests":0,"numPassedTestSuites":0,"numPassedTests":0,"numPendingTestSuites":0,"numPendingTests":0,"numRuntimeErrorTestSuites":0,"numTodoTests":0,"numTotalTestSuites":43,"numTotalTests":0,"openHandles":[],"snapshot":{"added":0,"didUpdate":false,"failure":false,"filesAdded":0,"filesRemoved":0,"filesRemovedList":[],"filesUnmatched":0,"filesUpdated":0,"matched":0,"total":0,"unchecked":0,"uncheckedKeysByFile":[],"unmatched":0,"updated":0},"startTime":1603459399575,"success":false,"testResults":[],"wasInterrupted":false}}${END_DIVIDER}`
            case 'onTestFileStart':
                return `${START_DIVIDER}{"status":"onTestFileStart","test":{"context":{},"duration":40472,"path":"/example/node-tdd/build/__tests__/${testFile}"}}${END_DIVIDER}`
            case 'onTestFileResult':
                return `${START_DIVIDER}${JSON.stringify(
                    onTestFileResult(testFile ?? 'missing')
                )}${END_DIVIDER}`
            default:
                throw new Error('Status not implemented')
        }
    }
}
