#!/usr/bin/env node
// What can come after the current step of a change, as a few lines of JSON: node scripts/next-step.mjs [<change>]
//
// `comet state next <change> --json` answers the same question but is ~10k tokens; this keeps what the /comet-next menu needs:
// phase, workflow, the next Comet skill and whether Comet starts it itself, task progress, repos still without an assignee.
//   no argument + one active change  -> that change
//   no argument + several            -> {"choose": ["a", "b"]}
//   a change already archived        -> phase "archived", next.kind "done"
// Read-only: it never advances a phase. Errors print {"error": ...} and exit 2.
import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, assigneesByRepo, changeDir, changeExists, readGroups, validChangeName } from './lib/assignees.mjs'
import { readJira } from './lib/jira.mjs'

const fail = (message) => { console.log(JSON.stringify({ error: message })); process.exit(2) }
const comet = (args) => {
  try {
    const out = execSync(`comet ${args}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
    return JSON.parse(out.slice(out.indexOf('{')))
  } catch (e) {
    fail(`comet ${args.split(' ')[0]} lỗi: ${(e.stderr || e.message || '').toString().trim().slice(0, 200)}`)
  }
}

let change = process.argv[2]
if (!change) {
  const active = comet(`status "${ROOT}" --json`).workflows?.classic?.changes ?? []
  if (!active.length) { console.log(JSON.stringify({ changes: [] })); process.exit(0) }
  if (active.length > 1) { console.log(JSON.stringify({ choose: active.map(c => c.name) })); process.exit(0) }
  change = active[0].name
}
if (!validChangeName(change)) fail(`Tên change không hợp lệ: ${change}`)

const repoList = (dirName) => [...new Set(readGroups(dirName).map(g => g.repo))]

if (!changeExists(change)) {
  const archive = join(changeDir('archive'))
  const dir = existsSync(archive) ? readdirSync(archive).filter(d => /^\d{4}-\d{2}-\d{2}-/.test(d) && d.slice(11) === change).sort().pop() : null
  if (!dir) fail(`Không thấy change "${change}" (đang mở hay đã archive).`)
  console.log(JSON.stringify({ change, phase: 'archived', workflow: null, next: { kind: 'done', skill: null }, tasks: null, repos: repoList(`archive/${dir}`), unassigned: [] }))
  process.exit(0)
}

const next = comet(`state next "${change}" --json`)
const data = next.data ?? {}
const cont = next.agent?.continuation ?? data.continuation ?? {}
const stdout = next.stdout ?? data.stdout ?? ''
const token = stdout.match(/^NEXT:\s*(\w+)/m)?.[1] ?? null
const skill = stdout.match(/^SKILL:\s*(\S+)/m)?.[1] ?? cont.skill ?? cont.ref ?? null
// done / delivery: nothing left to run. wait: Comet is waiting on its own executor. skill: a Comet skill is next, whether the user
// types it (manual) or Comet would load it (auto). Either way the menu only offers to load it, the skill itself handles the rest.
const kind = token === 'done' || token === 'delivery' ? token
  : cont.mode === 'wait' && cont.waitReason !== 'manual-transition' ? 'wait'
  : skill ? 'skill'
  : 'unknown'

const who = assigneesByRepo(change)
const jira = readJira(change) // jira.yaml: stories and group -> sub-task links, written by /comet-jira
const groups = readGroups(change)
console.log(JSON.stringify({
  change,
  phase: data.phase ?? null,
  workflow: data.configuration?.workflow ?? null,
  next: { kind, skill, mode: cont.mode ?? null, waitReason: cont.waitReason ?? null },
  tasks: data.taskState ? { done: data.taskState.completed, total: data.taskState.total } : null,
  repos: repoList(change),
  unassigned: [...who].filter(([, names]) => !names.length).map(([repo]) => repo),
  jira: { stories: jira.stories.length, groupsWithoutSubtask: groups.filter(g => !(jira.groups[String(g.n)] ?? []).length).length },
}, null, 2))
