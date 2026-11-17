# Tasks

All work is in `lms-fe` (`apps/lms-pro`). Read `lms-fe/.claude/CLAUDE.md` and `.claude/rules/` first. `lms-fe` has no test runner, so each task is verified by a browser check on `pnpm dev:lms-pro` (port 3000) or by the commands named in it. Run `pnpm --filter lms-pro check-types` once at the end only (rules/08).

## 1. [lms-fe] Inputs

- [ ] 1.1 Put the three agreed inputs into code constants (User Guide URL `https://uplms.gitbook.io/uplms/gamification`, end date 2026-12-18 +07:00) and add the UPLND-398 attachment image to the app (compressed or converted to WebP, hosted on the CDN under `linkCdnMktInApp` or in `libs/assets`); verify the image loads in the browser and is far smaller than the 1.69 MB original, and the User Guide URL opens in a browser

## 2. [lms-fe] Display rules

- [ ] 2.1 Add a helper that returns the current week key (Monday `YYYY-MM-DD` in Vietnam time, fixed +07:00 with the existing `dayjs` `utc` plugin) and safe read/write of the per-user seen record in `localStorage` (`try/catch`, never throws); verify in the browser console that 2026-11-22 23:59 +07 and 2026-11-23 00:00 +07 give different keys, two times on the same Monday give the same key, and a blocked `localStorage` makes the helper report "not shown" without an error
- [ ] 2.2 Add the eligibility logic: `ready && visible` from `useGamificationVisibility()`, a known non-empty user id, current time before the end-date constant, current path not in the suppressed list (test and case-study pages, `/event-test`, `/courses/test/*`, `/explanation/*`, `/courses/<id>/activity/*`; public certificate pages already excluded in `client-layout.tsx`), and seen record not equal to this week's key; confirm the suppressed list against `apps/lms-pro/src/app/` routes; verify with a teacher account and a student whose Gamification is hidden that the popup never mounts

## 3. [lms-fe] Popup UI and mount

- [ ] 3.1 Build the popup component in `apps/lms-pro/src/components/` following `ModalMarketingInApp` (overlay, centered image, fade): image click opens the User Guide in a new tab (`noopener,noreferrer`) and closes the popup, a visible Vietnamese-labelled close button closes without navigating, the seen record is written when the popup is displayed; verify by clicking the image (new tab opens on the User Guide URL) and the close button (no navigation) on a student account
- [ ] 3.2 Mount the component once in `apps/lms-pro/src/app/client-layout.tsx` next to `GamificationRealtime`; verify the popup appears on the first load of the week on `/courses` and, after reload, does not appear again until the seen record is cleared
- [ ] 3.3 Check responsive layout at 1440, 768 and 375 px wide with browser screenshots; verify the image fits the viewport with no horizontal scroll and the close button is reachable at every width

## 4. [lms-fe] Acceptance checks

- [ ] 4.1 Walk every scenario in `specs/uplnd/learning-experience/feature-announcement-popup/spec.md` on a student account with Gamification on (first load, reload, next week by editing the stored week key, second user on the same browser, first load landing on a case-study or activity page then a later allowed page, load after the end date by temporarily lowering the end-date constant); verify each scenario matches and record results in the verification report
- [ ] 4.2 Verify scope: a teacher account and a Gamification-off tenant show no popup, and the component is not imported by `lms-test` or `lms-zoom` (`grep` over `apps/lms-test` and `apps/lms-zoom` finds no reference)
- [ ] 4.3 Run `pnpm --filter lms-pro check-types`, `pnpm lint` and `pnpm build:lms-pro`; verify all three exit with code 0

## Workflow follow-up

- Verify the change, then archive it so the delta spec merges into `openspec/specs/uplnd/learning-experience/feature-announcement-popup/spec.md`, and register the capability in `openspec/products.yaml` (`repos: [lms-fe]`, feature `LMS-F001`).
- Separate cleanup, not part of this change: delete the popup component and its mount line from `client-layout.tsx` after the end date passes.
