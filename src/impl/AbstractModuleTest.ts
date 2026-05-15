import path from 'path'

import generateId from '@neurodevs/generate-id'

export default class AbstractModuleTest {
    protected static cwd: string

    protected static async beforeAll() {
        this.cwd = process.cwd()
    }

    protected static async afterAll() {}
    protected static async beforeEach() {}
    protected static async afterEach() {}

    protected static generateId(includeDashes?: boolean) {
        return generateId(includeDashes)
    }

    protected static async wait(ms = 1) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(true), ms)
        })
    }

    protected static log(...args: any[]) {
        const str = args.map((a) => `${a}`).join(' ')
        process.stderr.write(str)
    }

    protected static resolvePath(...filePath: string[]) {
        let builtPath = path.join(...filePath)

        if (builtPath[0] !== '/') {
            if (builtPath.slice(0, 2) === './') {
                builtPath = builtPath.slice(1)
            }

            builtPath = path.join(this.cwd, builtPath)
        }

        return builtPath
    }

    protected cwd = process.cwd()

    protected async beforeAll() {}
    protected async afterAll() {}
    protected async beforeEach() {}
    protected async afterEach() {}

    protected generateId(includeDashes?: boolean) {
        return AbstractModuleTest.generateId(includeDashes)
    }

    protected wait(ms = 1) {
        return AbstractModuleTest.wait(ms)
    }

    protected log(...args: any[]) {
        AbstractModuleTest.log(...args)
    }

    protected resolvePath(...filePath: string[]) {
        return AbstractModuleTest.resolvePath(...filePath)
    }
}
