import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const { default: AbstractSpruceTest } = require('@sprucelabs/test-utils') as {
    default: (typeof import('@sprucelabs/test-utils'))['default']
}

export default class AbstractModuleTest extends AbstractSpruceTest {}
