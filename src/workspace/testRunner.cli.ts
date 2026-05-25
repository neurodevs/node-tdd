import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import chokidar from 'chokidar'

import CommandServiceImpl from './CommandService.js'
import TestReporter from './TestReporter.js'
import TestRunner from './TestRunner.js'

const args = process.argv.slice(2)
const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : undefined
}
const has = (flag: string) => args.includes(flag)

const pattern = get('--pattern') ?? null
const watchMode = (get('--watchMode') ?? 'off') as 'off' | 'standard' | 'smart'
const cwd = process.cwd()

let currentPattern = pattern
let currentWatchMode = watchMode
let runner: TestRunner | null = null
let running = false

const reporter = new TestReporter({
    cwd,
    filterPattern: pattern ?? undefined,
    watchMode,
    status: has('--shouldHoldAtStart') ? 'stopped' : 'ready',
    handleStartStop: () => {
        if (running) {
            runner?.kill()
        } else {
            runTests()
        }
    },
    handleRestart: () => {
        runner?.kill()
        setTimeout(runTests, 100)
    },
    handleQuit: () => {
        runner?.kill()
        process.exit(0)
    },
    handleFilterPatternChange: (p?: string) => {
        currentPattern = p ?? null
        if (running) {
            runner?.kill()
            setTimeout(runTests, 100)
        } else {
            runTests()
        }
    },
    handletoggleStandardWatch: () => {
        currentWatchMode = currentWatchMode === 'standard' ? 'off' : 'standard'
        reporter.setWatchMode(currentWatchMode)
    },
    handleToggleSmartWatch: () => {
        currentWatchMode = currentWatchMode === 'smart' ? 'off' : 'smart'
        reporter.setWatchMode(currentWatchMode)
    },
    handleOpenTestFile: (filePath: string, testName?: string) => {
        const fullPath = path.isAbsolute(filePath)
            ? filePath
            : path.join(cwd, 'src', '__tests__', filePath)

        let resolvedLine = -1

        if (testName) {
            try {
                const contents = readFileSync(fullPath, 'utf8')
                const lines = contents.split('\n')
                const idx = lines.findIndex((l) => l.includes(testName))

                if (idx !== -1) {
                    resolvedLine = idx + 1
                }
            } catch {
                // if file can't be read, just open without a line
            }
        }

        const target =
            resolvedLine !== -1 ? `${fullPath}:${resolvedLine}` : fullPath

        spawn('code', ['--goto', target], {
            detached: true,
            stdio: 'ignore',
        }).unref()
    },
})

async function runTests() {
    if (running) {
        return
    }
    running = true

    try {
        reporter.setStatus('running')
    } catch (err) {
        running = false
        reporter.appendError(`setStatus error: ${err}`)
        return
    }

    const commandSvc = new CommandServiceImpl(cwd)
    runner = new TestRunner({ cwd, commandService: commandSvc })

    runner.on('did-update', ({ results }) => {
        try {
            reporter.updateResults(results)
        } catch (err) {
            reporter.appendError(`updateResults error: ${err}`)
        }
    })

    runner.on('did-error', ({ message }) => {
        reporter.appendError(message)
    })

    try {
        await runner.run({
            pattern: currentPattern,
            debugPort: null,
        })
    } catch (err) {
        reporter.appendError(`Test run failed: ${err}`)
    } finally {
        running = false
        reporter.setStatus('stopped')
    }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRerun(changedFile?: string) {
    if (debounceTimer) {
        clearTimeout(debounceTimer)
    }

    if (currentWatchMode === 'smart' && changedFile) {
        const rel = path.relative(cwd, changedFile)
        const base = path.basename(rel, path.extname(rel))
        reporter.startCountdownTimer(2)
        debounceTimer = setTimeout(() => {
            currentPattern = base
            reporter.setFilterPattern(base)
            runner?.kill()
            setTimeout(runTests, 100)
        }, 2000)
    } else if (currentWatchMode === 'standard') {
        reporter.startCountdownTimer(2)
        debounceTimer = setTimeout(() => {
            runner?.kill()
            setTimeout(runTests, 100)
        }, 2000)
    }
}

async function main() {
    await reporter.start()

    await new Promise((r) => setTimeout(r, 50))

    if (!has('--shouldHoldAtStart')) {
        runTests()
    }

    if (currentWatchMode !== 'off') {
        const watcher = chokidar.watch(path.join(cwd, 'src'), {
            ignored: /node_modules/,
            ignoreInitial: true,
        })
        watcher.on('change', scheduleRerun)
        watcher.on('add', scheduleRerun)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
