---
name: comet-codekb
description: 'Build or refresh the code knowledge base (docs/codekb/<repo>/, the 9 files of the AWS AI-DLC Reverse Engineering stage) for the sibling repos lms-package, lms-be, ops-fe, lms-fe. Use when the user types /comet-codekb, when /comet-start reports a repo with codekb NO_STORE / INCOMPLETE / STALE, or after /comet-archive to refresh the areas a change touched.'
---

# Comet Codekb

Runs the **AWS AI-DLC stage 2.1 Reverse Engineering** on the sibling repos and keeps the result in `docs/codekb/<repo>/`. The codekb is the shared, verified picture of the code that `/comet-open`, `/comet-design`, `/comet-build` and `/comet-tech-design` read for context (see CLAUDE.md "Code knowledge base"). Same method and store layout as `upbase-specs/domain/codekb/`.

Talk to the user in Vietnamese. Artifact prose is Vietnamese; keep code identifiers, paths, `repo:path:line` and the section headings of the AWS templates in English (tools parse them).

The AWS stage is copied verbatim in `aidlc/` (see `aidlc/README.md`); **do not edit those files**. They were written for an engine this repo does not install, so read them through this table:

| AWS stage text | Here |
|---|---|
| `{{INVOKE}} engine ...`, `aidlc-state.ts`, `aidlc-log.ts`, `aidlc-utility.ts`, `codekb-snapshot`, `codekb-publish`, link receipts, `orchestrate report`, approval gate | Not used. Skip them. |
| `aidlc/spaces/<space>/codekb/<repo>/` | `docs/codekb/<repo>/` (write the 9 files there directly, no staging directory) |
| `codekb-scope-diff` verdicts NO_STORE / CURRENT / STALE / UNVERIFIED / UNKNOWN_SCOPE | `node scripts/codekb-status.mjs [repo] --json`; same names, plus INCOMPLETE (a file of the 9 is missing) |
| fingerprint line in Scope of Analysis | `fingerprint: unknown (không cài engine; độ mới = commit + analyzed.paths)` and add a `commit:` line to the block |
| `<record>`, `intent` | `intent:` = the change name when refreshing for one, else `codekb` |
| pipeline of developer then architect agents | **Lead-only path**: one subagent per repo does the scan and writes the 9 files (Step 3 "lead-only" in the stage) |
| harness dirs to skip (`.claude/` …) | In these repos `.claude/` holds the repo's own conventions: do not scan or copy it, but point to it (see Step 3) |

## 1. Which repos

- Arguments name repos (`lms-be`, …) or `refresh <change>`; otherwise run `node scripts/codekb-status.mjs --json` and show one line per repo with its verdict.
- `refresh <change>`: take the repos from the `[<repo>]` groups of `openspec/changes/<change>/tasks.md` (or its archive copy) and the paths from the `repo:path` the change's design.md and tasks.md mention. That is a focused scan.
- No repo named and several need work: ask with `AskUserQuestion` (multiSelect) which repos to run, default every repo that is not CURRENT.

## 2. Decide per repo (stage "Rerun guard")

Use the verdict from the script and ask with `AskUserQuestion`, one question per repo, options as in the stage file:

- `NO_STORE` / `INCOMPLETE` / `UNKNOWN_SCOPE`: **Full scan** or **Focused scan** (name the area).
- `CURRENT`: **Reuse** (nothing to do for this repo), Full rescan, or Focused scan.
- `STALE` / `UNVERIFIED`: Full rescan or Focused scan; show the `recent` commits the script lists.

Focused scan merges into the store: update or extend the sections of the new area, keep prose outside it, union `analyzed.paths` when CURRENT, and when STALE/UNVERIFIED demote the old `analyzed.paths` to `shallow.paths` (stage Step 3, "Choose the write behavior"). Full rescan replaces all 9 files.

## 3. Scan and write (one foreground subagent per repo, parallel for several)

Brief each subagent with: the repo path (`../<repo>`), breadth (full or the named area), depth Minimal unless the user asks more, and these rules.

