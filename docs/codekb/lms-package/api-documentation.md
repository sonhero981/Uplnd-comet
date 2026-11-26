# API Documentation — lms-package

> Thư viện component, không có HTTP endpoint. "API" ở đây là public exports của từng package, lấy từ `exports` trong `package.json` và file entry ở `origin/main` @ `448d575`. Props chỉ liệt kê tên field đã thấy ở khai báo; hành vi bên trong chưa đọc.

## Cách import (`exports`)

| Package | `exports` | Bằng chứng |
|---|---|---|
| `auth-package` | `.` (`dist/index.{mjs,cjs}` + types), `./react`, `./package.json` | `packages/auth-package/package.json:16-28` |
| `design-tokens` | `.`, `./tailwind`, `./package.json` | `packages/design-tokens/package.json:16-28` |
| `tenant-context` | `.`, `./package.json` (không có `./react`, `./server`) | `packages/tenant-context/package.json:16-23` |
| `upbase-common-package`, `explanation-package`, `upbase-notification`, `quiz-result-package`, `test-result-package`, `student-dashboard-package` | `.` (mjs/cjs, không có `types`) và ba alias CSS `./dist/index.css`, `./style.css`, `./dist/style.css` trỏ cùng `dist/index.css` (file rỗng) | `packages/common-package/package.json:14-22` (tương tự các package còn lại) |
| `upbase-ui` | `.` (mjs/cjs) | `packages/ui/package.json:14-19` |

## `@upbase-tech/auth-package`

Entry `.`: `getAuthManager`, `initAuth`; type `AuthManager`, `AuthManagerConfig`, `KeycloakConnection`, `Logger`, `LogoutContext` (`packages/auth-package/src/index.ts:1-9`). Entry `./react`: `AuthProvider`, `useAuth`, type `AuthProviderProps` (`packages/auth-package/src/react/index.ts:1-2`).

`AuthManager` (`packages/auth-package/src/core/types.ts:98-138`): `waitUntilReady()`, `isAuthenticated()`, `getToken()`, `getSessionId()`, `getUserId()`, `getTokenParsed()`, `hasRealmRole(role)`, `hasResourceRole(role, resource?)`, `refreshToken()`, `login()`, `logout()`, `getKeycloak()`.

`AuthManagerConfig` (`types.ts:23-96`): bắt buộc `resolveConfig: () => KeycloakConnection`; tuỳ chọn `isPublicRoute`, `silentCheckSsoPath`, `skipWhenHeadless`, `minTokenValiditySeconds`, `clearLegacyCookies`, `resolvePostLogoutRedirectUri`, `onAfterLogin`, `onBeforeLogout`, `onLogoutCleanup`, `initOptions`, `logger`. Giá trị mặc định xem bảng ở `packages/auth-package/README.md:104-117`. Consumer phải tự đặt `public/silent-check-sso.html` (`README.md:23-30`).

## `@upbase-tech/design-tokens`

Entry `.`: `applyTokens`, `renderTokenCss`, `buildAntdTheme`, `getBranding`, `setBranding`, `subscribeBranding`, `brandRamp`, `brandScale`; type `AntdThemeConfig`, `BrandScale`, `BrandingInput` (`packages/design-tokens/src/index.ts:1-6`). Entry `./tailwind`: `preset` (Tailwind preset, màu `brand`, `on-brand`, `rounded-ub-*`, `font-brand`) (`packages/design-tokens/src/tailwind/index.ts:3-24`).

Chữ ký: `renderTokenCss(branding, selector = ':root')` (`src/core/css.ts:42`), `buildAntdTheme(branding)` (`src/core/antd.ts:9`), `getBranding(): BrandingInput | null` (`src/core/store.ts:18`), `brandScale(branding)`, `brandRamp(branding)` (`src/core/scale.ts:98,102`).

## `@upbase-tech/tenant-context`

Entry `.`: `getTenantManager`, `initTenant`, `tenantContextFromMe`; type `MePayload`, `TenantManager`, `Tenant`, `TenantBranding`, `TenantConfig`, `TenantContext`, `TenantFeatures`, `TenantLocale` (`packages/tenant-context/src/index.ts:1-13`).

`TenantManager` (`src/core/tenant-manager.ts:33-53`): `resolve(host)`, `getContext()`, `requireContext()`, `refresh()`, `hydrate(ctx)`, `subscribe(listener)`, `hasModule(name)`, `isEnabled(flag)`. `TenantContext = { tenant, config, host, source }` với `source` là `'static' | 'http' | 'cache' | 'hydrated'` (`src/core/types.ts:126-134`).

Có mã nhưng KHÔNG nằm trong `exports`/build (chỉ biết từ `src/*/index.ts`): `react/` (`TenantProvider`, `useBranding`, `useFeatureFlag`, `useHasModule`, `useRefreshTenant`, `useTenant`, `useTenantConfig`, `useTenantFeatures`, `useTenantLocale`; `src/react/index.ts:1-11`) và `server/` (`TENANT_*_HEADER`, `getTenantHost`, `readTenantHeaders`, `resolveHostInfo`, `tenantHeaders`, `normalizeHost`, `parseHost`, `TenantError`; `src/server/index.ts:1-16`).

## `@upbase-tech/upbase-common-package`

