---
name: comet-start
description: 'Developer entry point of Uplnd-comet. Use when the user types /comet-start or asks where to begin: it reads the approved PRDs of the PO repo, shows which already have changes, offers Continue a change / New feature / Hotfix / Tweak, then hands off to the matching Comet skill.'
---

# Comet Start

A menu in front of the Comet phases. It only reads and routes: it writes no state, creates no change and runs no phase itself. The skill it hands off to does the work.

This is an explicit Comet entry. Do not run `comet resume-probe`. Talk to the user in Vietnamese.

## 1. Read the state

From the repo root run:

```bash
node scripts/prd-status.mjs --json
```

- If it exits non-zero or prints `{"error": ...}`, show the message and stop (usually the PO repo `../uplnd_po_workflow` is not cloned).
- Show freshness warnings from `source`, but never pull or switch branches for the user:
  - `fetched: false` → the remote could not be checked, the list may be old.
  - `behind > 0` → the PO repo is N commits behind its remote; tell the user to run `git -C <source.path> pull` if they want the newest PRDs.
  - `branch` is not `main` → say which branch the PRDs are read from.
- Also run `node scripts/codekb-status.mjs --json --no-fetch` (no fetch, to stay fast; the verdict is against the last fetched `origin`). Print one line with the verdict per repo. For any repo that is not `CURRENT`, say it and that `/comet-codekb` builds or refreshes it, because the change's design and build read `docs/codekb/<repo>/` for context. Never run `/comet-codekb` from here and never block the menu on it; if the script fails, skip the line.
- Print a short summary: one line per PRD (`code`, name, version, and its state: `new` = no change yet, `in-progress` = has open changes, `has-archived` = only archived changes), its technical design (`techDesign.state`: `ready` = có, `template` = file chỉ là template trống, `missing` = chưa có; plus `feTechDesign` when `fe-technical-design.md` exists), the open changes under each PRD with phase and task progress, and the `unlinked` changes (no `PRD:` line in their proposal).

## 2. Ask what to do

If the user already said what they want in the command (for example `/comet-start hotfix lỗi X`), skip the menu and route directly.

Otherwise use `AskUserQuestion` with one question, "Bạn muốn làm gì?", and these options in this order. Leave out an option that cannot apply (no open changes → no "Làm tiếp"):

1. **Làm tiếp một change** — "Tiếp tục change đang dở, đúng phase của nó. Hiện có N change đang mở."
2. **Tính năng mới từ PRD** — "Mở change mới cho một PRD, đủ proposal, specs, design, tasks. Hiện có M PRD chưa có change." (`/comet-open`)
3. **Hotfix** — "Sửa lỗi cục bộ, không cần design doc." (`/comet-hotfix`)
4. **Chỉnh nhẹ** — "Chỉnh nhẹ trong một change, không cần design doc." (`/comet-tweak`)

If `AskUserQuestion` is not available, print the same menu as a numbered list and wait for the answer.

## 3. Route

**Làm tiếp một change.** Ask which change (one option per open change, label = name, description = phase and tasks; with more than 4, print the full list and let the user type a name through Other). Then **load the `comet-classic` skill with the Skill tool**, passing "Resume change `<name>`". Classic finds the phase and loads the right phase skill.

**Tính năng mới từ PRD.** Ask which PRD (one option per PRD, `new` first; a PRD that already has changes is still allowed, because one PRD yields several changes; with more than 4, print the list and let the user type a code). If the PRD file does not exist (`prdFileExists: false`), say so and ask for its path.

Then check the PRD's technical design (`techDesign.state`):

- `ready`: continue.
- `missing` or `template`: say it in Vietnamese (no technical design yet, or the file is still the empty template) and, when `feTechDesign.exists`, that `fe-technical-design.md` already exists (N lines). Ask with `AskUserQuestion`, leaving out the option that does not apply:
  1. **Soạn technical design** — "AI soạn bản nháp `tech-design.md` trong repo PO, trên nhánh riêng, không commit hay push." → **load the `comet-tech-design` skill with the Skill tool**, passing the intent, PRD code, version and `prdFile`. When it finishes it asks the user its own next-step question (menu or stop); do not go on to `comet-open` in this turn.
  2. **Dùng fe-technical-design.md hiện có** — only if it exists; continue and treat it as the technical design.
  3. **Bỏ qua, mở change luôn** — continue without technical design; tell the user the change's design.md will have to settle the technical choices itself.
  4. **Dừng** — end here.

Then **load the `comet-open` skill with the Skill tool**, passing:

- the PRD code, name, version and the absolute `prdFile` path, as the source of requirements: read it first and do not ask again what it already decides;
- the technical design files that exist (`techDesign.file` when `ready`, `feTechDesign.file` when it exists) and the PO repo commit (`source.commit`): read them first, and the change's design.md must open with a line `Tech design: <path> @ <commit>` and reference them instead of restating them;
- the changes that PRD already has (names and phases), so scope is not duplicated;
- "put the line `PRD: <code>` right after the title of proposal.md";
- "name the change `<module>-<name>` with no repo in it, group tasks as `## N. [<repo>] …`, write artifacts in Vietnamese; all as in CLAUDE.md";
- "when the artifacts are written, before you tell the user to run `/comet-design`, load the `comet-assign` skill with the Skill tool for this change, so the user says who takes each repo".

**Hotfix / Chỉnh nhẹ.** Load `comet-hotfix` or `comet-tweak` with the Skill tool, passing the user's description if there is one. If the fix belongs to a PRD, the user may say so; then it gets the same `PRD:` line.

After the hand-off, the loaded skill owns the flow. Do not repeat the menu.
