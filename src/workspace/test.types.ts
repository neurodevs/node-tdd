export type TestResultStatus = 'running' | 'passed' | 'failed'
export type TestRunnerStatus = 'running' | 'stopped' | 'ready'

export interface TestFileTest {
    name: string
    status:
        | 'passed'
        | 'failed'
        | 'skipped'
        | 'pending'
        | 'todo'
        | 'disabled'
        | 'focused'
    errorMessages?: string[]
    duration: number
}

export interface SpruceTestFile {
    path: string
    status: TestResultStatus
    tests?: TestFileTest[]
    errorMessage?: string
}

export interface TestResults {
    totalTests?: number
    totalPassed?: number
    totalFailed?: number
    totalSkipped?: number
    totalTodo?: number
    totalTestFiles: number
    totalTestFilesComplete?: number
    testFiles?: SpruceTestFile[]
}
