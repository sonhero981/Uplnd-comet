#!/usr/bin/env node
// Design-system guard for the FE repos, run as a Claude Code hook from this repo (.claude/settings.json):
//   PostToolUse (Edit|Write)  checks the file just written
//   Stop / SubagentStop       checks every file changed in the FE repos according to git
// A violation prints the reason on stderr and exits 2, so the agent fixes it before going on.
//
//   ops-fe  delegates to ops-fe/scripts/design-system-hook.mjs (the repo's own hook: ESLint no-restricted-* + hard-coded colors in SCSS).
//           Its ESLint part needs ops-fe's dependencies installed (pnpm install); without them only the SCSS colour check runs.
//   lms-fe  delegates to lms-fe/scripts/design-system-hook.mjs when the clone has it. On a branch without it, this file runs the same
//           checks itself (kept in step by hand): what lms-fe's rules/05-ui-and-styling.md forbids, on ADDED lines only (legacy code is not flagged):
//             1. hard-coded colour (#hex, rgb(), hsl()) outside libs/styles, libs/assets, tools/, config files
//             2. a component imported straight from 'antd' while `.claude/inventory/01-ui.md` lists a wrapper named UpBase<Name>
//           A justified exception goes on the same line (or any line of the import) as `ds-allow: <reason>`.
// Sibling repos are never edited. Not a lint replacement: a heuristic that catches the common ways of bypassing the design system.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const sibling = (name) => resolve(ROOT, '..', name)
const input = JSON.parse(readFileSync(0, 'utf8').replace(/^\uFEFF/, '') || '{}')
const event = input.hook_event_name
const isStop = event === 'Stop' || event === 'SubagentStop'
if (isStop && input.stop_hook_active) process.exit(0) // remind once per turn, never loop

const slash = (p) => p.split('\\').join('/')
const same = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b)
const inside = (file, root) => {
  const rel = slash(relative(root, resolve(file)))
  return !rel.startsWith('..') && !/^[a-zA-Z]:/.test(rel) && !same(rel, '')
}
const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 26 })

const problems = []

// ---- a repo's own hook (scripts/design-system-hook.mjs), when its clone has one -------------------
// Returns true when the repo's hook exists and was run, so the caller knows no fallback is needed.
function delegate(name) {
  const root = sibling(name)
  const script = join(root, 'scripts', 'design-system-hook.mjs')
  if (!existsSync(script)) return false
  const file = input.tool_input?.file_path
  if (!isStop && !(file && inside(file, root))) return true
  const r = spawnSync(process.execPath, [script], {
    cwd: root, encoding: 'utf8', input: JSON.stringify({ ...input, hook_event_name: isStop ? 'Stop' : event }),
  })
  if (r.status === 2 && r.stderr.trim()) problems.push(`[${name}]\n${r.stderr.trim()}`)
  return true
}
const opsFe = () => { delegate('ops-fe') }

// ---- lms-fe -----------------------------------------------------------------------------------
const CODE = /\.(tsx?|jsx?|scss|css)$/
const EXEMPT = /^(libs\/styles|libs\/assets|tools|public)\/|(^|\/)(tailwind|next|postcss|jest|eslint)[^/]*\.config\.|\.d\.ts$|\.(test|spec|stories)\./
const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/
const ALLOW = 'ds-allow'

// 1-based line numbers added to a file; an untracked file counts entirely
function addedLines(root, rel, text) {
  const tracked = git(root, 'ls-files', '--error-unmatch', '--', rel).status === 0
  const all = text.split('\n').map((_, i) => i + 1)
  if (!tracked) return new Set(all)
  const diff = git(root, 'diff', '-U0', 'HEAD', '--', rel).stdout
  const added = new Set()
  for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(m[1])
    const count = m[2] === undefined ? 1 : Number(m[2])
    for (let i = 0; i < count; i++) added.add(start + i)
  }
  return added
}

function wrappers(root) {
  const inv = join(root, '.claude', 'inventory', '01-ui.md')
  if (!existsSync(inv)) return new Set()
  return new Set([...readFileSync(inv, 'utf8').matchAll(/`(UpBase[A-Za-z0-9]+)`/g)].map((m) => m[1]))
}

function checkLmsFile(root, rel, known) {
  if (!CODE.test(rel) || EXEMPT.test(rel) || !existsSync(join(root, rel))) return
  const text = readFileSync(join(root, rel), 'utf8')
  const lines = text.split('\n')
  const added = addedLines(root, rel, text)
  lines.forEach((line, i) => {
    const n = i + 1
    const code = line.trim()
    if (!added.has(n) || code.startsWith('//') || code.startsWith('/*') || code.startsWith('*') || line.includes(ALLOW)) return
    if (COLOR.test(code)) {
      problems.push(`[lms-fe] ${rel}:${n}: Không hardcode màu (rules/05-ui-and-styling.md): dùng token Tailwind (text-primary, bg-secondary-100…) hoặc biến trong libs/styles; đã hỏi design mà vẫn cần thì thêm \`// ${ALLOW}: <lý do>\` và báo user.`)
    }
  })
  if (/^libs\/ui\//.test(rel) || !/\.(tsx?|jsx?)$/.test(rel) || !known.size) return // the wrappers themselves import antd
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]antd['"]/g)) {
    const first = text.slice(0, m.index).split('\n').length
    const last = first + m[0].split('\n').length - 1
    const span = Array.from({ length: last - first + 1 }, (_, k) => first + k)
    if (!span.some((n) => added.has(n)) || span.some((n) => lines[n - 1].includes(ALLOW))) continue
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0]
      if (name && known.has(`UpBase${name}`)) {
        problems.push(`[lms-fe] ${rel}:${first}: import ${name} thẳng từ 'antd' trong khi @lms/ui có UpBase${name} (.claude/inventory/01-ui.md). Dùng wrapper; thiếu prop/hành vi thì ghi lý do bằng \`// ${ALLOW}: <lý do>\`.`)
      }
    }
  }
}

function lmsFe() {
  const root = sibling('lms-fe')
  if (!existsSync(join(root, '.git'))) return
  if (delegate('lms-fe')) return // the repo has its own hook: use it, this file's checks below are the fallback for a clone without it
  const known = wrappers(root)
  let rels = []
  if (isStop) {
    const st = git(root, 'status', '--porcelain', '-uall')
    if (st.status !== 0) return
    rels = st.stdout.split('\n').filter((l) => l && !/^( D|D )/.test(l)).map((l) => slash(l.slice(3).replace(/^.* -> /, '').replace(/"/g, '')))
  } else {
    const file = input.tool_input?.file_path
    if (!file || !inside(file, root)) return
    rels = [slash(relative(root, resolve(file)))]
  }
  for (const rel of rels) checkLmsFile(root, rel, known)
}

opsFe()
lmsFe()

if (problems.length) {
  console.error(`Vi phạm design system, sửa trước khi đi tiếp:\n${problems.join('\n')}`)
  process.exit(2)
}
