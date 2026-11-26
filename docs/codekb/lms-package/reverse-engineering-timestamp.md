# Reverse Engineering Timestamp

## Run Record

- Date: 2026-11-17
- Commit: `448d575` (`448d575332746d5f6213bc730865f5434a227512`, `origin/main`, 2026-11-16, "chore(uplnd-515): upgrade required deps and bump 4 packages (#26)"; repo có 28 commit trên `origin/main`)
- Base ref: `origin/main` (repo không có `origin/staging`). `git fetch origin` chạy trước khi quét; không checkout, pull, merge hay sửa repo.
- Cách đọc mã: chỉ qua git, `git -C /e/Upbase-comet/lms-package show origin/main:<path>`, `ls-tree -r origin/main`, `grep -n ... origin/main -- <paths>`, `git log`/`git show --stat` cho commit `448d575`. Không đọc working tree, không chạy build/test. Consumer: `git grep -n "@upbase-tech/" origin/staging -- '*package.json'` ở `ops-fe` (`40f66b247`), `lms-fe` (`baf430fa7`), `lms-be` (`a2f4821`).
- Độ phủ: NÔNG. Đây là overview cấu trúc (Depth Minimal) của cả repo. Đã đọc kỹ: file gốc, `package.json` của cả 10 package + `configs/tailwind-config`, các `vite.lib.config.ts` chính, file entry/public exports, README của `auth-package`, `design-tokens`, `tenant-context`, `tailwind-config`. Danh sách file lấy từ `ls-tree`. KHÔNG đọc thân hầu hết component, hook, util, style; số liệu chất lượng (`eslint-disable`, `any`, `TODO`) là kết quả `git grep` đếm, không phải đọc từng file.
- Không có `.claude/` trên `origin/main`; `README.md` chỉ có tiêu đề, nên không có file quy ước của repo để trỏ tới.
- Bỏ qua (left out, không mở): `packages/common-package/dist-local/editor.mjs` (bundle build được commit), `pnpm-lock.yaml`.

## WIP branches

Nhánh remote chưa merge (không phải mã đang có ở `origin/main`), từ `git branch -r --sort=-committerdate`:

| Nhánh | Hơn `origin/main` | Chạm |
|---|---|---|
| `origin/feature/uplnd-518-test-result-ops-ui` | 2 commit: `f437687` "align test-result-package UI with OPS and LMS", `995c891` "bump test-result-package 1.1.0" | 13 file ở `packages/test-result-package/` (thêm `src/components/ChartScoreBySection.tsx`, sửa `ScoreDetail.tsx`, `TestResultPage.tsx`, `multipleQuestion.tsx`, `style.ts`...), `git diff --stat` |

`origin/HEAD` trỏ `origin/main`. Chỉ có hai nhánh remote.

## Scope of Analysis

