import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import test from '../../utilities/decorators.js'
import assert from '../../utilities/assert.js'
import TestReporter, {
    TestReporterOptions,
} from '../../workspace/TestReporter.js'

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
        assert.isFalse(
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
            getFrame: () => ({ top: 4, left: 0, width: 100, height: 46 }),
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

    @test()
    protected static async setWatchModeSetsSmartWatchLabel() {
        const reporter = this.TestReporter()
        const captured: Record<string, string> = {}
        reporter.menu = this.fakeMenu(captured)
        reporter.setWatchMode('smart')
        assert.isEqual(captured['watchDropdown'], 'Smart Watch    ^k^#^g • ^')
    }

    @test()
    protected static async setWatchModeSetsStandardWatchLabel() {
        const reporter = this.TestReporter()
        const captured: Record<string, string> = {}
        reporter.menu = this.fakeMenu(captured)
        reporter.setWatchMode('standard')
        assert.isEqual(captured['watchDropdown'], 'Standard Watch ^k^#^g • ^')
    }

    @test()
    protected static async setWatchModeSetsNotWatchingLabel() {
        const reporter = this.TestReporter()
        const captured: Record<string, string> = {}
        reporter.menu = this.fakeMenu(captured)
        reporter.setWatchMode('off')
        assert.isEqual(captured['watchDropdown'], 'Not Watching   ^w^#^r • ^')
    }

    @test()
    protected static async setWatchModeSkipsLabelUpdateWhenCountdownActive() {
        const reporter = this.TestReporter()
        const captured: Record<string, string> = {}
        reporter.menu = this.fakeMenu(captured)
        reporter.countDownTimeInterval = setInterval(() => {}, 10000)
        reporter.setWatchMode('smart')
        clearInterval(reporter.countDownTimeInterval)
        assert.isUndefined(
            captured['watchDropdown'],
            'label must not update during countdown'
        )
    }

    @test()
    protected static async createsDropInMenuWidgetOnStart() {
        const reporter = this.TestReporter() as any
        let capturedMenuBarOptions: any

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
                        return () => fakeWidget
                    }
                    return () => fakeWidget
                },
            }
        )

        reporter.widgets = {
            Widget: (type: string, options: any) => {
                if (type === 'menuBar') {
                    capturedMenuBarOptions = options
                }
                return fakeWidget
            },
        }

        await reporter.start()

        assert.isEqualDeep(capturedMenuBarOptions, {
            parent: reporter.window,
            left: 0,
            top: 0,
            shouldLockWidthWithParent: true,
            items: [
                {
                    label: 'Restart   ',
                    value: 'restart',
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

        clearInterval(reporter.updateInterval)
    }

    @test()
    protected static async createsTestLogWidgetOnStart() {
        const reporter = this.TestReporter() as any
        let capturedTextOptions: { type: string; options: any }[] = []

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
                        return () => fakeWidget
                    }
                    return () => fakeWidget
                },
            }
        )

        reporter.widgets = {
            Widget: (type: string, options: any) => {
                capturedTextOptions.push({ type, options })
                return fakeWidget
            },
        }

        await reporter.start()

        const expectedOptions = {
            isScrollEnabled: true,
            wordWrap: false,
            left: 0,
            top: 0,
            height: '100%',
            width: '100%',
            shouldLockHeightWithParent: true,
            shouldLockWidthWithParent: true,
        } as any

        const entry = capturedTextOptions.find(
            (o) =>
                o.type === 'text' &&
                Object.keys(expectedOptions).every(
                    (k) => o.options[k] === expectedOptions[k]
                )
        )

        assert.isTruthy(entry, 'Test log widget must be created on start')

        clearInterval(reporter.updateInterval)
    }

    @test()
    protected static async createsSelectTestPopupWidgetOnStart() {
        const capturedTextOptions: { type: string; options: any }[] = []

        const reporter = this.TestReporter() as any
        const popupWidth = 50

        const fakePopup = {
            getFrame: () => ({ width: popupWidth }),
            on: () => fakePopup,
        }

        const fakeButton = { on: () => fakeButton }

        reporter.window = {}
        reporter.widgets = {
            Widget: (type: string, options: any) => {
                capturedTextOptions.push({ type, options })
                if (type === 'popup') {
                    return fakePopup
                }
                return fakeButton
            },
        }

        reporter.dropInSelectTestPopup({
            testFile: 'src/foo/bar.test.ts',
            testName: 'someTestName',
            row: 10,
            column: 30,
        })

        const entry = capturedTextOptions.find(
            (o) => o.type === 'text' && o.options?.text?.startsWith('File:')
        )

        assert.isTruthy(entry, 'must create text widget that starts with File:')

        const { parent: _parent, ...restOptions } = entry!.options

        assert.isEqualDeep(restOptions, {
            left: 1,
            top: 1,
            height: 8,
            width: popupWidth - 2,
            text: 'File:\nsrc/foo/bar.test.ts\n\nTest:\nsomeTestName',
            wordWrap: true,
        })
    }

    @test()
    protected static async createsOpenButtonInSelectTestPopup() {
        const reporter = this.TestReporter() as any
        const capturedWidgets: { type: string; options: any }[] = []
        const popupWidth = 50

        const fakePopup = {
            getFrame: () => ({ width: popupWidth }),
            on: () => fakePopup,
        }

        const fakeButton = { on: () => fakeButton }

        reporter.window = {}
        reporter.widgets = {
            Widget: (type: string, options: any) => {
                capturedWidgets.push({ type, options })
                if (type === 'popup') {
                    return fakePopup
                }
                return fakeButton
            },
        }

        reporter.dropInSelectTestPopup({
            testFile: 'src/foo/bar.test.ts',
            row: 10,
            column: 30,
        })

        const entry = capturedWidgets.find(
            (o) => o.type === 'button' && o.options?.text === 'Open File'
        )

        assert.isTruthy(
            entry,
            'Open button must be created in select test popup'
        )

        const { parent: _parent, ...restOptions } = entry!.options

        assert.isEqualDeep(restOptions, {
            left: 14,
            top: 7,
            text: 'Open File',
        })
    }

    @test()
    protected static async createsCancelButtonInSelectTestPopup() {
        const reporter = this.TestReporter() as any
        const capturedWidgets: { type: string; options: any }[] = []
        const popupWidth = 50

        const fakePopup = {
            getFrame: () => ({ width: popupWidth }),
            on: () => fakePopup,
        }

        const fakeButton = { on: () => fakeButton }

        reporter.window = {}
        reporter.widgets = {
            Widget: (type: string, options: any) => {
                capturedWidgets.push({ type, options })
                if (type === 'popup') {
                    return fakePopup
                }
                return fakeButton
            },
        }

        reporter.dropInSelectTestPopup({
            testFile: 'src/foo/bar.test.ts',
            row: 10,
            column: 30,
        })

        const entry = capturedWidgets.find(
            (o) => o.type === 'button' && o.options?.text === 'Cancel'
        )

        assert.isTruthy(
            entry,
            'Cancel button must be created in select test popup'
        )

        const { parent: _parent, ...restOptions } = entry!.options

        assert.isEqualDeep(restOptions, {
            left: 28,
            top: 7,
            text: 'Cancel',
        })
    }

    @test()
    protected static async clearsErrorLogWhenStatusSetToRunning() {
        const reporter = this.TestReporter() as any
        let setTextCalledWith: string | undefined

        reporter.menu = this.fakeMenu({})
        reporter.bottomLayout = { updateLayout: () => {} }
        reporter.statusBar = { setText: () => {} }
        reporter.testLog = { setText: () => {}, getText: () => '' }
        reporter.errorLog = {
            setText: (text: string) => {
                setTextCalledWith = text
            },
        }

        reporter.setStatus('running')

        assert.isEqual(
            setTextCalledWith,
            '',
            'errorLog must be cleared when status is set to running'
        )
    }

    @test()
    protected static async scrollsToTopWhenStatusSetToStopped() {
        const reporter = this.TestReporter() as any
        let scrollToTopCalled = false

        reporter.menu = this.fakeMenu({})
        reporter.bottomLayout = {
            updateLayout: () => {},
            getRows: () => [{ id: 'row_1' }],
            removeRow: () => {},
        }
        reporter.statusBar = { setText: () => {} }
        reporter.testLog = {
            scrollToTop: () => {
                scrollToTopCalled = true
            },
            setText: () => {},
            getText: () => '',
        }

        reporter.setStatus('stopped')

        assert.isTrue(
            scrollToTopCalled,
            'scrollToTop must be called when status is stopped'
        )
    }

    @test()
    protected static async getFileForLineReturnsCorrectFileForRow() {
        const reporter = this.TestReporter() as any

        reporter.lastResults = {
            testFiles: [
                {
                    path: 'file1.ts',
                    status: 'passed',
                    tests: [{ name: 'test1' }, { name: 'test2' }],
                },
                {
                    path: 'file2.ts',
                    status: 'passed',
                    tests: [{ name: 'test3' }],
                },
            ],
        }

        reporter.testLog = { getScrollY: () => 0 }

        // file1: row 0 (header), 1 (blank), 2–3 (tests), 4 (blank)
        // file2: row 5 (header), 6 (blank), 7 (test), 8 (blank)
        assert.isEqual(reporter.getFileForLine(0), 'file1.ts') // header
        assert.isEqual(reporter.getFileForLine(2), 'file1.ts') // first test
        assert.isEqual(reporter.getFileForLine(3), 'file1.ts') // last test
        assert.isEqual(reporter.getFileForLine(5), 'file2.ts') // file2 header
        assert.isEqual(reporter.getFileForLine(7), 'file2.ts') // file2 test
        assert.isEqual(reporter.getFileForLine(9), undefined) // out of range
    }

    @test()
    protected static async sortsFailedFilesToTopWhenStopped() {
        const reporter = this.TestReporter() as any

        reporter.status = 'stopped'
        reporter.lastResults = { customErrors: [] }

        const results = {
            testFiles: [
                { path: 'passing.ts', status: 'passed', tests: [] },
                { path: 'failing.ts', status: 'failed', tests: [] },
            ],
        }

        const { logContent } = reporter.resultsToLogContents(results)

        const failingIdx = logContent.indexOf('failing.ts')
        const passingIdx = logContent.indexOf('passing.ts')

        assert.isBelow(
            failingIdx,
            passingIdx,
            'Failed file must appear before passing file when stopped'
        )
    }

    @test()
    protected static async restoresDividerWhenErrorContentReturns() {
        const reporter = this.TestReporter()
        const setFrameCalls: any[] = []

        reporter.orientation = 'landscape'
        reporter.selectTestPopup = null
        reporter.lastResults = { testFiles: [], customErrors: ['some error'] }
        reporter.testLog = { setText: () => {} }
        reporter.errorLog = { setText: () => {} }
        reporter.splitPercent = 60
        reporter.bottomLayout = {
            getRows: () => [{}, {}],
            setRowHeight: () => {},
            updateLayout: () => {},
            getFrame: () => ({ top: 4, left: 0, width: 100, height: 46 }),
        }
        reporter.dividerWidget = {
            setFrame: (frame: any) => {
                setFrameCalls.push(frame)
            },
        }

        reporter.updateLogs()

        const restoredFrame = setFrameCalls.find(
            (f) => f.top !== -1 && f.left !== -1
        )
        assert.isTruthy(
            restoredFrame,
            'dividerWidget.setFrame must be called with visible coordinates when errors reappear'
        )
    }

    @test()
    protected static async hidesDividerWhenNoErrorContent() {
        const reporter = this.TestReporter()
        let setFrameCalledWith: any

        reporter.selectTestPopup = null
        reporter.lastResults = { testFiles: [], customErrors: [] }
        reporter.testLog = { setText: () => {} }
        reporter.bottomLayout = {
            getRows: () => [{}, {}],
            setRowHeight: () => {},
            updateLayout: () => {},
        }
        reporter.dividerWidget = {
            setFrame: (frame: any) => {
                setFrameCalledWith = frame
            },
        }

        reporter.updateLogs()

        assert.isTruthy(
            setFrameCalledWith,
            'dividerWidget.setFrame must be called when error content is cleared'
        )
    }

    @test()
    protected static async collapsesErrorLogRowWhenNoErrorContent() {
        const reporter = this.TestReporter() as any
        const rowHeights: Record<string, string> = {}
        let updateLayoutCalled = false

        reporter.selectTestPopup = null
        reporter.lastResults = { testFiles: [], customErrors: [] }
        reporter.testLog = { setText: () => {} }
        reporter.bottomLayout = {
            getRows: () => [{}, {}],
            setRowHeight: (index: number, height: string) => {
                rowHeights[index] = height
            },
            updateLayout: () => {
                updateLayoutCalled = true
            },
        }

        reporter.updateLogs()

        assert.isEqual(
            rowHeights[0],
            '100%',
            'row 0 must be 100% when no errors'
        )
        assert.isEqual(rowHeights[1], '0%', 'row 1 must be 0% when no errors')
        assert.isTrue(
            updateLayoutCalled,
            'updateLayout must be called when collapsing error row'
        )
    }

    @test()
    protected static async expandsErrorLogRowWhenErrorContentPresent() {
        const reporter = this.TestReporter() as any
        const rowHeights: Record<string, string> = {}

        reporter.selectTestPopup = null
        reporter.lastResults = {
            testFiles: [],
            customErrors: ['something went wrong'],
        }
        reporter.testLog = { setText: () => {} }
        reporter.errorLog = { setText: () => {} }
        reporter.bottomLayout = {
            getRows: () => [{}, {}],
            setRowHeight: (index: number, height: string) => {
                rowHeights[index] = height
            },
            updateLayout: () => {},
        }

        reporter.updateLogs()

        assert.isEqual(
            rowHeights[0],
            '60%',
            'row 0 must be 60% when errors present'
        )
        assert.isEqual(
            rowHeights[1],
            '40%',
            'row 1 must be 40% when errors present'
        )
    }

    @test()
    protected static async setsAllPassingLabelWhenAllTestsPass() {
        const reporter = this.TestReporter()
        let capturedLabel: string | undefined
        reporter.bar = {
            setLabel: (label: string) => {
                capturedLabel = label
            },
            setProgress: () => {},
        }

        reporter.updateProgressBar({
            totalTestFiles: 1,
            totalTestFilesComplete: 1,
            testFiles: [
                {
                    tests: [
                        { status: 'passed', duration: 100 },
                        { status: 'passed', duration: 200 },
                    ],
                },
            ],
        })

        assert.isEqual(capturedLabel, '100% tests passed — 2/2 passed in 300ms')
    }

    @test()
    protected static async setsFailingLabelWithSingularWhenOneTestFails() {
        const reporter = this.TestReporter()
        let capturedLabel: string | undefined
        reporter.bar = {
            setLabel: (label: string) => {
                capturedLabel = label
            },
            setProgress: () => {},
        }

        reporter.updateProgressBar({
            totalTestFiles: 1,
            totalTestFilesComplete: 1,
            testFiles: [
                {
                    tests: [
                        { status: 'passed', duration: 100 },
                        { status: 'failed', duration: 200 },
                    ],
                },
            ],
        })

        assert.isEqual(capturedLabel, '1 test failed — 1/2 passed in 300ms')
    }

    @test()
    protected static async setsFailingLabelWithPluralWhenMultipleTestsFail() {
        const reporter = this.TestReporter()
        let capturedLabel: string | undefined
        reporter.bar = {
            setLabel: (label: string) => {
                capturedLabel = label
            },
            setProgress: () => {},
        }

        reporter.updateProgressBar({
            totalTestFiles: 1,
            totalTestFilesComplete: 1,
            testFiles: [
                {
                    tests: [
                        { status: 'passed', duration: 100 },
                        { status: 'failed', duration: 200 },
                        { status: 'failed', duration: 50 },
                    ],
                },
            ],
        })

        assert.isEqual(capturedLabel, '2 tests failed — 1/3 passed in 350ms')
    }

    @test()
    protected static async removesDividerTextBoxInteractionHandlers() {
        const reporter = this.TestReporter()
        const removedHandlers: string[] = []

        const fakeRaw = {
            attr: {} as any,
            blurAttr: {},
            draw: () => {},
            onDrag: () => {},
            onClick: () => {},
            onWheel: () => {},
            on: () => {},
            off: (event: string, _handler: () => void) => {
                removedHandlers.push(event)
            },
        }

        reporter.orientation = 'landscape'
        reporter.window = {}
        reporter.bottomLayout = this.fakeDividerBottomLayout()
        reporter.widgets = {
            Widget: () => ({
                on: () => {},
                getTermKitElement: () => fakeRaw,
                getFrame: () => ({ width: 10, height: 1 }),
            }),
        }

        reporter.dropInDivider()

        assert.isTrue(
            removedHandlers.includes('drag'),
            'onDrag must be removed to prevent text selection while dragging'
        )
        assert.isTrue(
            removedHandlers.includes('click'),
            'onClick must be removed to prevent focus stealing on click'
        )
        assert.isTrue(
            removedHandlers.includes('wheel'),
            'onWheel must be removed to prevent focus stealing on scroll'
        )
    }

    @test()
    protected static async createsDividerWidgetWithExpectedPortraitOptions() {
        const reporter = this.TestReporter()
        const capturedWidgets: { type: string; options: any }[] = []

        reporter.orientation = 'portrait'
        reporter.window = {}
        reporter.bottomLayout = this.fakeDividerBottomLayout()
        reporter.widgets = {
            Widget: (type: string, options: any) => {
                capturedWidgets.push({ type, options })
                return this.fakeTermKitWidget()
            },
        }

        reporter.dropInDivider()

        const entry = capturedWidgets.find((w) => w.type === 'text')!
        const { parent: _parent, ...rest } = entry.options

        assert.isEqualDeep(rest, {
            top: 30,
            left: 0,
            width: 100,
            height: 1,
            text: `${'─'.repeat(49)}☰${'─'.repeat(50)}`,
            focusable: false,
        })
    }

    @test()
    protected static async createsDividerWidgetWithExpectedLandscapeOptions() {
        const reporter = this.TestReporter()
        const capturedWidgets: { type: string; options: any }[] = []

        reporter.orientation = 'landscape'
        reporter.window = {}
        reporter.bottomLayout = this.fakeDividerBottomLayout()
        reporter.widgets = {
            Widget: (type: string, options: any) => {
                capturedWidgets.push({ type, options })
                return this.fakeTermKitWidget()
            },
        }

        reporter.dropInDivider()

        const entry = capturedWidgets.find((w) => w.type === 'text')!
        const { parent: _parent, ...rest } = entry.options
        const expectedText = Array.from({ length: 46 }, (_, i) =>
            i === 23 ? '☰' : '│'
        ).join('\n')

        assert.isEqualDeep(rest, {
            top: 4,
            left: 60,
            width: 1,
            height: 46,
            text: expectedText,
            focusable: false,
        })
    }

    @test()
    protected static async handlesDividerOnDragForPortrait() {
        const reporter = this.TestReporter()
        const rowHeights: Record<number, string> = {}
        let capturedSetFrame: any

        reporter.orientation = 'portrait'
        reporter.splitPercent = 60
        reporter.bottomLayout = {
            getFrame: () => ({ top: 0, left: 0, width: 200, height: 100 }),
            setRowHeight: (idx: number, h: string) => {
                rowHeights[idx] = h
            },
            setColumnWidth: () => {},
            updateLayout: () => {},
        }
        reporter.dividerWidget = {
            setFrame: (frame: any) => {
                capturedSetFrame = frame
            },
        }

        reporter.handleDividerDrag({ dx: 0, dy: 10 })

        assert.isEqual(rowHeights[0], '70%')
        assert.isEqual(rowHeights[1], '30%')
        assert.isEqualDeep(capturedSetFrame, { top: 69, left: 0 })
    }

    @test()
    protected static async handlesDividerOnDragForLandscape() {
        const reporter = this.TestReporter()
        const columnWidths: any[] = []
        let capturedSetFrame: any

        reporter.orientation = 'landscape'
        reporter.splitPercent = 60
        reporter.bottomLayout = {
            getFrame: () => ({ top: 0, left: 0, width: 200, height: 100 }),
            setRowHeight: () => {},
            setColumnWidth: (opts: any) => {
                columnWidths.push(opts)
            },
            updateLayout: () => {},
        }
        reporter.dividerWidget = {
            setFrame: (frame: any) => {
                capturedSetFrame = frame
            },
        }

        reporter.handleDividerDrag({ dx: 20, dy: 0 })

        assert.isEqualDeep(columnWidths[0], {
            rowIdx: 0,
            columnIdx: 0,
            width: '70%',
        })
        assert.isEqualDeep(columnWidths[1], {
            rowIdx: 0,
            columnIdx: 1,
            width: '30%',
        })
        assert.isEqualDeep(capturedSetFrame, { top: 0, left: 140 })
    }

    private static fakeDividerBottomLayout() {
        return {
            getRows: () => [{ id: 'row_1' }],
            addColumn: () => {},
            addRow: () => {},
            setColumnWidth: () => {},
            setRowHeight: () => {},
            updateLayout: () => {},
            getFrame: () => ({ top: 4, left: 0, width: 100, height: 46 }),
            getChildById: () => null,
        }
    }

    @test()
    protected static async createsCopyErrorLogButtonWithExpectedOptions() {
        const reporter = this.TestReporter()
        let capturedButtonOptions: any

        const fakeCell = { getFrame: () => ({ width: 100, height: 50 }) }
        reporter.orientation = 'landscape'
        reporter.bottomLayout = this.fakeErrorLogBottomLayout(fakeCell)
        reporter.widgets = {
            Widget: (type: string, options: any) => {
                if (type === 'button') {
                    capturedButtonOptions = options
                }
                return this.fakeTermKitWidget()
            },
        }

        reporter.dropInErrorLog()

        const { parent: _parent, ...rest } = capturedButtonOptions
        assert.isEqualDeep(rest, {
            top: 0,
            left: 92,
            width: 10,
            text: ' Copy All ',
            shouldLockRightWithParent: true,
            blurAttr: { bgColor: 'red' },
            focusAttr: { bgColor: 'green' },
        })
    }

    @test()
    protected static async enterCopyButtonChangesBgColorToGreen() {
        const reporter = this.TestReporter()
        const { enterLeaveHandlers, fakeRaw } =
            this.dropInErrorLogWithFakes(reporter)

        enterLeaveHandlers['enter']?.()

        assert.isEqualDeep(fakeRaw.attr, { bgColor: 'green' })
    }

    @test()
    protected static async leaveCopyButtonChangesBgColorToRed() {
        const reporter = this.TestReporter()
        const { enterLeaveHandlers, fakeRaw } =
            this.dropInErrorLogWithFakes(reporter)

        enterLeaveHandlers['leave']?.()

        assert.isEqualDeep(fakeRaw.attr, fakeRaw.blurAttr)
    }

    @test()
    protected static async passesLastErrorContentOnCopyButtonClick() {
        const reporter = this.TestReporter()
        let capturedText: string | undefined

        reporter.copyToClipboard = (text: string) => {
            capturedText = text
        }

        const { clickHandler } = this.dropInErrorLogWithFakes(reporter)
        reporter.lastErrorContent = 'some error output'

        clickHandler?.()

        assert.isEqual(capturedText, 'some error output')
    }

    @test()
    protected static async copyToClipboardUsesCorrectCommandOnMac() {
        const reporter = this.TestReporter()
        TestReporter.platformFn = () => 'darwin'
        const { capturedCmd, fakeSpawn } = this.fakeSpawn()
        TestReporter.spawnFn = fakeSpawn

        reporter.copyToClipboard('test output')

        assert.isEqual(capturedCmd.cmd, 'pbcopy')
        assert.isEqualDeep(capturedCmd.args, [])
    }

    @test()
    protected static async copyToClipboardUsesCorrectCommandOnWindows() {
        const reporter = this.TestReporter()
        TestReporter.platformFn = () => 'win32'
        const { capturedCmd, fakeSpawn } = this.fakeSpawn()
        TestReporter.spawnFn = fakeSpawn

        reporter.copyToClipboard('test output')

        assert.isEqual(capturedCmd.cmd, 'clip')
        assert.isEqualDeep(capturedCmd.args, [])
    }

    @test()
    protected static async copyToClipboardUsesCorrectCommandOnLinux() {
        const reporter = this.TestReporter()
        TestReporter.platformFn = () => 'linux'
        const { capturedCmd, fakeSpawn } = this.fakeSpawn()
        TestReporter.spawnFn = fakeSpawn

        reporter.copyToClipboard('test output')

        assert.isEqual(capturedCmd.cmd, 'xclip')
        assert.isEqualDeep(capturedCmd.args, ['-selection', 'clipboard'])
    }

    private static fakeSpawn() {
        const capturedCmd = { cmd: '', args: [] as string[] }
        const fakeStdin = { write: () => {}, end: () => {} }
        const fakeSpawn = (cmd: string, args: string[]) => {
            capturedCmd.cmd = cmd
            capturedCmd.args = args
            return { stdin: fakeStdin }
        }
        return { capturedCmd, fakeSpawn }
    }

    private static fakeTermKitWidget() {
        const fakeRaw = {
            attr: {} as any,
            blurAttr: { bgColor: 'red' },
            draw: () => {},
            on: (_event: string, _handler: () => void) => {},
            off: (_event: string, _handler: () => void) => {},
            onDrag: () => {},
            onClick: () => {},
            onWheel: () => {},
        }
        return {
            on: (_event: string, _handler: () => void) => {},
            getTermKitElement: () => fakeRaw,
            getFrame: () => ({ width: 10, height: 1 }),
        }
    }

    private static dropInErrorLogWithFakes(reporter: any) {
        const enterLeaveHandlers: Record<string, () => void> = {}
        let clickHandler: (() => void) | undefined

        const fakeRaw = {
            attr: {} as any,
            blurAttr: { bgColor: 'red' },
            draw: () => {},
            on: (event: string, handler: () => void) => {
                enterLeaveHandlers[event] = handler
            },
        }

        const fakeCell = { getFrame: () => ({ width: 100, height: 50 }) }
        reporter.orientation = 'landscape'
        reporter.bottomLayout = this.fakeErrorLogBottomLayout(fakeCell)
        reporter.widgets = {
            Widget: (type: string, _options: any) => {
                if (type === 'button') {
                    return {
                        on: (event: string, handler: () => void) => {
                            if (event === 'click') {
                                clickHandler = handler
                            }
                        },
                        getTermKitElement: () => fakeRaw,
                        getFrame: () => ({ width: 10, height: 1 }),
                    }
                }
                return {
                    on: () => {},
                    getFrame: () => ({ width: 100, height: 50 }),
                }
            },
        }

        reporter.dropInErrorLog()

        return { enterLeaveHandlers, fakeRaw, clickHandler }
    }

    private static fakeErrorLogBottomLayout(fakeCell: any) {
        return {
            getRows: () => [{ id: 'row_1' }],
            addColumn: () => {},
            setColumnWidth: () => {},
            updateLayout: () => {},
            getFrame: () => ({ top: 4, left: 0, width: 100, height: 46 }),
            getChildById: (id: string) => (id === 'errors' ? fakeCell : null),
        }
    }

    private static fakeMenu(captured: Record<string, string>) {
        return {
            setTextForItem: (key: string, label: string) => {
                captured[key] = label
            },
        }
    }

    @test()
    protected static async submitWithEmptyStringCallsFilterChangeWithUndefined() {
        let capturedPattern: string | undefined = 'not-set'
        const reporter = this.TestReporter({
            handleFilterPatternChange: (p?: string) => {
                capturedPattern = p
            },
        })

        let submitHandler: ((payload: { value: string }) => void) | undefined

        const fakeInput = {
            on: (event: string, handler: any) => {
                if (event === 'submit') {
                    submitHandler = handler
                }
            },
            setValue: () => {},
            getFrame: () => ({ width: 50 }),
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
                    if (prop === 'on') {
                        return () => fakeWidget
                    }
                    return () => fakeWidget
                },
            }
        )

        reporter.widgets = {
            Widget: (type: string, _options: any) => {
                if (type === 'input') {
                    return fakeInput
                }
                return fakeWidget
            },
        }

        await reporter.start()

        assert.isTruthy(
            submitHandler,
            'submit handler must be registered on filter input'
        )

        submitHandler!({ value: '' })

        assert.isUndefined(
            capturedPattern,
            'handleFilterPatternChange must receive undefined when submitted with empty string'
        )

        clearInterval(reporter.updateInterval)
    }

    @test()
    protected static async launchTerminalOnMacUsesOsascript() {
        const cwd = '/some/project'
        const reporter = this.TestReporter({ cwd })
        TestReporter.platformFn = () => 'darwin'

        const { capturedCmd, fakeSpawn } = this.fakeSpawn()
        TestReporter.spawnFn = fakeSpawn

        reporter.launchTerminal()

        assert.isEqual(capturedCmd.cmd, 'osascript')
        assert.isEqualDeep(capturedCmd.args, [
            '-e',
            `tell app "Terminal" to do script "cd ${cwd} && node $([ -f node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js ] && echo node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js || echo build/workspace/testRunner.cli.js) --watchMode standard"`,
        ])
    }

    @test()
    protected static async launchTerminalOnLinuxUsesXterm() {
        const cwd = '/some/project'
        const reporter = this.TestReporter({ cwd })
        TestReporter.platformFn = () => 'linux'

        const { capturedCmd, fakeSpawn } = this.fakeSpawn()
        TestReporter.spawnFn = fakeSpawn

        reporter.launchTerminal()

        assert.isEqual(capturedCmd.cmd, 'xterm')
        assert.isEqualDeep(capturedCmd.args, [
            '-e',
            `cd ${cwd} && node $([ -f node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js ] && echo node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js || echo build/workspace/testRunner.cli.js) --watchMode standard`,
        ])
    }

    @test()
    protected static async launchTerminalOnWindowsUsesCmd() {
        const cwd = '/some/project'
        const reporter = this.TestReporter({ cwd })
        TestReporter.platformFn = () => 'win32'

        const { capturedCmd, fakeSpawn } = this.fakeSpawn()
        TestReporter.spawnFn = fakeSpawn

        reporter.launchTerminal()

        assert.isEqual(capturedCmd.cmd, 'cmd')
        assert.isEqualDeep(capturedCmd.args, [
            '/c',
            'start',
            'cmd',
            '/k',
            `cd ${cwd} && node $([ -f node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js ] && echo node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js || echo build/workspace/testRunner.cli.js) --watchMode standard`,
        ])
    }

    @test()
    protected static async launchTerminalMenuItemCallsLaunchTerminal() {
        const reporter = this.TestReporter() as any
        let launchTerminalCalled = false
        reporter.launchTerminal = () => {
            launchTerminalCalled = true
        }

        reporter.handleMenuSelect({ value: 'launchTerminal' })

        assert.isTrue(
            launchTerminalCalled,
            'launchTerminal must be called when menu item is selected'
        )
    }

    private static TestReporter(options?: TestReporterOptions) {
        return new TestReporter(options) as any
    }
}
