# Business Overview — lms-be

> Quét `origin/staging` @ `a2f4821` (Minimal ở mức toàn repo, sâu ở vùng Group / LMS-F002). Quy ước của repo không chép lại ở đây: `CLAUDE.md`, `openspec/README.md`, `openspec/conventions/{backend,database,patterns,verification,git,domain}.md` (xem [architecture.md](architecture.md) mục "Quy ước của repo").

## Repo là gì

`lms-be` là backend của UpLnD/UpBase LMS: một Nx monorepo NestJS + TypeORM (PostgreSQL) + Kafka, đa tenant bằng Postgres RLS (`CLAUDE.md:3`). Gồm 7 ứng dụng deploy riêng (`docker-compose.yml`: `ops`, `lms`, `notification`, `background-job`, `video`, `event-processor`, `mock-test`; mỗi service chạy `node dist/apps/<app>/main.js`).

| App | Người dùng | Vai trò (suy ra từ cấu trúc thư mục, mức shallow) |
|---|---|---|
| `apps/ops` | nhân sự (staff) quản trị | API quản trị: lớp, khoá học, quiz, nhân sự, quyền, nhóm học viên, webhook Lark (`apps/ops/src/*`) |
| `apps/lms` | học viên | API phía học viên: lớp, khoá học, quiz, gamification, thông báo, `users/me/managers` |
| `apps/event-processor-service` | nội bộ | Consumer Kafka (`@EventPattern`) + lệnh nest-commander |
| `apps/background-job-service` | nội bộ | Cron (`@nestjs/schedule`) |
| `apps/notification-service` | nội bộ | Mail/thông báo, template MJML dưới `src/assets/templates` |
| `apps/video-service`, `apps/mock-test-service` | nội bộ / học viên | Xử lý video; dịch vụ thi thử (không quét sâu) |

## Miền nghiệp vụ (từ `libs/modules/src/lib/*`, shallow)

class, course, quiz / quiz-attempt / quiz-attempt-grading, question, resource, schedule / teacher-schedule, staff / staff-level / staff-position / staff-facility, user, role / permission / lms-permission, notification, mail, import, report / report-log, gamification / gamification-campaign, certificate, facility / room / address, support-group, tenant, **group** (vùng quét sâu).

## Vùng quét sâu: Group (nhóm học viên, LMS-F002)

Chức năng nhóm học viên thay thế chức năng "group" cũ: migration `libs/database/migrations/1792000000000-drop-legacy-group-department-business-unit.ts:17-34` xoá bảng `groups`, `group_user_instances`, `notification_group_instances` cũ, phòng ban (`departments`), đơn vị kinh doanh và 4 quyền `gr_*` cũ, rồi `1792000001000-create-group-tables.ts` tạo lại bộ bảng mới.

Những gì code thực hiện (chi tiết, file:line ở [areas/group.md](areas/group.md)):

- **Cây nhóm nhiều cấp** theo `parent_id` + nested set `left/right` cho mỗi tenant; nhóm có nguồn `MANUAL` (tự tạo trên Ops) hoặc `HR_SYNC` (đồng bộ từ Lark, chỉ đọc trên Ops); trạng thái `ACTIVE`/`ARCHIVED`.
- **Vai trò trong nhóm**: `MEMBER`, `MANAGER`, `MENTOR` (`libs/constants/src/lib/group/group.constants.ts:17-21`); mỗi lượt vào/ra là một dòng `group_user_instances` (nhật ký vào/ra).
- **Giao lớp cho nhóm** (`group_class_instances`) với 2 công tắc `auto_enroll`, `cascade_to_children`; ghi danh qua Kafka, nguồn lượt ghi danh `GROUP`, danh sách `class_user_instances.group_source_ids`.
- **Quản lý chính** của học viên (`users.primary_manager_user_id`), quản lý kế thừa từ nhóm cha (tính lúc đọc), mentor đi theo nhóm vào lớp, người chấm mặc định theo mentor nhóm.
- **Theo dõi nhánh** cho quản lý (Ops `groups/tracking/*`), **báo cáo nhóm** hiện tại và theo mốc quá khứ (bảng `class_user_report_logs`, job chụp 23:55 mỗi đêm).
- **Đồng bộ nhân sự từ Lark** (webhook + job 01:00 + lệnh `sync-group-structure`), gated bởi cờ theo tenant `group_feature_settings.hr_sync_enabled`; giao lớp gated bởi `class_assignment_enabled`.
- **Thông báo theo nhóm** (`notification_groups`) và 2 loại mail `GROUP_MEMBER_LEFT_WITH_PROGRESS`, `GROUP_RESPONSIBILITY_ASSIGNED` (`libs/constants/src/lib/mail/mail.ts:698-712`).

## Tài liệu đặc tả của repo (không phải code)

`openspec/changes/upbase-221100-group/{proposal,design,tasks}.md` và `specs/{class,group,notification}/*/spec.md` mô tả ý định; chỉ dùng để đối chiếu, mọi khẳng định trong codekb này lấy từ code.
