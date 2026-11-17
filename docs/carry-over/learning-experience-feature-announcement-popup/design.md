---
comet_change: learning-experience-feature-announcement-popup
role: technical-design
canonical_spec: openspec
---

# Design

## Context

See proposal.md for motivation and scope. The work is confined to `lms-fe` / `apps/lms-pro` (read `lms-fe/.claude/CLAUDE.md` and `.claude/rules/` before building).

Facts found in the code that shape the approach:

- `apps/lms-pro/src/app/client-layout.tsx` is a client component that already mounts the Gamification overlays (`GamificationRealtime`, `AchievementCelebration`) and returns nothing on public certificate routes. It is the natural mount point.
- `useGamificationVisibility()` (`@lms/hooks`) only reads the React Query cache that the Gamification bootstrap fills from `/gamification/me`. It exposes `ready` (result settled) and `visible` (feature on, and not a Test Account). Gamification data is only requested for students (`useGamificationData` gates on `isStudent`), so teachers never become `visible`.
- The project already persists small UI flags in `localStorage` (`openBannerPromotional`, `promotional_end_time`, `showPinTrial`), and `ModalMarketingInApp` is a precedent for an image modal using a CDN asset (`linkCdnMktInApp`).
- `dayjs` with the `utc` plugin is already set up in `lms-pro`; the `timezone` plugin is not used anywhere.
- The only "login" signal on the client is `loginHistory` in `userReducer`, a paged list loaded on the My Profile page. It is not a usable "first load this week" signal.
- `excludedPathsHelp` in `@lms/core` looks relevant but is unused, so it cannot be relied on.

## Goals / Non-Goals

**Goals:**
- One self-contained, easily deletable unit: a single popup component plus one line in `client-layout.tsx`, so removal after the end date is a small, safe cleanup.
- No new network request and no backend dependency.

**Non-Goals:**
- A reusable announcement framework, multiple queued popups, or remote configuration. The proposal says content may become dynamic in later phases; that is a separate change.
- Server-side "once per week" accuracy across devices.

## Decisions

**1. App-level component, not a shared lib or the `gamification` feature.** Place it in `apps/lms-pro/src/components/` and mount it from `client-layout.tsx`. The rules say app-only components live under the app and business logic stays out of `libs/`. It is temporary and tied to one release, so keeping it out of `features/gamification` avoids leaving removal debris in a long-lived feature.

**2. Eligibility from the existing visibility hook.** Render only when `ready && visible` from `useGamificationVisibility()`. This reuses the cache, adds no request, hides the popup from teachers, tenants with Gamification off and Test Accounts, and satisfies "not shown while visibility is unresolved". Alternative: show to every `lms-pro` user (the literal ticket wording); rejected by the user because it would advertise a feature the user cannot see.

**3. "Seen this week" in `localStorage`, per user, as a week key.** Key: `feature_popup_gamification_seen:<userId>` (user id from `userReducer`). Value: the Monday date (`YYYY-MM-DD`) of the week in which it was shown. The popup is eligible when the stored value differs from the current week's Monday. Write the value when the popup is displayed, not on click or close. Wrap every read and write in `try/catch`; if storage is unavailable, do not show (fail quiet, never nag on every load). Alternatives: backend flag per user (cross-device but needs `lms-be` work for a throwaway popup), or a timestamp with a 7-day rolling window (rejected by the user in favour of calendar weeks). Do not show before the user id is known, so the record is never written under an empty id.

**4. Calendar week in Vietnam time without the `timezone` plugin.** Vietnam has no daylight saving, so a fixed +07:00 offset is exact: `dayjs().utcOffset(420)`, then Monday = that date minus `(day + 6) % 7` days. This uses only the already-registered `utc` plugin and keeps the week boundary identical for every user regardless of their device time zone.

**5. Fixed end date as a single constant.** One exported constant holds the end date; the component renders nothing and writes nothing once `now` is past it. The end date is a build-time constant, so the popup retires itself with no hotfix, as the ticket asks. The value is not yet known (see Open Questions).

