import AbstractModuleTest from '../../utilities/AbstractModuleTest.js'
import test from '../../utilities/decorators.js'
import assert from '../../utilities/assert.js'
import { retrocycle } from '../../jest-json-reporter/cycle.js'
import JsonReporter, {
    END_DIVIDER,
    START_DIVIDER,
} from '../../jest-json-reporter/JsonReporter.js'

export default class StringifyTest extends AbstractModuleTest {
    private static originalLog: typeof console.log

    protected static async beforeEach() {
        this.originalLog = console.log
        console.log = () => {}
    }

    protected static async afterEach() {
        console.log = this.originalLog
    }

    @test()
    protected static canStringifyRecursive() {
        let obj: Record<string, any> = {
            go: 'team',
            around: true,
        }

        obj.recursive = obj

        const reporter = new JsonReporter()

        //@ts-ignore
        const lastLogged = reporter.render(obj)

        const parsed = JSON.parse(
            //@ts-ignore
            lastLogged
                .replace(START_DIVIDER, '')
                .replace(END_DIVIDER, '')
                .trim()
        )

        assert.isEqualDeep(parsed, {
            go: 'team',
            around: true,
            recursive: { $ref: '$' },
        })

        const uncycled = retrocycle(parsed)

        assert.isEqual(uncycled.go, 'team')
        assert.isEqual(uncycled.around, true)
        assert.isTruthy(uncycled.recursive)
    }
}
