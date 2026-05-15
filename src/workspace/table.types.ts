import { BaseWidget } from './widgets.types.js'

// ** Table Widget **//

export interface TableWidgetOptions {}

export interface TableWidget extends BaseWidget {
    type: 'table'
}
