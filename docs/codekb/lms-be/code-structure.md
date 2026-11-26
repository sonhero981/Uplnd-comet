# Code Structure — lms-be

> `origin/staging` @ `a2f4821`. Quy ước đặt code của repo: `openspec/conventions/backend.md` mục 1 (bảng "Vị trí đặt code"), `database.md`, `patterns.md`; hướng dẫn cho agent: `CLAUDE.md`; thư mục `.claude/` (commands `opsx/*`, `be/*`, skills `openspec-*`) là của repo, không quét. Các file đó không được chép lại ở đây.

## Cấu trúc thư mục (cấp 1-2)

```
apps/
  ops/                        # API quản trị (StaffGuard) - ~60 thư mục chức năng, trong đó groups/ (sâu)
  lms/                        # API học viên (LmsGuard)
  event-processor-service/    # consumer Kafka (src/app/*.handler.ts, app.controller.ts) + src/commanders/*
  background-job-service/     # cron (src/group-hr-sync, src/group-report, src/gamification*, src/app)
  notification-service/       # mail/thông báo; templates MJML src/assets/templates/**
  video-service/  mock-test-service/
libs/
  modules/src/lib/<domain>/   # business logic dùng chung (class, course, group, user, kafka, import, notification, queues, ...)
  database/                   # entities (143 *.entity.ts), repositories, migrations/ (55 file), migrations-stored-procedure/, src/lib/extends (tenant/RLS)
  constants/src/lib/<domain>/ # topic Kafka, enum, mã lỗi, mail type, cache key
  interface/src/lib/dto/<domain>/  # request/response DTO + payload Kafka
  services/src/lib/           # client bên thứ ba: lark, keycloak, kafka, redis, s3, fcm, mailer, cloudflare, casbin, sapp-ai
  exceptions/ utils/ validation/ configuration/ swagger/
openspec/                     # quy trình + conventions + changes/ (upbase-221100-group đang mở, gamification đã archive)
deploy/ docs/gamification/contract.md  .github/workflows/deploy-{staging,production}.yml
```

Bố cục khớp `backend.md` mục 1: controller/guard/wiring ở `apps/<app>`, logic dùng chung ở `libs/modules`, entity/repository/migration ở `libs/database`, hằng số ở `libs/constants`, DTO ở `libs/interface`.

## Các pattern lặp lại trong code (đã xác nhận ở vùng Group)

| Pattern | Chỗ thấy | Ghi chú |
|---|---|---|
| Controller mỏng gọi service, `SAPPResponse.Success / PaginationSuccess` | `apps/ops/src/groups/structure/group.controller.ts:48-60` | mỗi route có `@UseGuards(StaffGuard)`, `@ApiOperation({operationId, security, tags})` |
| Repository tuỳ biến bằng `@CustomRepository(Entity)` | `libs/database/src/lib/repositories/group/group.repository.ts:16` | đăng ký qua `TypeOrmExModule` (theo `database.md`) |
| Truy vấn nhận `query_runner?` để tham gia transaction của caller | `group-user-instance.repository.ts:49-53`, `group-scope.service.ts` | patterns.md T1 |
| Kafka consumer: controller `@EventPattern` -> `*.handler.ts` -> service ở `libs/modules` | `apps/event-processor-service/src/app/app.controller.ts:87-109` | tenant nhận từ payload `tenant_id` (interceptor) |
| Module con gom theo chức năng, `GroupCommonModule` gom 12 module | `libs/modules/src/lib/group/group.module.ts:15-28`, `share.module.ts:79,132` | |
| Comment JSDoc `@description` bắt buộc cho method | `.eslintrc.json` rule `jsdoc/require-jsdoc` | |
| Comment `// Spec: ...` trong code nghiệp vụ nhóm | ví dụ `group-enrollment.service.ts:52`, `group-leave.service.ts:159` | theo `CLAUDE.md` mục 1 của repo |

## Vùng Group: file theo vai trò

| Vai trò | Đường dẫn |
|---|---|
| Entity (5) | `libs/database/src/lib/entities/group/{group,group-user-instance,group-class-instance,group-feature-settings,class-user-report-version}.entity.ts`; thêm `notification/notification-group.entity.ts` |
| Repository | `libs/database/src/lib/repositories/group/*.repository.ts` (+ `notification/notification-group.repository.ts`) |
| Migration | `libs/database/migrations/1792000000000` ... `1792000007000` (8 file) |
| Hằng số | `libs/constants/src/lib/group/group.constants.ts`, topic: `libs/constants/src/lib/kafka/kafka.constants.ts:74-79`, mã lỗi `exceptions.code.ts` (khối `// * Group`, `640001-640026`), mail `mail.ts:698-712` |
| DTO | `libs/interface/src/lib/dto/group/{structure,members,relations,user-relations,assignments,report,settings,tracking,kafka,lms}/*` |
| Exception | `libs/exceptions/src/lib/group/group.exception.ts` |
| Logic dùng chung | `libs/modules/src/lib/group/{tree,membership,scope,source,enrollment,leave,hr-sync,manager,mentor-class,ops-access,assignee,common}/*` |
| API Ops (8 module con) | `apps/ops/src/groups/{structure,members,relations,user-relations,assignments,report,settings,tracking}/*` + `groups.module.ts` |
| Import thành viên | `libs/modules/src/lib/import/import-group-member.service.ts` (Kafka theo từng dòng, KHÔNG qua Bull `import.processor.ts`) |
| Consumer Kafka | `apps/event-processor-service/src/app/group-{enrollment-requested,member-left,source-sync-group,source-sync-user,hr-event}.handler.ts`, `app.controller.ts:87-109,250-252` |
| Lệnh vận hành | `apps/event-processor-service/src/commanders/{sync-group-structure,repair-group-tree}.command.ts` |
| Job | `apps/background-job-service/src/group-hr-sync/*`, `group-report/*` |
| Webhook nguồn sự kiện HR | `apps/ops/src/lark/lark-webhook.service.ts` |
| Nối sang module khác | `libs/modules/src/lib/class/class.service.ts` (`addStudent` :7786), `apps/ops/src/class/class.service.ts:96-186`, `apps/lms/src/users/users.{controller,service}.ts` (`/me/managers`), `libs/modules/src/lib/notification/notification.service.ts` (nhóm nhận thông báo), `libs/database/src/lib/repositories/user/user.repository.ts:21-69` |

## Điểm dễ nhầm về tên

- `support-group` (`libs/modules/src/lib/support-group`, entity `SupportGroup`) là chức năng khác (nhóm supporter), không phải nhóm học viên LMS-F002. `import.processor.ts` chỉ nhắc `SupportGroup`.
- Migration timestamp là `1792000000000...`, không phải "17920000*" như tên gọi tắt.
- `GroupTrackingService.roles()` (`group-tracking.service.ts:268`) có trong code nhưng không có route nào gọi (controller chỉ có 3 route tracking).
