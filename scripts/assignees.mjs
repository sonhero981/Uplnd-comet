#!/usr/bin/env node
// Who does which group of a change.
//
//   node scripts/assignees.mjs show  <change> [--json]            groups, task counts and the assignee of each
//   node scripts/assignees.mjs set   <change> --repo <repo> <name>  default for every group of that repo (clears that repo's group overrides)
//   node scripts/assignees.mjs set   <change> --group <N> <name>    override for one `## N. [<repo>]` group
//   node scripts/assignees.mjs unset <change> --repo <repo> | --group <N>
//   node scripts/assignees.mjs team  [--repo <repo>] [--json]       suggestions from openspec/team.yaml
//
// Writes only openspec/changes/<change>/assignees.yaml. It never touches tasks.md, so Comet's task tracking is unaffected.
import {
  BUILD_ORDER, changeExists, effectiveAssignee, readAssignees, readGroups, readTeam, validChangeName, writeAssignees,
} from './lib/assignees.mjs'

const usage = 'usage: node scripts/assignees.mjs show|set|unset <change> [--repo <repo> | --group <N>] [<name>] [--json] | team [--repo <repo>] [--json]'
const fail = (message, code = 2) => { console.error(message); process.exit(code) }

const [cmd, ...rest] = process.argv.slice(2)
const json = rest.includes('--json')
const flag = (f) => { const i = rest.indexOf(f); return i >= 0 ? rest[i + 1] : undefined }
const positional = rest.filter((a, i) => !a.startsWith('--') && !['--repo', '--group'].includes(rest[i - 1]))

if (cmd === 'team') {
  const repo = flag('--repo')
  const people = readTeam().filter(p => !repo || p.repos.includes(repo))
  if (json) console.log(JSON.stringify({ people }, null, 2))
  else if (!people.length) console.log(repo ? `Không ai trong openspec/team.yaml phụ trách ${repo}.` : 'openspec/team.yaml trống hoặc chưa có.')
  else for (const p of people) console.log(`${p.name}${p.role ? ` (${p.role})` : ''}  repos: ${p.repos.join(', ') || '-'}`)
  process.exit(0)
}

if (!['show', 'set', 'unset'].includes(cmd)) fail(usage, 64)
const change = positional[0]
if (!validChangeName(change)) fail(usage, 64)
if (!changeExists(change)) fail(`Không thấy change đang mở "${change}" (cần openspec/changes/${change}/tasks.md).`)
const groups = readGroups(change)
if (!groups.length) fail(`tasks.md của ${change} chưa có nhóm "## N. [<repo>] ..." nên chưa giao việc được.`)
const data = readAssignees(change)

if (cmd === 'show') {
  const rows = groups.map(g => ({
    group: g.n, repo: g.repo, title: g.title, done: g.done, total: g.total,
    assignee: effectiveAssignee(data, g),
    source: data.groups[String(g.n)] ? 'group' : data.repos[g.repo] ? 'repo' : null,
  }))
  const repos = new Set(groups.map(g => g.repo))
  const stale = [...Object.keys(data.repos).filter(r => !repos.has(r)).map(r => `repo ${r}`),
    ...Object.keys(data.groups).filter(n => !groups.some(g => String(g.n) === n)).map(n => `nhóm ${n}`)]
  if (json) { console.log(JSON.stringify({ change, groups: rows, stale }, null, 2)); process.exit(0) }
  console.log(change)
  for (const r of [...rows].sort((a, b) => BUILD_ORDER.indexOf(a.repo) - BUILD_ORDER.indexOf(b.repo) || a.group - b.group)) {
    console.log(`  ${String(r.group).padStart(2)}. [${r.repo}] ${r.title}  ${r.done}/${r.total} tasks  → ${r.assignee ?? '(chưa giao)'}${r.source === 'group' ? '  (riêng nhóm)' : ''}`)
  }
  if (stale.length) console.log(`Còn người làm cho thứ không còn trong tasks.md: ${stale.join(', ')}. Chạy unset để bỏ.`)
  process.exit(0)
}

const repo = flag('--repo')
const group = flag('--group')
if ((repo === undefined) === (group === undefined)) fail('Cần đúng một trong --repo <repo> hoặc --group <N>.', 64)
if (repo !== undefined && !groups.some(g => g.repo === repo)) fail(`Change ${change} không có nhóm nào của repo "${repo}". Repo có: ${[...new Set(groups.map(g => g.repo))].join(', ')}.`)
if (group !== undefined && !groups.some(g => String(g.n) === group)) fail(`Change ${change} không có nhóm số ${group}. Có: ${groups.map(g => g.n).join(', ')}.`)

if (cmd === 'set') {
  const name = positional.slice(1).join(' ').trim()
  if (!name || name.length > 80 || /[\r\n]/.test(name)) fail('Tên người làm phải có từ 1 đến 80 ký tự, một dòng.', 64)
  if (repo !== undefined) {
    data.repos[repo] = name
    for (const g of groups.filter(g => g.repo === repo)) delete data.groups[String(g.n)]
  } else data.groups[group] = name
  writeAssignees(change, data)
  const known = readTeam().some(p => p.name.toLowerCase() === name.toLowerCase())
  console.log(`Đã giao ${repo !== undefined ? `repo ${repo}` : `nhóm ${group}`} của ${change} cho ${name}.${known ? '' : ' (tên này chưa có trong openspec/team.yaml)'}`)
} else {
  if (repo !== undefined) delete data.repos[repo]
  else delete data.groups[group]
  writeAssignees(change, data)
  console.log(`Đã bỏ người làm của ${repo !== undefined ? `repo ${repo}` : `nhóm ${group}`} trong ${change}.`)
}
