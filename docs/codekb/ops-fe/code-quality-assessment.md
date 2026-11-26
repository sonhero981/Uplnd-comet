# Code Quality Assessment — ops-fe

> `origin/staging` @ `40f66b247`. Mức đánh giá nông cho toàn repo, sâu hơn cho `features/group`. Chuẩn của repo: `ops-fe:.claude/rules/07-testing-patterns.md`, `08-typecheck-policy.md`, `05-ui-and-styling.md`.

## Kiểm thử

- **Không có test suite**: tìm tệp `*.test.*`, `*.spec.*`, `__tests__`, vitest/jest/playwright/cypress trong cây `origin/staging` không ra tệp nào; rule của repo xác nhận không có test runner, "test" là xác minh thủ công bằng Playwright MCP (`ops-fe:.claude/rules/07-testing-patterns.md:3-15`).
- Hệ quả cho Group: không có test hồi quy cho adapter DTO, luật kéo thả, phân quyền ẩn/hiện.

## Lint, typecheck, CI

| Hạng mục | Hiện trạng | Bằng chứng |
|---|---|---|
| ESLint | flat config; luật design system mức `warn`, code mới bị chặn bằng `lint-staged --max-warnings=0` | `ops-fe:configs/design-system.eslint.mjs:1-2`, `ops-fe:package.json:45-47` |
| Husky pre-commit | `pkg-link check` + `lint-staged` | `ops-fe:.husky/pre-commit:1-4` |
| Typecheck | `tsc -p tsconfig.checker.json`; từng thoát 1 không chẩn đoán, `features/group` có tsconfig hẹp riêng | `ops-fe:apps/ops-fe/tsconfig.group-check.json:1-15` |
| CI staging | install, ghi `.env`, **chỉ `vite build`**, đóng gói, SSH deploy; không lint, không typecheck, không test | `ops-fe:.github/workflows/deploy-staging.yml:51-68` |
| TS strict | bật; `noUnusedLocals/Parameters` tắt | `ops-fe:apps/ops-fe/tsconfig.json:14-16` |
| CODEOWNERS | có | `ops-fe:.github/CODEOWNERS` |

## Tín hiệu nợ kỹ thuật (đếm trên `features libs apps`)

- ~190 dòng `eslint-disable`, ~175 dòng `TODO|FIXME|HACK` toàn repo; trong `features/group/src` có 19 dòng TODO/FIXME và 5 `eslint-disable`, 5 chỗ `any`.
- Quy tắc "mọi file < 300 dòng" (`ops-fe:.claude/rules/01-code-placement.md:39-43`) bị vượt trong Group ở 3 tệp: `GroupTreeChart.tsx` 330 dòng, `GroupTreeChart/styles.module.scss` 527, `tabs/MembersTab.tsx` 304.
- Tài liệu của repo lệch code: `rules/03-architecture-patterns.md:40-43` nói "KHÔNG Keycloak" trong khi code dùng Keycloak (`ops-fe:apps/ops-fe/src/services/auth.ts`); `.claude/CLAUDE.md:45-47` trỏ `rules/07`, `08` (có) nhưng `rules/03` còn mô tả provider nesting thiếu `AuthProvider`/`OpsAccessGate` (`index.tsx:195-212`).
- `features/course-version` có `package.json` nhưng không có `src/index.ts` module, không được đăng ký.
- Workflow `deploy-staging` dùng secret `GH_PACKAGES_TOKEN` (hoặc `GITHUB_TOKEN`) để cài `@upbase-tech/*` (`ops-fe:.github/workflows/deploy-staging.yml:44-49`).

## Group — đánh giá riêng

| Mặt | Nhận xét | Bằng chứng |
|---|---|---|
| Tách lớp | tốt: DTO ở `libs/core`, adapter một chỗ, hook tách theo vùng, DI qua `useFeature` | `api-adapter.ts:1-8`, `useGroups.ts:24-28` |
| Mã mock còn sót | trung bình: `canDeleteGroup` mock còn gọi từ UI; `useMyAccess` mock không dùng; 4 tệp mock chờ dọn | `GroupRowActions.tsx:94`, `useMyTeam.ts:119-125`, `areas/group.md` mục 3 |
| Không dùng hạ tầng chung | `useMutation` trực tiếp thay `useAppMutation`; toast thành công gọi tay ở component (`GroupRowActions.tsx:112-128`) | `useGroupMutations.ts:3` |
| Invalidate quá rộng | mọi mutation làm mới cả `['groups']` | `areas/group.md` mục 5 |
| Lọc phía client trên trang đã phân trang | Members (Direct/Sub-group) và GroupLog (keyword) | `MembersTab.tsx:96-101`, `GroupLog.tsx:97-100` |
| Hợp đồng BE chưa đủ | `allowed_actions` không có ở list; `member_count` ở `groups/options` chưa trả (đệm `fetchCountFallback`); `not_started_count` chưa có; `learning_period` là giả định; `GET groups?q=` chỉ khớp tên | `GroupRowActions.tsx:87-93`, `useRecipientGroups.ts:76-90`, `api-adapter-people.ts:102-105`, `api-adapter-assign.ts:61-67`, `learner-group.ts:215` |
| Dữ liệu tạm ở FE | ngưỡng "nhóm lớn" 100 là giả định | `AssignContentDialog.tsx:48-53` |
| Hiệu năng | `findTeamRow` duyệt tối đa 10 trang × 100 dòng khi F5 vào SCR25; danh sách lớp giao chỉ đọc 100 lớp đầu rồi lọc tại chỗ | `useMyTeam.ts:45-47`, `useGroupContent.ts:56-58` |
| Mật độ chú thích | cao, kèm mã `BR-/AC-/EC-`; nhiều `TODO(api)`, `TODO(copy)`, `TODO(prd)` làm dấu vết chờ BE/PO | toàn `features/group/src` |
| Truy cập trình duyệt | an toàn: `localStorage`/`sessionStorage` bọc try/catch ở nơi nhớ URL; riêng `localStorage` của chế độ xem không bọc | `group-list-url.ts:8-22`, `GroupList.tsx:36-38,105` |

## Tài liệu

`features/group/CLAUDE.md` chi tiết nhưng có nhiều đoạn đã lỗi thời (bảng đối chiếu ở `areas/group.md` mục 8). OpenSpec của repo: `openspec/changes/uplnd-group-sprint-4` đang mở; các change Group trước nằm ở `openspec/changes/archive/` (`uplnd-group-learner-groups`, `uplnd-423-424-group-foundation-list`, `uplnd-425-group-members-log`, `uplnd-427-group-assign-content`, `261005-group-b01-group-tree-skeleton`).
