#!/usr/bin/env node
// Which Jira stories and sub-tasks a change covers. Records references only; the Jira data itself is read by /comet-jira.
//
//   node scripts/jira-link.mjs show    <change> [--json]                 stories, and each tasks.md group with its sub-tasks
//   node scripts/jira-link.mjs stories <change> [--add] <KEY...>         set (or with --add append) the stories the change covers
//   node scripts/jira-link.mjs group   <change> --group <N> <KEY...>     sub-task(s) that `## N. [<repo>]` does
//   node scripts/jira-link.mjs unlink  <change> --group <N>
//   node scripts/jira-link.mjs covered [--json]                          story -> change over all changes, archived included
//
// Writes only openspec/changes/<change>/jira.yaml, never tasks.md or proposal.md.
import { changeExists, readGroups, validChangeName } from './lib/assignees.mjs'
import { coveredStories, readJira, validKey, writeJira } from './lib/jira.mjs'

const usage = 'usage: node scripts/jira-link.mjs show|stories|group|unlink <change> [--add] [--group <N>] [KEY...] [--json] | covered [--json]'
const fail = (message, code = 2) => { console.error(message); process.exit(code) }

const [cmd, ...rest] = process.argv.slice(2)
const json = rest.includes('--json')
const add = rest.includes('--add')
const gi = rest.indexOf('--group')
const group = gi >= 0 ? rest[gi + 1] : undefined
const positional = rest.filter((a, i) => !a.startsWith('--') && rest[i - 1] !== '--group')

if (cmd === 'covered') {
  const rows = [...coveredStories()].sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
  if (json) console.log(JSON.stringify(Object.fromEntries(rows), null, 2))
  else if (!rows.length) console.log('Chưa change nào ghi story Jira.')
  else for (const [story, changes] of rows) console.log(`${story}  ${changes.map(c => c.change + (c.archived ? ' (archive)' : '')).join(', ')}`)
  process.exit(0)
}

if (!['show', 'stories', 'group', 'unlink'].includes(cmd)) fail(usage, 64)
const change = positional[0]
if (!validChangeName(change)) fail(usage, 64)
if (!changeExists(change)) fail(`Không thấy change đang mở "${change}" (cần openspec/changes/${change}/tasks.md).`)
const groups = readGroups(change)
const data = readJira(change)
const keys = positional.slice(1)
if (keys.some(k => !validKey(k))) fail(`Mã Jira không hợp lệ: ${keys.filter(k => !validKey(k)).join(', ')} (dạng UPLND-123).`, 64)

if (cmd === 'show') {
  const rows = groups.map(g => ({ group: g.n, repo: g.repo, title: g.title, subtasks: data.groups[String(g.n)] ?? [] }))
  const stale = Object.keys(data.groups).filter(n => !groups.some(g => String(g.n) === n))
  if (json) { console.log(JSON.stringify({ change, stories: data.stories, groups: rows, stale }, null, 2)); process.exit(0) }
  console.log(`${change}  stories: ${data.stories.join(', ') || '(chưa ghi)'}`)
  for (const r of rows) console.log(`  ${String(r.group).padStart(2)}. [${r.repo}] ${r.title}  → ${r.subtasks.join(', ') || '(chưa nối sub-task)'}`)
  if (stale.length) console.log(`Còn nối cho nhóm không còn trong tasks.md: ${stale.join(', ')}. Chạy unlink để bỏ.`)
  process.exit(0)
}

if (cmd === 'stories') {
  if (!keys.length) fail('Cần ít nhất một mã story.', 64)
  data.stories = add ? [...new Set([...data.stories, ...keys])] : [...new Set(keys)]
  writeJira(change, data)
  console.log(`${change} phủ ${data.stories.length} story: ${data.stories.join(', ')}`)
  process.exit(0)
}

if (group === undefined || !groups.some(g => String(g.n) === group)) {
  fail(`Cần --group <N> với N là một nhóm của ${change}. Có: ${groups.map(g => g.n).join(', ') || '(không có nhóm)'}.`, 64)
}
if (cmd === 'group') {
  if (!keys.length) fail('Cần ít nhất một mã sub-task.', 64)
  data.groups[group] = [...new Set(keys)]
  writeJira(change, data)
  console.log(`Nhóm ${group} của ${change} nối với ${data.groups[group].join(', ')}.`)
} else {
  delete data.groups[group]
  writeJira(change, data)
  console.log(`Đã bỏ nối sub-task của nhóm ${group} trong ${change}.`)
}
