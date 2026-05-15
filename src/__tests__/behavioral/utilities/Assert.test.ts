import generateId from '@neurodevs/generate-id'

import assert from '../../../utilities/assert.js'
import test from '../../../utilities/decorators.js'
import AbstractModuleTest from '../../../impl/AbstractModuleTest.js'

interface ICustomObj {
    testStr: string
}

export default class AssertTest extends AbstractModuleTest {
    @test()
    protected static async canHandleAsyncThrows() {
        let hitError = false

        await assert.doesThrowAsync(
            async () =>
                new Promise(() => {
                    hitError = true
                    throw new Error('should catch')
                })
        )

        assert.isTrue(hitError)
    }

    @test()
    protected static async canDetectNoErrorThrown() {
        let hitCallback = true
        let detectedNoThrow = false

        try {
            assert.doesThrow(async () => {
                hitCallback = true
            })
        } catch (err) {
            detectedNoThrow = true
            assert.isTruthy(err)
        }

        assert.isTrue(hitCallback)
        assert.isTrue(detectedNoThrow)
    }

    @test()
    protected static isEqual() {
        assert.doesThrow(() => assert.isEqual('hello', 'world'), /expected/)
        assert.isEqual(1, 1)
        assert.isEqual(1, 1, 'works with error message')
        assert.isEqual('testing', 'testing', 'works with error message')
    }

    @test()
    protected static isAbove() {
        assert.isAbove(10, 5)
        assert.doesThrow(() => assert.isAbove(5, 10), /is not above/)
        assert.doesThrow(() => assert.isAbove(undefined, 10), /is not a number/)
    }

    @test()
    protected static async isBelow() {
        assert.isBelow(5, 10)
        assert.doesThrow(() => assert.isBelow(10, 5), /is not below/)
        assert.doesThrow(() => assert.isBelow(undefined, 5), /is not a number/)
    }

    @test()
    protected static async typeTests() {
        assert.isType<string>('string')
        assert.isType<number>(123)

        const myCustomObj: ICustomObj = {
            testStr: 'blah',
        }

        assert.isType<ICustomObj>(myCustomObj)
        assert.areSameType(true, true)
    }

    @test()
    protected static async canMatchErrorByString() {
        assert.doesThrow(() => {
            throw new Error('Match on string')
        }, 'on string')

        assert.doesThrow(() => {
            throw new Error(
                'crudAssert.beforeEach(this.views) is is here with dots and parentheses'
            )
        }, 'crudAssert.beforeEach(this.views)')

        await assert.doesThrowAsync(async () => {
            throw new Error('canMatchErrorByString: Match on string')
        }, 'on string')
    }

    @test()
    protected static async doesNotMatchErrorByBadString() {
        let errorThrown = false
        try {
            assert.doesThrow(() => {
                throw new Error('doesNotMatchErrorByBadString: Match on string')
            }, 'on string2')
        } catch {
            errorThrown = true
        }

        assert.isTrue(errorThrown)
    }

    @test()
    protected static async throwMatchesErrorByRegex() {
        assert.doesThrow(() => {
            throw new Error('Match on string')
        }, /on STRING/i)

        await assert.doesThrowAsync(async () => {
            throw new Error('Match on string')
        }, /on STRING/i)
    }

    @test()
    protected static async throwReturnsTheError() {
        const err = assert.doesThrow(() => {
            throw new Error('Match on string')
        })

        assert.isEqual(err.message, 'Match on string')

        const err2 = await assert.doesThrowAsync(async () => {
            throw new Error('Match on string')
        })

        assert.isEqual(err2.message, 'Match on string')
    }

    @test()
    protected static async doesNotMatchErrorByBadRegex() {
        let errorThrown = false
        try {
            assert.doesThrow(() => {
                throw new Error('Match on string')
            }, /on string2/)
        } catch {
            errorThrown = true
        }

        assert.isTrue(errorThrown)
    }

    @test()
    protected static async doesNotMatchErrorByBadRegexAsync() {
        let errorThrown = false
        try {
            await assert.doesThrowAsync(async () => {
                throw new Error('Match on string')
            }, /on string2/)
        } catch {
            errorThrown = true
        }

        assert.isTrue(errorThrown)
    }

