# Code Structure — ops-fe

> `origin/staging` @ `40f66b247`. Quy tắc đặt file của chính repo: `ops-fe:.claude/rules/01-code-placement.md` (app / feature / lib, mọi file < 300 dòng). Danh mục hook/UI/util có sẵn: `ops-fe:.claude/inventory/01-ui.md` … `06-upbase-packages.md`. Không chép lại.

## Ba tầng

| Tầng | Thư mục | Ghi chú |
|---|---|---|
| App | `apps/ops-fe/` | bootstrap, router gốc, 44 thư mục API class (`src/apis/*`), module registry |
| Feature | `features/*` (19) | nghiệp vụ cắm được; mỗi cái `@ops/feature-<name>`, `main: src/index.ts` |
| Lib | `libs/*` (10) | dùng chung không chứa nghiệp vụ |

Số file `.ts/.tsx` (đếm trên `origin/staging`): app 107; `class-and-course` 412, `group` 121, `schedule` 96, `user` 86, `gamification` 66, `support` 63, `grading` 29, `dashboard` 26, `department` 26, `notification` 19; libs: `ui` 349, `core` 186, `hooks` 72, `utils` 42, `assets` 36, `_metronic` 19, `state` 10, `service` 3, `HOC` 2.

## apps/ops-fe/src

| Đường dẫn | Vai trò |
|---|---|
| `index.tsx` | đăng ký toàn bộ `*API` vào `FeatureProvider`, dựng provider lồng nhau (`:131-215`) |
| `bootstrap.ts` | `buildPageLink()`, `buildSidebarIds()`, `initApp()` (`:5-28`) |
| `module-registry.ts` | mảng `modules: AppModule[]` (`:20-38`); file sinh tự động khi `pnpm gen` |
| `routes/AppRouter.tsx` | `BrowserRouter`, `/` → `HomeRedirect`, `PROFILE/*`, duyệt `modules` render qua `renderRoutes`, `*` → NotFound (`:46-70`) |
| `routes/HomeRedirect.tsx` | điều hướng trang vào mặc định theo cờ manager |
| `services/auth.ts` | `initAuth` Keycloak |
| `apis/<domain>/index.ts` | static class `XxxAPI` dùng `fetcher` (ví dụ `apis/learner-group/`) |
| `constants/sidebar.ts` | `permissionsToCheck` (map `allowRender*` → khoá quyền) |
| `pageLink.default.ts`, `pageLink.store.ts`, `constants/pageLink.ts` | bảng `PageLink` mặc định và singleton |
| `components/access-denied`, `components/ErrorBoundary.tsx` | màn chặn truy cập, error boundary |
| `pages/` | vài trang cấp app (404, my-profile, shop/*, setting…) |

## libs/*

| Lib | Alias | Nội dung chính |
|---|---|---|
| `core` | `@ops/core` | `types/`, `enums/`, `constants/` (có `permission.ts`: `ID_SIDE_BAR`, `TITLE_*_GR`), interface API (`AppModule` ở `types/common.ts:42-47`, `learner-group*.ts`) |
| `state` | `@ops/state` | `context/`: `FeatureContext`, `UserProvider`, `SidebarContext`, `CourseProvider`, `TeacherProvider`, `LoadingContext`, `QueryRequest/ResponseProvider` |
| `hooks` | `@ops/hooks` | `use-app-mutation.tsx`, `use-confirm`, `use-edit-mode`, `permission/` (`useHasPermission`, `usePermissions`, `useMenuData`, `useTeamAccess`, `useIsTeamManager`), nhiều hook infinite/filter |
| `service` | `@ops/service` | `request.ts` (axios + interceptor + `fetcher`/`apiRequest`/`fetchFormData`), `en.exceptions.json` (592 mã lỗi) |
| `ui` | `@ops/ui` | `base/` (primitive: select, table, modal, tabs, `upload-file/ModalImport`…), `common/` (`PermissionRoute`, `PopupConfirm`, button…), `layout/`, `extensions/` |
| `utils` | `@ops/utils` | helper, `permission.ts`, `tenant-theme.ts`, `validation/` |
| `HOC` | `@ops/hoc` | `withAuthComponents` (`:4-19`) |
| `_metronic`, `styles`, `assets` | | layout/theme Metronic, SCSS, asset index sinh tự động |

## Cấu trúc một feature (mẫu: `features/group`)

```
features/group/
  CLAUDE.md                  # ghi chú đã kiểm của team (đọc trước khi sửa)
  package.json               # @ops/feature-group, deps @ops/* = workspace:*
  src/
    index.ts                 # groupModule: AppModule + export StudentGroupSection
    routes.tsx               # route + withAuthComponents + PermissionRoute
    constant/index.ts        # GROUP_ROUTES, GROUP_DETAIL_TAB, GROUP_LABELS, *_LABEL
    context/                 # GroupDetailContext (UI state chia cho tab)
    hooks/                   # groupKeys, useGroups(+tách), useSupervisors, useMyTeam, useGroupPermissions
    services/                # api-adapter*.ts (DTO→kiểu feature) và các file *.service.ts mock còn sót
    types/                   # IGroup..., people.ts, learning-period.ts
    utils/                   # group-list-url, learning-period, server-error
    components/groups/       # GroupList, GroupTreeChart, GroupDetail, tabs/, shared/, ...
    components/student|myTeam/
    pages/                   # groups/index, groups/[id], membership-log, my-team/*
```

Chi tiết từng phần Group: `areas/group.md`; danh mục component: `component-inventory.md`.

## Quy ước mã quan sát được

- Feature không import `apps/ops-fe`; lấy API qua `useFeature()` (`ops-fe:libs/state/src/context/FeatureContext.tsx:69-75`).
- DTO BE giữ snake_case ở `libs/core/src/types/learner-group.ts`; feature đổi sang camelCase ở một chỗ (`ops-fe:features/group/src/services/api-adapter.ts:1-8`).
- Hook lớn tách theo vùng để file < 300 dòng (ví dụ `useGroups.ts:24-28` re-export `useGroupDetail`, `useGroupMutations`, `useGroupMembers`, `useGroupContent`).
- `GROUP_ROUTES` được trải thẳng vào `PageLink` toàn app qua `pageLink` của module (`ops-fe:features/group/src/index.ts:5-10`, `ops-fe:apps/ops-fe/src/bootstrap.ts:5-18`); `HomeRedirect` và `useMenuData` dùng `PageLink.MY_TEAM`/`GROUPS` do module này cung cấp.
