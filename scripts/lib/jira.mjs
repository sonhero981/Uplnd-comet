// Jira links of a change. Used by scripts/jira-link.mjs and scripts/changes.mjs.
//
// openspec/changes/<change>/jira.yaml (a sidecar like product-ups' jira.yaml, never tasks.md or proposal.md: Comet tracks those by
// ids and hashes and reads an edit as drift). Written only by scripts/jira-link.mjs:
//
//   stories:               # Jira stories this change covers
//     - UPLND-402
//   groups:                # `## N. [<repo>]` group of tasks.md -> Jira sub-task(s) it does
//     "1": [UPLND-448, UPLND-446]
//
// The file records references only. Status, assignee and sub-tasks live in Jira and are read through the Jira MCP by /comet-jira.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { changeDir } from './assignees.mjs'

export const validKey = (k) => /^[A-Z][A-Z0-9_]+-\d+$/.test(k ?? '')

const listOf = (s) => s.replace(/^\[|\]$/g, '').split(',').map(x => x.trim().replace(/^"|"$/g, '')).filter(Boolean)

export function readJira(dirName) {
  const data = { stories: [], groups: {} }
  const file = join(changeDir(dirName), 'jira.yaml')
  if (!existsSync(file)) return data
  let section = null
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    if (/^stories:\s*(#.*)?$/.test(raw)) { section = 'stories'; continue }
    if (/^groups:\s*(#.*)?$/.test(raw)) { section = 'groups'; continue }
    const item = raw.match(/^\s+-\s+(\S+)/)
    if (item && section === 'stories') { data.stories.push(item[1]); continue }
    const group = raw.match(/^\s+"?(\d+)"?:\s*(.+)$/)
    if (group && section === 'groups') data.groups[group[1]] = listOf(group[2].replace(/\s+#.*$/, ''))
  }
  return data
}

export function writeJira(dirName, data) {
  const out = ['# Liên kết Jira của change. Ghi bởi scripts/jira-link.mjs (/comet-jira); chỉ là tham chiếu, trạng thái và người làm nằm ở Jira.']
  if (data.stories.length) out.push('stories:  # story Jira mà change này phủ', ...data.stories.map(k => `  - ${k}`))
  const groups = Object.entries(data.groups).filter(([, keys]) => keys.length).sort(([a], [b]) => Number(a) - Number(b))
  if (groups.length) out.push('groups:  # nhóm `## N.` của tasks.md -> sub-task Jira', ...groups.map(([n, keys]) => `  "${n}": [${keys.join(', ')}]`))
  writeFileSync(join(changeDir(dirName), 'jira.yaml'), out.join('\n') + '\n', 'utf8')
}

// story -> [{ change, archived }] over active changes and archived ones
export function coveredStories() {
  const map = new Map()
  const add = (dirName, name, archived) => {
    for (const s of readJira(dirName).stories) map.set(s, [...(map.get(s) ?? []), { change: name, archived }])
  }
  const root = changeDir('')
  if (!existsSync(root)) return map
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name === 'archive') continue
    add(d.name, d.name, false)
  }
  const archive = join(root, 'archive')
  if (existsSync(archive)) {
    for (const d of readdirSync(archive, { withFileTypes: true })) {
      if (d.isDirectory()) add(`archive/${d.name}`, d.name.replace(/^\d{4}-\d{2}-\d{2}-/, ''), true)
    }
  }
  return map
}
