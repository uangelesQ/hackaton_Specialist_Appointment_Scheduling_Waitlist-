import path from 'node:path'

export const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173'
export const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
export const apiPort = Number(new URL(apiUrl).port || 3001)
export const repoRoot = path.resolve(__dirname, '../../..')
export const e2eDbFile = path.resolve(repoRoot, 'playwright-suite/.e2e/e2e.db')
export const apiPidFile = path.resolve(repoRoot, 'playwright-suite/.e2e/api.pid')
