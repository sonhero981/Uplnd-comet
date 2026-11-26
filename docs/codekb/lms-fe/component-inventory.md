# Component Inventory — lms-fe

> Nguồn: `origin/staging` @ `baf430fa7`. Danh sách chi tiết wrapper `UpBase*`, hook, enum: `.claude/inventory/01-ui.md` .. `05-api.md` (không chép lại). File này ghi thành phần đã đọc sâu (heading `###` là tên dùng trong khối Scope of Analysis) và đếm nhóm còn lại.

## Đã đọc sâu (lát cắt hồ sơ học viên và hạ tầng nó phụ thuộc)

### MyManagers
- Vị trí: `features/user/src/components/profile/MyManagers/MyManagers.tsx`, export qua `MyManagers/index.ts:1`, `profile/index.ts:16`, gói `@lms/feature-user`.
- Props: `fetchManagers: FetchMyManagers` (bắt buộc), `className?` (`MyManagers.tsx:48-55`).
- Việc làm: `useQuery(['my-managers'], () => getMyManagers(fetchManagers), { refetchOnWindowFocus:false })`; sort quản lý chính lên đầu (`:63-65`); 4 trạng thái Loading / lỗi / rỗng / danh sách (`:69-92`).
- Phụ thuộc: `@lms/assets` (`BlankAvatarImage`), `clsx`, `next/image`, `react-query`, `./my-managers.service`.
- Dùng ở: `apps/lms-pro/src/app/[page]/page.tsx:194` và `:277`. Chỉ lms-pro.

### ManagerRow
- Vị trí: cùng file `MyManagers.tsx:18-46`, không export.
- Hiện: ảnh 40x40 (`manager.avatarUrl || BlankAvatarImage`), tên cắt ba chấm, nhãn `Primary manager` khi `isPrimary`, email là link `mailto:` (`:20-44`). Không có điện thoại, không có nhóm.

### getMyManagers
- Vị trí: `features/user/src/components/profile/MyManagers/my-managers.service.ts:35-46` (cùng các type `IMyManager`, `IMyManagerDto`, `FetchMyManagers`, hàm `pickAvatar`).
- Việc: DTO snake_case -> model camelCase (`fullName`, `avatarUrl`, `isPrimary`).

### ProfilePage
- Vị trí: `apps/lms-pro/src/app/[page]/page.tsx:62-504`; export `withAuthorization([UserType.STUDENT])(ProfilePage)` (`:527`). `CollapseListLabel` (`:506-524`) là helper nội bộ.
- Gồm: `ProfileHeader`, `Tabs` antd (My profile / Security / Badges), bản mobile `OverviewItemCard` + `FullScreenMobile` (`:459-501`).
- Trạng thái: `activeTab` khởi tạo từ `?tab=badges` (`:90-92`), `isEdit`, `avatar`, `showSidebar`...
- Phụ thuộc: `@lms/contexts`, `@lms/core`, `@lms/feature-user`, `@lms/hoc`, `@lms/hooks`, `@lms/ui`, `@lms/utils`, `src/api/profile`, `src/redux/*` (`:2-53`).

### withAuthorization
- `libs/HOC/src/withAuthorization.tsx:6-51`; xem cơ chế ở `architecture.md` mục auth.

### RouteGuard
- `features/auth/src/components/RouteGuard.tsx:11-91`.

### MyProfileAPI
- `libs/api/api/profile/index.ts:10-54` (object literal, default export) cùng class `AuthAPI` (`:58-174`).

### createHttpClient
- `libs/api/client.ts:91-254`; `configureHttpClient` `:264`; `fetcher`, `fetchFormData`, `getRequest` `:278-293`.

### useGamificationVisibility
- `libs/hooks/useGamificationVisibility.ts:68-88`; cùng `useGamificationLevel` (`:57-66`), hằng `GAMIFICATION_ME_KEY`, `GAMIFICATION_RULES_KEY` (`:6-7`). Trả `{ready, visible, points, badges, levels, leaderboard, checkIn}`; `HIDDEN` (tất cả false) khi `me` không thành công hoặc `data` null (`:32-38`, `75-87`).

