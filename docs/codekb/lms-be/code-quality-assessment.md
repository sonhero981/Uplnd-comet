# Code Quality Assessment — lms-be

> `origin/staging` @ `a2f4821`. Đo bằng grep/đọc có chọn lọc, không chạy lint/test/coverage. Quy ước chất lượng của repo: `openspec/conventions/{backend,database,patterns,verification,git}.md`, `CLAUDE.md`.

## Test

- Toàn repo chỉ có **13** file `*.spec.ts` (gamification engine/leaderboard/history/config, `quiz-attempt-grading`, `apps/ops/src/app`, `apps/event-processor-service/src/app`, `apps/lms/src/gamification-leaderboard`, `apps/background-job-service/src/gamification`). **Không có spec nào cho Group** (không file nào trong `groups/`, `group/` hay `group-*`).
- Khung: Jest 29 + `ts-jest` + `@nx/jest` (`jest.config.ts` gốc dùng `getJestProjects()`, mỗi lib/app có `jest.config.ts`). Không thấy cấu hình coverage ở `jest.preset.js`/`nx.json` (grep "coverage" rỗng).
- Cách verify nghiệp vụ nhóm là curl theo `openspec/conventions/verification.md` (không phải test tự động).
- `class.service.ts` (`libs/modules/src/lib/class/class.service.ts`) dài 18.377 dòng và là điểm giao với Group; không có spec đi kèm.

## Lint, format, commit

- ESLint 8.15 + `@nx/typescript`; rule đáng chú ý: `jsdoc/require-jsdoc` bắt buộc cho FunctionDeclaration/MethodDefinition, `@typescript-eslint/no-unused-vars` lỗi, `no-console` chỉ cho `warn|error|info`, `no-explicit-any` tắt (`.eslintrc.json`).
- Prettier 2.6, Husky: `pre-commit` chạy `lint-staged` (prettier + eslint `--fix` cho `{apps,libs,tools}/**/*.ts`), `commit-msg` chạy commitlint (`.husky/*`, `package.json` `lint-staged`).
- Vùng Group: 0 dòng `TODO|FIXME|HACK`, 0 chỗ dùng `any`; 30 dòng `eslint-disable` đều là `jsdoc/require-jsdoc` trên constructor (đã lọc, các dòng còn lại bằng 0 khi loại rule này). Toàn repo (ngoài migration): 2 dòng `TODO|FIXME|HACK`.

## CI/CD

`.github/workflows/` chỉ có `deploy-staging.yml` và `deploy-production.yml`: build image, push Docker Hub, copy compose lên server, `docker compose up -d` theo lô (`"ops lms mock-test"`, `"notification background-job video event-processor"`, `deploy-staging.yml:136`). Grep `test|lint|migration|jest` không thấy bước kiểm tra hay chạy migration trong workflow (chỉ `yarn` nhắc ở comment build). `CODEOWNERS`: mặc định `@UpBase-Tech/lms`, `.github/CODEOWNERS` thuộc `@UpBase-Tech/sre`.

## Tài liệu

`CLAUDE.md` + `openspec/` đầy đủ (quy trình, conventions, change `upbase-221100-group` đang mở với `proposal/design/tasks/specs`, `design.dbml`). `docs/` chỉ có `docs/gamification/contract.md`. `README.md` ở gốc và `libs/modules/README.md`, `libs/database/README.md` chưa đọc. Mã nhóm có comment `// Spec: …` tham chiếu yêu cầu, JSDoc `@description` đầy đủ (rule lint ép buộc).

## Chất lượng vùng Group (đánh giá theo `code-analysis-guide`: tốt / khá / kém)

| Tiêu chí | Đánh giá | Căn cứ |
|---|---|---|
| Đặt tên | tốt | tên hàm/biến mô tả đúng vai trò (`openMembership`, `findAssignmentsForUser`) |
| Kích thước hàm/file | khá | service lớn: `group-structure.service.ts` 37 KB, `group-assignment.service.ts` 33 KB, `group-hr-sync.service.ts` 31 KB, `group-member.service.ts` 24 KB; nhiều hàm dài (`syncPeople` ~130 dòng, `buildCtes` ~90 dòng SQL) |
| Xử lý lỗi | khá | exception có mã riêng (640001-640026); một số nơi chủ ý nuốt lỗi và chỉ log (`group-enrollment.service.ts:181-187`, gửi mail `group-leave.service.ts:278-284`, Redis `group-feature-settings.service.ts:95,104`) |
| Test | kém | không có spec cho Group |
| Trùng lặp | khá | `getTenantTimezone`, `inTransaction`, `buildMeta`, truy vấn thông tin user (`full_name`, email mặc định) lặp ở nhiều service (`group-relation.service.ts`, `group-user-relation.service.ts`, `group-structure.service.ts`) |
| Dead code | khá | `GroupTrackingService.roles()` và `GroupRolesDto` không có route (`group-tracking.service.ts:268-282`) |
| SQL thô | cần chú ý | nhiều SQL thô dài (báo cáo, theo dõi, đồng bộ nguồn) tự viết `deleted_at IS NULL` theo `database.md` mục 2; không có test bảo vệ |

## Nợ kỹ thuật / rủi ro quan sát được

Chi tiết có `file:line` ở [areas/group.md](areas/group.md) mục 9 (G1-G17), nổi bật: xoá nhóm là xoá cứng trong khi cột `deleted_at` gợi ý xoá mềm; đổi cha qua đồng bộ HR không cập nhật `group_source_ids`; nhóm `HR_SYNC` đã lưu trữ không có đường khôi phục; cờ `class_assignment_enabled` không chặn thao tác công tắc/gỡ; phát Kafka không outbox; route không có `tags` mặc định mở theo Casbin. Ngoài Group: `class.service.ts` quá lớn; kiểm sức chứa lớp bị comment (`class.service.ts:7544`); `patterns.md` tham chiếu T9 chưa tồn tại.