- **Read `origin/<base>`, never the working tree.** The sibling repos usually sit on a feature branch. Run `git -C ../<repo> fetch origin`, take `<base>` = `staging` when `origin/staging` exists, else `main` (the same one the status script reports), and read with `git -C ../<repo> show|grep|ls-tree origin/<base>:<path>`. Do not check out. In Git Bash prefix `MSYS_NO_PATHCONV=1`.
- First read `aidlc/reverse-engineering.md` Steps 2 and 3, `aidlc/re-artifacts.md` (templates for the scan, the 9 files and the Scope of Analysis block) and `aidlc/code-analysis-guide.md` (what to skip), and follow them with the table above.
- Read the repo's own conventions first and point to them instead of copying: `lms-be` `CLAUDE.md` → `openspec/README.md`, `openspec/conventions/*`; `ops-fe` and `lms-fe` `.claude/CLAUDE.md`, `.claude/rules/`, `.claude/inventory/`; `lms-package` `README.md`. `architecture.md` and `code-structure.md` link to them.
- Every claim carries `file:line`. A claim it cannot confirm in code is not written as fact.
- CodeGraph (`codegraph callers|explore|query <symbol> -p ../<repo>`) may help the subagent find symbols and call paths, but it indexes the **working tree**, not `origin/<base>`. Every line the subagent cites must be read again with `git show origin/<base>:<path>`; the codekb records `origin/<base>`.
- `architecture.md` has its own section for infrastructure limits that bite every feature (tenant / RLS, auth and permission flow, cache keys, idempotency, transactions, every write path to the main tables).
- `reverse-engineering-timestamp.md`: Run Record (date, `origin/<base>` commit, the exact way it read the code), a `## WIP branches` section listing unmerged remote branches that touch the area (`git branch -r --sort=-committerdate`; they are not existing code), and the `## Scope of Analysis` block last, with `commit:` (short hash of `origin/<base>` at scan time), `kind`, honest `analyzed.paths` (a file read only in part is written `path#Lx-Ly`) and `shallow.paths`. The status script reads exactly this block.
- A large repo: the subagent may split by module group, foreground, and writes only after all parts return.
- Deeper area notes go in `docs/codekb/<repo>/areas/<area>.md`; register the area in the README catalog first.
- Dispatch prompt must say the subagent has no access to this conversation or to CLAUDE.md files and must read the repo's conventions file as its first step.

## 4. Verify and index

1. `node scripts/codekb-status.mjs <repo> --no-fetch` for every repo written must print `CURRENT`. Anything else: fix the timestamp block or the missing file, do not report success.
2. Update `docs/codekb/README.md` (create it from the layout below when absent): the store table row (repo, commit, kind, verified date, intent), the area catalog, and the "Bức tranh xuyên repo" table, one line per cross-repo fact found (tenant, 403 handling, cache, auth…) pointing to each repo's `architecture.md`.
3. Report per repo: path, kind, commit, what was covered deeply and what only shallowly, anything the code contradicts in the PO repo's KB (`../uplnd_po_workflow/domain/`). Nothing is committed: the user reviews and commits.
4. Then ask with `AskUserQuestion` "Tiếp theo làm gì?": **Về menu `/comet-start`** (load the `comet-start` skill with the Skill tool) or **Dừng ở đây**. No change is involved here, so do not load `comet-next`.

README layout:

```
# codekb
Bản chụp code đã kiểm, dùng lại cho mọi change. Sinh bởi /comet-codekb (AWS AI-DLC Reverse Engineering).
CURRENT khi `git log <commit>..origin/<base> -- <analyzed.paths>` rỗng (`node scripts/codekb-status.mjs`).
## Bức tranh xuyên repo        | Chủ đề | Tóm tắt | Chi tiết |
## Store chuẩn AWS (9 file)    | Repo | Commit origin/<base> | kind | verified_date | Intent |
## Danh mục vùng (areas/)      | Area | Repo chính | Mô tả |
```

## Limits

- Writes only under `docs/codekb/`. Never edit a sibling repo, never check out or pull there (`git fetch` only).
- One rule from the stage still holds: record what was **actually** verified deeply, not what was aimed for.
