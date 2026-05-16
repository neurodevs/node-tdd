import chalk from 'chalk'
import durationUtil from './duration.utility.js'
import { ButtonWidget } from './button.types.js'
import { InputWidget } from './input.types.js'
import { LayoutWidget } from './layout.types.js'
import { MenuBarWidget } from './menuBar.types.js'
import { PopupWidget } from './popup.types.js'
import { ProgressBarWidget } from './progressBar.types.js'
import { TextWidget } from './text.types.js'
import { WindowWidget } from './window.types.js'
import WidgetFactory from './WidgetFactory.js'
import { TestResults, TestRunnerStatus } from './test.types.js'
import TestLogItemGenerator from './TestLogItemGenerator.js'

export default class TestReporter {
    private started = false
    private table?: any
    private bar!: ProgressBarWidget
    private bottomLayout!: LayoutWidget
    private testLog!: TextWidget
    private errorLog?: TextWidget
    private errorLogItemGenerator: TestLogItemGenerator
    private lastResults: TestReporterResults = {
        totalTestFiles: 0,
        customErrors: [],
    }
    private updateInterval?: any
    private menu!: MenuBarWidget
    private statusBar!: TextWidget
    private window!: WindowWidget
    private widgets: WidgetFactory
    private selectTestPopup?: PopupWidget
    private topLayout!: LayoutWidget
    private filterInput!: InputWidget
    private filterPattern?: string
    private clearFilterPatternButton!: ButtonWidget
    private isDebugging = false
    private watchMode: WatchMode = 'off'
    private status: TestRunnerStatus = 'ready'
    private countDownTimeInterval?: any
    private cwd: string | undefined
    private orientation: TestReporterOrientation = 'landscape'

    private handleStartStop?: () => void
    private handleRestart?: () => void
    private handleQuit?: () => void
    private handleRerunTestFile?: (fileName: string) => void
    private handleFilterChange?: (pattern?: string) => void
    private handleOpenTestFile?: (testFile: string) => void
    private handleToggleDebug?: () => void
    private handletoggleStandardWatch?: () => void
    private handleToggleSmartWatch?: () => any
    private minWidth = 50

    public constructor(options?: TestReporterOptions) {
        this.cwd = options?.cwd
        this.filterPattern = options?.filterPattern
        this.handleRestart = options?.handleRestart
        this.handleStartStop = options?.handleStartStop
        this.handleQuit = options?.handleQuit
        this.handleRerunTestFile = options?.handleRerunTestFile
        this.handleOpenTestFile = options?.handleOpenTestFile
        this.handleFilterChange = options?.handleFilterPatternChange
        this.status = options?.status ?? 'ready'
        this.handleToggleDebug = options?.handleToggleDebug
        this.handletoggleStandardWatch = options?.handletoggleStandardWatch
        this.isDebugging = options?.isDebugging ?? false
        this.watchMode = options?.watchMode ?? 'off'
        this.handleToggleSmartWatch = options?.handleToggleSmartWatch

        this.errorLogItemGenerator = new TestLogItemGenerator()
        this.widgets = new WidgetFactory()
    }

    public setFilterPattern(pattern: string | undefined) {
        this.filterPattern = pattern
        this.filterInput.setValue(pattern ?? '')
        this.clearFilterPatternButton.setText(buildPatternButtonText(pattern))
    }

    public setIsDebugging(isDebugging: boolean) {
        this.setLabelStatus('toggleDebug', 'Debug', isDebugging)
        this.isDebugging = isDebugging
    }

    public setWatchMode(watchMode: WatchMode) {
        this.watchMode = watchMode
        if (!this.countDownTimeInterval) {
            let label =
                watchMode === 'smart' ? 'Smart Watch   ' : 'Standard Watch'
            if (watchMode === 'off') {
                label = 'Not Watching  '
            }
            this.setWatchLabel(label)
        }
    }

