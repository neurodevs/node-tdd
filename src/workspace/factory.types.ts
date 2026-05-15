import TKButtonWidget from './TKButtonWidget.js'
import TkInputWidget from './TkInputWidget.js'
import TkLayoutCellWidget from './TkLayoutCellWidget.js'
import TkLayoutWidget from './TkLayoutWidget.js'
import TkMenuBarWidget from './TkMenuBarWidget.js'
import TkPopupWidget from './TkPopupWidget.js'
import TkProgressBarWidget from './TkProgressBarWidget.js'
import TkTextWidget from './TkTextWidget.js'
import TkWindowWidget from './TkWindowWidget.js'
import {
    buttonEventContract,
    ButtonWidget,
    ButtonWidgetOptions,
} from './button.types.js'
import {
    inputEventContract,
    InputWidget,
    InputWidgetOptions,
} from './input.types.js'
import {
    LayoutWidgetOptions,
    LayoutWidget,
    LayoutCellWidgetOptions,
    LayoutCellWidget,
} from './layout.types.js'
import {
    MenuBarWidgetOptions,
    MenuBarWidget,
    menuBarEventContract,
} from './menuBar.types.js'
import { PopupWidget, PopupWidgetOptions } from './popup.types.js'
import {
    ProgressBarWidgetOptions,
    ProgressBarWidget,
} from './progressBar.types.js'
import {
    TextWidgetOptions,
    TextWidget,
    textEventContract,
} from './text.types.js'
import { UniversalWidgetOptions } from './widgets.types.js'
import {
    WindowWidgetOptions,
    WindowWidget,
    windowEventContract,
} from './window.types.js'

export type WidgetType = keyof WidgetRegistry

export type Widget<T extends WidgetType = WidgetType> = WidgetRegistry[T]

export type FactoryOptions<T extends WidgetType> = UniversalWidgetOptions &
    OptionsMap[T]

interface OptionsMap {
    text: TextWidgetOptions
    window: WindowWidgetOptions
    layout: LayoutWidgetOptions
    layoutCell: LayoutCellWidgetOptions
    progressBar: ProgressBarWidgetOptions
    menuBar: MenuBarWidgetOptions
    popup: PopupWidgetOptions
    button: ButtonWidgetOptions
    input: InputWidgetOptions
}

export interface WidgetRegistry {
    text: TextWidget
    window: WindowWidget
    layout: LayoutWidget
    layoutCell: LayoutCellWidget
    progressBar: ProgressBarWidget
    menuBar: MenuBarWidget
    popup: PopupWidget
    button: ButtonWidget
    input: InputWidget
}

export const widgetRegistry = {
    window: TkWindowWidget,
    text: TkTextWidget,
    layout: TkLayoutWidget,
    layoutCell: TkLayoutCellWidget,
    progressBar: TkProgressBarWidget,
    menuBar: TkMenuBarWidget,
    popup: TkPopupWidget,
    button: TKButtonWidget,
    input: TkInputWidget,
}

export const contractRegistry = {
    window: windowEventContract,
    text: textEventContract,
    layout: null,
    layoutCell: null,
    progressBar: null,
    menuBar: menuBarEventContract,
    popup: null,
    button: buttonEventContract,
    input: inputEventContract,
}