    @test('asserts is string (test will pass, types will fail)')
    protected static async assertIsString() {
        const path = ((): string | undefined => {
            return 'test'
        })()

        assert.isString(path)
        assert.isType<string>(path)
    }

    @test('include uses string to match string', 'hello world', 'world')
    @test('assert regex on string', 'hello world', /world/gi)
    @test(
        'assert regex obj on string',
        'hello world',
        new RegExp('world', 'gis')
    )
    @test(
        'include uses partial and matches 0th level',
        { hello: 'world', taco: 'bell' },
        { taco: 'bell' }
    )
    @test(
        'include can find string as value on 0th level',
        { hello: 'world', taco: 'bell' },
        'bell'
    )
    @test(
        'include can find scalar on 1st level',
        {
            hello: 'world',
            taco: 'bell',
            flavor: { cheese: true, buffalo: true },
        },
        { 'flavor.cheese': true }
    )
    @test(
        'include can find scalar on 2nd level',
        {
            hello: 'world',
            taco: 'bell',
            flavor: { cheese: { size: 'large', buffalo: true } },
        },
        { 'flavor.cheese.size': 'large' }
    )
    @test(
        'include can find object on 2nd level',
        {
            hello: 'world',
            taco: 'bell',
            flavor: { cheese: { size: 'large', buffalo: { wing: true } } },
        },
        { 'flavor.cheese.buffalo': { wing: true } }
    )
    @test(
        'include can search inside array with index',
        {
            flavors: [{ cheese: true }, { peperoni: true }],
        },
        { 'flavors[0].cheese': true }
    )
    @test(
        'include can search inside array without index',
        {
            flavors: [{ cheese: true }, { peperoni: true }],
        },
        { 'flavors[].peperoni': true }
    )
    @test(
        'include can search inside array without index',
        {
            flavors: [
                { size: 'large', toppings: [{ meat: true }, { cheese: true }] },
                { size: 'small' },
            ],
        },
        { 'flavors[].toppings[].meat': true }
    )
    @test(
        'include can search array without index',
        [{ cheese: true }, { meat: true }],
        { meat: true }
    )
    @test(
        'include can match on partial object',
        { cheese: true, meat: true },
        {
            meat: true,
        }
    )
    @test(
        'include can search array without index',
        [{ cheese: true }, { meat: true }],
        { '[].meat': true }
    )
    @test(
        'include can search array without index',
        [{ cheese: true }, { meat: true }],
        { meat: true }
    )
    @test(
        'include matches partial object in array',
        [
            {
                name: 'schemas.types.ts',
                description:
                    'Every schema you need based on all your contracts',
                path: '/example/schemas.types.ts',
                action: 'updated',
            },
        ],
        {
            action: 'updated',
        }
    )
    @test(
        'include matches deep equal on object with nested object in array',
        [
            {
                name: 'schemas.types.ts',
                description:
                    'Every schema you need based on all your contracts',
                path: '/example/schemas.types.ts',
                action: 'updated',
                deep: {
                    foo: 'bar',
                },
            },
        ],
        {
            name: 'schemas.types.ts',
            description: 'Every schema you need based on all your contracts',
            path: '/example/schemas.types.ts',
            action: 'updated',
            deep: {
                foo: 'bar',
            },
        }
    )
    @test(
        'include matches deep equal on nested object in array',
        [
            {
                name: 'schemas.types.ts',
                description:
                    'Every schema you need based on all your contracts',
                path: '/example/schemas.types.ts',
                action: 'updated',
                deep: {
                    foo: 'bar',
                },
            },
        ],
        {
            name: 'schemas.types.ts',
            deep: {
                foo: 'bar',
            },
        }
    )
    @test(
        'include matches object props',
        {
            results: {
                errors: [new Error('test'), new Error('test2')],
            },
        },
        {
            'results.errors[].stack': 'test2',
        }
    )
    @test(
        'include matches object props against regex',
        {
            results: {
                errors: [new Error('test'), new Error('test2')],
            },
        },
        {
            'results.errors[].stack': /test[1|2]/,
        }
    )
    @test(
        'include matches when passed an array and matching against object with numbers',
        [6, 7],
        7
    )
    @test(
        'include matches object with array property in array of objects',
        [
            {
                methodName: 'use',
                args: [null],
            },
            {
                methodName: 'on',
                args: ['confirm-pin', null],
            },
            {
                methodName: 'on',
                args: ['who-am-i', null],
            },
            {
                methodName: 'on',
                args: ['authenticate', null],
            },
            {
                methodName: 'on',
                args: ['can-listen', null],
            },
            {
                methodName: 'emit',
                args: ['test.what-an-event', null],
            },
        ],
        {
            methodName: 'emit',
            args: ['test.what-an-event', null],
        }
    )
    protected static includeAndDoesNotInclude(haystack: any, needle: any) {
        assert.doesInclude(haystack, needle)
        assert.doesThrow(() => assert.doesNotInclude(haystack, needle))
    }

