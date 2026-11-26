# Reverse Engineering Timestamp

## Run Record

- Date: 2026-11-18 (quét bắt đầu 2026-11-17, hoàn tất sau khi chạy lại do giới hạn API)
- Commit: `baf430fa7` (`baf430fa778bf4309b022d2e0183987888d2753d`, `origin/staging`, 2026-11-17, "Feature/lms sprint 4/uplnd 495 498 profile and search (#97)")
- Repo: `E:\Upbase-comet\lms-fe`, working tree ở nhánh `main` (không phải đối tượng được ghi; `origin/main` không có `MyManagers`)
- Cách đọc code: chỉ qua git, không checkout/pull/merge/sửa repo. `git fetch origin` một lần ở đầu; sau đó `git show origin/staging:<path>`, `git grep -n <pattern> origin/staging -- <paths>`, `git ls-tree -r --name-only origin/staging <dir>`, `git log`, `git rev-list`. CodeGraph không dùng. Mọi `file:line` trong 9 file lấy từ `git show origin/staging:<path>` ở commit trên.
- Cách quét: một agent (lead-only), không có engine/state/snapshot/publish. Độ sâu Minimal toàn repo, sâu ở lát cắt hồ sơ học viên (My Profile, My Managers).
- Đọc conventions của repo để trỏ tới (không chép): `.claude/CLAUDE.md`, `.claude/rules/01`, `03`, `04`, `07`, `08`; không quét phần còn lại của `.claude/`.
- Ghi chú ngoài 9 file: `areas/learner-profile.md` (đã kiểm đủ để viết).

## WIP branches

Các nhánh remote chưa nằm trong `origin/staging` (không phải code hiện có; `git branch -r --sort=-committerdate`, `git rev-list --count origin/staging..<nhánh>`):

| Nhánh | Commit mới nhất | Số commit chưa có trong staging | Chạm vùng hồ sơ? |
|---|---|---|---|
| `origin/main` | 2026-11-11 | 2 (`c88540fa1` fix `/gamification/me` trả 200 với field null (#93); `4b934c76d` merge Sprint 2 Gamification (#86)) | Có: khác `staging` ở `apps/lms-pro/src/app/[page]/page.tsx` và `features/user/.../ProfileHeader.tsx`; `main` KHÔNG có `MyManagers` |
| `origin/hotfix/uplnd-sprint-4/event-test` | 2026-11-10 | 2 (cùng 2 commit như `main`) | Có, như `main` |
| `origin/feature/uplms-sprint-2/gamification-feature` | 2026-10-23 | 19 | Có: `[page]/page.tsx`, `ProfileHeader.tsx` |
| `origin/feature/ai_workflow` | 2026-10-08 | 1 (`69efa37e7`, rules và hướng dẫn `.claude`) | Không |
| `origin/feature/uplnd-sprint-3/uplnd-401` | 2026-10-28 | 0 | Không |
| `origin/fix/uplms-sprint-1/grading-issues`, `origin/fix/lms-sprint-1/issues-sprint-1`, `origin/chore/lms-pro-static-export`, `origin/feature/init-lms` | 2026-07 đến 2026-10 | không đếm | không kiểm |

`origin/main` và `origin/staging` có lịch sử khác nhau (merge-base `04e0a5c7c`, staging hơn main 8959 commit); số "chưa có trong staging" tính theo SHA nên có thể gồm thay đổi đã vào staging bằng commit khác (nội dung xử lý `contract 2.3.0` có ở staging: `libs/hooks/useGamificationVisibility.ts:47`).

## Scope of Analysis

```yaml
scope_version: 1
kind: partial
intent: codekb
fingerprint: unknown (không cài engine; độ mới = commit + analyzed.paths)
commit: baf430fa7
analyzed:
  paths:
    - apps/lms-pro/src/app/[page]/page.tsx
    - apps/lms-pro/src/app/[page]/layout.tsx
    - apps/lms-pro/src/app/page.tsx
    - apps/lms-pro/src/app/providers.tsx
    - apps/lms-pro/src/app/layout.tsx
    - apps/lms-pro/src/app/client-layout.tsx
    - apps/lms-pro/src/app/module-registry.ts
    - apps/lms-pro/src/app/error.tsx
    - apps/lms-pro/src/services/request.ts
    - apps/lms-pro/src/utils/helpers/keycloak.ts
    - apps/lms-pro/src/constants/routers.ts
    - apps/lms-pro/src/redux/store.ts
    - apps/lms-pro/src/redux/hook.ts
    - apps/lms-pro/src/api/profile/index.ts
    - apps/lms-pro/next.config.js#L1-L60
    - apps/lms-zoom/src/middleware.ts
    - features/user/src/components/profile/MyManagers/
    - features/user/src/components/profile/MyProfile.tsx#L1-L130
    - features/user/src/components/profile/index.ts
    - features/user/src/index.ts
    - features/auth/src/components/RouteGuard.tsx
    - features/gamification/src/module.tsx
    - features/gamification/src/index.ts
    - features/gamification/src/realtime.ts
    - features/gamification/src/constants/keys.ts
    - features/gamification/src/hooks/useGamificationData.ts#L1-L80
    - features/gamification/src/realtime/GamificationRealtime.tsx#L1-L30
    - libs/api/client.ts
    - libs/api/index.ts
    - libs/api/constants.ts
    - libs/api/api/profile/index.ts
    - libs/api/redux/store.ts
    - libs/HOC/src/
    - libs/hooks/useGamificationVisibility.ts
    - libs/hooks/useUserRole.tsx
    - libs/hooks/index.ts
    - libs/state/contexts/FeatureContext.tsx
    - libs/state/redux/store.ts
    - libs/state/redux/slice/User/User.tsx#L1-L120
    - libs/state/redux/types/User/urser.ts#L1-L110
    - libs/core/constants/User.ts#L1-L61
    - libs/core/constants/localStorageKeys.ts
    - libs/core/types/common.ts#L150-L185
    - libs/ui/extensions/Slot.tsx
    - libs/ui/extensions/ExtensionRegistry.ts
    - libs/utils/common.ts#L345-L365
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - .github/workflows/deploy-staging.yml#L1-L60
  components:
    - MyManagers
    - ManagerRow
    - getMyManagers
    - ProfilePage
    - withAuthorization
    - RouteGuard
    - MyProfileAPI
    - createHttpClient
    - useGamificationVisibility
    - useUserRole
    - FeatureContext
    - Slot
    - Providers
shallow:
  paths:
    - apps/lms-pro/src/
    - apps/lms-test/
    - apps/lms-zoom/
    - features/attendance/
    - features/certificate/
    - features/class/
    - features/courses/
    - features/dashboard/
    - features/examination/
    - features/notifications/
    - features/schedule/
    - features/test/
    - features/user/
    - features/auth/
    - features/gamification/
    - libs/api/
    - libs/state/
    - libs/core/
    - libs/hooks/
    - libs/ui/
    - libs/utils/
    - libs/assets/
    - libs/styles/
    - tools/
    - .github/
    - Dockerfile
    - .npmrc
    - apps/lms-pro/package.json
    - apps/lms-test/package.json
    - apps/lms-zoom/package.json
    - features/user/package.json
    - features/gamification/package.json
    - libs/api/package.json
    - libs/state/package.json
    - libs/hooks/package.json
    - libs/HOC/package.json
    - libs/ui/package.json
    - libs/core/package.json
    - libs/utils/package.json
```
