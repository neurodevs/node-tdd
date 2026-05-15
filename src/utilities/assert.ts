import chalk from 'chalk'
import deepEqual from 'deep-equal'
import { printDiffOrStringify } from 'jest-matcher-utils'
import { escapeRegExp, isObjectLike, cloneDeep, set } from 'lodash-es'
import { expectType } from 'ts-expect'
import diff from 'variable-diff'
import assertUtil from './assert.utility.js'
export * from './assert.utility.js'

const stringify = assertUtil.stringify.bind(assertUtil)

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? RecursivePartial<U>[]
        : T[P] extends object
          ? RecursivePartial<T[P]>
          : T[P]
}

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
type IsAny<T> = IfAny<T, true, never>

type TypeEqual<T, U> =
    IsAny<T> extends never
        ? Exclude<T, U> extends never
            ? Exclude<U, T> extends never
                ? true
                : false
            : false
        : false

export function isExactType<T, E, Pass = TypeEqual<T, E>>(_: Pass) {}

export interface Assert {
    isInstanceOf<T>(
        test: T,
        Test: new (...props: any[]) => T,
        message?: string
    ): void
    isNumber(actual: any, message?: string): asserts actual is number
    isType: typeof expectType
    isExactType: typeof isExactType
    isArray<T extends any[]>(actual: any, message?: string): asserts actual is T
    areSameType<T>(actual: T, expected: T): asserts actual is T
    isEqual<T>(actual: T, expected: T, message?: string): asserts actual is T
    isNotEqual<T>(actual: T, expected: T, message?: string): asserts actual is T
    isEqualDeep<T>(
        actual: T,
        expected: T,
        message?: string,
        shouldAppendDelta?: boolean
    ): asserts actual is T
    isNotEqualDeep<T>(actual: T, expected: T, message?: string): void
    isAbove<T>(actual: T, floor: T, message?: string): void
    isBelow<T>(actual: T, ceiling: T, message?: string): void
    isUndefined<T>(actual: T, message?: string): void
    isTruthy<T = any>(
        value: T,
        message?: string
    ): asserts value is NonNullable<T>
    isFalsy(value: any, message?: string): void
    isTrue(
        actual: boolean | undefined | null,
        message?: string
    ): asserts actual is true
    isFalse(
        actual: boolean | undefined | null,
        message?: string
    ): asserts actual is false
    isObject<T>(actual: T, message?: string): void
    isLength(
        actual: any[] | undefined | null,
        expected: number,
        message?: string
    ): void
    isNull(actual: any, message?: string): void
    doesNotInclude<T>(
        haystack: T,
        needle: RecursivePartial<T>,
        message?: string
    ): void

    doesNotInclude(haystack: string, needle: string, message?: string): void
    doesNotInclude(haystack: any, needle: string, message?: string): void
    doesNotInclude(haystack: any, needle: any, message?: string): void

    doesInclude<T>(
        haystack: T,
        needle: RecursivePartial<T>,
        message?: string
    ): void

    doesInclude(haystack: string, needle: string, message?: string): void
    doesInclude(haystack: any, needle: string, message?: string): void
    doesInclude(haystack: any, needle: any, message?: string): void

    isString(actual: any, message?: string): asserts actual is string

    isFunction(actual: any, message?: string): asserts actual is Function
    hasAllFunctions(obj: any, functionNames: string[]): void
    doesThrow(
        cb: () => any,
        matcher?: string | RegExp | undefined,
        msg?: string | undefined
    ): Error
    doesThrowAsync(
        cb: () => any | Promise<any>,
        matcher?: string | RegExp | undefined,
        msg?: string | undefined
    ): Promise<Error>
    fail(message?: string): void
    isBetween(
        actual: any,
        floor: number,
        ceiling: number,
        message?: string
    ): asserts actual is number

    isBetweenInclusive(
        actual: any,
        floor: number,
        ceiling: number,
        message?: string
    ): asserts actual is number
}

