export default class TestDecoratorResolver {
    public static ActiveTestClass?: any
    private static __activeTest: any

    public static resolveTestClass(target: any) {
        if (!this.__activeTest) {
            this.__activeTest = this.ActiveTestClass
                ? new this.ActiveTestClass()
                : target
        }

        return this.__activeTest
    }

    public static getActiveTest() {
        return this.__activeTest
    }

    public static reset() {
        delete this.__activeTest
    }

    public static onWillCallBeforeAll(cb: TestLifecycleListener) {
        TestLifecycleListeners.willBeforeAllListeners.push(cb)
    }

    public static onDidCallBeforeAll(cb: TestLifecycleListener) {
        TestLifecycleListeners.didBeforeAllListeners.push(cb)
    }

    public static onWillCallBeforeEach(cb: TestLifecycleListener) {
        TestLifecycleListeners.willBeforeEachListeners.push(cb)
    }

    public static onDidCallBeforeEach(cb: TestLifecycleListener) {
        TestLifecycleListeners.didBeforeEachListeners.push(cb)
    }

    public static onWillCallAfterEach(cb: TestLifecycleListener) {
        TestLifecycleListeners.willAfterEachListeners.push(cb)
    }

    public static onDidCallAfterEach(cb: TestLifecycleListener) {
        TestLifecycleListeners.didAfterEachListeners.push(cb)
    }

    public static onWillCallAfterAll(cb: TestLifecycleListener) {
        TestLifecycleListeners.willAfterAllListeners.push(cb)
    }

    public static onDidCallAfterAll(cb: TestLifecycleListener) {
        TestLifecycleListeners.didAfterAllListeners.push(cb)
    }
}

type TestLifecycleListener = (Test: any) => any | Promise<any>

export class TestLifecycleListeners {
    public static willBeforeAllListeners: TestLifecycleListener[] = []
    public static didBeforeAllListeners: TestLifecycleListener[] = []

    public static willBeforeEachListeners: TestLifecycleListener[] = []
    public static didBeforeEachListeners: TestLifecycleListener[] = []

    public static willAfterEachListeners: TestLifecycleListener[] = []
    public static didAfterEachListeners: TestLifecycleListener[] = []

    public static willAfterAllListeners: TestLifecycleListener[] = []
    public static didAfterAllListeners: TestLifecycleListener[] = []

    public static async emitWillRunBeforeAll() {
        for (const cb of this.willBeforeAllListeners) {
            await cb(TestDecoratorResolver.getActiveTest().constructor)
        }
    }

    public static async emitDidRunBeforeAll() {
        for (const cb of this.didBeforeAllListeners) {
            await cb(TestDecoratorResolver.getActiveTest().constructor)
        }
    }

    public static async emitWillRunBeforeEach() {
        for (const cb of this.willBeforeEachListeners) {
            await cb(TestDecoratorResolver.getActiveTest())
        }
    }

    public static async emitDidRunBeforeEach() {
        for (const cb of this.didBeforeEachListeners) {
            await cb(TestDecoratorResolver.getActiveTest())
        }
    }

    public static async emitWillRunAfterEach() {
        for (const cb of this.willAfterEachListeners) {
            await cb(TestDecoratorResolver.getActiveTest())
        }
    }

    public static async emitDidRunAfterEach() {
        for (const cb of this.didAfterEachListeners) {
            await cb(TestDecoratorResolver.getActiveTest())
        }
    }

    public static async emitWillRunAfterAll() {
        for (const cb of this.willAfterAllListeners) {
            await cb(TestDecoratorResolver.getActiveTest().constructor)
        }
    }

    public static async emitDidRunAfterAll() {
        for (const cb of this.didAfterAllListeners) {
            await cb(TestDecoratorResolver.getActiveTest().constructor)
        }
    }
}