    private setWatchLabel(label: string) {
        const isEnabled = this.watchMode !== 'off'
        this.setLabelStatus('watchDropdown', label, isEnabled)

        this.menu.setTextForItem(
            'toggleStandardWatch',
            this.watchMode === 'standard' ? '√ Standard' : 'Standard'
        )

        this.menu.setTextForItem(
            'toggleSmartWatch',
            this.watchMode === 'smart' ? '√ Smart' : 'Smart'
        )
    }

    private setLabelStatus(menuKey: string, label: string, isEnabled: boolean) {
        this.menu.setTextForItem(
            menuKey,
            `${label} ^${isEnabled ? 'k' : 'w'}^#^${isEnabled ? 'g' : 'r'}${isEnabled ? ' • ' : ' • '}^`
        )
    }

    public startCountdownTimer(durationSec: number) {
        clearInterval(this.countDownTimeInterval)
        this.countDownTimeInterval = undefined

        let remaining = durationSec

        function renderCountdownTime(time: number) {
            return `Starting ${time} `
        }

        this.setWatchLabel(renderCountdownTime(remaining))

        this.countDownTimeInterval = setInterval(() => {
            remaining--

            if (remaining < 0) {
                this.stopCountdownTimer()
            } else {
                this.setWatchLabel(renderCountdownTime(remaining))
            }
        }, 1000) as any
    }

    public stopCountdownTimer() {
        clearInterval(this.countDownTimeInterval)
        this.countDownTimeInterval = undefined
        this.setWatchMode(this.watchMode)
    }

    public async start() {
        this.started = true

        this.window = this.widgets.Widget('window', {})
        this.window.hideCursor()

        const { width } = this.window.getFrame()
        if (width < this.minWidth) {
            throw new Error(
                `Your screen must be at least ${this.minWidth} characters wide.`
            )
        }

        void this.window.on('key', this.handleGlobalKeypress.bind(this))
        void this.window.on('kill', (payload: { code: any }) => {
            if (payload.code instanceof Error) {
                const term = (this.window as any).term as any
                const doc = (this.window as any).getTermKitElement?.() as any
                term?.grabInput?.({ mouse: 'button' })
                doc?.draw?.()
            } else {
                void this.destroy()
            }
        })
        void this.window.on('resize', this.handleWindowResize.bind(this))

        this.dropInTopLayout()
        this.dropInProgressBar()
        this.dropInMenu()
        this.dropInBottomLayout()
        this.dropInStatusBar()
        this.dropInTestLog()
        this.dropInFilterControls()

        this.updateOrientation()

        this.setIsDebugging(this.isDebugging)
        this.setWatchMode(this.watchMode)
        this.setStatus(this.status)

        this.updateInterval = setInterval(
            this.handleUpdateInterval.bind(this),
            1000
        )
    }

    private handleWindowResize() {
        this.updateOrientation()
    }

    private updateOrientation() {
        const frame = this.window.getFrame()

        if (frame.width * 0.4 > frame.height) {
            this.orientation = 'landscape'
        } else {
            this.orientation = 'portrait'
        }
    }

    private dropInMenu() {
        this.menu = this.widgets.Widget('menuBar', {
            parent: this.window,
            left: 0,
            top: 0,
            shouldLockWidthWithParent: true,
            items: [
                {
                    label: 'Restart   ',
                    value: 'restart',
                },
                {
                    label: 'Debug    ',
                    value: 'toggleDebug',
                },
                {
                    label: 'Not Watching      ',
                    value: 'watchDropdown',
                    items: [
                        {
                            label: 'Watch all',
                            value: 'toggleStandardWatch',
                        },
                        {
                            label: 'Smart watch',
                            value: 'toggleSmartWatch',
                        },
                    ],
                },
                {
                    label: 'Quit',
                    value: 'quit',
                },
            ],
        })

        void this.menu.on('select', this.handleMenuSelect.bind(this))
    }

