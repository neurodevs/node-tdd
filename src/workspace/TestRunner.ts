import fs from 'fs'
import pathUtil from 'path'
import { EventEmitter } from 'events'
import CommandServiceImpl from './CommandService.js'
import JestJsonParser from './JestJsonParser.js'
import { TestResults } from './test.types.js'

export default class TestRunner extends EventEmitter {
    private cwd: string
    private commandService: CommandServiceImpl
    private wasKilled = false
    private testResults: TestResults = { totalTestFiles: 0 }

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
        const command = `node --experimental-vm-modules --unhandled-rejections=strict ${debugArgs} ${jestPath} --reporters="@sprucelabs/jest-json-reporter" --testRunner="jest-circus/runner" --passWithNoTests ${
            pattern ? escapeShell(pattern) : ''
        }`

        const parser = new JestJsonParser()

        this.testResults = {
            totalTestFiles: 0,
        }

        try {
            await this.commandService.execute(command, {
                forceColor: true,
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
                        this.emit('did-update', { results: this.testResults })
                    } catch (err) {
                        this.emit('did-error', {
                            message: `Parser error: ${err}`,
                        })
                    }
                },
            })
        } catch (err) {
            if (!this.testResults.totalTestFiles) {
                throw err
            }
        }

        return { ...this.testResults, wasKilled: this.wasKilled }
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
