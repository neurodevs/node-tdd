import fs from 'node:fs'
import pathUtil from 'node:path'
import { EventEmitter } from 'node:events'

import CommandServiceImpl from './CommandService.js'
import JestJsonParser from './JestJsonParser.js'
import { TestResults } from './test.types.js'

export default class TestRunner extends EventEmitter {
    public static updateThrottleMs = 50

    private cwd: string
    private commandService: CommandServiceImpl
    private wasKilled = false
    private testResults: TestResults = { totalTestFiles: 0 }
    private pendingUpdate?: ReturnType<typeof setTimeout>

    public constructor(options: {
        cwd: string
        commandService: CommandServiceImpl
    }) {
        super()
        this.cwd = options.cwd
        this.commandService = options.commandService
    }

    public async run(options?: {
        pattern?: string | null
        debugPort?: number | null
    }): Promise<TestResults & { wasKilled: boolean }> {
        this.wasKilled = false

        const jestPath = this.resolvePathToJest()
        const debugArgs =
            (options?.debugPort ?? 0) > 0
                ? `--inspect=${options?.debugPort}`
                : ``
        const pattern = options?.pattern ?? ''
        const escapeShell = function (cmd: string) {
            return (
                '--testPathPatterns="' +
                cmd.replace(/(["\s'$`\\])/g, '\\$1') +
                '"'
            )
        }
        const reporterPath = pathUtil.resolve(
            pathUtil.dirname(new URL(import.meta.url).pathname),
            '../jest-json-reporter/JsonReporter.js'
        )
        const command = `node --experimental-vm-modules --unhandled-rejections=strict ${debugArgs} ${jestPath} --reporters="${reporterPath}" --testRunner="jest-circus/runner" --passWithNoTests ${
            pattern ? escapeShell(pattern) : ''
        }`

        const parser = new JestJsonParser()

        this.testResults = {
            totalTestFiles: 0,
        }

        try {
            await this.commandService.execute(command, {
                forceColor: true,
                env: { NODE_NO_WARNINGS: '1' },
                onError: async (data) => {
                    const isDebugMessaging = this.isDebugMessage(data)

                    if (!isDebugMessaging) {
                        this.emit('did-error', { message: data })
                    }
                },
                onData: async (data) => {
                    try {
                        parser.write(data)
                        this.testResults = parser.getResults()
                        this.scheduleDidUpdate()
                    } catch (err) {
                        this.emit('did-error', {
                            message: `Parser error: ${err}`,
                        })
                    }
                },
            })
        } catch (err) {
            if (!this.testResults.totalTestFiles) {
                this.flushDidUpdate()
                throw err
            }
        }

        this.flushDidUpdate()

        return { ...this.testResults, wasKilled: this.wasKilled }
    }

    // Redrawing on every chunk starves the child's stdout pipe, which can keep
    // jest alive past its open handles timeout. Coalesce redraws instead so the
    // pipe stays drained.
    private scheduleDidUpdate() {
        if (this.pendingUpdate) {
            return
        }

        this.pendingUpdate = setTimeout(() => {
            this.pendingUpdate = undefined
            this.emit('did-update', { results: this.testResults })
        }, TestRunner.updateThrottleMs)
    }

    private flushDidUpdate() {
        clearTimeout(this.pendingUpdate)
        this.pendingUpdate = undefined
        this.emit('did-update', { results: this.testResults })
    }

    private isDebugMessage(data: string) {
        return (
            data.search(/^ attached/i) === 0 ||
            data.search(/^ listening/i) === 0 ||
            data.search(/^waiting for the /i) === 0
        )
    }

    public hasFailedTests() {
        return (this.testResults.totalFailed ?? 0) > 0
    }

    public hasSkippedTests() {
        return (this.testResults.totalSkipped ?? 0) > 0
    }

    public kill() {
        this.wasKilled = true
        this.commandService.kill()
    }

    private resolvePathToJest() {
        const jestBin = pathUtil.join('node_modules', '.bin', 'jest')
        const fullCwd = pathUtil.resolve(this.cwd)
        const pathParts = fullCwd.split(pathUtil.sep).filter(Boolean)

        while (pathParts.length > 0) {
            const candidate =
                pathUtil.sep +
                pathUtil.join(...pathParts) +
                pathUtil.sep +
                jestBin

            if (fs.existsSync(candidate)) {
                return candidate
            }

            pathParts.pop()
        }

        throw new Error(
            `Could not find jest binary. Make sure jest is installed in ${this.cwd}`
        )
    }
}
