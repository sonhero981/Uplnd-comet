// Shared helpers for who does what in a change. Used by scripts/assignees.mjs and scripts/changes.mjs.
//
// The assignment lives in openspec/changes/<change>/assignees.yaml, NOT in tasks.md: Comet tracks tasks.md by task ids and hashes,
// and an extra line there can read as drift. The file is plain and written only by scripts/assignees.mjs:
//
//   repos:               # default assignee for every `## N. [<repo>]` group of that repo
//     lms-fe: "Tên"
//   groups:              # optional override for one group, by its number N
//     "3": "Tên khác"
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const BUILD_ORDER = ['lms-package', 'lms-be', 'ops-fe', 'lms-fe']

export const changeDir = (name) => join(ROOT, 'openspec', 'changes', name)
export const validChangeName = (name) => /^[A-Za-z0-9._-]+$/.test(name ?? '') && name !== 'archive'
export const changeExists = (name) => validChangeName(name) && existsSync(join(changeDir(name), 'tasks.md'))

// `## N. [<repo>] <title>` groups of tasks.md with their task counts
export function readGroups(name) {
  const file = join(changeDir(name), 'tasks.md')
  if (!existsSync(file)) return []
  const groups = []
  let current = null
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const head = line.match(/^##\s+(\d+)\.\s*\[([^\]]+)\]\s*(.*)$/)
    if (head) {
      current = { n: Number(head[1]), repo: head[2].trim(), title: head[3].trim(), done: 0, total: 0 }
      groups.push(current)
      continue
    }
    if (/^##\s/.test(line)) { current = null; continue }
    const task = line.match(/^\s*- \[( |x|X)\]/)
    if (task && current) { current.total++; if (task[1] !== ' ') current.done++ }
  }
  return groups
}

const unquote = (s) => {
  const v = s.trim()
  if (v.startsWith('"')) { try { return JSON.parse(v) } catch { return v.slice(1, -1) } }
  return v.replace(/^'|'$/g, '')
}

export function readAssignees(name) {
  const data = { repos: {}, groups: {} }
  const file = join(changeDir(name), 'assignees.yaml')
  if (!existsSync(file)) return data
  let section = null
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    if (/^repos:\s*(#.*)?$/.test(raw)) { section = 'repos'; continue }
    if (/^groups:\s*(#.*)?$/.test(raw)) { section = 'groups'; continue }
    const m = raw.match(/^\s+("[^"]*"|[^\s:]+):\s*(.+)$/)
    if (m && section) data[section][unquote(m[1])] = unquote(m[2])
  }
  return data
}

export function writeAssignees(name, data) {
  const out = ['# Người làm của change. Ghi bởi scripts/assignees.mjs (/comet-assign); không sửa tay trừ khi cần.']
  const repos = Object.entries(data.repos)
  const groups = Object.entries(data.groups)
  if (repos.length) {
    out.push('repos:  # mặc định cho mọi nhóm của repo')
    for (const [k, v] of repos) out.push(`  ${k}: ${JSON.stringify(v)}`)
  }
  if (groups.length) {
    out.push('groups:  # ghi đè cho một nhóm, theo số N của `## N.`')
    for (const [k, v] of groups) out.push(`  ${JSON.stringify(String(k))}: ${JSON.stringify(v)}`)
  }
  writeFileSync(join(changeDir(name), 'assignees.yaml'), out.join('\n') + '\n', 'utf8')
}

// The assignee a group really has: its own override, else the default of its repo, else null
export const effectiveAssignee = (data, group) => data.groups[String(group.n)] ?? data.repos[group.repo] ?? null

// repo -> distinct assignees across that repo's groups (empty array = nobody assigned yet)
export function assigneesByRepo(name) {
  const data = readAssignees(name)
  const byRepo = new Map()
  for (const g of readGroups(name)) {
    const list = byRepo.get(g.repo) ?? []
    const who = effectiveAssignee(data, g)
    if (who && !list.includes(who)) list.push(who)
    byRepo.set(g.repo, list)
  }
  return byRepo
}

// openspec/team.yaml: suggestions only. Reads `- name:`, `role:` and `repos: [a, b]` of each entry.
export function readTeam() {
  const file = join(ROOT, 'openspec', 'team.yaml')
  if (!existsSync(file)) return []
  const people = []
  let cur = null
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '')
    const name = line.match(/^\s*-\s+name:\s*(.+)$/)
    if (name) { cur = { name: unquote(name[1]), role: '', repos: [] }; people.push(cur); continue }
    const role = line.match(/^\s+role:\s*(.+)$/)
    if (role && cur) cur.role = unquote(role[1])
    const repos = line.match(/^\s+repos:\s*\[(.*)\]\s*$/)
    if (repos && cur) cur.repos = repos[1].split(',').map(s => unquote(s)).filter(Boolean)
  }
  return people
}
