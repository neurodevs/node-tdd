import chalk from 'chalk'
import { spawn } from 'child_process'
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
    public static spawnFn: (cmd: string, args: string[]) => any = spawn
    public static platformFn: () => string = () => process.platform

    private started = false
    private table?: any
    private bar!: ProgressBarWidget
    private bottomLayout!: LayoutWidget
    private testLog!: TextWidget
    private errorLog?: TextWidget
    private dividerWidget?: TextWidget
    private copyErrorLogButton?: ButtonWidget
    private lastErrorContent = ''
    private splitPercent = 60
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
    private handleFilterChange?: (pattern?: string) => void
    private handleOpenTestFile?: (testFile: string, testName?: string) => void
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
                    label: 'Launch Terminal',
                    value: 'launchTerminal',
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
            this.reset()
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
            case 'launchTerminal':
                this.launchTerminal()
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
        const info = this.getFileInfoForLine(payload.row)
        const { row, column } = payload

        this.closeSelectTestPopup()

        if (info) {
            this.dropInSelectTestPopup({
                testFile: info.file,
                testName: info.testName,
                column,
                row,
            })
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
        testName?: string
        column: number
        row: number
    }) {
        const { testFile, testName, row, column } = options
        const hasTest = testName !== undefined
        const popupHeight = hasTest ? 12 : 10

        this.selectTestPopup = this.widgets.Widget('popup', {
            parent: this.window,
            left: Math.max(1, column - 25),
            top: Math.max(4, row - 2),
            width: 56,
            height: popupHeight,
        })

        const popupWidth = this.selectTestPopup.getFrame().width

        let infoText = `File:\n${testFile}`
        if (hasTest) {
            infoText += `\n\nTest:\n${testName}`
        }

        this.widgets.Widget('text', {
            parent: this.selectTestPopup,
            left: 1,
            top: 1,
            height: popupHeight - 4,
            width: popupWidth - 2,
            text: infoText,
            wordWrap: true,
        })

        const buttonTop = popupHeight - 3

        if (hasTest) {
            const openFile = this.widgets.Widget('button', {
                parent: this.selectTestPopup,
                left: 2,
                top: buttonTop,
                text: 'Open File',
            })
            const openTest = this.widgets.Widget('button', {
                parent: this.selectTestPopup,
                left: 16,
                top: buttonTop,
                text: 'Open Test',
            })
            const cancel = this.widgets.Widget('button', {
                parent: this.selectTestPopup,
                left: 30,
                top: buttonTop,
                text: 'Cancel',
            })
            void openFile.on('click', () => {
                this.openTestFile(testFile)
            })
            void openTest.on('click', () => {
                this.openTestFile(testFile, testName)
            })
            void cancel.on('click', this.closeSelectTestPopup.bind(this))
        } else {
            const openFile = this.widgets.Widget('button', {
                parent: this.selectTestPopup,
                left: 14,
                top: buttonTop,
                text: 'Open File',
            })
            const cancel = this.widgets.Widget('button', {
                parent: this.selectTestPopup,
                left: 28,
                top: buttonTop,
                text: 'Cancel',
            })
            void openFile.on('click', () => {
                this.openTestFile(testFile)
            })
            void cancel.on('click', this.closeSelectTestPopup.bind(this))
        }
    }

    private openTestFile(testFile: string, testName?: string) {
        this.handleOpenTestFile?.(testFile, testName)
        this.closeSelectTestPopup()
    }

    public getFileForLine(row: number): string | undefined {
        return this.getFileInfoForLine(row)?.file
    }

    private getFileInfoForLine(row: number) {
        let currentRow = this.testLog.getScrollY()

        for (const file of this.lastResults.testFiles ?? []) {
            const fileHeaderRow = currentRow
            const tests = file.tests ?? []
            const hasTests = file.tests !== undefined
            const lineCount =
                1 +
                (hasTests ? 2 : 0) +
                tests.length +
                (file.status === 'running' ? 1 : 0)
            const maxRow = currentRow + lineCount - 1

            if (row >= currentRow && row <= maxRow) {
                if (row === fileHeaderRow) {
                    return { file: file.path }
                }
                const testIndex = row - fileHeaderRow - 2
                const test = tests[testIndex]
                return {
                    file: file.path,
                    testName: test?.name,
                }
            }

            currentRow = maxRow + 1
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
            this.handleFilterChange?.(payload?.value || undefined)
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
            if (this.bottomLayout.getRows().length === 2) {
                this.bottomLayout.setRowHeight(0, '100%')
                this.bottomLayout.setRowHeight(1, '0%')
            }
            this.dividerWidget?.setFrame({ top: -1, left: -1 })
        } else {
            !this.errorLog && this.dropInErrorLog()

            if (this.bottomLayout.getRows().length === 2) {
                this.bottomLayout.setRowHeight(0, `${this.splitPercent}%`)
                this.bottomLayout.setRowHeight(1, `${100 - this.splitPercent}%`)
            }
            const cleanedLog = this.cwd
                ? errorContent.replace(new RegExp(this.cwd + '/', 'gim'), '')
                : errorContent

            this.lastErrorContent = cleanedLog
            this.errorLog?.setText(cleanedLog)

            if (this.dividerWidget) {
                const { top, left } = this.buildDividerProps(
                    this.orientation === 'portrait',
                    this.bottomLayout.getFrame()
                )
                this.dividerWidget.setFrame({ top, left })
            }
        }

        this.bottomLayout.updateLayout()
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

                this.bottomLayout.setRowHeight(0, `${this.splitPercent}%`)
                this.bottomLayout.setRowHeight(1, `${100 - this.splitPercent}%`)
            } else {
                this.bottomLayout.addColumn(0, {
                    id: 'errors',
                    width: `${100 - this.splitPercent}%`,
                })
                this.bottomLayout.setColumnWidth({
                    rowIdx: 0,
                    columnIdx: 0,
                    width: `${this.splitPercent}%`,
                })
            }

            this.bottomLayout.updateLayout()
            this.dropInDivider()

            const cell = this.bottomLayout.getChildById('errors')

            if (!cell) {
                throw new Error('Pulling child error')
            }

            const buttonWidth = 10

            this.copyErrorLogButton = this.widgets.Widget('button', {
                parent: cell,
                top: 0,
                left: cell.getFrame().width - buttonWidth + 2,
                width: buttonWidth,
                text: ' Copy All ',
                shouldLockRightWithParent: true,
                blurAttr: { bgColor: 'red' },
                focusAttr: { bgColor: 'green' },
            } as any)

            const raw = (this.copyErrorLogButton as any).getTermKitElement?.()
            if (raw) {
                raw.on('enter', () => {
                    raw.attr = { bgColor: 'green' }
                    raw.draw?.()
                })
                raw.on('leave', () => {
                    raw.attr = raw.blurAttr
                    raw.draw?.()
                })
            }

            void this.copyErrorLogButton.on('click', () => {
                this.copyToClipboard(this.lastErrorContent)
            })

            this.errorLog = this.widgets.Widget('text', {
                parent: cell,
                top: 1,
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

    private dropInDivider() {
        const isPortrait = this.orientation === 'portrait'
        const layoutFrame = this.bottomLayout.getFrame()

        const { top, left, width, height, text } = this.buildDividerProps(
            isPortrait,
            layoutFrame
        )

        this.dividerWidget = this.widgets.Widget('text', {
            parent: this.window,
            top,
            left,
            width,
            height,
            text,
            focusable: false,
        })

        const raw = (this.dividerWidget as any).getTermKitElement?.()
        if (raw) {
            raw.off('drag', raw.onDrag)
            raw.off('click', raw.onClick)
            raw.off('wheel', raw.onWheel)
            raw.on('drag', (payload: { dx: number; dy: number }) => {
                this.handleDividerDrag(payload)
            })
        }
    }

    private buildDividerProps(
        isPortrait: boolean,
        layoutFrame: {
            top: number
            left: number
            width: number
            height: number
        }
    ) {
        const handle = '☰'
        if (isPortrait) {
            const top =
                layoutFrame.top +
                Math.floor((layoutFrame.height * this.splitPercent) / 100) -
                1
            const left = layoutFrame.left
            const width = layoutFrame.width
            const halfL = Math.floor((width - 1) / 2)
            const halfR = Math.ceil((width - 1) / 2)
            return {
                top,
                left,
                width,
                height: 1,
                text: `${'─'.repeat(halfL)}${handle}${'─'.repeat(halfR)}`,
            }
        } else {
            const left =
                layoutFrame.left +
                Math.floor((layoutFrame.width * this.splitPercent) / 100)
            const top = layoutFrame.top
            const height = layoutFrame.height
            const mid = Math.floor(height / 2)
            return {
                top,
                left,
                width: 1,
                height,
                text: Array.from({ length: height }, (_, i) =>
                    i === mid ? handle : '│'
                ).join('\n'),
            }
        }
    }

    private handleDividerDrag(payload: { dx: number; dy: number }) {
        const isPortrait = this.orientation === 'portrait'
        const layoutFrame = this.bottomLayout.getFrame()
        const delta = isPortrait
            ? (payload.dy / layoutFrame.height) * 100
            : (payload.dx / layoutFrame.width) * 100

        this.splitPercent = Math.max(
            10,
            Math.min(90, this.splitPercent + delta)
        )

        if (isPortrait) {
            this.bottomLayout.setRowHeight(0, `${this.splitPercent}%`)
            this.bottomLayout.setRowHeight(1, `${100 - this.splitPercent}%`)
        } else {
            this.bottomLayout.setColumnWidth({
                rowIdx: 0,
                columnIdx: 0,
                width: `${this.splitPercent}%`,
            })
            this.bottomLayout.setColumnWidth({
                rowIdx: 0,
                columnIdx: 1,
                width: `${100 - this.splitPercent}%`,
            })
        }

        this.bottomLayout.updateLayout()

        const { top, left } = this.buildDividerProps(isPortrait, layoutFrame)
        this.dividerWidget?.setFrame({ top, left })
    }

    public launchTerminal() {
        const cwd = this.cwd ?? process.cwd()
        const tddCommand =
            'node node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js --watchMode standard'
        const command = `cd ${cwd} && ${tddCommand}`
        const platform = TestReporter.platformFn()

        const [cmd, ...args] =
            platform === 'win32'
                ? ['cmd', '/c', 'start', 'cmd', '/k', command]
                : platform === 'darwin'
                  ? [
                        'osascript',
                        '-e',
                        `tell app "Terminal" to do script "${command}"`,
                    ]
                  : ['xterm', '-e', command]

        TestReporter.spawnFn(cmd, args)
    }

    private copyToClipboard(text: string) {
        const stripped = text.replace(/\x1b\[[0-9;]*m/g, '')
        const platform = TestReporter.platformFn()

        const [cmd, ...args] =
            platform === 'win32'
                ? ['clip']
                : platform === 'darwin'
                  ? ['pbcopy']
                  : ['xclip', '-selection', 'clipboard']

        const proc = TestReporter.spawnFn(cmd, args)
        proc.stdin.write(stripped)
        proc.stdin.end()
    }

    private updateProgressBar(results: TestResults) {
        if ((results.totalTestFilesComplete ?? 0) > 0) {
            const testsRemaining =
                results.totalTestFiles - (results.totalTestFilesComplete ?? 0)

            if (testsRemaining === 0) {
                const { percent, totalTests, totalPassedTests, totalTime } =
                    this.generateProgressStats(results)

                const totalFailingTests = totalTests - totalPassedTests
                this.bar.setLabel(
                    percent === 100
                        ? `100% tests passed — ${totalPassedTests}/${totalTests} passed in ${durationUtil.msToFriendly(totalTime)}`
                        : `${totalFailingTests} test${totalFailingTests > 1 ? 's' : ''} failed — ${totalPassedTests}/${totalTests} passed in ${durationUtil.msToFriendly(totalTime)}`
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
        this.errorLog?.setText('')
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
    handleOpenTestFile?: (fileName: string, testName?: string) => void
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
