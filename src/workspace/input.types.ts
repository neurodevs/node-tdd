import { BaseWidget } from './widgets.types.js'

export const inputEventContract = {
    eventSignatures: {
        submit: {},
        cancel: {},
    },
}

export type InputEventContract = typeof inputEventContract

export interface InputWidgetOptions {
    value?: string
    label?: string
    placeholder?: string
}

export interface InputWidget extends BaseWidget<InputEventContract> {
    readonly type: 'input'
    getValue(): string | undefined
    setValue(value: string): void
}
