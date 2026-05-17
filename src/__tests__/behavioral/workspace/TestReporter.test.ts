import AbstractModuleTest from '../../../utilities/AbstractModuleTest.js'
import test from '../../../utilities/decorators.js'
import assert from '../../../utilities/assert.js'
import TestReporter, {
    TestReporterOptions,
} from '../../../workspace/TestReporter.js'

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
            isDebugging: false,
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
        const reporter = this.TestReporter() as any
        const capturedTextOptions: { type: string; options: any }[] = []
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
            row: 10,
            column: 30,
        })

        const entry = capturedTextOptions.find(
            (o) =>
                o.type === 'text' &&
                o.options?.text?.startsWith('Selected file:')
        )

        assert.isTruthy(entry, 'popup text widget must be created')

        const { parent: _parent, ...restOptions } = entry!.options

        assert.isEqualDeep(restOptions, {
            left: 1,
            top: 1,
            height: 4,
            width: popupWidth - 2,
            text: 'Selected file:\n\nsrc/foo/bar.test.ts',
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
            (o) => o.type === 'button' && o.options?.text === 'Open'
        )

        assert.isTruthy(
            entry,
            'Open button must be created in select test popup'
        )

        const { parent: _parent, ...restOptions } = entry!.options

        assert.isEqualDeep(restOptions, {
            left: 11,
            top: 6,
            text: 'Open',
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
            left: 30,
            top: 6,
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

        // file1: rows 0–2 (header + 2 tests), file2: rows 3–4 (header + 1 test)
        assert.isEqual(reporter.getFileForLine(0), 'file1.ts') // header
        assert.isEqual(reporter.getFileForLine(2), 'file1.ts') // last test
        assert.isEqual(reporter.getFileForLine(3), 'file2.ts') // file2 header
        assert.isEqual(reporter.getFileForLine(4), 'file2.ts') // file2 last test
        assert.isEqual(reporter.getFileForLine(5), undefined) // out of range
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

        assert.isEqual(rowHeights[0], '100%', 'row 0 must be 100% when no errors')
        assert.isEqual(rowHeights[1], '0%', 'row 1 must be 0% when no errors')
        assert.isTrue(updateLayoutCalled, 'updateLayout must be called when collapsing error row')
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

        assert.isEqual(rowHeights[0], '60%', 'row 0 must be 60% when errors present')
        assert.isEqual(rowHeights[1], '40%', 'row 1 must be 40% when errors present')
    }

    private static fakeMenu(captured: Record<string, string>) {
        return {
            setTextForItem: (key: string, label: string) => {
                captured[key] = label
            },
        }
    }

    private static TestReporter(options?: TestReporterOptions) {
        return new TestReporter(options) as any
    }
}