    public setStatus(status: TestRunnerStatus) {
        this.status = status

        this.updateMenuLabels()
        this.closeSelectTestPopup()
        this.bottomLayout.updateLayout()

        if (status === 'ready') {
            this.setStatusLabel('Starting...')
        } else if (this.status === 'stopped') {
            this.refreshResults()
            this.testLog?.scrollToTop()
            this.setStatusLabel('')
        } else if (this.status === 'running') {
            this.setStatusLabel('Running tests...')
        }
    }

    private updateMenuLabels() {
        let restartLabel = 'Start ^#^r › ^'
        switch (this.status) {
            case 'running':
                restartLabel = 'Stop   ^k^#^g › ^'
                break
            case 'stopped':
                restartLabel = `Start  ^w^#^r › ^`
                break
            case 'ready':
                restartLabel = 'Booting ^#^K › ^'
                break
        }

        this.menu.setTextForItem('restart', restartLabel)
    }

    private handleMenuSelect(payload: { value: string }) {
        switch (payload.value) {
            case 'quit':
                this.handleQuit?.()
                break
            case 'restart':
                this.handleStartStop?.()
                break
            case 'toggleDebug':
                this.handleToggleDebug?.()
                break
            case 'toggleStandardWatch':
                this.handletoggleStandardWatch?.()
                break
            case 'toggleSmartWatch':
                this.handleToggleSmartWatch?.()
                break
        }
    }

    private handleUpdateInterval() {
        try {
            if (this.status !== 'stopped') {
                this.refreshResults()
            }
        } catch {
            // prevent uncaughtException from crashing the TUI
        }
    }

    private refreshResults() {
        if (this.lastResults) {
            this.updateLogs()
        }
    }

    private async handleGlobalKeypress(payload: { key: string }) {
        if (this.window.getFocusedWidget() === this.filterInput) {
            return
        }

        switch (payload.key) {
            case 'ENTER':
                this.handleRestart?.()
                break
            case 'CTRL_C':
                this.handleQuit?.()
                process.exit()
                break
        }
    }

    private dropInTestLog() {
        const parent = this.bottomLayout.getChildById('results')!

        this.testLog = this.widgets.Widget('text', {
            parent,
            isScrollEnabled: true,
            wordWrap: false,
            left: 0,
            top: 0,
            height: '100%',
            width: '100%',
            shouldLockHeightWithParent: true,
            shouldLockWidthWithParent: true,
        })

        void this.testLog.on('click', this.handleClickTestLog.bind(this))
    }

    private async handleClickTestLog(payload: { row: number; column: number }) {
        const testFile = this.getFileForLine(payload.row)
        const { row, column } = payload

        this.closeSelectTestPopup()

        if (testFile) {
            this.dropInSelectTestPopup({ testFile, column, row })
        }
    }

    public async showAlert(options: { title: string; message: string }) {
        const { title, message } = options

        const windowFrame = this.window.getFrame()
        const popupHeight = Math.min(windowFrame.height - 4, 25)

        return new Promise<void>((resolve) => {
            const popup = this.widgets.Widget('popup', {
                parent: this.window,
                top: 2,
                left: 4,
                width: Math.min(windowFrame.width - 8, 80),
                height: popupHeight,
            })

            this.widgets.Widget('text', {
                parent: popup,
                left: 2,
                top: 1,
                height: 1,
                width: popup.getFrame().width - 4,
                text: title,
            })

            this.widgets.Widget('text', {
                parent: popup,
                left: 2,
                top: 3,
                height: popupHeight - 7,
                width: popup.getFrame().width - 4,
                text: message,
                isScrollEnabled: true,
                wordWrap: true,
            })

            const okButton = this.widgets.Widget('button', {
                parent: popup,
                left: Math.floor(popup.getFrame().width / 2) - 4,
                top: popupHeight - 3,
                text: '   OK   ',
            })

            void okButton.on('click', () => {
                void popup.destroy()
                resolve()
            })
        })
    }

    private closeSelectTestPopup() {
        if (this.selectTestPopup) {
            void this.selectTestPopup.destroy()
            this.selectTestPopup = undefined
        }
    }

