import TestDecoratorResolver, {
    TestLifecycleListeners,
} from './TestDecoratorResolver.js'

if (typeof it === 'undefined') {
    //@ts-ignore
    global.it = () => {}
}

let areLifecycleHooksInPlace = false

/** Hooks up before, after, etc. */
function hookupTestClassToJestLifecycle(Target: any) {
    if (areLifecycleHooksInPlace) {
        return
    }

    areLifecycleHooksInPlace = true
    const hooks = ['beforeAll', 'beforeEach', 'afterAll', 'afterEach']
    hooks.forEach((hook) => {
        // @ts-ignore
        if (global[hook]) {
            // @ts-ignore
            global[hook](async () => {
                TestDecoratorResolver.resolveTestClass(Target)
                if (hook === 'beforeEach') {
                    await TestLifecycleListeners.emitWillRunBeforeEach()
                    await runBeforeEach(Target)
                    await TestLifecycleListeners.emitDidRunBeforeEach()
                } else if (hook === 'afterEach') {
                    await TestLifecycleListeners.emitWillRunAfterEach()
                    await runAfterEach(Target)
                    await TestLifecycleListeners.emitDidRunAfterEach()
                    TestDecoratorResolver.reset()
                } else if (hook === 'beforeAll') {
                    await TestLifecycleListeners.emitWillRunBeforeAll()
                    await runBeforeAll(Target)
                    await TestLifecycleListeners.emitDidRunBeforeAll()
                    TestDecoratorResolver.reset()
                } else if (hook === 'afterAll') {
                    await TestLifecycleListeners.emitWillRunAfterAll()
                    await runAfterAll(Target)
                    await TestLifecycleListeners.emitDidRunAfterAll()
                }
            })
        }
    })
}

async function runBeforeAll(Target: any) {
    await callStaticHook(Target, 'beforeAll')
}

async function runAfterAll(Target: any) {
    await callStaticHook(Target, 'afterAll')
}

async function callStaticHook(Target: any, hook: 'beforeAll' | 'afterAll') {
    const Class =
        TestDecoratorResolver.ActiveTestClass ??
        (typeof Target === 'function' ? Target : Target.constructor)
    const cb = Class?.[hook]
    await cb?.call(Class)
}

async function runAfterEach(Target: any) {
    if (TestDecoratorResolver.ActiveTestClass) {
        const Resolved = TestDecoratorResolver.resolveTestClass(Target)
        await Resolved.afterEach?.apply(Resolved)
    } else if (Target.afterEach) {
        await Target.afterEach?.apply?.(Target)
    } else {
        await Target?.constructor.afterEach?.apply?.(Target.constructor)
    }
}

async function runBeforeEach(Target: any) {
    if (TestDecoratorResolver.ActiveTestClass) {
        const Resolved = TestDecoratorResolver.resolveTestClass(Target)
        await Resolved.beforeEach?.apply(Resolved)
    } else if (Target.beforeEach) {
        await Target.beforeEach?.apply?.(Target)
    } else {
        await Target?.constructor.beforeEach?.apply?.(Target.constructor)
    }
}

/** Test decorator */
export default function test(description?: string, ...args: any[]) {
    return function (
        Target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        hookupTestClassToJestLifecycle(Target)

        it(description ?? propertyKey, async () => {
            const Resolved = TestDecoratorResolver.resolveTestClass(Target)

            if (!Resolved[propertyKey]) {
                throw new Error(
                    `The test '${propertyKey}()' should NOT be static when tests run with suite(). Or, if you are not using suite(), you MUST make your test static.`
                )
            }

            const bound = descriptor.value.bind(Resolved)

            //@ts-ignore
            global.activeTest = {
                file: Target.name,
                test: propertyKey,
            }
            return bound(...args)
        })
    }
}

export function suite() {
    return function (Target: any) {
        TestDecoratorResolver.ActiveTestClass = Target
    }
}

/** Only decorator */
test.only = (description?: string, ...args: any[]) => {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        hookupTestClassToJestLifecycle(target)

        it.only(description ?? propertyKey, async () => {
            const bound = descriptor.value.bind(
                TestDecoratorResolver.resolveTestClass(target)
            )
            return bound(...args)
        })
    }
}

/** Todo decorator */
test.todo = (description?: string, ..._args: any[]) => {
    return function (target: any, propertyKey: string) {
        hookupTestClassToJestLifecycle(target)

        it.todo(description ?? propertyKey)
    }
}

/** Skip decorator */
test.skip = (description?: string, ...args: any[]) => {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        hookupTestClassToJestLifecycle(target)

        it.skip(description ?? propertyKey, async () => {
            const bound = descriptor.value.bind(
                TestDecoratorResolver.resolveTestClass(target)
            )
            return bound(...args)
        })
    }
}
