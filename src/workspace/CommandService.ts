import { spawn, SpawnOptions, ChildProcess } from 'child_process'
import { Writable } from 'stream'

process.setMaxListeners(100)

export default class CommandServiceImpl implements CommandService {
    private cwd: string
    private activeChildProcess: ChildProcess | undefined
    private ignoreCloseErrors = false
    private static fakeResponses: {
        command: string | RegExp
        response: FakedCommandResponse
    }[] = []
    private static commandsRunCapturedByMockResponses: string[] = []

    public constructor(cwd: string) {
        this.cwd = cwd
    }

    public getCwd() {
        return this.cwd
    }

    public setCwd(cwd: string) {
        this.cwd = cwd
    }

    public async execute(
        cmd: string,
        options?: ExecuteCommandOptions
    ): Promise<{
        stdout: string
    }> {
        const cwd = this.cwd
        const args = options?.args || this.parseArgv(cmd)
        const executable = options?.args ? cmd : args.shift()
        const boundKill = this.kill.bind(this)

        if (!executable) {
            throw new Error('Bad params sent to command service')
        }

        const { mockResponse, mockKey } = this.getMockResponse(executable, args)

        if (mockResponse) {
            CommandServiceImpl.commandsRunCapturedByMockResponses.push(mockKey)
            mockResponse.callback?.(executable, args)

            if (mockResponse.code !== 0) {
                throw new Error(
                    `Command failed: ${executable} ${args.join(' ')}`
                )
            }

            return { stdout: mockResponse.stdout ?? '' }
        }

        process.on('exit', boundKill)

        return new Promise((resolve, reject) => {
            let stdout = ''
            let stderr = ''
            const spawnOptions: SpawnOptions = options?.shouldStream
                ? {
                      stdio: 'inherit',
                      cwd,
                      env: {
                          PATH: process.env.PATH,
                          IS_CLI: 'true',
                          FORCE_COLOR: options?.forceColor ? '1' : '0',
                          ...options?.env,
                      },
                  }
                : {
                      cwd,
                      env: {
                          PATH: process.env.PATH,
                          IS_CLI: 'true',
                          FORCE_COLOR: options?.forceColor ? '1' : '0',
                          ...options?.env,
                      },
                      shell: true,
                      ...options?.spawnOptions,
                  }

            let child: ChildProcess
            if (spawnOptions.shell) {
                const commandStr = options?.args
                    ? [executable, ...args].join(' ')
                    : cmd
                child = spawn(commandStr, spawnOptions)
            } else {
                child = spawn(executable, args, spawnOptions)
            }
            this.activeChildProcess = child

            if (options?.outStream) {
                child.stdout?.pipe(options.outStream)
            }

            child.stdout?.addListener('data', (data) => {
                options?.onData?.(data.toString())
                stdout += data
            })

            child.stderr?.addListener('data', (data) => {
                options?.onError?.(data.toString())
                stderr += data
            })

            const closeHandler = (code: number) => {
                process.off('exit', boundKill)

                if (!this.activeChildProcess) {
                    return
                }
                this.activeChildProcess = undefined

                setTimeout(() => {
                    child.stdout?.removeAllListeners()
                    child.stderr?.removeAllListeners()
                    child.removeAllListeners()

                    if (
                        code === 0 ||
                        this.ignoreCloseErrors ||
                        options?.ignoreErrors
                    ) {
                        resolve({ stdout })
                        this.ignoreCloseErrors = false
                    } else {
                        reject(
                            new Error(
                                `Command failed (exit ${code}): ${executable} ${args.join(' ')}\n${stderr}`
                            )
                        )
                    }
                }, 0)
            }

            child.addListener('close', closeHandler)
            child.addListener('exit', closeHandler)
        })
    }

    private parseArgv(cmd: string): string[] {
        const result: string[] = []
        let current = ''
        let inQuote = false
        let quoteChar = ''

        for (let i = 0; i < cmd.length; i++) {
            const ch = cmd[i]
            if (inQuote) {
                if (ch === quoteChar) {
                    inQuote = false
                } else {
                    current += ch
                }
            } else if (ch === '"' || ch === "'") {
                inQuote = true
                quoteChar = ch
            } else if (ch === ' ') {
                if (current.length > 0) {
                    result.push(current)
                    current = ''
                }
            } else {
                current += ch
            }
        }
        if (current.length > 0) {
            result.push(current)
        }
        return result
    }

    public kill = () => {
        const child = this.activeChildProcess
        if (child?.pid) {
            this.ignoreCloseErrors = true
            try {
                process.kill(-child.pid, 'SIGTERM')
            } catch {
                try {
                    child.kill('SIGTERM')
                } catch {
                }
            }
        }
    }

    public pid = () => {
        return this.activeChildProcess?.pid
    }

    private getMockResponse(executable: string, args: string[]) {
        const mockKey = `${executable} ${args.join(' ')}`.trim()
        const commands = CommandServiceImpl.fakeResponses
        const match = commands.find((r) =>
            r.command instanceof RegExp
                ? mockKey.search(r.command) > -1
                : r.command.replace(/ +/gis, '') ===
                  mockKey.replace(/ +/gis, '')
        )

        return { mockResponse: match?.response, mockKey }
    }

    public static fakeCommand(
        command: string | RegExp,
        response: FakedCommandResponse
    ) {
        this.fakeResponses.unshift({
            command,
            response,
        })
    }

    public static clearFakedResponses() {
        this.fakeResponses = []
    }
}

export type FakedCommandCallback = (executable: string, args: any[]) => void

interface FakedCommandResponse {
    code: number
    stdout?: string
    stderr?: string
    callback?: FakedCommandCallback
}

export interface CommandService {
    execute(
        cmd: string,
        options?: ExecuteCommandOptions
    ): Promise<{
        stdout: string
    }>
    getCwd(): string
    setCwd(cwd: string): void
    kill(): void
    pid(): number | undefined
}

export interface ExecuteCommandOptions {
    ignoreErrors?: boolean
    args?: string[]
    shouldStream?: boolean
    outStream?: Writable
    onError?: (error: string) => void
    onData?: (data: string) => void
    spawnOptions?: SpawnOptions
    forceColor?: boolean
    env?: Record<string, any>
}
