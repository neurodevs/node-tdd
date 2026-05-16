import { BaseWidget } from './widgets.types.js'

// ** Text Widget ** //

export const textEventContract = {
    eventSignatures: {
        click: {},
    },
}

export type TextEventContract = typeof textEventContract

export interface TextWidgetOptions {
    isScrollEnabled?: boolean
    shouldAutoScrollWhenAppendingContent?: boolean
    wordWrap?: boolean
    text?: string
}

export interface TextWidget extends BaseWidget<TextEventContract> {
    readonly type: 'text'
    getText(): string
    setText(content: string): void
    getScrollX(): number
    getScrollY(): number
    scrollToTop(): void
}
