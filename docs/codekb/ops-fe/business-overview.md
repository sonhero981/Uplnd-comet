# Business Overview — ops-fe

> Ghi nhận trên `origin/staging` @ `40f66b247` (xem `reverse-engineering-timestamp.md`). Quét tập trung vào feature Group (LMS-F002); phần còn lại ở mức cấu trúc nông.
> Quy ước của chính repo: `ops-fe:.claude/CLAUDE.md`, `ops-fe:.claude/rules/*`, `ops-fe:.claude/inventory/*` (không chép lại ở đây).

## Mục đích

`ops-fe` là web app vận hành ("UpLMS Ops", Admin Portal) của Upbase LMS: nhân sự vận hành quản lý học viên, giáo viên, nhân viên, lớp và khoá học, câu hỏi/bài thi, chấm bài, lịch, chứng chỉ, thông báo, gamification, v.v. Là monorepo pnpm một app (`apps/ops-fe`, tên `ops-fe`, version 8.1.8) cộng các feature module cắm vào được (`ops-fe:apps/ops-fe/package.json:3-4`, `ops-fe:.claude/CLAUDE.md:3`).

Repo còn là white-label đa khách hàng: `pnpm gen <config>` sinh bản build chỉ chứa các feature khai trong `configs/customer-*.json` (`ops-fe:scripts/generate-customer.js:11-17,19-56`).

## Miền nghiệp vụ theo feature (mức cấu trúc)

| Feature (`features/*`) | Gói | Vai trò (suy từ tên module/route, chưa đọc sâu) | File .ts/.tsx |
|---|---|---|---|
| `class-and-course` | `@ops/feature-class-and-course` | Lớp, khoá học, question bank, resource | 412 |
| `user` | `@ops/feature-user` | Học viên, giáo viên, nhân viên, hồ sơ | 86 |
| `schedule` | `@ops/feature-schedule` | Lịch; cũng chứa trang Import Log (`features/schedule/src/routes.tsx:96-104`) | 96 |
| `gamification` | `@ops/feature-gamification` | Gamification (Sprint 2) | 66 |
| `support` | `@ops/feature-support` | Hỗ trợ, ticket | 63 |
| `grading`, `test`, `dashboard`, `department`, `role`, `notification`, `certificate`, `marketing`, `working-schedule`, `video-streaming`, `cache` | `@ops/feature-*` | các miền còn lại | 4-29 mỗi cái |
| `course-version` | `@ops/feature-course-version` | Có `package.json` nhưng không có `src/index.ts` export `AppModule`, không có trong `module-registry.ts` | 30 |
| **`group`** | `@ops/feature-group` | **Nhóm học viên (LMS-F002)** — đào sâu | 121 |

Danh sách module đăng ký: `ops-fe:apps/ops-fe/src/module-registry.ts:1-38` (17 module).

## Feature Group (LMS-F002)

Nguồn tài liệu của feature, ghi trong `ops-fe:features/group/CLAUDE.md:3-6`: intent `261005-group`, Jira UPLND-423/424/425 (nền, danh sách, thành viên/nhập tệp/nhật ký), PRD `inception/prd/prd.md`, tech design `fe-technical-design.md`.

Người vận hành:
- tạo/sửa/di chuyển/lưu trữ/khôi phục/xoá nhóm; xem cây nhóm (React Flow) hoặc bảng (`features/group/src/components/groups/GroupList/GroupList.tsx`);
- quản lý thành viên (thêm, gỡ, nhập tệp), giao lớp cho nhóm (tự ghi danh, cascade nhánh con), gán quản lý/mentor, xem báo cáo học tập của nhóm, xem nhật ký thành viên;
- nhóm có hai nguồn: `MANUAL` (tự tạo) và `SYNCED` (đồng bộ từ HR, chỉ đọc cơ cấu/thành viên) (`ops-fe:features/group/src/types/index.ts:8-13`, `ops-fe:libs/core/src/types/learner-group.ts:47-50`).

Quản lý (người học bình thường được gán quản lý) có màn riêng `My Team` (`/my-team`, `/my-team/learners/:id`) bật theo cờ `is_group_manager` của `GET /me` (`ops-fe:libs/hooks/src/permission/useTeamAccess.ts:14-19`).

Chi tiết route, tab, mock/thật, quyền, gotcha: `areas/group.md`.

## Điểm nối của Group sang miền khác

| Nơi | Điểm nối | Bằng chứng |
|---|---|---|
| `features/user` hồ sơ học viên | nhúng `StudentGroupSection` (Groups, Managers, Responsibilities) | `ops-fe:features/user/src/components/student-profile/student-setting/index.tsx:11,34` |
| `features/class-and-course` tab Mentor | cột "Group in charge" đọc `source_groups` | `ops-fe:features/class-and-course/src/components/classes/profile/user/ListMentorClass.tsx:101-148` |
| `features/class-and-course` tab Students | cột "Nguồn" (`source_groups`) và dòng báo vượt sức chứa đọc `meta.is_over_capacity` | `.../StudentList/ListStudent.tsx:197-203,563-581,739-744` |
| `features/class-and-course` tạo lớp | cảnh báo capacity tính ở client | `.../classes/create/ListUser.tsx:170-177,255-260` |
| `features/notification` | chọn nhóm người nhận qua `LearnerGroupAPI.getOptions` (BR-21.1) | `ops-fe:features/notification/src/hooks/useRecipientGroups.ts:44-57` |
| `apps/ops-fe` | `HomeRedirect` đưa tài khoản chỉ có vai quản lý vào My Team | `ops-fe:apps/ops-fe/src/routes/HomeRedirect.tsx:9-19` |

## Người dùng và đăng nhập

Đăng nhập qua Keycloak SSO (`@upbase-tech/auth-package`), không có trang login riêng; tài khoản không được vào UpOPS thấy màn `AccessDenied` (`ops-fe:apps/ops-fe/src/components/access-denied/index.tsx:44-57`). Chi tiết ở `architecture.md`.