    private dropInSelectTestPopup(options: {
        testFile: string
        column: number
        row: number
    }) {
        const { testFile, row, column } = options

        this.selectTestPopup = this.widgets.Widget('popup', {
            parent: this.window,
            left: Math.max(1, column - 25),
            top: Math.max(4, row - 2),
            width: 50,
            height: 10,
        })

        this.widgets.Widget('text', {
            parent: this.selectTestPopup,
            left: 1,
            top: 1,
            height: 4,
            width: this.selectTestPopup.getFrame().width - 2,
            text: `Selected file:\n\n${testFile}`,
        })

        const open = this.widgets.Widget('button', {
            parent: this.selectTestPopup,
            left: 1,
            top: 6,
            text: 'Open',
        })

        const rerun = this.widgets.Widget('button', {
            parent: this.selectTestPopup,
            left: 20,
            top: 6,
            text: 'Test',
        })

        const cancel = this.widgets.Widget('button', {
            parent: this.selectTestPopup,
            left: 37,
            top: 6,
            text: 'Nevermind',
        })

        void rerun.on('click', () => {
            this.handleRerunTestFile?.(testFile)
            this.closeSelectTestPopup()
        })
        void cancel.on('click', this.closeSelectTestPopup.bind(this))
        void open.on('click', () => {
            this.openTestFile(testFile)
        })
    }

    private openTestFile(testFile: string) {
        this.handleOpenTestFile?.(testFile)
        this.closeSelectTestPopup()
    }

    public getFileForLine(row: number): string | undefined {
        let line = this.testLog.getScrollY()

        for (const file of this.lastResults.testFiles ?? []) {
            const minRow = line
            const lineCount =
                1 +
                (file.tests ?? []).length +
                (file.status === 'running' ? 1 : 0)
            const maxRow = line + lineCount - 1

            if (row >= minRow && row <= maxRow) {
                return file.path
            }

            line = maxRow + 1
        }

        return undefined
    }

    private dropInProgressBar() {
        const parent = this.topLayout.getChildById('progress') ?? this.window
        this.bar = this.widgets.Widget('progressBar', {
            parent,
            left: 0,
            top: 0,
            width: parent.getFrame().width,
            shouldLockWidthWithParent: true,
            label: 'Ready and waiting...',
            progress: 0,
        })
    }

    private dropInFilterControls() {
        const parent = this.topLayout.getChildById('filter') ?? this.window

        const buttonWidth = 3
        this.filterInput = this.widgets.Widget('input', {
            parent,
            left: 0,
            label: 'Pattern',
            width: parent.getFrame().width - buttonWidth,
            height: 1,
            shouldLockWidthWithParent: true,
            value: this.filterPattern,
        })

        void this.filterInput.on('cancel', () => {
            this.filterInput.setValue(this.filterPattern ?? '')
        })

        void this.filterInput.on('submit', (payload) => {
            this.handleFilterChange?.(payload?.value ?? undefined)
        })

        this.clearFilterPatternButton = this.widgets.Widget('button', {
            parent,
            left: this.filterInput.getFrame().width,
            width: buttonWidth,
            top: 0,
            text: buildPatternButtonText(this.filterPattern),
            shouldLockRightWithParent: true,
        })

        void this.clearFilterPatternButton.on('click', () => {
            if (this.filterPattern || this.filterPattern?.length === 0) {
                this.handleFilterChange?.(undefined)
            } else {
                this.filterInput.setValue('')
            }
        })
    }

    private dropInBottomLayout() {
        this.bottomLayout = this.widgets.Widget('layout', {
            parent: this.window,
            width: '100%',
            top: 4,
            height: this.window.getFrame().height - 5,
            shouldLockWidthWithParent: true,
            shouldLockHeightWithParent: true,
            rows: [
                {
                    height: '100%',
                    columns: [
                        {
                            id: 'results',
                            width: '100%',
                        },
                    ],
                },
            ],
        })
    }

