# Dependencies — ops-fe

> `origin/staging` @ `40f66b247`. Phiên bản chi tiết: `technology-stack.md`. Quy ước import/dependency của repo: `ops-fe:.claude/rules/04-imports-and-dependencies.md`; gói `@upbase-tech/*`: `ops-fe:.claude/inventory/06-upbase-packages.md`.

## Phụ thuộc ngoài (đáng chú ý)

| Gói | Nguồn | Dùng cho |
|---|---|---|
| `@upbase-tech/auth-package 1.0.1` | GitHub Packages (`.npmrc` gốc, cần token `read:packages`) | Keycloak SSO: `initAuth`, `AuthProvider`, `useAuth`, `getAuthManager` (`apps/ops-fe/src/services/auth.ts:1`, `libs/HOC/src/with-auth-components.tsx:1`) |
| `@upbase-tech/tenant-context 1.0.0`, `@upbase-tech/design-tokens 1.0.0` | idem | tenant/theme từ `/me` (`apps/ops-fe/src/index.tsx:10-18`) |
| `@upbase-tech/test-result-package ^1.0.2` | idem | kết quả bài thi |
| `keycloak-js ^26.2.0` | npm | nền của auth-package |
| `@xyflow/react ^12.6.4` | npm | sơ đồ cây Group, chỉ khai ở `features/group/package.json:23` |
| `react-query 3.39.3`, `antd ^5.24.3`, `react-router-dom ^6.30.6`, `axios`, `zod`, `react-hook-form`, `react-hot-toast` | npm | xem `technology-stack.md` |

Nguồn của `@upbase-tech/*` là repo `lms-package` (sibling); sửa lỗi nằm trong package phải sửa ở đó rồi publish (`ops-fe:.claude/CLAUDE.md:22-37`). `pnpm overrides` ghim `dayjs 1.11.23` và vài gói vá bảo mật (`ops-fe:package.json:48-58`).

Peer dependency: các feature khai `peerDependencies` để dùng chung runtime của app (ví dụ `features/group/package.json:5-21`), nên phiên bản react/react-query/antd phải đồng nhất.

## Phụ thuộc nội bộ

```mermaid
flowchart LR
  app[apps/ops-fe] --> feats[features/* x17 module]
  app --> libs
  feats --> libs[libs: core, ui, hooks, state, utils, hoc, service, _metronic, style, assets]
  user[features/user] -->|StudentGroupSection| group[features/group]
  notif[features/notification] -.useFeature LearnerGroupAPI.-> core[libs/core types]
  class[features/class-and-course] -.PageLink.GROUPS.-> group
  group -.ModalImport route.-> sched[features/schedule: import-log/detail]
  ui[libs/ui] -.useFeature.-> state[libs/state]
```

Text fallback và bằng chứng:
- `features/user` → `@ops/feature-group` (phụ thuộc ngược, đã khai `"@ops/feature-group": "workspace:*"` ở `ops-fe:features/user/package.json:35`; import ở `.../student-setting/index.tsx:11`). Hệ quả: `feature-group` thuộc `REQUIRED_FEATURES` của bản white-label (`ops-fe:scripts/generate-customer.js:11-17`).
- `features/notification` và `features/class-and-course` không import `@ops/feature-group`; chúng dùng `LearnerGroupAPI` qua `useFeature()` (`ops-fe:features/notification/src/hooks/useRecipientGroups.ts:44`) và `PageLink.GROUPS` do module Group đưa vào (`ListMentorClass.tsx:137`). Nếu bản build thiếu `feature-group` thì `PageLink.GROUPS` không có (không có trong `DEFAULT_PAGE_LINK` theo grep) — nhưng Group luôn có mặt nhờ `REQUIRED_FEATURES`.
- `features/group` → trang `import-log/detail/:type/:id` thuộc `features/schedule` (`ops-fe:features/schedule/src/routes.tsx:101-104`); `feature-schedule` không nằm trong `REQUIRED_FEATURES`, nên một bản white-label không có schedule mất trang kết quả nhập thành viên (suy luận từ hai tệp đã đọc, chưa chạy `pnpm gen`).
- `libs/ui` đọc API qua `useFeature` của `libs/state` (`libs/ui/src/base/mobile/FilterMobile.tsx:1387,2033`), tức lib UI không hoàn toàn trung lập với app.
- Chưa vẽ đồ thị import vòng tròn; chưa kiểm.

## Dependency giữa app và feature

`apps/ops-fe/package.json:10-36` khai mọi `@ops/*` là `workspace:*` (17 `@ops/feature-*`). Alias Vite chỉ cho `class-and-course`, `group` (`vite.config.ts:28-32`).
