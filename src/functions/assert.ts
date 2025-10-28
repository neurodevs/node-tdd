import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const { assert: spruceAssert } = require('@sprucelabs/test-utils')

const assert = spruceAssert

export default assert
