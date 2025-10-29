import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const { default: AbstractSpruceTest } = require('@sprucelabs/test-utils')

export default class AbstractModuleTest extends AbstractSpruceTest {}
