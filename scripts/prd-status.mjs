#!/usr/bin/env node
// PRD status for /comet-start: read the approved-PRD list of the PO repo and match it with this repo's changes.
//
//   node scripts/prd-status.mjs            human-readable list
//   node scripts/prd-status.mjs --json     machine-readable (used by the /comet-start skill)
//   node scripts/prd-status.mjs --no-fetch skip `git fetch` of the PO repo (offline)
//
// PO repo: ../uplnd_po_workflow, override with env PRD_REPO. Only intents/INDEX.md is read (approved PRDs);
// nothing in the PO repo is modified (git fetch only updates remote-tracking refs).
// A change belongs to a PRD when its proposal.md has a line `PRD: LMS-F001` (several codes may be comma-separated).
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PRD_REPO = resolve(ROOT, process.env.PRD_REPO ?? '../uplnd_po_workflow')
const asJson = process.argv.includes('--json')
const noFetch = process.argv.includes('--no-fetch')

function die(message) {
  if (asJson) console.log(JSON.stringify({ error: message }))
  else console.error(message)
  process.exit(2)
}

const git = (args, timeout = 20000) => {
  const r = spawnSync('git', ['-C', PRD_REPO, ...args], { encoding: 'utf8', timeout, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
  return { ok: r.status === 0, out: (r.stdout ?? '').trim() }
}

// ---- PO repo: freshness + approved PRD list -------------------------------------------------
const indexFile = join(PRD_REPO, 'intents', 'INDEX.md')
if (!existsSync(indexFile)) die(`Không thấy ${indexFile}. Clone repo PO cạnh repo này (../uplnd_po_workflow) hoặc đặt biến PRD_REPO.`)

const source = { path: PRD_REPO, branch: git(['branch', '--show-current']).out || null, commit: git(['rev-parse', '--short', 'HEAD']).out || null, fetched: false, behind: null }
if (!noFetch) source.fetched = git(['fetch', '--quiet'], 25000).ok
if (git(['rev-parse', '--abbrev-ref', '@{u}']).ok) {
  const n = git(['rev-list', '--count', 'HEAD..@{u}'])
  if (n.ok) source.behind = Number(n.out)
}

function parseIndex(text) {
  const rows = text.split(/\r?\n/).filter((l) => l.trim().startsWith('|'))
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
  const head = rows.findIndex((l) => l.includes('Mã tính năng'))
  if (head < 0) die('intents/INDEX.md: không tìm thấy bảng có cột "Mã tính năng".')
  const h = cells(rows[head])
  const col = (name, exact = false) => h.findIndex((c) => (exact ? c === name : c.includes(name)))
  const i = { code: col('Mã tính năng'), name: col('Tên', true), version: col('PRD', true), status: col('Status'), approved: col('Approved at'), file: col('Bản duyệt mới nhất'), tag: col('Tag git') }
  return rows.slice(head + 2).map(cells).filter((c) => c[i.code]).map((c) => {
    const file = c[i.file] && c[i.file] !== '-' ? c[i.file] : null
    return {
      code: c[i.code], name: c[i.name], version: c[i.version], status: c[i.status], approvedAt: c[i.approved], tag: c[i.tag],
      prdFile: file ? join(PRD_REPO, file) : null,
      prdFileExists: file ? existsSync(join(PRD_REPO, file)) : false,
    }
  })
}
const prds = parseIndex(readFileSync(indexFile, 'utf8'))

// ---- technical design of each PRD: intents/<intent>/inception/tech-design/ in the PO repo ----
// stage 2.43 creates tech-design.md from the template with only the frontmatter filled, so "file exists" is not enough:
// it counts as `ready` only when the Tech PIC wrote lines that are not in the template.
const templateFile = join(PRD_REPO, 'engine', 'templates', 'tech-design.md')
const templateLines = new Set(existsSync(templateFile) ? readFileSync(templateFile, 'utf8').split(/\r?\n/).map((l) => l.trim()) : [])
const MIN_CONTENT_LINES = 3
function contentLines(text) {
  const lines = text.split(/\r?\n/)
  const end = lines[0]?.trim() === '---' ? lines.indexOf('---', 1) : -1
  const body = end > 0 ? lines.slice(end + 1) : lines
  return body
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !/^\|[\s|:-]+\|$/.test(l) && !/^<!--.*-->$/.test(l) && !templateLines.has(l)).length
}
for (const p of prds) {
  p.intent = p.prdFile ? (relative(PRD_REPO, p.prdFile).split(sep)[1] ?? null) : null
  const dir = p.intent ? join(PRD_REPO, 'intents', p.intent, 'inception', 'tech-design') : null
  const td = dir && join(dir, 'tech-design.md')
  const fe = dir && join(dir, 'fe-technical-design.md')
  const tdExists = !!td && existsSync(td)
  p.techDesign = { file: td, state: !tdExists ? 'missing' : contentLines(readFileSync(td, 'utf8')) >= MIN_CONTENT_LINES ? 'ready' : 'template' }
  const feExists = !!fe && existsSync(fe)
  p.feTechDesign = { file: fe, exists: feExists, lines: feExists ? readFileSync(fe, 'utf8').split(/\r?\n/).length : 0 }
}

// ---- this repo: changes and the PRD each one declares ---------------------------------------
const codesOf = (changeDir) => {
  const f = join(changeDir, 'proposal.md')
  if (!existsSync(f)) return []
  const m = readFileSync(f, 'utf8').match(/^\s*PRD:\s*(.+)$/im)
  return m ? [...m[1].matchAll(/[A-Z][A-Z0-9]*-F\d+/g)].map((x) => x[0]) : []
}

const status = execSync(`comet status "${ROOT}" --json`, { encoding: 'utf8' })
const active = JSON.parse(status.slice(status.indexOf('{'))).workflows.classic.changes.map((c) => ({
  name: c.name, phase: c.phase, tasks: `${c.tasksCompleted}/${c.tasksTotal}`, prd: codesOf(join(ROOT, 'openspec', 'changes', c.name)),
}))
const archiveDir = join(ROOT, 'openspec', 'changes', 'archive')
const archived = existsSync(archiveDir)
  ? readdirSync(archiveDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => ({ name: e.name, prd: codesOf(join(archiveDir, e.name)) }))
  : []

for (const p of prds) {
  p.active = active.filter((c) => c.prd.includes(p.code)).map(({ name, phase, tasks }) => ({ name, phase, tasks }))
  p.archivedCount = archived.filter((c) => c.prd.includes(p.code)).length
  p.state = p.active.length ? 'in-progress' : p.archivedCount ? 'has-archived' : 'new'
}
const unlinked = active.filter((c) => !c.prd.length).map(({ name, phase, tasks }) => ({ name, phase, tasks }))

// ---- output ---------------------------------------------------------------------------------
if (asJson) {
  console.log(JSON.stringify({ source, prds, unlinked }, null, 2))
  process.exit(0)
}

const label = { new: 'MỚI, chưa có change', 'in-progress': 'ĐANG LÀM', 'has-archived': 'đã có change archive, chưa có change mở' }
const warn = []
if (!noFetch && !source.fetched) warn.push('không kiểm tra được remote (git fetch lỗi), danh sách có thể cũ')
if (source.behind) warn.push(`repo PO chậm ${source.behind} commit so với remote, chạy: git -C ${PRD_REPO} pull`)
if (source.branch && source.branch !== 'main') warn.push(`repo PO đang ở nhánh ${source.branch}, không phải main`)
console.log(`Repo PO: ${PRD_REPO}${source.branch ? `  (nhánh ${source.branch})` : ''}`)
for (const w of warn) console.log(`  ! ${w}`)
console.log(`\nPRD đã duyệt (${prds.length}):`)
for (const p of prds) {
  console.log(`  ${p.code}  ${p.name}  ${p.version}  [${label[p.state]}]${p.prdFileExists ? '' : '  (!) không thấy file PRD'}`)
  const tdLabel = { ready: 'có', template: 'file chỉ là template trống', missing: 'chưa có' }[p.techDesign.state]
  console.log(`      technical design: ${tdLabel}${p.feTechDesign.exists ? `  |  fe-technical-design.md: có (${p.feTechDesign.lines} dòng)` : ''}`)
  for (const c of p.active) console.log(`      - ${c.name}  [${c.phase}]  ${c.tasks} tasks`)
  if (p.archivedCount) console.log(`      (${p.archivedCount} change đã archive)`)
}
if (unlinked.length) {
  console.log('\nChange chưa ghi dòng "PRD: <mã>" trong proposal.md:')
  for (const c of unlinked) console.log(`  - ${c.name}  [${c.phase}]  ${c.tasks} tasks`)
}
