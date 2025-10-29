import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const { test: spruceTest } = require('@sprucelabs/test-utils')

const test = spruceTest

export default test
