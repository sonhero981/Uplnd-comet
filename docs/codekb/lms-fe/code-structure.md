# Code Structure — lms-fe

> Nguồn: `origin/staging` @ `baf430fa7`. Chỗ đặt file theo repo: `.claude/rules/01-code-placement.md` (và `.claude/inventory/01..05` cho từng lib). File này ghi bản đồ thực tế đã kiểm bằng `git ls-tree` và các điểm lệch so với rules.

## Package/module organization

Workspaces (`pnpm-workspace.yaml:1-8`): `apps/lms-pro`, `apps/lms-zoom`, `apps/lms-test`, `features/*`, `libs/*`, `tools/*`.

| Path | Package (`name`) | Ghi chú đã kiểm |
|---|---|---|
| `apps/lms-pro` | `lms-pro` | Next 14 App Router, `src/app`, `src/api`, `src/services/request.ts`, `src/redux`, `src/constants`, `src/utils/helpers/keycloak.ts` |
| `apps/lms-test` | `lms-test` | `src/app/{api,test}`, `src/services/requestV2.ts`, `src/api/*` |
| `apps/lms-zoom` | `lms-zoom` | `src/app/{meeting,...}`, `src/middleware.ts`, `src/contexts`, `src/hooks` (không dùng `@lms/*`: `apps/lms-zoom/package.json` không khai package workspace nào) |
| `libs/api` | `@lms/api` | `client.ts`, `constants.ts`, `api/{activity,class,courses,notification,profile,question,test,test-api,upload,user}`, `redux/{hook,store,User,Course}` (`libs/api/index.ts:1-27`) |
| `libs/state` | `@lms/contexts` | `contexts/*` (6 context), `redux/slice/*`, `redux/types/*`, `redux/store.ts` (`globalReducer`) |
| `libs/core` | `@lms/core` | `constants/`, `enums/`, `types/` (kể cả `types/upbase-tech.d.ts`) |
| `libs/hooks` | `@lms/hooks` | file nằm thẳng dưới `libs/hooks/` + `course/`, barrel `index.ts` |
| `libs/HOC` | `@lms/hoc` | duy nhất `src/withAuthorization.tsx`, `main: ./src/index.ts` |
| `libs/ui` | `@lms/ui` | `components/` (~279 file), `layout/` (~36), `extensions/` (Slot + registry) |
| `libs/utils`, `libs/assets`, `libs/styles` | `@lms/utils`, `@lms/assets`, `@lms/styles` | chỉ liệt kê cấp thư mục |
| `features/*` | `@lms/feature-*` | `src/index.ts` là entry; một số có `src/module.tsx` (AppModule) |
| `tools/*` | config tailwind/eslint/typescript | chỉ liệt kê thư mục |

Số file mỗi feature (đếm bằng `git ls-tree`): courses 143, schedule 61, test 30, attendance 29, dashboard 21, certificate 18, examination 13, notifications 10, class 7, user 30, gamification 44, auth 7.

## Files theo vai trò (lát cắt hồ sơ học viên)

| Vai trò | File |
|---|---|
| Page (Controller) | `apps/lms-pro/src/app/[page]/page.tsx` (527 dòng), `apps/lms-pro/src/app/[page]/layout.tsx` |
| Feature component | `features/user/src/components/profile/MyManagers/MyManagers.tsx` |
| Service/mapper (Service) | `features/user/src/components/profile/MyManagers/my-managers.service.ts` (DTO -> model) |
| API (Repository) | `libs/api/api/profile/index.ts` (`MyProfileAPI.getMyManagers`), re-export `apps/lms-pro/src/api/profile/index.ts:1` |
| Middleware/HOC | `libs/HOC/src/withAuthorization.tsx`, `features/auth/src/components/RouteGuard.tsx` |
| Config | `libs/core/constants/User.ts` (`MYPROFILE_TREE`, `SECURITY_TREE`), `apps/lms-pro/src/constants/routers.ts` |
| Hook | `libs/hooks/useGamificationVisibility.ts`, `libs/hooks/useUserRole.tsx` |
| Barrel | `features/user/src/index.ts` -> `components/index` -> `components/profile/index.ts:16` -> `MyManagers/index.ts` |

## Code patterns

- **Barrel exports**: mỗi lib/feature có `index.ts`; `export *` phổ biến. Default export không đi qua `export *` nên `libs/api/index.ts:21-27` re-export tường minh (`MyProfileAPI`, ...).
- **API object/class**: `const MyProfileAPI = {...}` (object literal) và `class AuthAPI` với static method cùng file (`libs/api/api/profile/index.ts:10`, `58`). Rules gọi chung là `XxxAPI`.
- **DI qua props thay vì context** khi feature không phụ thuộc `@lms/api`: `MyManagers({ fetchManagers })` (`MyManagers.tsx:48-55`).
- **Alias**: app-level `@components`, `@services`, `@utils`, `src/...` trong lms-pro (xem `.claude/rules/04-...`); ví dụ `page.tsx:45`, `51-53`.
- **File `'use client'`**: đứng đầu mọi page/feature component đã đọc.
- **Comment nghiệp vụ nhúng mã yêu cầu** (`UPLND-495`, `BR-17.x`, `AC17.x`) trong `MyManagers.tsx`, `my-managers.service.ts`, `page.tsx:189`.

## Điểm lệch so với `.claude/rules/` (đã kiểm)

1. `features/gamification` tồn tại (`pnpm-workspace` glob `features/*`, `apps/lms-pro/package.json` khai `@lms/feature-gamification`) nhưng `01-code-placement.md` chưa liệt kê.
2. `@upbase-tech/design-tokens` được dùng, bảng ở `04-imports-and-dependencies.md` chưa có.
3. Rules nói gamification/`feature-user` không dùng `@lms/api`; đúng cho `features/user`, nhưng `features/gamification/package.json` khai `@lms/api`, `@lms/hoc`, `@upbase-tech/auth-package`.
4. `myProfileApi` trong `FeatureContext` được gõ kiểu cố định 4 hàm, chưa có `getMyManagers` (`libs/state/contexts/FeatureContext.tsx:53-73`), dù `MyProfileAPI` thật có (`libs/api/api/profile/index.ts:16`). Hiện không gây lỗi vì page truyền hàm bằng props.
