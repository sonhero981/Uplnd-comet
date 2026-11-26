---
name: comet-jira
description: 'Tie a change to its Jira stories and sub-tasks. Use when the user types /comet-jira, right after /comet-open has written tasks.md, or to see which stories of a feature no change covers: it reads Jira, records the mapping in the change''s jira.yaml and assignees.yaml, and, only after asking, creates missing sub-tasks and moves finished sub-tasks to Done.'
---

# Comet Jira

Keeps a change in step with the Jira stories the PO already created for the PRD. Jira is the source of truth for stories, sub-tasks, assignees and status; this repo records only references (`jira.yaml`) and who does what (`assignees.yaml`). Talk to the user in Vietnamese.

Not a Comet phase: do not run `comet resume-probe`. It never edits `tasks.md`, `proposal.md`, `design.md` or specs (Comet tracks them by hash and would read it as drift). The `/dev-feature` flow of `ops-fe` and `lms-fe` is not used in this workflow; sub-tasks are created here.

## Tools

Jira is reached only through the Jira MCP, which is deferred. Load what you need once with `ToolSearch`: `select:mcp__jira__jira_search,mcp__jira__jira_get_issue,mcp__jira__jira_get_transitions,mcp__jira__jira_transition_issue,mcp__jira__jira_create_issue,mcp__jira__jira_get_create_fields`. If they are unavailable, say Jira cannot be reached and stop; do not guess keys.

Facts about this Jira (`jira.upbase.asia`, project `UPLND`), seen in the Group feature:
- A story belongs to the PO. Its sub-tasks carry the work: `[BE] - …` with labels `BE`, `<PRD code>` (for example `LMS-F002`), `lms-be`; `[FE] …` with labels `FE`, `<PRD code>`, `ops-fe` or `lms-fe`. The **repo label** matches the `[<repo>]` of a `tasks.md` group, and the **assignee** of a sub-task is who does it.
- Story labels do not reliably carry the PRD code (only some do); sub-tasks do. Find a feature's stories through its sub-tasks.
- `jira_search`: `ORDER BY parent` is rejected; each issue is large, so ask only `fields=summary,status,assignee,labels,parent` and `limit` 15 or less, paging with `start_at`.
- Statuses seen: `New`, `Developing`, `IN STATGING`, `Done`, `Won't Do`. Read the real transitions with `jira_get_transitions` before moving anything.
- **Never touch Story Points.** An automation sets a story's points to the sum of its sub-tasks' points and has overwritten the PO's points twice. Never set or change estimates, descriptions or assignee of a story.

## 1. Which change and feature

The change comes from the command or from `/comet-open`. Otherwise `node scripts/changes.mjs` and ask. Its PRD code is the `PRD:` line of `proposal.md` (for example `LMS-F002`). `/comet-jira coverage` skips to step 2 and stops after printing the gap list.

## 2. Find the stories and who covers them

1. Search sub-tasks: `labels = <PRD code> AND issuetype = Sub-task`, collect the distinct `parent` keys, then read those stories (`key in (…)`). If the PRD code finds nothing, ask the user for the story keys or a JQL.
2. `node scripts/jira-link.mjs covered --json` gives story → changes that already list it. Print a table: story, title, status, assignee, **covered by** (change name or `—`).
3. Stories with `—` are the drift this skill exists to catch: say so. The ones that look like another PRD version's scope (for example added by a change request the PRD in this repo does not have yet) are worth naming.

## 3. Choose the stories this change covers

Propose the stories whose title and sub-tasks fit the change's proposal, goal and user stories (US). Ask with `AskUserQuestion` (multiSelect, at most 4 options; with more candidates print the full list and take the keys through Other). Then record:

```bash
node scripts/jira-link.mjs stories <change> <KEY> <KEY> …
```

A story can already be covered by another change; allowed, but say it.

## 4. Map groups to sub-tasks

Read the sub-tasks of the chosen stories (`parent in (…)`) and `node scripts/jira-link.mjs show <change> --json`. Match each `## N. [<repo>]` group to the sub-tasks with the same repo label and a matching topic; one group may do several sub-tasks, and a sub-task belongs to one group. Show the proposed table (group, repo, sub-tasks, status, assignee) and ask the user to confirm or correct, then record each:

```bash
node scripts/jira-link.mjs group <change> --group <N> <SUBTASK> <SUBTASK> …
```

Sub-tasks left over (Done already or not matched) and groups with none are listed, not forced.

## 5. Assignees from Jira

For each group with sub-tasks, take the distinct assignees' display names and run `node scripts/assignees.mjs set <change> --group <N> "<name>[, <name>]"`. When every group of a repo has the same people, use `--repo <repo>` instead. Groups without sub-tasks stay for `/comet-assign`.

## 6. Missing sub-tasks (write to Jira, ask first)

For a group with no sub-task, offer to create one. Show the exact list first (parent story, summary, repo label, assignee) and create only after the user confirms it once for the whole list. Fields:
- type `Sub-task`, parent = the story chosen for that group;
- summary: `[BE] - <title>` for `lms-be`, `[FE] <title>` for `ops-fe` and `lms-fe`;
- labels: `BE` or `FE`, the PRD code, the repo id;
- the required custom field Activity `customfield_10207` = `Develop`; check `jira_get_create_fields` if creation is refused;
- the sprint follows the parent story; set no estimate and no story points.

Record each created key with `jira-link.mjs group`.

## 7. Status (write to Jira, ask first)

Do this when the user asks, or when a group's tasks are all checked off (`node scripts/assignees.mjs show <change> --json` gives `done` and `total` per group). For the sub-tasks of those groups that are not yet `Done`, read `jira_get_transitions`, show "sub-task → Done" for each, and move them only after the user confirms. Never transition a story, a `Won't Do` sub-task or anything the user did not confirm. If a group's tasks are not all done but Jira says `Done`, report that difference and change nothing.

## 8. Finish

Print `node scripts/jira-link.mjs show <change>`, and list every Jira write made (key and what), or say none. Then load the `comet-next` skill with the Skill tool for this change. For `coverage`, stop after the table.
