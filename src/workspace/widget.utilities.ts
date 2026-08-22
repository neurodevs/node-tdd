import { BaseWidget, WidgetFrame } from './widgets.types.js'

const widgetUtil = {
    buildFrame(frame?: Partial<WidgetFrame>, parent?: BaseWidget | null) {
        let { left, top, height, width } = frame || {}

        if (typeof width === 'string') {
            if (!parent) {
                throw new Error(
                    'I can only calculate percentage sizes if a parent is passed.'
                )
            }

            width = parent.getFrame().width * (parseInt(width, 10) / 100)
        }

        if (typeof height === 'string') {
            if (!parent) {
                throw new Error(
                    'I can only calculate percentage sizes if a parent is passed.'
                )
            }

            height = parent.getFrame().height * (parseInt(height, 10) / 100)
        }

        return {
            left,
            top,
            height,
            width,
        }
    },
}

export default widgetUtil
