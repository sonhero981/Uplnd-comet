#!/usr/bin/env node
// Claude Code hook around `comet archive <change>` (see scripts/openspec-specs.mjs).
//   pre:  flatten the specs the change touches; exit 2 blocks the archive on a nested/unregistered delta
//   post: nest the flat specs back and check; runs after success and failure so a failed archive
//         does not leave specs flattened
// Node port of product-ups/scripts/hooks/comet-archive-specs.sh (that one needs jq, which Windows machines lack).
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const mode = process.argv[2]
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const script = join(root, 'scripts', 'openspec-specs.mjs')

let command = ''
try { command = JSON.parse(readFileSync(0, 'utf8')).tool_input?.command ?? '' } catch { process.exit(0) }

const re = /(?:^|[;&|(])[ \t]*comet[ \t]+archive[ \t]+["']?([A-Za-z0-9._-]+)["']?([^;&|]*)/
let change = null
for (const line of command.split('\n')) {
  const m = line.match(re)
  if (!m) continue
  if (m[2].includes('--dry-run')) process.exit(0)
  change = m[1]
  break
}
if (!change) process.exit(0)

const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' })
const steps = mode === 'pre' ? [['flatten', change]] : mode === 'post' ? [['nest'], ['check']] : []

let out = ''
for (const step of steps) {
  const r = run(...step)
  out += r.stdout + r.stderr
  if (r.status !== 0) { process.stderr.write(out); process.exit(2) }
}
process.stdout.write(out)
