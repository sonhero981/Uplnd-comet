# API Documentation — lms-be

> `origin/staging` @ `a2f4821`. Sâu cho vùng Group; các nhóm API khác chỉ đếm theo app (shallow). Quy ước viết API của repo: `openspec/conventions/backend.md` mục 2-3 (guard + `@ApiOperation` hợp lệ, `tags` để trống cho BA, `UuidValidationPipe`, lỗi validation 422 `422|000405`, lỗi nghiệp vụ 400).

## Quy mô (đếm decorator, không phải danh sách đầy đủ)

| App | File có `@Controller(` | Decorator `@Get/@Post/@Put/@Patch/@Delete` |
|---|---|---|
| `apps/ops` | 65 | 574 (537 dòng `operationId` trong `apps/ops`) |
| `apps/lms` | 27 | 148 |
| `apps/mock-test-service` | 7 | 21 |
| `apps/notification-service`, `apps/video-service` | 2 + 2 | 2 + 2 |
| Kafka `@EventPattern` ở `apps/event-processor-service/src/app/app.controller.ts` | 1 | 34 |

Cổng vào và định dạng chung: `apps/ops/src/main.ts` (prefix toàn cục từ env `EnvDict.app_ops.prefix`, `ValidationPipe` `whitelist` + `transform`, `ClassSerializerInterceptor`, Swagger ở `<prefix>/docs` trừ `PRODUCTION`, body thô cho `/<prefix>/lark/webhook`). Response bọc bằng `SAPPResponse.Success` / `PaginationSuccess` (`@sapp/utils`). Phân trang: `PaginationDto` (`page_index`, `page_size`) và meta `{ total_records, total_pages, page_size, page_index, next_page }` (`group-structure.service.ts:932-941`).

Xác thực: Ops dùng `StaffGuard` (Keycloak JWT -> staff, xem [architecture.md](architecture.md)); LMS dùng `LmsGuard` (`apps/lms/src/auth/guard/lms.guard.ts`); mock-test dùng `mock-test.guard.ts`; API key: `libs/modules/src/lib/auth-api-key/auth-api-key.guard.ts`.

## Group — HTTP (Ops)

Bảng đầy đủ method/path/operationId/quyền: [areas/group.md](areas/group.md) mục 3. Tóm tắt nhóm route (đều `StaffGuard`):

- Cấu trúc: `POST/GET/PUT/DELETE /groups…`, `tree`, `tree/flat`, `search`, `options`, `:id/{move,archive,restore}-preview`, `:id/archive`, `:id/restore`.
- Thành viên: `GET /groups/:id/members`, `:id/candidates`, `POST/DELETE :id/members`, `:id/members/remove-preview`, `:id/members/import`, `GET /groups/member-import-template`, `GET /groups/membership-logs`.
- Người phụ trách: `GET :id/responsibles`, `POST/DELETE :id/managers`, `:id/mentors`; phía học viên `GET/PUT/DELETE /users/:id/{group-relations,group-responsibilities,primary-manager}`, `GET/POST /users/:id/transfer-responsibilities[/preview]`.
- Giao lớp: `GET /groups/assignable-classes`, `POST :id/class-assignments[/preview]`, `GET :id/class-assignments`, `GET :id/class-assignments/:aid/auto-enroll-preview`, `PATCH …/:aid/auto-enroll`, `PATCH …/:aid/cascade`, `DELETE …/:aid`.
- Báo cáo: `GET :id/report/{members,children,courses}?as_of=YYYY-MM-DD`.
- Cấu hình tenant: `GET/PUT /groups/settings` (`{hr_sync_enabled, class_assignment_enabled}`).
- Theo dõi quản lý: `GET /groups/tracking/{groups,learners}`, `GET /groups/tracking/learners/:userId/learning`.
- Webhook: `POST /lark/webhook` (`apps/ops/src/lark/lark-webhook.controller.ts:17,26`).

