#!/usr/bin/env node
// Prepare the PO repo for writing a technical design: `node scripts/po-tech-design.mjs prepare <intent>`
//
//   - stops if the PO repo has uncommitted changes (never mixes the AI's file into someone else's work)
//   - creates (or reuses) the branch feature/<intent>-tech-design from the branch the PO repo is on now, and switches to it
//   - creates intents/<intent>/inception/tech-design/ when missing
// It never commits, pushes or touches a remote. PO repo: ../uplnd_po_workflow, override with env PRD_REPO.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = resolve(ROOT, process.env.PRD_REPO ?? '../uplnd_po_workflow')
const args = process.argv.slice(2)
const [cmd, intent] = args
const at = args.indexOf('--base')
const baseRef = at >= 0 ? args[at + 1] : null
const usage = 'usage: node scripts/po-tech-design.mjs prepare <intent> [--base <branch>]'

const fail = (message, code = 2) => {
  console.error(message)
  process.exit(code)
}
const git = (...args) => {
  const r = spawnSync('git', ['-C', REPO, ...args], { encoding: 'utf8' })
  return { ok: r.status === 0, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim() }
}

if (cmd !== 'prepare' || !intent || (at >= 0 && !baseRef)) fail(usage, 64)
if (!/^[A-Za-z0-9._-]+$/.test(intent)) fail(`Tên intent không hợp lệ: ${intent}`, 64)
if (!existsSync(join(REPO, '.git'))) fail(`${REPO} không phải git repo. Clone repo PO cạnh repo này hoặc đặt biến PRD_REPO.`)
if (!existsSync(join(REPO, 'intents', intent))) fail(`Không thấy intent ${intent} trong ${join(REPO, 'intents')}.`)

const dirty = git('status', '--porcelain').out
if (dirty) {
  fail(`Repo PO có thay đổi chưa commit, dừng để không trộn vào việc của người khác:\n${dirty}\nCommit hoặc stash ở ${REPO} rồi chạy lại.`, 3)
}

const target = `feature/${intent}-tech-design`
const current = git('branch', '--show-current').out
const base = current || `commit ${git('rev-parse', '--short', 'HEAD').out}`
let action
if (current === target) action = 'đã ở sẵn nhánh này'
else if (git('rev-parse', '--verify', '--quiet', `refs/heads/${target}`).ok) {
  const r = git('switch', target)
  if (!r.ok) fail(`Không chuyển được sang ${target}: ${r.err}`)
  action = 'nhánh đã có, chuyển sang'
} else {
  // another intent's tech-design branch is not a valid base: the new branch would carry that intent's work
  if (!baseRef && /^feature\/.+-tech-design$/.test(current)) {
    fail(`Đang ở nhánh ${current}, là nhánh tech design của intent khác; tạo nhánh mới từ đây sẽ trộn hai intent.\nChuyển repo PO về nhánh nền trước, hoặc thêm --base <nhánh>.`, 4)
  }
  const r = baseRef ? git('switch', '-c', target, baseRef) : git('switch', '-c', target)
  if (!r.ok) fail(`Không tạo được nhánh ${target}: ${r.err}`)
  action = `tạo mới từ ${baseRef ?? base}`
}

const dir = join(REPO, 'intents', intent, 'inception', 'tech-design')
mkdirSync(dir, { recursive: true })
console.log(`Repo PO: ${REPO}`)
console.log(`Nhánh:   ${target}  (${action})`)
console.log(`Thư mục: ${dir}`)
console.log('Chưa commit, chưa push.')