    @test(
        'include fails as expected with strings',
        'taco',
        'bravo',
        /could not find(.*?)"bravo"/gis
    )
    @test(
        'include fails as expected with regex obj on string',
        'hello world',
        new RegExp('cheeseball', 'gis')
    )
    @test(
        'include fails as expected matching string against object',
        { hello: 'world' },
        'taco',
        /Could not find(.*?)taco/gis
    )
    @test(
        'include fails as expected matching string against object with array',
        {
            flavors: [
                { size: 'large', toppings: [{ meat: true }, { cheese: true }] },
                { size: 'small' },
            ],
        },
        { 'flavors[].toppings[].meat': false },
        /could not find match(.*?)false(.*?)at(.*?)toppings\[\]\.meat/gis
    )
    @test(
        'include fails as expected matching string against nested object',
        {
            cheese: { size: 'large', toppings: { meat: true } },
        },
        { 'cheese.toppings.stink': false },
        /the path(.*?)cheese.toppings.stink(.*?)was not found in/gis
    )
    @test(
        'include fails as expected by not showing full object if path matches but value differs',
        {
            cheese: { size: 'large', toppings: { meat: true } },
        },
        { 'cheese.toppings.meat': false },
        /expected(.*?)false(.*?)but found(.*?)true(.*?)at(.*?)cheese.toppings.meat/gis
    )
    @test(
        "include fails when can't find in an array",
        [
            {
                name: 'schemas.types.ts',
                description:
                    'Every schema you need based on all your contracts',
                path: '/example/schemas.types.ts',
                action: 'updated',
            },
        ],
        {
            action: 'star',
        },
        /could not find(.*?)"action": "star"/gis
    )
    @test(
        "include fails when can't find in an array",
        [
            {
                name: 'schemas.types.ts',
                description:
                    'Every schema you need based on all your contracts',
                path: '/example/schemas.types.ts',
                action: 'updated',
            },
        ],
        {
            name: 'schemas.types.ts',
            action: '2',
        },
        /could not find(.*?)"name": "schemas.types.ts"/gis
    )
    @test(
        'include fails object props against regex',
        {
            results: {
                errors: [new Error('test'), new Error('test2')],
            },
        },
        {
            'results.errors[].stack': /test3/,
        },
        /could not find match/i
    )
    @test(
        'include fails when passed an array and matching against object',
        ['hey', 'there'],
        { name: 'hey', foo: 'bar' },
        /could not find/i
    )
    @test(
        'include fails when passed an array and matching against object with numbers',
        [6, 7],
        { name: 7, foo: 6 },
        /could not find/i
    )
    @test(
        'include matches when passed an array and matching against numbers',
        [6, 7],
        9
    )
    @test(
        'include fails when searching an object for a regex',
        { foo: 'bar', taco: 'bravo' },
        /yummy/
    )
    protected static doesIncludeThrowsAsExpected(
        haystack: any,
        needle: any,
        matcher: any
    ) {
        const err = assert.doesThrow(
            () => assert.doesInclude(haystack, needle),
            matcher
        )

        assert.doesNotInclude(err.message, 'undefined')
    }

    @test()
    protected static hasAllFunctionsAndPasses() {
        const obj = { func1: () => {}, func2() {}, foo: 'bar' }
        assert.hasAllFunctions(obj, ['func1', 'func2'])
    }

