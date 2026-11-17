#!/usr/bin/env node
// List the active Comet changes of this repo, each with the repos it touches.
// A change name never contains a repo; the repos are read from the `## N. [<repo>] <title>` groups of its tasks.md.
//
//   node scripts/changes.mjs                 all active changes
//   node scripts/changes.mjs --repo ops-fe   only changes that have tasks for ops-fe
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assigneesByRepo } from './lib/assignees.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BUILD_ORDER = ['lms-package', 'lms-be', 'ops-fe', 'lms-fe']
const UNTAGGED = '(no repo tag)'

const args = process.argv.slice(2)
const at = args.indexOf('--repo')
const only = at >= 0 ? args[at + 1] : null
if (at >= 0 && !only) {
  console.error('usage: node scripts/changes.mjs [--repo <repo>]')
  process.exit(64)
}

const raw = execSync(`comet status "${ROOT}" --json`, { encoding: 'utf8' })
const changes = JSON.parse(raw.slice(raw.indexOf('{'))).workflows.classic.changes

// repo -> { done, total } from the checkboxes under each `## N. [<repo>]` group
function repoProgress(name) {
  const file = join(ROOT, 'openspec', 'changes', name, 'tasks.md')
  const repos = new Map()
  if (!existsSync(file)) return repos
  let current = null
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const tagged = line.match(/^##\s+\d+\.\s*\[([^\]]+)\]/)
    if (tagged) { current = tagged[1].trim(); continue }
    if (/^##\s/.test(line)) { current = null; continue }
    const task = line.match(/^\s*- \[( |x|X)\]/)
    if (!task) continue
    const key = current ?? UNTAGGED
    const p = repos.get(key) ?? { done: 0, total: 0 }
    p.total++
    if (task[1] !== ' ') p.done++
    repos.set(key, p)
  }
  return repos
}

const rank = (repo) => (repo === UNTAGGED ? BUILD_ORDER.length + 1 : BUILD_ORDER.includes(repo) ? BUILD_ORDER.indexOf(repo) : BUILD_ORDER.length)

let shown = 0
for (const c of changes) {
  const repos = repoProgress(c.name)
  if (only && !repos.has(only)) continue
  shown++
  const note = c.nextCommand ? `next: ${c.nextCommand}` : c.error ? `error: ${c.error.slice(0, 80)}` : ''
  console.log(`${c.name}  [${c.phase}]  ${c.tasksCompleted}/${c.tasksTotal} tasks  ${note}`.trimEnd())
  const rows = [...repos].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
  if (!rows.length) console.log('  (tasks.md has no [<repo>] groups)')
  const who = assigneesByRepo(c.name) // from assignees.yaml, written by /comet-assign
  for (const [repo, p] of rows) {
    const names = who.get(repo) ?? []
    console.log(`  - ${repo.padEnd(14)} ${p.done}/${p.total} tasks  ${repo === UNTAGGED ? '' : `→ ${names.length ? names.join(', ') : '(chưa giao)'}`}`.trimEnd())
  }
  console.log('')
}
if (!shown) console.log(only ? `No active change touches ${only}.` : 'No active changes.')
