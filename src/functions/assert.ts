import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const {
    assert: spruceAssert,
    ISpruceAssert,
} = require('@sprucelabs/test-utils')

const assert: typeof ISpruceAssert = spruceAssert

export default assert
