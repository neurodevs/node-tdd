import { createRequire } from 'module'
import generateId from '@neurodevs/generate-id'

const require = createRequire(import.meta.url)

const { default: AbstractSpruceTest } = require('@sprucelabs/test-utils') as {
    default: (typeof import('@sprucelabs/test-utils'))['default']
}

export default class AbstractModuleTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static generateId() {
        return generateId()
    }
}