    @test()
    protected static hasAllFunctionsAndFails() {
        const obj = { func1: () => {}, func2() {}, foo: 'bar' }
        let errorHit = false
        try {
            assert.hasAllFunctions(obj, ['func1', 'func3'])
        } catch (err: any) {
            errorHit = true
            assert.doesInclude(err.message, 'func3')
        }

        assert.isTrue(errorHit)
    }

    @test()
    protected static isTruthy() {
        const run = (): string | undefined => {
            return 'test'
        }

        const value = run()
        assert.isTruthy(value)

        assert.isType<string>(value)

        assert.doesThrow(() => assert.isTruthy(false), /is not truthy/)
        assert.doesThrow(() => assert.isTruthy(undefined), /is not truthy/)
        assert.doesThrow(() => assert.isTruthy(null), /is not truthy/)
        assert.doesThrow(() => assert.isTruthy(0), /is not truthy/)
    }

    @test()
    protected static isFalsy() {
        assert.isFalsy(null)
        assert.isFalsy(0)
        assert.isFalsy(undefined)
        assert.isFalsy(false)

        assert.doesThrow(() => assert.isFalsy(1), /is not falsy/)
        assert.doesThrow(() => assert.isFalsy('undefined'), /is not falsy/)
    }

    @test()
    protected static isString() {
        assert.isString('test')
        assert.doesThrow(() => assert.isString(true), 'not a string')
    }

    @test()
    protected static isTrue() {
        assert.isTrue(true)
        assert.doesThrow(() => assert.isTrue(false))
        assert.doesThrow(() => assert.isTrue(undefined))
    }

    @test()
    protected static isFalse() {
        assert.isFalse(false)
        assert.doesThrow(() => assert.isFalse(true))
        assert.doesThrow(() => assert.isFalse(undefined))
    }

    @test()
    protected static deepEqual() {
        assert.isEqualDeep({ test: true }, { test: true })
        assert.doesThrow(() =>
            assert.isNotEqualDeep({ test: true }, { test: true })
        )

        assert.doesThrow(
            () => assert.isEqualDeep({ test: true }, { test: false }),
            /true => false/
        )
        assert.isNotEqualDeep({ test: true }, { test: false })

        assert.doesThrow(
            () => assert.isEqualDeep({ test: '1' }, { test: 1 }),
            /"1" => 1/
        )

        assert.doesThrow(() =>
            assert.isNotEqualDeep(
                { test: true, hello: 'world' },
                {
                    test: true,
                    hello: 'world',
                }
            )
        )
    }

    @test()
    protected static isUndefined() {
        assert.isUndefined(undefined)
        assert.doesThrow(() => assert.isUndefined(true), /not undefined/)
    }

    @test()
    protected static isNotEqual() {
        assert.isNotEqual(true, false)
        assert.doesThrow(
            () => assert.isNotEqual('do', 'do'),
            /should not equal/
        )
    }

    @test()
    protected static fail() {
        assert.doesThrow(() => assert.fail('waka waka'), 'waka waka')
    }

    @test()
    protected static isObject() {
        assert.isObject({ test: true })
        assert.doesThrow(() => assert.isObject(true), /not an object/gi)
    }

    @test()
    protected static isLength() {
        assert.isLength([], 0)
        assert.isLength(['test'], 1)
        assert.doesThrow(
            () => assert.isLength(['test'], 4),
            /expected length/gi
        )
        assert.doesThrow(() => assert.isLength(undefined, 4), /undefined/gi)
        assert.doesThrow(() => assert.isLength(null, 4), /null/gi)
    }

    @test()
    protected static isNull() {
        assert.isNull(null)
        assert.doesThrow(() => assert.isNull(false))
        assert.doesThrow(() => assert.isNull(undefined))
    }

