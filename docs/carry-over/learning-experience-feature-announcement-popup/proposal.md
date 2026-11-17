# Proposal

Source: Jira UPLND-497 (sub-task of UPLND-398, "Bổ sung popup giới thiệu tính năng mới trên UpLMS").

## Why

Gamification (points, badges, levels) is being released on UpLMS, but learners have no in-product signal that it exists. A one-off announcement popup lets learners discover the feature and reach the User Guide without a support or marketing push. The popup is deliberately temporary: it is planned to be removed 2 sprints after release.

## What Changes

- Show a full-screen announcement popup on UpLMS (`lms-pro` only) that displays one fixed image announcing Gamification.
- Clicking the popup navigates the learner to the UpLMS User Guide (UG) page.
- Show the popup at most once per calendar week per user, on the first authenticated app load of that week (week starts Monday, Vietnam time).
- Show it only to users for whom Gamification is visible (students whose tenant has the feature enabled), so the popup never promotes a feature the user cannot see.
- Remember "already shown this week" on the client, keyed by user id; no backend change.
- Stop showing the popup automatically after a fixed end date (about 2 sprints after release), so removal needs no hotfix. The popup code is deleted later as planned cleanup.
- Out of scope: Ops (`ops-fe`), `lms-test` and `lms-zoom`, dynamic or CMS-driven popup content, backend or database changes, any change to Gamification itself.

## Capabilities

### New Capabilities
- `uplnd/learning-experience/feature-announcement-popup`: when and to whom UpLMS shows a fixed-image "new feature" announcement popup, what a click does, and when it stops appearing.

### Modified Capabilities

None. There are no archived specs yet, and Gamification behavior itself does not change.

## Impact

- **Repo:** `lms-fe` only (primary), app `lms-pro`. Likely touch points: `apps/lms-pro/src/app/client-layout.tsx` (mount point, next to `GamificationRealtime`), the existing `useGamificationVisibility()` hook in `@lms/hooks`, and a new popup component. Follow the precedent of `ModalMarketingInApp` (image modal on a CDN asset) and the `localStorage` flags in `PromotionalBanner`.
- **No** API, schema, shared-package (`@upbase-tech/*`) or `lms-be` changes.
- **External inputs (provided 2026-11-17, see design.md "Resolved Inputs"):**
  - User Guide page: `https://uplms.gitbook.io/uplms/gamification`.
  - Popup end date: 2026-12-18 (Sprint 4 ends 2026-11-20, plus 2 sprints).
  - Popup image: the image attached to UPLND-398, used as the official image with its English text.
- **Modules:** Learning Experience (module 07) is chosen as the closest fit; `openspec/products.yaml` registers the capability on archive.