`packages/common-package/src/index.tsx:1-8`: `UpbaseCalendar`, `UpbaseCalendarV2`, `UpbaseEditor`, `UpbaseEditorV2` (đều default export của file component, re-export có tên), `UI_VERSION`, `UiVersionBadge` (từ `@upbase-tech/upbase-ui`), và `export * from './types'` (`ButtonType`, `ButtonColor`, `CalendarMode`, `EventType`, `IEvent`, ... `packages/common-package/src/types/index.ts:7-50`).

- `UpbaseEditorV2` là `forwardRef<UpbaseEditorHandle, UseEditorControllerProps>` (`.../UpbaseEditorV2/UpbaseEditorV2.tsx:511`). Props tuỳ chọn thấy ở khai báo: `content`, `onChange(html)`, `handleImageUpload(file)`, `disabled`, `placeholder`, `height`, `hasError`, `isGradeForm`, `onRequestImageLibrary`, `onRequestVideo`, `enableBlankTag` (`:436-453`). Handle: `moveSelectionOutOfTable`, `resetContentSafe`, `insertImage`, `insertVideo`, `insertBlankTag` (`:455-460`). Kiểu xuất cùng file: `UploadedMedia`, `InsertImageAttrs`, `InsertVideoAttrs`, `UpbaseEditorHandle` (`:409-460`) nhưng barrel `src/index.tsx` không re-export các kiểu này; chỉ `src/local-editor.tsx:8-13` re-export.
- `UpbaseCalendarV2`: props `events`, `norms?`, `teacherName?`, `showTeacherName?`, `showWeeklyNorm?`, `onOpenDetail?`, `onOpenCreate?`, `onRefetchAPI(startDate, endDate)` (bắt buộc), `onEventDetail?`, `loading?`, `type?`, `courses?`, `onfilter?`, `hasFilter?`, `headerType?` (`.../UpbaseCalendarV2/UpbaseCalendar.tsx:35-50`; vài field sau dòng 50 chưa đọc).
- Entry build local `local-editor.tsx` chỉ xuất `UpbaseEditorV2` + 4 kiểu, build ra `dist-local/editor.mjs` (`packages/common-package/src/local-editor.tsx:7-13`, `vite.local.config.ts:26-28`).

## `@upbase-tech/explanation-package`

Xuất có tên `ExplanationPackage`, `ExplanationPackageV2` và type `MultipleQuestionsData`, `QuestionFilterType` (`packages/explanation-package/src/index.tsx:15,46,69`). Props chung (`:28-44`): `activeQuestion`, `getActiveQuestion(id)`, `document_id`, `handleDownload`, `topic?`, `renderPdf?`, `questions?`, `questionFilter?`, `onQuestionFilterChange?`. Lưu ý: `ExplanationPackage` chỉ dùng `activeQuestion`, `getActiveQuestion`, `document_id`, `renderPdf` (`:46-51`); `handleDownload`, `topic` khai báo trong `Props` nhưng cả hai component không dùng.

## `@upbase-tech/upbase-notification`

Default export `UpbaseNotificationComponent` (`React.memo`) (`packages/notification-package/src/index.tsx:38,184`). Props chính: `notifyDetail`, `tabs`, `selectedTab`, `setSelectedTab`, `handleMarkAll`, `handleMarkById`, `handleUnMarkById`, `handleBack`, `isViewDetail`, `openNotification`, `setOpenNotification`, `handleViewDetail`, `notifyLists`, `notificationUnread`, `scrollRef`, `handleViewNotification`, tuỳ chọn `isDesktopView`, `isLoading`, `textMainColor` (`:16-36`). Lưu ý: test của package import `{ UpbaseNotificationComponent }` có tên (`src/index.test.tsx:1`) trong khi entry chỉ có default export.

## `@upbase-tech/quiz-result-package`

Xuất có tên `QuizResultComponent`; props `questionResponse?`, `getTable({page_index,page_size})`, `onShowDetail?`, `loading`, `showTotal?`, `is_ops?`, `is_lms_v2?`, `isQuizResult?` (`packages/quiz-result-package/src/index.tsx:8-34`). Chọn `ScoreDetails` khi `is_ops || !is_lms_v2`, ngược lại `ScoreDetailsV2` (`:37-54`).

## `@upbase-tech/test-result-package`

Xuất có tên `ResultDashBoard`; props `questions`, `chartData?`, `scoreDetails`, `onScoreDetailScroll`, `score?`, `isLoading?`, `onBack?`, `attempt?`, `explanationUrl` (`packages/test-result-package/src/index.tsx:9-31`).

## `@upbase-tech/student-dashboard-package`

Default export `UpbaseLearningProgressDashboard`; nhận `ICourseDashBoardProps` (khoá thường: `courseInfo`, `overallProgressData`, `weeklyReportData`, `topicProgressData`, `learningResultData`, `handleViewCertificate`) hoặc `IExamDashBoardProps` (khoá thi: `courseInfo`, `mockTestResultsData`, `topicProgressData`, `overProgressData`, `isViewMockTest?`); phân nhánh theo `courseInfo.course_type === COURSE_TYPE.NORMAL_COURSE` (`packages/student-dashboard-package/src/index.tsx:15-63`).

## `@upbase-tech/upbase-ui`

`UI_VERSION` (đọc từ `package.json`), `UiVersionBadge` (`packages/ui/src/index.tsx:4-23`).

## Chưa quét

Props/behavior chi tiết bên trong các component con, hook, `utils` của mọi package; thân `createAuthManager`, `createTenantManager`, thuật toán màu của `design-tokens`.
