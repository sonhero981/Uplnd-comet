# UpLnD — Spec & Workflow Repo

> Specs, change tracking and Comet state for UpLnD (UpBase's LMS). This repo holds no application code:
> code lives in the sibling repos below, and every change is designed and tracked here.

---

## Workflow: Comet Classic (OpenSpec + Superpowers)

```
open → design → build → verify → archive
```

- `/comet-open` → `/comet-design` → `/comet-build` → `/comet-verify` → `/comet-archive`; lighter presets `/comet-hotfix`, `/comet-tweak`.
- `auto_transition: false` (`.comet/config.yaml`): Comet does **not** start the next phase by itself — run each command yourself.
- Phase guard: read `.comet.yaml` `phase` of the change before any operation. No implementation writes in `open`, `design`, `verify`, `archive`.
- Settings: `artifact_layout: legacy` (OpenSpec at `openspec/`, Superpowers docs at `docs/superpowers/`), `memory.learning: false`.
- Setup on a new machine: `npm install -g @rpamis/comet`, then `comet init --yes --workflow classic --platform claude --scope project --skip-existing --codegraph skip --language en` and `comet doctor`. `.claude/settings.local.json` is generated per machine and is not committed. On Windows run `init` from a path whose drive letter is uppercase (`E:\...`): Comet 0.5.2 compares the hook path case-sensitively, so a lowercase `e:\...` makes `comet doctor` report "managed Hook missing".

---

## Layout

```
openspec/
  products.yaml                         # product → module → capability → repos registry (read by scripts/openspec-specs.mjs)
  changes/<module>-<repo>-<name>/       # active changes; archived copies get a YYYY-MM-DD- prefix under changes/archive/
    .comet.yaml                         # Comet phase tracker
    specs/<capability>/spec.md          # delta specs stay FLAT — openspec archive silently skips nested deltas
  specs/<product>/<module>/<capability>/spec.md   # archived main specs, grouped by product, not by repo
docs/superpowers/{specs,plans,reports}/ # Design Docs, build plans, verification reports
scripts/                                # openspec-specs.mjs (flatten/nest/check) and hooks/
```

Naming: a change is `<module>-<repo>-<name>` — module slug plus the **primary** repo; when a change touches several repos, name it after the primary one and list the rest in `proposal.md`.

**Archive and specs.** `.claude/settings.json` hooks wrap every `comet archive <change>` Bash call (`scripts/hooks/comet-archive-specs.mjs`): before it, `flatten <change>` moves each main spec the change touches to `openspec/specs/<capability>/` and blocks the archive on a nested or unregistered delta; after it (success or failure), `nest` moves flat specs back to `<product>/<module>/<capability>/` and `check` verifies the registry. So `/comet-archive` needs only:

1. Before archive, register any new capability in `openspec/products.yaml` (with `repos`, `features`). The file is read line by line — keep the indentation documented at its top.
2. After archive, stage the moved spec paths with the archive commit.

Outside Claude Code (no hooks), run `node scripts/openspec-specs.mjs flatten <change>` → `comet archive <change>` → `nest` → `check` by hand.

---

## Sibling Repos

Build order for a change that spans repos: `lms-package` → `lms-be` → `ops-fe` → `lms-fe`.

| Repo | Code path | Stack | Conventions to read first |
|---|---|---|---|
| `lms-package` | `../lms-package/packages/` | shared `@upbase-tech/*`, pnpm + turbo | `README.md` (no `.claude/CLAUDE.md` on `main`) |
| `lms-be` | `../lms-be/apps/` | NestJS · Nx · TypeORM · Kafka | `CLAUDE.md` → `openspec/README.md` |
| `ops-fe` | `../ops-fe/{apps,features,libs}/` | Vite · React Router · pnpm monorepo | `.claude/CLAUDE.md`, `.claude/rules/` |
| `lms-fe` | `../lms-fe/apps/` | Next.js 14 (lms-pro, lms-test, lms-zoom) | `.claude/CLAUDE.md`, `.claude/rules/` |

When exploring or designing a change, navigate to the relevant repo and load its own conventions file before designing.

**During `/comet-build`, this does not happen automatically.** Every implementer/reviewer/fix subagent runs in a fresh, isolated context and does not inherit this CLAUDE.md or the target repo's. So every dispatch prompt sent into a sibling repo — implementer, reviewer and fix agent alike — must explicitly instruct the subagent to read that repo's own `CLAUDE.md` (or the file in the last column) as its first step.

Per `UP_BASE/HUONG-DAN-VAN-HANH.md`, `lms-be` is not on Comet yet (it keeps the legacy `/opsx` flow inside its own repo, because Comet 0.5.2 rejects repos with a root `*.lock` file). A change here that needs `lms-be` work is tracked in this repo; the `lms-be` implementation follows that repo's own flow.

---

## Open Items

- `comet.yaml` (guard `build_command`) is not set yet. This repo has no build target, so guard auto-detection finds nothing; set `build_command` to the build of the primary sibling repo you work on (see how `product-ups/comet.yaml` does it) before the first `comet guard <change> build`.
- `openspec/products.yaml` has no modules yet — add the first module and capabilities with the first change.

<comet-ambient-resume>
<!-- Managed by Comet. Edits inside this block may be replaced by comet init/update. -->
<!-- Contract: comet.resume_probe.v2 -->

## Comet Ambient Resume

In this repository, before starting work that may need code changes or investigation, pass the current user request to the read-only probe when a Comet workflow may already be active: `comet resume-probe . --stdin --json`.

- If the user explicitly invokes any Comet Skill through the host (for example, `@comet`, `/comet`, `@comet-native`, or `/comet-hotfix`), that explicit invocation takes precedence over this resume protocol; do not run the resume probe, and enter the invoked Skill directly.
- If the user explicitly invokes a non-Comet skill or slash command through the host, the task intent is already explicit in that invocation: do not run the resume probe, and execute the invoked skill directly.
- If you are already inside a Comet flow (including while waiting for the user to answer a question you asked in that flow), do not run the resume probe; treat replies such as option picks as continuation of the current change and proceed directly with the chosen option.
- Trust only the returned `workflow`, `skill`, and `entrySource`; project configuration or the no-config compatibility fallback alone selects them. Do not scan or switch to the other workflow.
- If the probe returns `auto_resume`, briefly state the selected active change and enter the permanent entry in `nextCommand`. Do not treat a state command as the resume entry or advance it blindly.
- If the probe returns `ask_user`, ask one short question and wait.
- If the current request did not explicitly invoke a Comet Skill and the probe returns `out_of_scope` or `none`, do not enter the Comet workflow.
- An `out_of_scope` or `none` result only means do not enter the Comet workflow for this new request; it never pauses or exits a Comet flow that is already in progress.
- If configuration or state is invalid and `nextCommand` is absent, stop and report the reason; do not guess another workflow.
- Never attach unrelated work merely because an active change exists. The Native entry inspects uncommitted work; the probe does not attribute it automatically.
</comet-ambient-resume>
