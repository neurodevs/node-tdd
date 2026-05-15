import StackCleaner from './StackCleaner.js'

export default class AssertionError extends Error {
    public constructor(message: string, stack?: string) {
        super(message)
        this.message = message
        this.stack =
            this.message +
            '\n' +
            StackCleaner.clean(
                `${(stack ?? this.stack ?? '').replace(message, '')}`
            )
    }
}