### useUserRole
- `libs/hooks/useUserRole.tsx:5-18`: `{isTeacher, isStudent, userType}` từ Redux qua `useFeature().useAppSelector`.

### FeatureContext
- `libs/state/contexts/FeatureContext.tsx:34-105`; `useFeature()` (`:103`), `FeatureProvider` (`:105`). Chứa API object, `authManager`, `pageLink`, `router`, `fetcher`, `dispatch`, `useAppSelector`, `appModules`.

### Slot
- `libs/ui/extensions/Slot.tsx:11-25`; `ExtensionRegistry` (`libs/ui/extensions/ExtensionRegistry.ts`) với `register(slot, Component)` và `getExtensions(slot)`.

### Providers
- `apps/lms-pro/src/app/providers.tsx:138-391`; `ProvidersWrapper` (`:393-399`) thêm Redux `Provider`. Thứ tự lồng thực tế: Redux `Provider` > `AntConfigProvider` > `PinnedNotifyProvider` > `FeatureProvider` > `CourseProvider` > `CourseNoteProvider` > `QueryClientProvider` (+ `Toaster`) > `AuthProvider` > `RouteGuard` > `PreviousSectionRouteProvider` > `AntdApp` (`:341-383`), khớp mô tả ở `.claude/rules/03-architecture-patterns.md`.

## Shallow: nhóm còn lại

| Nhóm | Số lượng / ghi chú | Nguồn |
|---|---|---|
| `libs/ui/components` | 279 file; wrapper `UpBase*`, `HookForm*` | `git ls-tree`; danh sách `.claude/inventory/01-ui.md` |
| `libs/ui/layout` | 36 file; Sidebar, Header, Footer, Notification, PinnedNotifications, layout theo vai trò | `git ls-tree` |
| `libs/state` slices | 14 reducer trong `globalReducer`: `loginReducer`, `userReducer`, `confirmDialogReducer`, `courseActivityReducer`, `notificationReducer`, `popupReducer`, `courseActivityQuizReducer`, `userGuideReducer`, `caseStudyTestReducer`, `eventTestReducer`, `notesListReducer`, `shortCourseActivityReducer`, `shortNotesListReducer`, `activateCourseReducer` | `libs/state/redux/store.ts:1-33` |
| `libs/state` contexts | `CommonContext`, `CourseNoteContext`, `FeatureContext`, `PinnedNotifyContext`, `PreviousSectionRouteContext`, `RequestContext` | `git ls-tree libs/state/contexts` |
| `libs/hooks` | ~35 hook/file, barrel `libs/hooks/index.ts` | `git ls-tree`, `index.ts:1-38` |
| `features/user` profile | `ChangePassword`, `DeviceInformation`, `ExamInformation`, `LoginHistory`, `MyProfile`, `OverviewItemCard`, `PasswordProfile`, `ProfileCard`, `ProfileHeader`, `ProfileInformation`, `ProfileSideBar`, `Security/MyPasword`, `Settings`, `TabLayout` | `features/user/src/components/profile/index.ts:1-16` |
| `features/gamification` | page, badges, leaderboard, summary, panels, realtime (toast/celebration/socket), api, hooks | `git ls-tree` (44 file); `src/index.ts`, `module.tsx` đã đọc |
| Các feature khác | `attendance`, `certificate`, `class`, `courses` (143 file), `dashboard`, `examination`, `notifications`, `schedule`, `test` | chỉ đếm file |
| Route lms-pro | `[page]`, `calendar`, `case-study`, `catalog`, `certificates`, `course-activation`, `courses/*`, `event-test`, `exam_list`, `explanation`, `gamification`, `storyline`, `teachers/*`, `lms-pro-new-version`, `api` | `git ls-tree -d apps/lms-pro/src/app` |
