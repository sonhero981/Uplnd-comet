#!/usr/bin/env node
// Freshness of the code knowledge base: node scripts/codekb-status.mjs [repo...] [--json] [--no-fetch]
//
// docs/codekb/<repo>/ holds the 9 AWS AI-DLC Reverse Engineering files. Its reverse-engineering-timestamp.md ends with a
// `## Scope of Analysis` yaml block (commit + analyzed.paths). A store is CURRENT when
//   git log <commit>..origin/<base> -- <analyzed.paths>
// is empty, STALE otherwise. <base> is origin/staging when the repo has it, else origin/main (same rule as UP_BASE).
// Verdicts: NO_STORE | INCOMPLETE (a file of the 9 is missing) | UNKNOWN_SCOPE (no commit or no analyzed.paths)
//           | UNVERIFIED (repo, base ref or commit not found) | CURRENT | STALE
// Read-only: it runs `git fetch origin` unless --no-fetch, and never checks out, pulls or writes.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KB = join(ROOT, 'docs', 'codekb')
const ALL_REPOS = ['lms-package', 'lms-be', 'ops-fe', 'lms-fe']
const REQUIRED = [
  'business-overview', 'architecture', 'code-structure', 'api-documentation', 'component-inventory',
  'technology-stack', 'dependencies', 'code-quality-assessment', 'reverse-engineering-timestamp',
]
const args = process.argv.slice(2)
const json = args.includes('--json')
const noFetch = args.includes('--no-fetch')
const wanted = args.filter(a => !a.startsWith('--'))
const bad = wanted.filter(r => !ALL_REPOS.includes(r))
if (bad.length) {
  console.error(`Repo không hợp lệ: ${bad.join(', ')}. usage: node scripts/codekb-status.mjs [${ALL_REPOS.join('|')}...] [--json] [--no-fetch]`)
  process.exit(64)
}
const repos = wanted.length ? wanted : ALL_REPOS

const git = (repo, ...a) => {
  const r = spawnSync('git', ['-C', join(ROOT, '..', repo), ...a], { encoding: 'utf8', timeout: 60000 })
  return { ok: r.status === 0, out: (r.stdout ?? '').trim() }
}

// Minimal reader for the Scope of Analysis block: top-level scalars and the `analyzed:` -> `paths:` list.
function parseScope(text) {
  const section = text.split(/^## Scope of Analysis\s*$/m)[1]
  const block = section?.match(/```ya?ml\n([\s\S]*?)```/)?.[1]
  if (!block) return null
  const scope = { kind: null, commit: null, paths: [] }
  let top = null, sub = null
  for (const raw of block.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    const indent = raw.match(/^ */)[0].length
    const line = raw.trim()
    if (indent === 0) {
      const m = line.match(/^([A-Za-z_]+):\s*(.*)$/)
      if (!m) continue
      top = m[1]; sub = null
      if (m[1] === 'kind') scope.kind = m[2].trim()
      if (m[1] === 'commit') scope.commit = m[2].trim().match(/^[0-9a-f]{7,40}/i)?.[0] ?? null
    } else if (line.endsWith(':') && !line.startsWith('-')) {
      sub = line.slice(0, -1)
    } else if (line.startsWith('- ') && top === 'analyzed' && sub === 'paths') {
      // `path#Lx-Ly` records a partial read of a file: freshness is per file, so drop the line range
      const p = line.slice(2).trim().replace(/^["']|["']$/g, '').replace(/#L\d.*$/, '').trim()
      if (p) scope.paths.push(p === './' ? '.' : p)
    }
  }
  return scope
}

function check(repo) {
  const dir = join(KB, repo)
  const res = { repo, dir: `docs/codekb/${repo}`, verdict: null, commit: null, kind: null, base: null, baseCommit: null, changed: 0, recent: [], missing: [], fetched: false }
  const stamp = join(dir, 'reverse-engineering-timestamp.md')
  if (!existsSync(dir) || !existsSync(stamp)) { res.verdict = 'NO_STORE'; res.missing = REQUIRED; return res }
  res.missing = REQUIRED.filter(f => !existsSync(join(dir, `${f}.md`)))
  if (res.missing.length) { res.verdict = 'INCOMPLETE'; return res }

  const text = readFileSync(stamp, 'utf8')
  const scope = parseScope(text)
  res.commit = scope?.commit ?? text.match(/^- Commit:\s*`?([0-9a-f]{7,40})/im)?.[1] ?? null
  res.kind = scope?.kind ?? null
  if (!scope || !res.commit || !scope.paths.length) { res.verdict = 'UNKNOWN_SCOPE'; return res }

  if (!existsSync(join(ROOT, '..', repo, '.git'))) { res.verdict = 'UNVERIFIED'; res.note = 'repo chưa được clone'; return res }
  if (!noFetch) res.fetched = git(repo, 'fetch', 'origin', '--quiet').ok
  const ref = git(repo, 'rev-parse', '--verify', '--quiet', 'refs/remotes/origin/staging').ok ? 'origin/staging' : 'origin/main'
  res.base = ref
  const head = git(repo, 'rev-parse', '--short', ref)
  if (!head.ok) { res.verdict = 'UNVERIFIED'; res.note = `không thấy ${ref}`; return res }
  res.baseCommit = head.out
  if (!git(repo, 'cat-file', '-e', `${res.commit}^{commit}`).ok) { res.verdict = 'UNVERIFIED'; res.note = `commit ${res.commit} không có trong repo`; return res }

  const log = git(repo, 'log', '--oneline', `${res.commit}..${ref}`, '--', ...scope.paths.map(p => `:(literal)${p}`))
  if (!log.ok) { res.verdict = 'UNVERIFIED'; res.note = 'git log lỗi'; return res }
  const lines = log.out ? log.out.split('\n') : []
  res.changed = lines.length
  res.recent = lines.slice(0, 5)
  res.verdict = lines.length ? 'STALE' : 'CURRENT'
  return res
}

const results = repos.map(check)
if (json) {
  console.log(JSON.stringify({ repos: results }, null, 2))
} else {
  for (const r of results) {
    const detail = r.verdict === 'NO_STORE' ? `chưa có ${r.dir}/`
      : r.verdict === 'INCOMPLETE' ? `thiếu ${r.missing.length}/9 file: ${r.missing.join(', ')}`
      : r.verdict === 'UNKNOWN_SCOPE' ? 'timestamp không có commit hoặc analyzed.paths'
      : r.verdict === 'UNVERIFIED' ? r.note
      : r.verdict === 'STALE' ? `${r.changed} commit chạm vùng đã quét kể từ ${r.commit} (${r.base} @ ${r.baseCommit})`
      : `không đổi từ ${r.commit} (${r.base} @ ${r.baseCommit}), kind ${r.kind ?? '?'}`
    console.log(`${r.repo.padEnd(12)} ${r.verdict.padEnd(13)} ${detail}`)
    for (const l of r.recent) console.log(`${' '.repeat(26)}${l}`)
  }
  if (!noFetch && results.some(r => r.commit && !r.fetched)) console.log('Lưu ý: git fetch không chạy được ở một số repo, kết quả so với bản fetch lần trước.')
}
