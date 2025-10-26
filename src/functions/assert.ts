const assert: Assert = {
    isTrue(value: boolean): asserts value {
        if (value !== true) {
            throw new Error('Expected true but got false.')
        }
    },
}

export default assert

export interface Assert {
    isTrue(value: boolean): asserts value
}