**6. Suppress on pages where an interruption is harmful.** Skip the popup (without recording it as seen) on test and case-study pages (`/case-study/*`, `/event-test`, `/courses/test/*`, `/explanation/*`), on learning-activity pages (`/courses/<id>/activity/*`), and on public certificate pages (already excluded by `client-layout.tsx`). Matching is done with a small local prefix/regex list built from the route table above, since `excludedPathsHelp` is unused and uses `[id]` placeholders that nothing resolves. The list is confirmed against the live route table during build. Because a suppressed load is not recorded, the learner sees the popup on their next allowed page that week. This protection is not in the ticket; it is called out for confirmation in the Open step.

**7. Presentation.** Follow `ModalMarketingInApp` (full-screen overlay, centered image, `AnimatePresence` fade). The image is the click target and opens the User Guide with `window.open(url, '_blank', 'noopener,noreferrer')`; a visible close button dismisses without navigating. The User Guide URL comes from one constant (or an env var if the team prefers per-environment URLs). The image is served from the CDN (`linkCdnMktInApp`) or `libs/assets`, sized responsively so it never overflows mobile or tablet viewports. All user-visible text (alt text, close label) is Vietnamese, matching the app's hard-coded-text convention.

## Approaches Considered

- **A. Self-contained app-level component with a localStorage week key (chosen, approved 2026-11-17).** No new request; one component plus one mount line to delete after the end date.
- **B. Drive it through the shared Redux `Popup` slice or `CourseContext` popup state.** Rejected: ties a throwaway popup into shared state, leaves more to clean up, and no cross-popup coordination is required today.
- **C. Server-driven announcement (`lms-be` flag, endpoint, CMS).** Rejected for now: needs backend work and a migration for a 2-sprint popup; it belongs to the later "dynamic content" phase mentioned in the ticket.

## Risks / Trade-offs

- [`localStorage` is per browser, so another browser or cleared data shows the popup again] → Accepted for a 2-sprint popup; stated in the proposal as the chosen trade-off.
- [User Guide URL or final image not yet supplied] → Both are build-time constants; building cannot finish without them. Tracked in Open Questions.
- [Popup could still collide with another overlay, for example `AchievementCelebration` or the existing welcome/CTA popups] → Mount it once in `client-layout.tsx` with a z-index consistent with `ModalMarketingInApp` (`z-[1050]`) and check on a Gamification-enabled account during Verify; no coordination logic is added unless a real collision is seen.
- [Route suppression list drifts if routes are added] → The list is local and small; the popup is deleted within weeks.
- [The Gamification query fails and the popup never appears] → Acceptable: failure resolves to hidden, the safe state.

## Testing

`lms-fe` has no test runner and none is added for a temporary popup. Verification is manual in the browser on `pnpm dev:lms-pro`: a student with Gamification on, a teacher, and a Gamification-off tenant; the week and end-date boundaries by editing the stored week key and temporarily lowering the end-date constant; widths 1440, 768 and 375 px. Then `pnpm --filter lms-pro check-types`, `pnpm lint` and `pnpm build:lms-pro` must exit 0. Each scenario of the delta spec maps to a step in tasks 2.x, 3.x and 4.1.

## Resolved Inputs

Supplied by the requester on 2026-11-17; they are build-time constants and do not change the specs or tasks:
- **User Guide URL:** `https://uplms.gitbook.io/uplms/gamification`. Not reachable from the authoring environment, so it still has to be opened once in a browser during Verify.
- **End date:** 2026-12-18 (Vietnam time, inclusive), derived as Sprint 4's end (2026-11-20) plus 2 two-week sprints. The popup is not displayed from 2026-12-19 00:00 +07:00. If the release slips past Sprint 4, revisit the date before shipping.
- **Image:** the image attached to UPLND-398 (Jira attachment 37465, `image-2026-11-09-14-15-59-406.png`, 1.69 MB PNG, "Gamification is live" with the English "Explore now" text baked in) is used as the official image, so the English text is accepted as-is. It must be added to the app at build time (CDN under `linkCdnMktInApp`, or `libs/assets`); a 1.69 MB PNG should be compressed or converted (for example to WebP) first so the popup does not slow the first load.

## Open Questions

None.