Giới hạn đầu vào đã thấy: `user_ids` <= 1000 và duy nhất (`group-member.dto.ts`, `group-relation.dto.ts`), `class_ids` <= 100 (`group-assignment-request.dto.ts`), `name` <= 255, `description` <= 1000 (`create-group.dto.ts`), `scope=DIRECT|SUBTREE`, `status=ACTIVE|ARCHIVED|ALL` (mặc định `ACTIVE`).

## Group — HTTP (LMS)

`GET /me/managers` (`apps/lms/src/users/users.controller.ts:121-128`, `LmsGuard`) -> `LearnerMyManagerDto[]` `{ user_id, full_name, email, avatar, type: PRIMARY|GROUP|INHERITED }` (`libs/interface/src/lib/dto/group/lms/lms-my-manager.dto.ts`).

## Group — mã lỗi

Khối `// * Group` trong `libs/constants/src/lib/exceptions/exceptions.code.ts`: `GROUP_NOT_FOUND 404|640001`, `GROUP_PARENT_INVALID 640003`, `GROUP_SYNCED_READ_ONLY 640004`, `GROUP_CODE_IMMUTABLE 640005`, `GROUP_MOVE_INTO_DESCENDANT 640006`, `GROUP_ALREADY_ARCHIVED 640007`, `GROUP_NOT_ARCHIVED 640008`, `GROUP_HAS_HISTORY 640009`, `GROUP_HAS_CHILDREN 640010`, `GROUP_ARCHIVED 640011`, `GROUP_MEMBER_INVALID 640012`, `GROUP_MEMBER_NOT_IN_GROUP 640013`, `GROUP_CONTENT_ASSIGNMENT_DISABLED 640014`, `CLASS_NOT_ACCEPTING 640015`, `GROUP_CLASS_ALREADY_ASSIGNED 640016`, `GROUP_CLASS_HAS_LEARNERS 640017`, `USER_NOT_ASSIGNABLE 640018`, `TRANSFER_TO_SELF 640019`, `GROUP_NOT_IN_SCOPE 403|640020`, `GROUP_REPORT_DATE_OUT_OF_RANGE 640021`, `GROUP_MEMBER_ALREADY_IN_GROUP 640022`, `GROUP_MEMBER_TEST_ACCOUNT 640023`, `GROUP_IMPORT_FILE_INVALID 640024`, `GROUP_MEMBER_IN_RELATED_GROUP 640025`, `GROUP_MENTOR_STAFF_REQUIRED 640026` (tất cả `400|…` trừ ghi chú). Một số lỗi trả kèm `others`/`user_ids` (ví dụ `GroupMemberInvalidException({ user_ids })`).

## Kafka (nội bộ)

Topic `MICRO_SERVICES.EVENT_PROCESSOR.TOPICS` (`libs/constants/src/lib/kafka/kafka.constants.ts:32-80`): 34 pattern xử lý ở `app.controller.ts`; riêng Group: `process_group_hr_event`, `process_group_enrollment_requested`, `process_group_member_left`, `process_group_source_sync_group`, `process_group_source_sync_user`, `process_import_group_member` (payload ở `libs/interface/src/lib/dto/group/kafka/*`; luồng ở [areas/group.md](areas/group.md) mục 5). Topic khác theo `MICRO_SERVICES`: `VIDEO_SERVICE`, `NOTIFICATION_SERVICE` (`process_send_mail`, …), `MOCK_TEST_SERVICE` (`process_grade_quiz_attempt`).

## Cron và lệnh (nội bộ)

- `apps/background-job-service/src/app/app.controller.ts`: khoảng 20 `@Cron` (múi `Asia/Ho_Chi_Minh`), shallow.
- Group: `GroupHrSyncJobService` `0 0 1 * * *` (`group-hr-sync-job.service.ts:7,26`); `GroupReportJobService` `55 23 * * *` (`group.constants.ts:105`); gamification: các job `0 */15 * * * *`, `0 0 * * * *`.
- nest-commander: `sync-group-structure [-t <tenant_id>] [--allow-empty-source]`, `repair-group-tree [-t <tenant_id>]` (`apps/event-processor-service/src/commanders/`); thư mục `commanders` khác ở `apps/lms`, `apps/background-job-service` chưa quét.