```yaml
scope_version: 1
kind: partial
intent: codekb
fingerprint: unknown (không cài engine; độ mới = commit + analyzed.paths)
commit: 448d575
analyzed:
  paths:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - tsconfig.base.json
    - .npmrc
    - .gitignore
    - .github/workflows/publish.yml
    - .github/CODEOWNERS
    - README.md
    - configs/tailwind-config/package.json
    - configs/tailwind-config/README.md
    - packages/auth-package/package.json
    - packages/auth-package/README.md
    - packages/auth-package/vite.lib.config.ts
    - packages/auth-package/src/index.ts
    - packages/auth-package/src/react/index.ts
    - packages/auth-package/src/core/types.ts#L1-L138
    - packages/design-tokens/package.json
    - packages/design-tokens/README.md#L1-L120
    - packages/design-tokens/src/index.ts
    - packages/design-tokens/src/tailwind/index.ts
    - packages/design-tokens/src/core/css.ts#L42
    - packages/design-tokens/src/core/antd.ts#L9
    - packages/design-tokens/src/core/store.ts#L18
    - packages/design-tokens/src/core/scale.ts#L98-L102
    - packages/tenant-context/package.json
    - packages/tenant-context/README.md
    - packages/tenant-context/vite.lib.config.ts
    - packages/tenant-context/tsconfig.build.json
    - packages/tenant-context/src/index.ts
    - packages/tenant-context/src/react/index.ts
    - packages/tenant-context/src/server/index.ts
    - packages/tenant-context/src/core/tenant-manager.ts#L33-L53
    - packages/tenant-context/src/core/types.ts#L120-L135
    - packages/common-package/package.json
    - packages/common-package/PUBLISH.md
    - packages/common-package/vite.lib.config.ts
    - packages/common-package/vite.local.config.ts
    - packages/common-package/scripts/postbuild-css-stub.cjs
    - packages/common-package/src/index.tsx
    - packages/common-package/src/local-editor.tsx
    - packages/common-package/src/types/index.ts#L1-L50
    - packages/common-package/src/components/UpbaseEditorV2/UpbaseEditorV2.tsx#L409-L460
    - packages/common-package/src/components/UpbaseCalendarV2/UpbaseCalendar.tsx#L32-L50
    - packages/common-package/tailwind.config.js#L1-L10
    - packages/common-package/.eslintrc#L1-L20
    - packages/common-package/dev/README.md#L1-L20
    - packages/explanation-package/package.json
    - packages/explanation-package/vite.lib.config.ts
    - packages/explanation-package/src/index.tsx
    - packages/notification-package/package.json
    - packages/notification-package/src/index.tsx#L1-L70
    - packages/notification-package/src/index.tsx#L160-L184
    - packages/quiz-result-package/package.json
    - packages/quiz-result-package/src/index.tsx
    - packages/test-result-package/package.json
    - packages/test-result-package/src/index.tsx
    - packages/student-dashboard-package/package.json
    - packages/student-dashboard-package/src/index.tsx
    - packages/ui/package.json
    - packages/ui/src/index.tsx
    - packages/ui/vite.lib.config.ts
    - packages/common-package/src/index.test.tsx
    - packages/explanation-package/src/index.test.tsx
    - packages/notification-package/src/index.test.tsx
    - packages/quiz-result-package/src/index.test.tsx
    - packages/test-result-package/src/index.test.tsx
  components:
    - UpbaseEditorV2
    - UpbaseCalendarV2
    - ExplanationPackage
    - ExplanationPackageV2
    - QuizResultComponent
    - ResultDashBoard
    - UpbaseLearningProgressDashboard
    - UpbaseNotificationComponent
    - UiVersionBadge
    - AuthManager
    - TenantManager
    - design-tokens
shallow:
  paths:
    - packages/auth-package/src/core/
    - packages/auth-package/src/react/auth-context.tsx
    - packages/design-tokens/src/core/
    - packages/tenant-context/src/core/
    - packages/tenant-context/src/react/tenant-context.tsx
    - packages/tenant-context/src/server/headers.ts
    - packages/common-package/src/components/UpbaseCalendar/
    - packages/common-package/src/components/UpbaseCalendarV2/
    - packages/common-package/src/components/UpbaseEditor/
    - packages/common-package/src/components/UpbaseEditorV2/
    - packages/common-package/src/hooks/
    - packages/common-package/src/icons/
    - packages/common-package/src/iconsV2/
    - packages/common-package/src/styles/
    - packages/common-package/dev/
    - packages/explanation-package/src/
    - packages/explanation-package/dev/
    - packages/notification-package/src/
    - packages/quiz-result-package/src/
    - packages/test-result-package/src/
    - packages/student-dashboard-package/src/
    - packages/notification-package/README.md
    - packages/quiz-result-package/README.md
    - packages/test-result-package/README.md
    - packages/student-dashboard-package/README.md
    - packages/explanation-package/README.md
    - packages/common-package/README.md
    - configs/tailwind-config/index.js
```
