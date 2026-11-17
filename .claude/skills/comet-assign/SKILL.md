---
name: comet-assign
description: 'Assign who does each repo group of a change. Use when the user types /comet-assign, or right after /comet-open has written tasks.md: it asks who takes each repo (suggesting people from openspec/team.yaml) and records the answer in the change''s assignees.yaml.'
---

# Comet Assign

Asks who takes each repo of a change and records it. It changes no phase, no tasks and no `tasks.md`: the answer goes only to `openspec/changes/<change>/assignees.yaml` through `scripts/assignees.mjs`, so Comet's task tracking is untouched. Talk to the user in Vietnamese.

This is not a Comet phase, so do not run `comet resume-probe`. Run it as often as needed: after `/comet-open`, or later to reassign.

## 1. Which change

The change name may come from the command or from `/comet-start`. Otherwise run `node scripts/changes.mjs`, and when more than one change is open ask which one (`AskUserQuestion`, one option per change, at most 4; more go through Other).

## 2. Read the current state

```bash
node scripts/assignees.mjs show <change>
node scripts/assignees.mjs team
```

- If `show` exits non-zero because `tasks.md` has no `## N. [<repo>]` groups, say so and stop: groups come from `/comet-open`, and the rule in `openspec/config.yaml` makes it write them.
- Show the user the `show` output: each group with its repo, task count and current assignee.

## 3. Ask repo by repo

Ask once per **repo** that has groups, in build order (`lms-package`, `lms-be`, `ops-fe`, `lms-fe`), not once per group: a repo often has several groups for the same person. For each repo use `AskUserQuestion`:

- Question: "Repo `<repo>` (N nhóm, M task) giao cho ai?"
- Options, in this order and at most 4:
  1. People from `team` whose `repos` include this repo (at most 2), label = name, description = role. Mark the current assignee "(hiện tại)".
  2. **Chia theo nhóm**: only when the repo has more than one group.
  3. **Để sau**: leave it as it is.
- Anything else the user types through Other is a name; accept it as typed.

When the user picks **Chia theo nhóm**, ask once per group of that repo in the same way (options: the same people, **Giữ như repo**, **Để sau**).

## 4. Record

For each answer run one command; do not write the yaml yourself:

```bash
node scripts/assignees.mjs set <change> --repo <repo> "<name>"      # every group of the repo
node scripts/assignees.mjs set <change> --group <N> "<name>"        # one group (overrides the repo)
node scripts/assignees.mjs unset <change> --repo <repo>             # back to nobody
```

`set --repo` also clears that repo's group overrides, so the repo has one person again. If the script exits non-zero show its message and ask again; never edit `assignees.yaml` or `tasks.md` by hand.

## 5. Finish

Run `node scripts/assignees.mjs show <change>` and show it. Say that:
- a name not in `openspec/team.yaml` is accepted but not remembered; add the person to that file to get them as a suggestion next time;
- nothing was committed, and no Jira issue was created.

Then load the `comet-next` skill with the Skill tool for this change, so the user picks the next step from a menu instead of typing it.
