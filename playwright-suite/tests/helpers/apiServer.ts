import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { apiPidFile, apiPort, apiUrl, e2eDbFile, repoRoot } from './env'

let child: ChildProcess | undefined

export interface ApiOptions {
  demoWaitlist?: boolean
  demoLogin?: boolean
}

function portInUse(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port: apiPort, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

async function waitUntilReady(): Promise<void> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      await fetch(`${apiUrl}/waitlist`)
      return
    } catch {
      // the server is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error('The suite API did not answer within 30 seconds')
}

function recordedPid(): number | undefined {
  try {
    return Number(readFileSync(apiPidFile, 'utf8')) || undefined
  } catch {
    return undefined
  }
}

/** Kills any process that listens on the API port and holds the suite database, for example one orphaned by a crashed worker. */
function killSuiteListeners(): void {
  let listeners: string[] = []
  try {
    listeners = execFileSync('lsof', ['-ti', `tcp:${apiPort}`, '-sTCP:LISTEN']).toString().split('\n').filter(Boolean)
  } catch {
    return
  }
  for (const pid of listeners) {
    try {
      const files = execFileSync('lsof', ['-p', pid, '-Fn']).toString()
      if (!files.includes(e2eDbFile)) continue
      const group = execFileSync('ps', ['-o', 'pgid=', '-p', pid]).toString().trim()
      process.kill(-Number(group), 'SIGTERM')
    } catch {
      // the process already exited
    }
  }
}

async function waitUntilPortFree(): Promise<void> {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline && (await portInUse())) await new Promise((resolve) => setTimeout(resolve, 200))
}

/** Stops the suite API, also when it was started by another worker or an earlier run. */
export async function stopApi(): Promise<void> {
  const pid = child?.pid ?? recordedPid()
  child = undefined
  rmSync(apiPidFile, { force: true })
  if (pid) {
    try {
      process.kill(-pid, 'SIGTERM')
    } catch {
      // the process group is already gone
    }
  }
  killSuiteListeners()
  await waitUntilPortFree()
}

/** Starts the API on a fresh database that only this suite uses. */
export async function restartApi(options: ApiOptions = {}): Promise<void> {
  const { demoWaitlist = false, demoLogin = true } = options
  await stopApi()
  if (await portInUse()) {
    throw new Error(`Port ${apiPort} is in use. Stop the demo API before running the suite.`)
  }
  for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(`${e2eDbFile}${suffix}`, { force: true })
  const env = { ...process.env, DATABASE_FILE: e2eDbFile, PORT: String(apiPort) }
  if (demoWaitlist) execFileSync('npm', ['run', 'seed', '-w', '@waitlist/api'], { cwd: repoRoot, env, stdio: 'ignore' })
  child = spawn('npm', ['run', 'start', '-w', '@waitlist/api'], {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
    env: { ...env, DEMO_LOGIN: demoLogin ? 'true' : 'false', JWT_SECRET: 'suite-secret' },
  })
  mkdirSync(path.dirname(apiPidFile), { recursive: true })
  writeFileSync(apiPidFile, String(child.pid))
  await waitUntilReady()
}
