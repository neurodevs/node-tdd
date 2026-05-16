import AbstractModuleTest from '../../../utilities/AbstractModuleTest.js'
import assert from '../../../utilities/assert.js'
import test from '../../../utilities/decorators.js'
import WidgetFactory from '../../../workspace/WidgetFactory.js'

export default class WidgetsTest extends AbstractModuleTest {
    private static factory: WidgetFactory

    protected static async beforeEach() {
        await super.beforeEach()
        this.factory = new WidgetFactory()
    }

    @test()
    protected static async canCreateFactory() {
        assert.isTruthy(this.factory)
    }

    @test()
    protected static async canCreateTextWidget() {
        const log = this.buildText()
        assert.isTruthy(log)
    }

    @test()
    protected static async setsStartingFrame() {
        const text = this.buildText()
        assert.isEqualDeep(text.getFrame(), {
            left: 0,
            top: 0,
            width: 4,
            height: 4,
        })
    }

    @test()
    protected static canCreateWindow() {
        const window = this.factory.Widget('window', {})
        assert.isTruthy(window)
    }

    @test()
    protected static canCreateProgressBar() {
        const progress = this.factory.Widget('progressBar', {
            progress: 0,
        })
        assert.isTruthy(progress)
    }

    @test()
    protected static canCreateText() {
        const text = this.factory.Widget('text', {})
        assert.isTruthy(text)
    }

    @test.skip('enable when ready to fake termkit')
    protected static canCreateLayout() {
        const window = this.factory.Widget('window', {})
        const layout = this.factory.Widget('layout', {
            parent: window,
            width: '100%',
            rows: [
                {
                    id: 'row_1',
                    height: '100%',
                    columns: [
                        {
                            id: 'column_1',
                            width: '100%',
                        },
                    ],
                },
            ],
        })
        assert.isTruthy(layout)

        const column = layout.getChildById('results')

        assert.isTruthy(column)
    }

    @test()
    protected static async setFrameResyncsScrollPositionOnScrollableWidget() {
        const text = this.buildScrollableText() as any
        let capturedArgs: any[] | undefined

        text.text.scrollable = true
        text.text.scrollTo = (...args: any[]) => {
            capturedArgs = args
        }

        const currentScrollY = text.text.scrollY

        text.setFrame({ left: 0, top: 0, width: 20, height: 10 })

        assert.isEqualDeep(capturedArgs, [null, currentScrollY])
    }

    @test()
    protected static async scrollToTopCallsScrollToWithZero() {
        const text = this.buildScrollableText() as any
        let capturedArgs: any[] | undefined

        text.text.scrollTo = (...args: any[]) => {
            capturedArgs = args
        }

        text.scrollToTop()

        assert.isEqualDeep(capturedArgs, [null, 0])
    }

    private static buildScrollableText() {
        return this.factory.Widget('text', {
            left: 0,
            top: 0,
            width: 20,
            height: 10,
            isScrollEnabled: true,
        })
    }

    private static buildText() {
        return this.factory.Widget('text', {
            left: 0,
            top: 0,
            width: 4,
            height: 4,
        })
    }
}
