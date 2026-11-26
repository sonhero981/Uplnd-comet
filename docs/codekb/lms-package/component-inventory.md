# Component Inventory — lms-package

> Tên heading `###` dưới đây là tên component dùng nguyên văn trong `analyzed.components` của `reverse-engineering-timestamp.md`. Mức overview: mục "Đã đọc" ghi rõ phần nào thực sự được mở. `origin/main` @ `448d575`.

## Component có đã đọc phần khai báo công khai

### UpbaseEditorV2
- Package: `upbase-common-package`. Trình soạn thảo TipTap, `forwardRef` với handle `UpbaseEditorHandle` (`packages/common-package/src/components/UpbaseEditorV2/UpbaseEditorV2.tsx:455-460,511`).
- Mở rộng TipTap riêng: `blank-tag/BlankTagNode.ts`, `table/CustomTable.ts`, `video/VideoNode.ts`, `image/CustomImage.ts`, `LineHeight.ts` (từ `ls-tree`, chưa đọc nội dung).
- Phụ thuộc: `@tiptap/*`, `@floating-ui/react`, `@tippyjs/react`, `antd`, `dayjs`, `clsx` (external trong build, `packages/common-package/vite.lib.config.ts:35-50`).
- Đã đọc: khai báo type và props `:409-460`. Chưa đọc: thân component.

### UpbaseCalendarV2
- Package: `upbase-common-package`. Lịch tháng/tuần/LMS-tuần, có biến thể mobile (`MonthlyCalendarMobile.tsx`, `FilterCalendarMobile.tsx`, `LMSHeaderCalendarMobile.tsx`; từ `ls-tree`). Style bằng SCSS (`configs/tailwind-config/README.md:74`).
- Props: xem `api-documentation.md` (`packages/common-package/src/components/UpbaseCalendarV2/UpbaseCalendar.tsx:35-50`).
- Đã đọc: props `:32-50`. Chưa đọc: thân component.

### ExplanationPackage
- Package: `explanation-package`. Hiển thị câu hỏi + lời giải trong Shadow DOM (`react-shadow` + `styled-components`), bao `ExplainationProvider` và `QuizComponent` (`packages/explanation-package/src/index.tsx:46-67`).
- Dependency đáng chú ý: `@xyflow/react` (câu hỏi nối cặp, `MatchQuiz/*`), `@fortune-sheet/react`, `@cyntler/react-doc-viewer`, `@cloudflare/stream-react`, `react-markdown`, `react-hook-form` (`packages/explanation-package/package.json:66-79`).

### ExplanationPackageV2
- Như trên nhưng bao `QuizComponentV2`, thêm props `questions`, `questionFilter`, `onQuestionFilterChange` (`packages/explanation-package/src/index.tsx:69-96`).

### QuizResultComponent
- Package: `quiz-result-package`. Chọn `ScoreDetails` hoặc `ScoreDetailsV2` theo `is_ops`/`is_lms_v2` (`packages/quiz-result-package/src/index.tsx:25-57`).

### ResultDashBoard
- Package: `test-result-package`. Bọc `TestResultPage`, lấy `type` từ `questions.course.course_categories[0].name` và `subjectCode` từ `questions.course.subject.code` (`packages/test-result-package/src/index.tsx:33-48`). Thư mục `components/` có `acca/`, `cfa/`, `cma/` (biểu đồ điểm theo chứng chỉ; tên từ `ls-tree`, chưa đọc).

### UpbaseLearningProgressDashboard
- Package: `student-dashboard-package`. Nhánh `CourseDashBoard` (khoá thường) / `ExamDashboard` (khoá thi) (`packages/student-dashboard-package/src/index.tsx:38-61`). Dependency vẽ biểu đồ: `echarts`, `recharts` (`packages/student-dashboard-package/package.json:62,64`).

### UpbaseNotificationComponent
- Package: `upbase-notification`. Drawer thông báo antd, đo chiều cao footer bằng `ResizeObserver` (`packages/notification-package/src/index.tsx:38-62,164-178`).

### UiVersionBadge
- Package: `upbase-ui`. Badge hiển thị `upbase-ui v{UI_VERSION}` (`packages/ui/src/index.tsx:7-23`); `common-package` re-export nó (`packages/common-package/src/index.tsx:3`).

### AuthManager
- Package: `auth-package`. Đối tượng quản lý phiên Keycloak (`packages/auth-package/src/core/types.ts:98-138`); lớp React `AuthProvider`/`useAuth` (`packages/auth-package/src/react/index.ts:1`).

### TenantManager
- Package: `tenant-context`. Giữ `TenantContext`, phát cho subscriber (`packages/tenant-context/src/core/tenant-manager.ts:33-53`).

### design-tokens
- Package: `design-tokens`. Bộ hàm token/branding, không phải component React (`packages/design-tokens/src/index.ts:1-6`).

## Chỉ biết qua `ls-tree`, chưa đọc nội dung

| Thành phần | Package | Ghi chú |
|---|---|---|
| `UpbaseEditor` (V1) | `upbase-common-package` | `packages/common-package/src/components/UpbaseEditor/`, export `src/index.tsx:6` |
| `UpbaseCalendar` (V1) | `upbase-common-package` | `packages/common-package/src/components/UpbaseCalendar/`, export `src/index.tsx:4` |
| `hooks/` 7 hook, `icons/`, `iconsV2/` | `upbase-common-package` | `use-tiptap-editor`, `use-mobile`, `useIsInTable`... |
| `quiz-component`, `quiz-component-v2`, `questionType/*`, `comment-*`, `list-question/*`, `grading-file/*` | `explanation-package` | 144 file |
| `ScoreDetails`, `ScoreDetailsV2`, `pagination/*` | `quiz-result-package` | |
| `charts/course-dashboard/*`, `charts/exam-dashboard/*` | `student-dashboard-package` | |
| `TestResultPage`, `ScoreDetail`, `Recommendation`, `acca/cfa/cma` chart | `test-result-package` | `ChartScoreBySection.tsx` chỉ có ở nhánh WIP, không có ở main (xem `## WIP branches` ở file timestamp) |
