import { BaseWidget } from './widgets.types.js'

export const menuBarEventContract = {
    eventSignatures: {
        select: {},
    },
}

export type MenuBarEventContract = typeof menuBarEventContract

export interface MenuBarWidgetOptions {
    items: MenuBarWidgetItem[]
}

export interface MenuBarWidgetItem {
    label: string
    value: string
    items?: MenuBarWidgetItem[]
}

export interface MenuBarWidget extends BaseWidget<MenuBarEventContract> {
    setTextForItem(value: string, text: string): void
    readonly type: 'menuBar'
}
