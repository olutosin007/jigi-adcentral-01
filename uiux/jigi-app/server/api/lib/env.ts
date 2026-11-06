import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

let localEnvLoaded = false

function parseEnvFile(contents: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = contents.split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const equalsIndex = line.indexOf('=')
    if (equalsIndex <= 0) continue

    const key = line.slice(0, equalsIndex).trim()
    let value = line.slice(equalsIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

function loadLocalEnvOnce() {
  if (localEnvLoaded) return

  const currentFile = fileURLToPath(import.meta.url)
  const projectRoot = path.resolve(path.dirname(currentFile), '..', '..', '..')
  const cwdRoot = process.cwd()
  const candidates = [
    path.join(projectRoot, '.env.local'),
    path.join(cwdRoot, '.env.local'),
    path.join(cwdRoot, 'uiux', 'jigi-app', '.env.local'),
  ]

  for (const envLocalPath of candidates) {
    if (fs.existsSync(envLocalPath)) {
      try {
        const parsed = parseEnvFile(fs.readFileSync(envLocalPath, 'utf8'))
        for (const [key, value] of Object.entries(parsed)) {
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      } catch (err) {
        console.error('[env] Failed to load .env.local:', err)
      }
      break
    }
  }

  localEnvLoaded = true
}

export function getServerEnv(key: string): string
export function getServerEnv(key: string, required: true): string
export function getServerEnv(key: string, required: false): string | undefined
export function getServerEnv(key: string, required = true): string | undefined {
  loadLocalEnvOnce()
  const value = process.env[key]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export function getBooleanEnv(
  key: string,
  defaultValue = false
): boolean {
  const raw = getServerEnv(key, false)
  if (!raw) return defaultValue

  const normalized = raw.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false

  return defaultValue
}

export function getNumberEnv(
  key: string,
  defaultValue: number
): number {
  const raw = getServerEnv(key, false)
  if (!raw) return defaultValue

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return defaultValue

  return parsed
}

