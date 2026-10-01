import { spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import { apiPidFile, apiPort, apiUrl, e2eDbFile, repoRoot } from './env'

let child: ChildProcess | undefined

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
      const response = await fetch(`${apiUrl}/demo/users`)
      if (response.ok) return
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

/** Stops the suite API, also when it was started by another worker or an earlier run. */
export async function stopApi(): Promise<void> {
  const pid = child?.pid ?? recordedPid()
  child = undefined
  rmSync(apiPidFile, { force: true })
  if (!pid) return
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    return
  }
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline && (await portInUse())) await new Promise((resolve) => setTimeout(resolve, 200))
}

/** Starts the API on a fresh database that only this suite uses. */
export async function restartApi(): Promise<void> {
  await stopApi()
  if (await portInUse()) {
    throw new Error(`Port ${apiPort} is in use. Stop the demo API before running the suite.`)
  }
  for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(`${e2eDbFile}${suffix}`, { force: true })
  child = spawn('npm', ['run', 'start', '-w', '@waitlist/api'], {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, DEMO_LOGIN: 'true', DATABASE_FILE: e2eDbFile, PORT: String(apiPort) },
  })
  mkdirSync(path.dirname(apiPidFile), { recursive: true })
  writeFileSync(apiPidFile, String(child.pid))
  await waitUntilReady()
}
