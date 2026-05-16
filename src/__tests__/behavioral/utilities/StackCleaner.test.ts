import AbstractModuleTest from '../../../impl/AbstractModuleTest.js'
import assert from '../../../utilities/assert.js'
import test from '../../../utilities/decorators.js'
import StackCleaner from '../../../utilities/StackCleaner.js'

export default class ErrorStackTest extends AbstractModuleTest {
    @test(
        'removes test files',
        `Error: You called will-fail!
	at Object.willFail (~/node-tdd/src/assert.ts:53:17)
	at Function.canRemoveTestFiles (~/node-tdd/src/__tests__/ErrorStack.test.ts:8:10)
	at Object.<anonymous> (~/node-tdd/src/decorators.ts:36:11)
	at Object.asyncJestTest (~/node-tdd/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:100:37)
	at ~/node-tdd/node_modules/jest-jasmine2/build/queueRunner.js:45:12
	at new Promise (<anonymous>)
	at mapper (~/node-tdd/node_modules/jest-jasmine2/build/queueRunner.js:28:19)
	at ~/node-tdd/node_modules/jest-jasmine2/build/queueRunner.js:75:41
	at processTicksAndRejections (internal/process/task_queues.js:97:5)`,
        `Error: You called will-fail!
	at Function.canRemoveTestFiles (~/node-tdd/src/__tests__/ErrorStack.test.ts:8:10)
	at new Promise (<anonymous>)`
    )
    @test(
        'drops spammy logs',
        `TypeError: Cannot read property 'map' of undefined
    at Object (~/example/src/databases/mongo.utilities.ts:21:17)
    at Array.forEach (<anonymous>)
    at mapNestedIdValues (~/example/src/databases/mongo.utilities.ts:20:2)
    at Object.mongoUtil [as mapQuery] (~/example/src/databases/mongo.utilities.ts:11:27)
    at MongoDatabase.toMongo…
    at Generator.next (~/example/node_modules/regenerator-runtime/runtime.js:118:21)
    at asyncGeneratorStep (~/example/node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:24)
    at _next (~/example/node_modules/@babel/runtime/helpers/asyncToGenerator.js:25:9)
    at processTicksAndRejections (internal/process/task_queues.js:97:5)`,
        `TypeError: Cannot read property 'map' of undefined
    at Object (~/example/src/databases/mongo.utilities.ts:21:17)
    at Array.forEach (<anonymous>)
    at mapNestedIdValues (~/example/src/databases/mongo.utilities.ts:20:2)
    at Object.mongoUtil [as mapQuery] (~/example/src/databases/mongo.utilities.ts:11:27)
    at MongoDatabase.toMongo…`
    )
    protected static async removesExpected(stack: string, expected: string) {
        const cleaned = StackCleaner.clean(stack)
        assert.isEqual(cleaned, expected)
    }
}
