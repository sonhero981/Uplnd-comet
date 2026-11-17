---
name: comet-tech-design
description: 'Draft the technical design (tech-design.md) of an approved PRD inside the PO repo, on its own branch, from the approved PRD, the PO repo template and the real code of the sibling repos. Use when /comet-start finds a PRD without technical design, or when the user asks to write or add a technical design for an intent.'
---

# Comet Tech Design

Writes `intents/<intent>/inception/tech-design/tech-design.md` in the PO repo (`../uplnd_po_workflow`, or env `PRD_REPO`) as a **draft for the Tech PIC to review**. It follows the PO repo's own template and rules (stage 2.43 Design Alignment), the same document the Tech PIC writes by hand today. It does not run the `/tech` AI-DLC stages of `upbase-specs`.

Talk to the user in Vietnamese. The document is Vietnamese prose; keep technical terms, code identifiers, paths and codes in English.

## Hard limits

- Write exactly one file: `tech-design.md` of that intent. Do not edit the PRD, `state.md`, `decisions.md`, `intent.md`, reviews, `ux-design.md`, `test-design.md` or `fe-technical-design.md`.
- Never tick a gate (`[x]`), never approve anything. The file stays `status: draft`.
- Never commit, push, stash, or touch a remote in the PO repo. The Tech PIC reviews, edits, commits and pushes.
- Write only when `techDesign.state` is `missing` or `template`. If it is `ready` (a person already wrote content), stop and ask whether to update it or cancel; do not overwrite.

## 1. Which intent

The intent slug comes from `/comet-start` (`prd.intent`). Otherwise run `node scripts/prd-status.mjs --json --no-fetch`, let the user pick a PRD, and use its `intent`, `prdFile`, `version` and `techDesign.state`.

## 2. Prepare the PO repo branch

```bash
node scripts/po-tech-design.mjs prepare <intent>
```

It creates (or reuses) `feature/<intent>-tech-design` from the branch the PO repo is on, and creates the folder. Exit codes:

- `3`: the PO repo has uncommitted changes. Show the message, ask the user to commit or stash there, stop.
- `4`: the PO repo is on another intent's tech-design branch. List local branches that do not end in `-tech-design` (`git -C <PO repo> branch --list`), ask which one is the base (AskUserQuestion, at most 4 options), then rerun with `--base <branch>`.
- other non-zero: show the message and stop.

## 3. Read the inputs (read-only)

In the PO repo:
- the approved PRD (`prdFile`): user stories, acceptance criteria and business rules with their codes, NFRs, hard dates;
- `engine/templates/tech-design.md` (the structure you will fill) and the Tech section of `engine/stages/design-alignment.md`;
- `AGENTS.md` section "Cách làm việc" (Fact / Assumption / Open Question labels, `❓PO`, `[suy ra]`, document style) and `engine/standards/story-splitting.md` section 4;
- `intent.md` (Tech PIC name, profile), and when they exist `inception/ux-design/ux-design.md`, `inception/test-design/test-design.md`, `inception/tech-design/fe-technical-design.md`, `inception/impact-analysis/`, `decisions.md`. If `fe-technical-design.md` exists, align with it and point to it instead of repeating it.

## 4. Ground the design in the real code

Technical design must rest on the code that exists, not on guesses. The repos are siblings of this one (`../lms-package`, `../lms-be`, `../ops-fe`, `../lms-fe`; see `CLAUDE.md`). For each repo the PRD touches:

1. Read that repo's own conventions first (`CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/`, `openspec/README.md`, as listed in `CLAUDE.md`).
2. Read the repo's code knowledge base `docs/codekb/<repo>/` (`architecture.md`, `code-structure.md`, `component-inventory.md`, `api-documentation.md`, and the `areas/*.md` that match the PRD). Run `node scripts/codekb-status.mjs <repo> --no-fetch`; when it is not `CURRENT` (or the store is missing), tell the user, use the codekb only as a hint and read the code itself; suggest `/comet-codekb` afterwards.
3. Find the modules, endpoints, entities and components the user stories would change or reuse. Locate them with CodeGraph where the repo has an index (`codegraph explore "<symbols>" -p ../<repo>`, `codegraph callers <symbol> -p ../<repo>`, `codegraph impact <symbol> -p ../<repo>`; name symbols, not topics), then verify the lines you rely on in the code (a codekb or CodeGraph hit is not yet a fact), and note them as `repo:path`.
4. Anything you cannot confirm from code or documents is not written as fact: put it in section 8 as an open question, or mark an inference `[suy ra]`.

Use `AskUserQuestion` only for real forks that change scope, data or architecture (for example reuse an existing table or add one). Give options with consequences; do not decide for the Tech PIC.

## 5. Write the file

Create `intents/<intent>/inception/tech-design/tech-design.md` from the template, all eight sections, in this order:

1. Thành phần bị chạm: repo or service, what changes, which US.
2. Quyết định kỹ thuật: each decision with context, options considered, choice, consequence (ADR style).
3. Dữ liệu: new or changed entities, relations, migration of old data.
4. API và hợp đồng giữa thành phần: new or changed endpoints, events, contracts with outside systems (drop the section only if nothing applies, say so in one line).
5. Đáp ứng business rule và NFR: one row for every BR and NFR in the PRD, how it is met.
6. Unit of work, thứ tự và độ lớn: units, the US they cover, dependencies, size; flag any story too large for one sprint.
7. Ý kiến về PRD: per code, Đồng ý / Đề xuất sửa / Phản đối with a reason; if none, one line "Đồng ý với PRD bản <version>".
8. Rủi ro và câu hỏi cần chốt: each open point with who must answer and whether it blocks.

Frontmatter: `intent`, `artifact: tech-design`, `feature` (the PRD code), `owner` (Tech PIC from `intent.md`, else leave `Tech PIC`), `version: 0.1`, `status: draft`, `inputs: prd@<version>`. Delete the template's guidance line. Leave no `<...>` placeholder.

Style (PO repo rules): full sentences in written Vietnamese, no bold inside paragraphs, every code followed by its content, codes side by side separated by `·`, cite `repo:path` for code facts. Describe what must hold and the decisions taken; do not write implementation code.

## 6. Finish

Tell the user, in a few lines: the file path, the branch, the open questions in section 8 (blocking ones first), and that nothing was committed or pushed: the Tech PIC reviews and edits the draft, then commits and pushes it. Then ask with `AskUserQuestion` "Tiếp theo làm gì?": **Về menu `/comet-start`** (load the `comet-start` skill with the Skill tool; it will see the technical design, but only the committed one once the Tech PIC has pushed it) or **Dừng ở đây** (to let the Tech PIC review first).
