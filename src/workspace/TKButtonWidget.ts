import terminal_kit from 'terminal-kit'
import { ButtonWidget, ButtonWidgetOptions } from './button.types.js'
import termKitUtil from './termKit.utility.js'
import TkBaseWidget, { TkWidgetOptions } from './TkBaseWidget.js'
const termKit = terminal_kit as any

export default class TKButtonWidget
    extends TkBaseWidget
    implements ButtonWidget
{
    private button: any

    public readonly type = 'button'

    public constructor(
        options: TkWidgetOptions & ButtonWidgetOptions & { termKitElement: any }
    ) {
        super({
            ...options,
        })

        const { parent, text, ...rest } = options

        const frame = termKitUtil.buildFrame(options, parent)

        this.button = new termKit.Button({
            parent: parent ? parent.getTermKitElement() : undefined,
            content: text,
            ...rest,
            ...frame,
        })

        this.button.on('submit', this.handleClick.bind(this))
        this.button.__widget = this

        this.calculateSizeLockDeltas()
    }

    private handleClick() {
        void (this as ButtonWidget).emit('click')
    }

    public getText(): string {
        throw new Error('Method not implemented.')
    }

    public setText(text: string): void {
        this.button.setContent(text)
    }

    public getTermKitElement() {
        return this.button
    }
}