    @test()
    protected static isExactType() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const test: 'first' | 'last' | null = null
        assert.isExactType<typeof test, null>(true)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let test2: 'first' | 'last' | undefined
        assert.isExactType<typeof test2, 'first' | 'last' | undefined>(true)
    }

    @test()
    protected static isArray() {
        assert.isArray([])
        assert.doesThrow(() => assert.isArray(true), /is not an array/)

        let couldBeArray: number[] | undefined
        couldBeArray = []

        function test() {
            assert.isArray(couldBeArray)
            assert.isExactType<typeof couldBeArray, number[]>(true)
        }

        test()
    }

    @test()
    protected static isNumber() {
        assert.doesThrow(() => assert.isNumber('test'))
        assert.doesThrow(() => assert.isNumber('1'))
        assert.isNumber(1)
        assert.isNumber(2)
    }

    @test()
    protected static canAssertIstanceOf() {
        class Test {
            public test = true
        }

        class Test2 {
            public test = false
        }

        const test = new Test()
        const test2: any = true
        const test3: any = { hello: 'world' }
        const test4 = new Test2()

        assert.doesThrow(() => assert.isInstanceOf(test2, Test))
        assert.doesThrow(() => assert.isInstanceOf(test3, Test))
        assert.doesThrow(() => assert.isInstanceOf(test4, Test))
        assert.doesThrow(() => assert.isInstanceOf(test, Test2))
        assert.isInstanceOf(test, Test)
        // assert.isInstanceOf(test4, Test)
    }

    @test.skip('Example of pretty print. Remove skip() to see. Always fails.')
    protected static printsNiceDiff() {
        // assert.isEqualDeep(
        // 	{ test: true, taco: 'bell' },
        // 	{ test: false, burger: 'king' }
        // )

        // assert.isFalsy([new Error('yay')])
        assert.isEqual('actual: string one', 'expected: string two')
    }

    @test.skip(
        'Example of pretty print with does include. Remove only() to see. Always fails.'
    )
    protected static printsNiceDiffWithDoesInclude() {
        this.simpleDoesIncludePrettyPrint()

        assert.doesInclude(
            [
                {
                    body: generateId(),
                    classification: 'transactional',
                    source: {
                        isCore: true,
                    },
                    target: {
                        personId: generateId(),
                    },
                },
                {
                    body: generateId(),
                    classification: 'transactional',
                    source: {
                        isCore: true,
                    },
                    target: {
                        personId: generateId(),
                    },
                },
            ],
            {
                target: {
                    address: '+1 555 555 5555',
                    personId: generateId(),
                },
            }
        )
    }

    private static simpleDoesIncludePrettyPrint() {
        assert.doesInclude({ test: true, taco: 'bell' }, { test: false })
    }

    @test()
    protected static async doesThrowMatchIsCaseInsensitive() {
        assert.doesThrow(() => {
            throw new Error('Match on string')
        }, 'on STRING')
    }

    @test()
    protected static async doesNotThrowRegexErrorIfStringNotFound() {
        const err = assert.doesThrow(() => {
            assert.doesInclude('hello', '+1 555 555 5555')
        })

        assert.doesNotInclude(err.message, 'Invalid regular')
    }

    @test()
    protected static async canFindInBetween() {
        assert.doesThrow(() => assert.isBetween(1, 2, 3))
        assert.isBetween(3, 0, 5)
        assert.doesThrow(() => assert.isBetween(3, 0, 3))
        assert.isBetween(4, 3, 5)
    }

    @test()
    protected static async isBetweenInclusive() {
        assert.doesThrow(() => assert.isBetweenInclusive(1, 2, 3))
        assert.isBetweenInclusive(3, 0, 5)
        assert.isBetweenInclusive(1, 1, 1)
        assert.doesThrow(() => assert.isBetweenInclusive(3, 0, 2))
        assert.isBetweenInclusive(4, 3, 4)
        assert.isBetweenInclusive(4, 4, 4)
    }

    @test()
    protected static async doesThrowDoesNotCheckErrorStack() {
        const err = new Error('taco')
        err.stack = 'one two three'

        assert.doesThrow(() => {
            throw err
        }, 'taco')
    }

    @test()
    protected static async doesIncludeThrowsWithExpectedError() {
        const haystack = [{ taco: 'breath' }]
        const needle = [{ burrito: true }]

        assert.doesThrow(
            () =>
                assert.doesInclude(
                    haystack,
                    needle,
                    `Oh no! I checked the map and could not find that pin anywhere! Try 'this.mapVc.addPin(...)'!`
                ),
            'could not find that'
        )
    }
}
