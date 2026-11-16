#!/usr/bin/env node
// Keeps openspec/specs/<product>/<module>/<capability>/spec.md working with `openspec archive`.
//
// `openspec archive` only reads flat paths: deltas at changes/<c>/specs/<cap>/spec.md are merged into
// openspec/specs/<cap>/spec.md. A nested delta is skipped with a non-blocking "No deltas found" warning and the
// change still archives, so the main spec silently never gets updated. Capability names are unique across
// openspec/products.yaml, so the flat name is enough to find the nested home.
//
//   flatten <change>  before /comet-archive: move each main spec the change touches to the flat path
//   nest              after  /comet-archive: move every flat spec back to its registry path
//   check             registry and folders agree, names unique, nothing left flat
//
// Node port of product-ups/scripts/openspec-specs.sh (that one needs ruby, which Windows machines lack).
// products.yaml is read line by line (see the format note at the top of that file), not with a YAML parser.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SPECS = join(ROOT, 'openspec', 'specs')
const REGISTRY = join(ROOT, 'openspec', 'products.yaml')

const fail = (msg) => console.error(msg)

// [{ product, module, capability }] in file order
function registry() {
  const out = []
  let product = null
  let module = null
  for (const line of readFileSync(REGISTRY, 'utf8').split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line)) continue
    let m
    if ((m = line.match(/^ {2}([\w.-]+):\s*$/))) { product = m[1]; module = null }
    else if ((m = line.match(/^ {6}([\w.-]+):\s*$/))) module = m[1]
    else if ((m = line.match(/^ {10}([\w.-]+):/)) && product && module) out.push({ product, module, capability: m[1] })
  }
  return out
}

// product keys, including products that have no module yet
const products = () =>
  readFileSync(REGISTRY, 'utf8').split(/\r?\n/).flatMap((l) => (l.match(/^ {2}([\w.-]+):\s*$/) ? [l.trim().slice(0, -1)] : []))

const targetOf = (cap) => {
  const r = registry().find((x) => x.capability === cap)
  return r && `${r.product}/${r.module}/${r.capability}`
}

const subdirs = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory()) : [])

function findSpecs(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? findSpecs(join(dir, e.name)) : e.name === 'spec.md' ? [join(dir, e.name)] : [],
  )
}

// SPECS/<x>/spec.md where <x> is not a product folder — i.e. a spec sitting at the flat location
function flatSpecs() {
  const prods = new Set(products())
  return subdirs(SPECS).filter((n) => !prods.has(n) && existsSync(join(SPECS, n, 'spec.md')))
}

function flatten(change) {
  const changeDir = join(ROOT, 'openspec', 'changes', change)
  if (!existsSync(changeDir)) { fail(`no change: ${change}`); return 1 }
  const dir = join(changeDir, 'specs')
  if (!existsSync(dir)) { console.log(`${change} has no delta specs`); return 0 }

  let bad = 0
  for (const f of findSpecs(dir)) {
    const rel = relative(dir, f).split(sep)
    if (rel.length !== 2) {
      fail(`nested delta (openspec ignores it): ${relative(ROOT, f)}`)
      fail(`  fix: git mv ${relative(ROOT, dirname(f))} ${relative(ROOT, join(dir, rel[rel.length - 2]))}`)
      bad = 1
    }
  }
  if (bad) return 1

  const caps = subdirs(dir)
  for (const cap of caps) {
    if (!targetOf(cap)) { fail(`${cap}: not in openspec/products.yaml — add it under its module before archive`); bad = 1 }
  }
  if (bad) return 1

  for (const cap of caps) {
    const t = targetOf(cap)
    const nested = join(SPECS, ...t.split('/'))
    if (existsSync(join(nested, 'spec.md'))) {
      mkdirSync(join(SPECS, cap), { recursive: true })
      renameSync(join(nested, 'spec.md'), join(SPECS, cap, 'spec.md'))
      try { rmdirSync(nested) } catch { /* not empty: keep */ }
      console.log(`flattened ${t} -> ${cap}`)
    } else {
      console.log(`${cap}: new capability, archive will create openspec/specs/${cap}`)
    }
  }
  return 0
}

function nest() {
  let bad = 0
  for (const cap of flatSpecs()) {
    const t = targetOf(cap)
    const dest = t && join(SPECS, ...t.split('/'))
    if (!t) { fail(`openspec/specs/${cap}: not in openspec/products.yaml — add it under its module, then rerun nest`); bad = 1 }
    else if (existsSync(dest)) { fail(`openspec/specs/${cap}: target openspec/specs/${t} already exists`); bad = 1 }
    else {
      mkdirSync(dirname(dest), { recursive: true })
      renameSync(join(SPECS, cap), dest)
      console.log(`nested ${cap} -> ${t}`)
    }
  }
  return bad
}

function check() {
  let bad = 0
  const reg = registry()

  const counts = new Map()
  for (const r of reg) counts.set(r.capability, (counts.get(r.capability) ?? 0) + 1)
  const dups = [...counts].filter(([, n]) => n > 1).map(([c]) => c)
  if (dups.length) { fail(`duplicate capability names: ${dups.join(' ')}`); bad = 1 }

  const flat = flatSpecs()
  if (flat.length) { fail(`flat specs left (run nest): ${flat.join(' ')}`); bad = 1 }

  const want = new Set(reg.map((r) => `${r.product}/${r.module}/${r.capability}`))
  const have = new Set(
    findSpecs(SPECS)
      .map((f) => relative(SPECS, f).split(sep))
      .filter((p) => p.length === 4)
      .map((p) => p.slice(0, 3).join('/')),
  )
  for (const w of want) if (!have.has(w)) { fail(`registry only: ${w}`); bad = 1 }
  for (const h of have) if (!want.has(h)) { fail(`disk only: ${h}`); bad = 1 }

  if (!bad) console.log(`ok: ${have.size} specs match openspec/products.yaml`)
  return bad
}

const [cmd, arg] = process.argv.slice(2)
const usage = () => { fail(`usage: ${basename(process.argv[1])} flatten <change> | nest | check`); return 64 }
process.exit(cmd === 'flatten' ? (arg ? flatten(arg) : usage()) : cmd === 'nest' ? nest() : cmd === 'check' ? check() : usage())
