---
name: comet-next
description: 'Offer the next step as a selection instead of a typed command. Use when a Comet phase skill (comet-open, comet-design, comet-build, comet-verify, comet-archive, comet-hotfix, comet-tweak) or comet-assign has finished and would tell the user to run the next /comet-... command by hand, or when the user types /comet-next.'
---

# Comet Next

Replaces "now run `/comet-build`" with a select box. It only reads state and routes: it advances no phase, runs no phase work and writes nothing. The skill it loads does the work. Talk to the user in Vietnamese.

Comet's `auto_transition: false` stays: nothing starts without the user's choice. Only the way the choice is asked changes, from typing a command to picking an option. This is not a Comet phase, so do not run `comet resume-probe`.

## 1. Read where the change stands

```bash
node scripts/next-step.mjs [<change>]
```

The change is the one the finished skill worked on. With no name, the script picks the only active change; if it prints `{"choose": [...]}` ask which one (`AskUserQuestion`, at most 4 options, more through Other); `{"changes": []}` means nothing is open, go to step 3 with "mới".

It prints `phase`, `workflow` (`full`, `hotfix`, `tweak`), `next.kind` and `next.skill`, `tasks`, `repos` and `unassigned` (repos of the change with nobody assigned). On `{"error": ...}` show the message and stop.

## 2. Build the options

One question, "Tiếp theo làm gì?", with the change name, phase and task progress in its text. Options in this order, at most 4 (leave out what does not apply; the user can always type something else through Other):

1. **The next Comet step**, when `next.kind` is `skill`. Label by `next.skill`:

   | `next.skill` | Label |
   |---|---|
   | `comet-design` | Sang thiết kế (`/comet-design`) |
   | `comet-build` | Bắt đầu / tiếp tục build (`/comet-build`) |
   | `comet-verify` | Kiểm tra kết quả (`/comet-verify`) |
   | `comet-archive` | Archive change (`/comet-archive`) |
   | `comet-hotfix`, `comet-tweak` | Làm tiếp (`/<skill>`) |
   | anything else | Tiếp tục (`/<skill>`) |

   Mark it "(Recommended)". The description says what the phase does in one sentence and, for `comet-build`, the build order of `repos`.
2. **Giao việc cho từng repo** (`/comet-assign`), only when `unassigned` is not empty; the description names those repos.
3. **Cập nhật codekb sau change này** (`/comet-codekb refresh <change>`), only when the change is archived or `next.kind` is `done` or `delivery`, and `repos` is not empty.
4. **Về menu `/comet-start`**, when the change is archived or done, or when nothing is open.
5. **Dừng ở đây**, always last.

`next.kind` is `wait` (Comet is waiting for its own earlier task) or `unknown`: say so in one line and offer **Làm tiếp change (`comet-classic`)** in place of option 1, because that skill finds and resumes the right phase itself.

If `AskUserQuestion` is not available, print the same options as a numbered list and wait for the answer.

## 3. Route

Load the chosen skill with the Skill tool, passing the change name:

- the next step: load `next.skill`, "Resume change `<change>`";
- giao việc: load `comet-assign` for the change;
- codekb: load `comet-codekb` with "refresh `<change>`";
- menu: load `comet-start`;
- làm tiếp: load `comet-classic`, "Resume change `<change>`";
- dừng: say nothing more than that the change stays where it is and which command resumes it.

After the hand-off the loaded skill owns the flow. When it finishes it calls this skill again, so do not repeat the menu here.