const assert: Assert = {
    areSameType() {},

    isType: expectType,

    isExactType,

    isNumber(actual, message) {
        if (typeof actual !== 'number') {
            this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not a number!`,
                    message
                )
            )
        }
    },

    isEqual(actual, expected, message) {
        if (actual !== expected) {
            const diff = printDiffOrStringify(
                expected,
                actual,
                'Expected',
                'Actual',
                false
            )
            this.fail(buildErrorMessage(`${diff}`, message))
        }
    },

    isNotEqual(actual, expected, message) {
        if (actual === expected) {
            this.fail(
                buildErrorMessage(
                    `${stringify(actual)}\n\n should not equal ${stringify(expected)}\n\n`,
                    message
                )
            )
        }
    },

    isEqualDeep(actual, expected, message, shouldAppendDelta = true) {
        if (!deepEqual(actual, expected, { strict: true })) {
            let result = diff(actual, expected)
            this.fail(
                buildErrorMessage(
                    `${`Deep equal failed.\n\nActual would need the following changes to match expected:`}${shouldAppendDelta ? `\n\n${result.text}` : ``}`,
                    message
                )
            )
        }
    },

    isNotEqualDeep(actual, expected, message) {
        this.doesThrow(
            () => this.isEqualDeep(actual, expected),
            undefined,
            buildErrorMessage(
                `The objects you passed are deep equal! They should not be!`,
                message
            )
        )
    },

    isAbove(actual, floor, message) {
        if (typeof actual !== 'number') {
            this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not a number!`,
                    message
                )
            )
        }
        if (actual <= floor) {
            this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not above ${stringify(floor)}`,
                    message
                )
            )
        }
    },

    isBelow(actual, ceiling, message) {
        if (typeof actual !== 'number') {
            this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not a number!`,
                    message
                )
            )
        }

        if (actual >= ceiling) {
            this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not below ${stringify(ceiling)}`,
                    message
                )
            )
        }
    },

    isUndefined(actual, message) {
        if (typeof actual !== 'undefined') {
            this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not undefined`,
                    message
                )
            )
        }
    },

    isTruthy(actual: any, message) {
        if (
            actual === false ||
            actual === null ||
            typeof actual === 'undefined' ||
            actual === 0
        ) {
            this.fail(
                buildErrorMessage(`${stringify(actual)} is not truthy`, message)
            )
        }
    },

    isFalsy(actual, message) {
        if (actual) {
            this.fail(
                buildErrorMessage(`${stringify(actual)} is not falsy`, message)
            )
        }
    },

    isNull(actual: any, message?) {
        if (actual !== null) {
            this.fail(
                buildErrorMessage(`${stringify(actual)} is not null`, message)
            )
        }
    },

    isString(actual, message) {
        assertUtil.assertTypeof(actual, 'string', message)
    },

    isFunction(actual, message) {
        assertUtil.assertTypeof(actual, 'function', message)
    },

    isTrue(actual, message) {
        //@ts-ignore
        this.isEqual(actual, true, message)
    },

    isFalse(actual, message) {
        //@ts-ignore
        this.isEqual(actual, false, message)
    },

    isObject(actual, message) {
        if (!isObjectLike(actual)) {
            throw this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not an object`,
                    message
                )
            )
        }
    },

    isArray(actual, message) {
        if (!Array.isArray(actual)) {
            throw this.fail(
                buildErrorMessage(
                    `${stringify(actual)} is not an array`,
                    message
                )
            )
        }
    },

    isLength(actual, expected, message) {
        if (!actual) {
            throw this.fail(
                buildErrorMessage(
                    `Expected array of length ${expected}, but got ${stringify(actual)}`,
                    message
                )
            )
        }

        //@ts-ignore
        this.isEqual(
            actual.length,
            expected,
            buildErrorMessage(`Your array is not the expected length!`, message)
        )
    },

    doesNotInclude(haystack: any, needle: any, message?: string) {
        let doesInclude = false
        try {
            this.doesInclude(haystack, needle, message)
            doesInclude = true
        } catch {
            doesInclude = false
        }

        if (doesInclude) {
            this.fail(
                buildErrorMessage(
                    `${stringify(haystack)} should not include ${stringify(
                        needle
                    )}, but it does`,
                    message
                )
            )
        }
    },

    doesInclude(haystack: any, needle: any, message?: string) {
        let msg = `Could not find \n\n${stringify(needle)}\n\n in \n\n${stringify(haystack)}\n\n`

        const isNeedleString = typeof needle === 'string'
        const isNeedleRegex = needle instanceof RegExp

        if (
            typeof haystack === 'string' &&
            (isNeedleString || isNeedleRegex) &&
            haystack.search(isNeedleString ? escapeRegExp(needle) : needle) > -1
        ) {
            return
        }

        const isHaystackObject = isObjectLike(haystack)
        const { needleHasArrayNotation, path, expected } =
            assertUtil.parseIncludeNeedle(needle)

        if (Array.isArray(haystack)) {
            let cleanedNeedle = needle

            if (path && path.substr(0, 3) === '[].') {
                cleanedNeedle = { [path.substr(3)]: expected }
            }

            const found = assertUtil.doHaystacksPassCheck(
                haystack,
                cleanedNeedle,
                this.doesInclude.bind(this)
            )

            if (found) {
                return
            }
        }

        if (isHaystackObject && isObjectLike(needle)) {
            try {
                //@ts-ignore
                this.isEqualDeep(haystack, needle, message)
                return
            } catch {}
        }

        if (
            assertUtil.foundUsing3rdPartyIncludes(
                haystack,
                needle,
                isHaystackObject
            )
        ) {
            return
        }

        if (
            !Array.isArray(haystack) &&
            isHaystackObject &&
            isObjectLike(needle) &&
            Object.keys(needle).length === 1 &&
            !needleHasArrayNotation &&
            path
        ) {
            const actual = assertUtil.valueAtPath(haystack, path)

            if (typeof actual === 'undefined') {
                msg = `The path ${stringify(path)} was not found in ${stringify(
                    haystack
                )}`
            } else {
                // msg = `Expected:\n\n${chalk.green(
                //     stringify(actual)
                // )}\n\nbut found:\n\n${chalk.red(stringify(actual))}\n\nat key:\n\n${stringify(
                //     path
                // )}\n\nin:\n\n${stringify(haystack)}`

                msg = `Expected:\n\n${chalk.green(
                    stringify(needle[path])
                )}\n\nbut found:\n\n${chalk.red(stringify(actual))}\n\nat key:\n\n${stringify(
                    path
                )}`

                let clonedHaystack = cloneDeep(haystack)
                clonedHaystack = set(
                    clonedHaystack,
                    path,
                    `${actual} -> ${expected}`
                )
                msg += `\n\nHere is the change:\n\n${stringify(clonedHaystack)}`
            }

            if (
                typeof expected === 'string' &&
                typeof actual === 'string' &&
                actual.search(expected) > -1
            ) {
                return
            } else if (expected instanceof RegExp && expected.exec(actual)) {
                return
            } else {
                //@ts-ignore
                this.isEqualDeep(
                    expected,
                    actual,
                    buildErrorMessage(msg, message),
                    false
                )
            }

            return
        }

        if (isHaystackObject && isObjectLike(needle) && path) {
            const { actualBeforeArray, pathAfterFirstArray } =
                assertUtil.splitPathBasedOnArrayNotation(path, haystack)

            if (!Array.isArray(actualBeforeArray)) {
                this.fail(buildErrorMessage(msg, message))
            }

            const found = assertUtil.doHaystacksPassCheck(
                actualBeforeArray,
                {
                    [pathAfterFirstArray]: expected,
                },
                this.doesInclude.bind(this)
            )

            if (found) {
                return
            }

            msg = `Could not find match ${stringify(expected)} at ${stringify(
                pathAfterFirstArray
            )} in ${stringify(actualBeforeArray)}.`
        }

        this.fail(buildErrorMessage(msg, message))
    },

    hasAllFunctions(obj, functionNames, message?: string) {
        functionNames.forEach((name) => {
            if (typeof obj[name] !== 'function') {
                this.fail(
                    buildErrorMessage(
                        `A function named "${name}" does not exist on ${stringify(obj)}`,
                        message
                    )
                )
            }
        })
    },

    doesThrow(cb, matcher, msg) {
        try {
            cb()
        } catch (err: any) {
            assertUtil.assertErrorIncludes(matcher, err, msg)
            return err
        }

        this.fail(
            buildErrorMessage(
                'Expected a thrown error, but never got one!',
                msg
            )
        )
    },

    async doesThrowAsync(cb, matcher, msg) {
        try {
            await cb()
        } catch (err: any) {
            assertUtil.assertErrorIncludes(matcher, err, msg)

            return err
        }

        this.fail(
            buildErrorMessage(
                'Expected a thrown error, but never got one!',
                msg
            )
        )
    },

    fail: assertUtil.fail,
    isInstanceOf<T>(
        actual: T,
        Class: new (...props: any[]) => T,
        message?: string
    ): void {
        assert.isTrue(
            actual instanceof Class,
            buildErrorMessage(
                `${assertUtil.stringify(actual)} is not an instance of:\n\n${Class}`,
                message
            )
        )
    },

    isBetween(actual, floor, ceiling, message) {
        assert.isBelow(actual, ceiling, message)
        assert.isAbove(actual, floor, message)
    },

    isBetweenInclusive(actual, floor, ceiling, message) {
        //@ts-ignore
        this.isNumber(actual, message)

        if (actual >= floor && actual <= ceiling) {
            return
        }

        assert.fail(
            buildErrorMessage(
                `${actual} is not between ${floor} and ${ceiling} (inclusive)`,
                message
            )
        )
    },
}

export default assert

function buildErrorMessage(
    defaultMessage: string,
    customMessage: string | undefined
) {
    return (
        (customMessage
            ? `${customMessage}\n\n${defaultMessage}`
            : defaultMessage) + '\n\n'
    )
}