    private dropInStatusBar() {
        this.statusBar = this.widgets.Widget('text', {
            parent: this.window,
            top: this.window.getFrame().height - 1,
            width: '100%',
            shouldLockWidthWithParent: true,
            shouldLockBottomWithParent: true,
            backgroundColor: 'yellow',
            foregroundColor: 'black',
            text: '...',
        })
    }

    private dropInTopLayout() {
        this.topLayout = this.widgets.Widget('layout', {
            parent: this.window,
            width: '100%',
            top: 1,
            height: 3,
            shouldLockWidthWithParent: true,
            shouldLockHeightWithParent: false,
            rows: [
                {
                    height: '100%',
                    columns: [
                        {
                            id: 'progress',
                            width: 50,
                        },
                        {
                            id: 'filter',
                        },
                    ],
                },
            ],
        })
    }

    public updateResults(results: TestResults) {
        if (!this.started) {
            throw new Error('You must call start() before anything else.')
        }

        this.lastResults = {
            ...this.lastResults,
            ...results,
        }

        this.updateProgressBar(results)

        const percentPassing = this.generatePercentPassing(results)
        const percentComplete = this.generatePercentComplete(results)

        this.window.setTitle(
            `Testing: ${percentComplete}% complete.${
                percentComplete > 0 ? ` ${percentPassing}% passing.` : ''
            }`
        )

        this.updateLogs()
    }

    private updateLogs() {
        if (this.selectTestPopup) {
            return
        }

        const { logContent, errorContent } = this.resultsToLogContents(
            this.lastResults
        )

        this.testLog.setText(logContent)

        if (!errorContent) {
            this.errorLog?.setText('  Nothing to report...')
        } else {
            !this.errorLog && this.dropInErrorLog()
            const cleanedLog = this.cwd
                ? errorContent.replace(new RegExp(this.cwd + '/', 'gim'), '')
                : errorContent

            this.errorLog?.setText(cleanedLog)
        }
    }

    private resultsToLogContents(results: TestResults) {
        let logContent = ''
        let errorContent = ''

        const files = [...(results.testFiles ?? [])]

        if (this.status === 'stopped') {
            files.sort((a, b) => {
                const aFailed = a.status === 'failed' ? 0 : 1
                const bFailed = b.status === 'failed' ? 0 : 1
                return aFailed - bFailed
            })
        }

        files.forEach((file) => {
            logContent += this.errorLogItemGenerator.generateLogItemForFile(
                file,
                this.status
            )
            errorContent +=
                this.errorLogItemGenerator.generateErrorLogItemForFile(file)
        })

        if (this.lastResults.customErrors.length > 0) {
            errorContent =
                this.lastResults.customErrors
                    .map((err) => chalk.red(err))
                    .join(`\n`) + `\n${errorContent}`
        }

        return { logContent, errorContent }
    }

    private dropInErrorLog() {
        if (this.bottomLayout.getRows().length === 1) {
            if (this.orientation === 'portrait') {
                this.bottomLayout.addRow({
                    id: 'row_2',
                    columns: [{ id: 'errors', width: '100%' }],
                })

                this.bottomLayout.setRowHeight(0, '60%')
                this.bottomLayout.setRowHeight(1, '40%')
            } else {
                this.bottomLayout.addColumn(0, { id: 'errors', width: '40%' })
                this.bottomLayout.setColumnWidth({
                    rowIdx: 0,
                    columnIdx: 0,
                    width: '60%',
                })
            }

            this.bottomLayout.updateLayout()

            const cell = this.bottomLayout.getChildById('errors')

            if (!cell) {
                throw new Error('Pulling child error')
            }

            this.errorLog = this.widgets.Widget('text', {
                parent: cell,
                width: '100%',
                height: '100%',
                isScrollEnabled: true,
                shouldAutoScrollWhenAppendingContent: false,
                shouldLockHeightWithParent: true,
                shouldLockWidthWithParent: true,
                padding: { left: 1 },
                focusable: false,
            })
        }
    }

