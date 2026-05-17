import chalk from 'chalk'

import assert from '../../utilities/assert.js'
import test from '../../utilities/decorators.js'
import assertUtil, {
    CIRCULAR_PLACEHOLDER,
    FUNCTION_PLACEHOLDER,
    NULL_PLACEHOLDER,
    UNDEFINED_PLACEHOLDER,
} from '../../utilities/assert.utility.js'

const teammate = {
    firstName: 'tay',
}

const team: Record<string, any> = {
    teammate: { ...teammate },
}

team.teammate.team = team

const team2 = {
    teammate,
    teammate2: teammate,
}

const team3 = {
    teammate: {
        ...teammate,
        age: 100,
    },
    coach: {
        name: {
            firstName: 'tay',
            age: 100,
        },
    },
}

export default class StringifyTest {
    @test('placeholdering simple object', { test: true }, { test: true })
    @test(
        'placeholdering object with null',
        { test: null },
        { test: NULL_PLACEHOLDER }
    )
    @test(
        'placeholdering object with function',
        { test: () => {} },
        { test: FUNCTION_PLACEHOLDER }
    )
    @test('placeholdering circular object', team, {
        teammate: {
            firstName: 'tay',
            team: CIRCULAR_PLACEHOLDER,
        },
    })
    @test('placeholdering same object on same level', team2, {
        teammate: {
            firstName: 'tay',
        },
        teammate2: {
            firstName: 'tay',
        },
    })
    @test(
        'placeholdering objects with same values at different levels',
        team3,
        {
            teammate: {
                firstName: 'tay',
                age: 100,
            },
            coach: {
                name: {
                    firstName: 'tay',
                    age: 100,
                },
            },
        }
    )
    protected static dropInPlaceholders(obj: any, expected: any) {
        const placholder = assertUtil.dropInPlaceholders(obj)
        assert.isEqualDeep(placholder, expected)
    }

    @test(
        'one level deep (undefined)',
        {
            hello: 'world',
            undefined,
        },
        `{
  "hello": "world",
  "undefined": "${UNDEFINED_PLACEHOLDER}"
}`
    )
    @test(
        'one level deep (null)',
        {
            hello: 'world',
            null: null,
        },
        `{
  "hello": "world",
  "null": "${NULL_PLACEHOLDER}"
}`
    )
    @test(
        'two levels deep',
        {
            hello: 'world',
            undefinedDeep: {
                undefined,
            },
        },
        `{
  "hello": "world",
  "undefinedDeep": {
    "undefined": "${UNDEFINED_PLACEHOLDER}"
  }
}`
    )
    @test(
        'three levels deep',
        {
            hello: 'world',
            undefinedDeep: {
                undefinedDeepAgain: {
                    undefined,
                },
            },
        },
        `{
  "hello": "world",
  "undefinedDeep": {
    "undefinedDeepAgain": {
      "undefined": "${UNDEFINED_PLACEHOLDER}"
    }
  }
}`
    )
    @test(
        'prints a function nicely',
        { hello: () => {} },
        `{
  "hello": "${FUNCTION_PLACEHOLDER}"
}`
    )
    protected static printsPlaceholderFields(
        obj: Record<string, any>,
        expected: string
    ) {
        const stringified = assertUtil.stringify(obj)

        assert.isEqual(
            stringified,
            chalk.bold(assertUtil.replacePlaceholders(expected))
        )
    }

    @test.skip('array looks good', ['hello', 'world'])
    @test.skip('objects looks good', { hello: 'world' })
    protected static canRenderWithoutStrippingCharactorsInTestReporter(
        obj: any
    ) {
        process.stderr.write(assertUtil.stringify(obj))
    }
}
