import { BaseWidget } from './widgets.types.js'

// ** Window Widget ** //
export const windowEventContract = {
    eventSignatures: {
        key: {},
        kill: {},
        resize: {},
    },
}

export type WindowEventContract = typeof windowEventContract

export interface WindowWidgetOptions {}

export interface WindowWidget extends BaseWidget<WindowEventContract> {
    readonly type: 'window'
    hideCursor: () => void
    showCursor: () => void
    setTitle: (title: string) => void
    getFocusedWidget(): BaseWidget | null
}