    private updateProgressBar(results: TestResults) {
        if ((results.totalTestFilesComplete ?? 0) > 0) {
            const testsRemaining =
                results.totalTestFiles - (results.totalTestFilesComplete ?? 0)

            if (testsRemaining === 0) {
                const { percent, totalTests, totalPassedTests, totalTime } =
                    this.generateProgressStats(results)

                this.bar.setLabel(
                    `Finished! ${totalPassedTests} of ${totalTests} (${percent}%) passed in ${durationUtil.msToFriendly(
                        totalTime
                    )}.${percent < 100 ? ` Don't give up!` : ''}`
                )
            } else {
                this.bar.setLabel(
                    `${results.totalTestFilesComplete} of ${
                        results.totalTestFiles
                    } (${this.generatePercentComplete(
                        results
                    )}%) complete. ${testsRemaining} remaining...`
                )
            }
        } else {
            this.bar.setLabel('0%')
        }

        this.bar.setProgress(this.generatePercentComplete(results) / 100)
    }

    private generateProgressStats(results: TestResults): {
        percent: number
        totalTests: number
        totalPassedTests: number
        totalTime: number
    } {
        let totalTests = 0
        let totalPassedTests = 0
        let totalTime = 0

        results.testFiles?.forEach((file) => {
            file.tests?.forEach((test) => {
                totalTime += test.duration
                if (test.status === 'passed') {
                    totalPassedTests++
                }

                if (test.status === 'passed' || test.status === 'failed') {
                    totalTests++
                }
            })
        })

        const percent = Math.floor((totalPassedTests / totalTests) * 100)
        return {
            percent: percent > 0 ? percent : 0,
            totalTests,
            totalPassedTests,
            totalTime,
        }
    }

    private generatePercentComplete(results: TestResults): number {
        const percent =
            (results.totalTestFilesComplete ?? 0) / results.totalTestFiles
        if (isNaN(percent)) {
            return 0
        }
        return Math.round(percent * 100)
    }

    private generatePercentPassing(results: TestResults): number {
        const percent =
            (results.totalPassed ?? 0) / this.getTotalTestFilesRun(results)

        if (isNaN(percent)) {
            return 0
        }

        return Math.floor(percent * 100)
    }

    private getTotalTestFilesRun(results: TestResults) {
        return (
            (results.totalTests ?? 0) -
            (results.totalSkipped ?? 0) -
            (results.totalTodo ?? 0)
        )
    }

    public render() {
        this.table?.computeCells()
        this.table?.draw()
    }

    public async destroy() {
        clearInterval(this.updateInterval)
        await this.window.destroy()
    }

    public reset() {
        this.testLog.setText('')
        this.lastResults = {
            totalTestFiles: 0,
            customErrors: [],
        }
        this.errorLogItemGenerator.resetStartTimes()
    }

    public setStatusLabel(text: string) {
        this.statusBar.setText(text)
    }

    public appendError(message: string) {
        this.lastResults.customErrors.push(message)
    }
}

function buildPatternButtonText(pattern: string | undefined): string {
    return pattern ? ' x ' : ' - '
}

export interface TestReporterOptions {
    handleStartStop?: () => void
    handleRestart?: () => void
    handleQuit?: () => void
    onRequestOpenTestFile?: () => void
    handleRerunTestFile?: (fileName: string) => void
    handleOpenTestFile?: (fileName: string) => void
    handleFilterPatternChange?: (pattern?: string) => void
    handleToggleDebug?: () => void
    handletoggleStandardWatch?: () => void
    handleToggleSmartWatch?: () => void
    filterPattern?: string
    isDebugging?: boolean
    watchMode?: WatchMode
    status?: TestRunnerStatus
    cwd?: string
}

type TestReporterResults = TestResults & {
    customErrors: string[]
}

export type TestReporterOrientation = 'landscape' | 'portrait'
export type WatchMode = 'off' | 'standard' | 'smart'
