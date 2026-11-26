# Area: Group (nhóm học viên, LMS-F002) — lms-be

> `origin/staging` @ `a2f4821`. Mọi `file:line` đều đọc bằng `git show origin/staging:<path>`. Ngữ cảnh chung (RLS, auth, transaction, cache): [../architecture.md](../architecture.md). Quy ước của repo (không chép): `openspec/conventions/database.md` mục 3 (RLS), `patterns.md` T1-T9.
> Đây là code đã merge (`origin/feature/group` đã nằm trong staging, merge commit `a2f4821`), không phải đặc tả. Đặc tả của repo ở `openspec/changes/upbase-221100-group/`.

## 1. Mô hình dữ liệu

Migration: `libs/database/migrations/1792000000000` ... `1792000007000`. Bảng tạo ở `1792000001000-create-group-tables.ts`.

### Bảng mới

| Bảng | RLS | Cột chính | Index / ràng buộc |
|---|---|---|---|
| `group_feature_settings` | `tenant_id` | `hr_sync_enabled`, `class_assignment_enabled` (mặc định false) | `UQ_group_feature_settings_tenant_id` (một dòng/tenant) (`create-group-tables.ts:134-146`) |
| `groups` | `tenant_id` | `name`(255), `code`(255), `description`(1000), `parent_id`, `left`, `right`, `source` (`MANUAL`/`HR_SYNC`), `status` (`ACTIVE`/`ARCHIVED`), `external_id`(100), `archived_root_id` (thêm ở `1792000005000`) | `UQ_groups_tenant_code (tenant_id, code) WHERE deleted_at IS NULL`; `UQ_groups_tenant_external (tenant_id, external_id) WHERE external_id IS NOT NULL AND deleted_at IS NULL`; `IDX_groups_tenant_left_right`; `IDX_groups_tenant_parent`; `IDX_groups_tenant_archived_root` (partial); FK `parent_id` `ON DELETE RESTRICT` (`:150-181`, `1792000005000:29-42`) |
| `group_user_instances` | qua `groups` (EXISTS) | `group_id`, `user_id`, `role` (`MEMBER`/`MANAGER`/`MENTOR`), `reason` (lý do rời), `join_reason`, `created_by`/`deleted_by` (FK `staffs`), `left_notified_at`; soft-delete `deleted_at` = thời điểm rời | `UQ_group_user_instances_open (group_id, user_id, role) WHERE deleted_at IS NULL`; `IDX_group_user_instances_user (user_id, role)`; `IDX_..._group_role (group_id, role)` (`:185-207`, `1792000005000:21-35`) |
| `group_class_instances` | qua `groups` | `group_id`, `class_id`, `cascade_to_children`, `auto_enroll` | `UQ_group_class_instances (group_id, class_id) WHERE deleted_at IS NULL`; index theo `group_id`, `class_id` (`:211-233`) |
| `notification_groups` | qua `notifications` | `notification_id`, `group_id` | `UQ_notification_groups (notification_id, group_id) WHERE deleted_at IS NULL` (`:237-254`) |
| `class_user_report_logs` | `tenant_id` | `class_user_id`, `user_id`, `class_id`, `type` (thêm `1792000006000`), `status`, `completed_sections`, `total_sections`, `finished_at`, `user_status`, `valid_from`/`valid_to` (kiểu `date`) | `UQ_class_user_report_logs_open (class_user_id) WHERE valid_to IS NULL`; `IDX_..._user (tenant_id, user_id, valid_from, valid_to)`; `IDX_..._tenant_from` (`:258-289`) |

Policy RLS tên `tenant_isolation_<bảng>`, `ENABLE` + `FORCE`, có `OR app_rls_bypassed()` (`create-group-tables.ts:366-376`). Bảng gốc có `tenant_id`: `group_feature_settings`, `groups`, `class_user_report_logs` (`:7`); bảng con theo cha: `group_user_instances`, `group_class_instances` (cha `groups`), `notification_groups` (cha `notifications`) (`:10-14`).

### Cột thêm vào bảng có sẵn

| Bảng.cột | Ý nghĩa | Nguồn |
|---|---|---|
| `class_mentor_instances.source_type` (`MANUAL`/`GROUP`, default `MANUAL`) | mentor vào lớp qua nhóm | `create-group-tables.ts:292-297` |
| `users.primary_manager_user_id` (FK `users`, index `IDX_users_primary_manager`) | quản lý chính chỉ định trên hồ sơ | `:300-306`; entity `user.entity.ts:199-209` |
| `class_user_instances.source_type` thêm giá trị `GROUP` | chỉ đổi comment cột | `:312-314`; hằng `CLASS_USER_SOURCE_TYPE.GROUP` (`class.constants.ts:95`) |
| `class_user_instances.group_source_ids uuid[] NOT NULL DEFAULT '{}'` | các nhóm đang giao lớp cho lượt này (kể cả lượt thêm tay) | `1792000004000-add-group-source-ids-to-class-user-instances.ts:9` |

### Dữ liệu cũ bị xoá
`1792000000000` (`:17-34`) bật bypass RLS, `DROP TABLE` `notification_group_instances`, `group_user_instances`, `groups` cũ, `departments`, `department_staff_position_instances`, `staff_business_unit_management`, cột `staffs.department_id`, xoá 4 quyền cũ `gr_get_groups|gr_create_group|gr_edit_group|gr_remove_group` khỏi `casbin_rule`. `1792000003000` seed role `GROUP_RESPONSIBLE`, `1792000007000` gỡ lại role đó (`:20-28`); `down()` của nó seed lại (`:30-57`).

### Hằng số liên quan (`libs/constants/src/lib/group/group.constants.ts`)
`GroupSource`, `HR_SYNC_ROOT_EXTERNAL_ID = '__TENANT_ROOT__'` (`:8`), `GroupStatus`, `GroupUserRole`, `GroupJoinReason` (`MANUAL_ADDED|IMPORT_ADDED|HR_SYNCED`), `GroupLeaveReason` (`MANUAL_REMOVED|IMPORT_REMOVED|HR_TRANSFERRED|HR_REMOVED|RESIGNED|ROLE_REVOKED|RESPONSIBILITY_TRANSFERRED`), `GroupEnrollmentTrigger` (`ASSIGNED|JOINED|AUTO_ENROLL|CASCADE`), `GROUP_REDIS_KEYS.FEATURE_SETTINGS = 'group:feature-settings'` (`:100-102`), cron báo cáo `'55 23 * * *'` múi `Asia/Ho_Chi_Minh` (`:105-106`), `GROUP_PERMISSIONS` 4 quyền (`:122-127`).

`field_change_logs` (bảng có sẵn) được dùng làm nhật ký với `object_type` `GROUP|GROUP_CLASS|GROUP_SYNC|CLASS_USER|USER` (`:71-77`).

## 2. Cây nhóm (nested set + `parent_id`)

`libs/modules/src/lib/group/tree/group-tree.service.ts`:

- Mọi ghi vào cây đi qua `withTreeLock` (`:305-330`): mở transaction nếu caller chưa có, rồi `pg_advisory_xact_lock(hashtext('group-tree:<tenant_id>'))` (`:320`). Khoá theo tenant, giữ tới hết transaction.
- `addNode` (`:44-83`): chèn ở `parent.right` hoặc sau `MAX(right)` của tenant; dịch `left/right >= position` thêm 2 bằng SQL thô (`:65-71`); cha phải cùng `source` với con, và với `MANUAL` cha phải `ACTIVE` (`assertValidParent :340-345`).
- `moveNode` (`:120-175`): SQL `CASE` đổi số cho đoạn bị ảnh hưởng, cấm chuyển vào nhánh con (`:135-137`).
- `removeNode` (`:92-110`): chỉ nhóm lá `MANUAL`; dùng `runner.manager.delete(Group, …)` ở `:101`, tức DELETE thật (xem gotcha G1).
- `rebuildFromParent` (`:183-207`): tính lại toàn bộ `left/right` từ `parent_id` (`buildNestedSet` ở `group-tree.util.ts`), ghi theo lô 1000; chạy bằng lệnh `repair-group-tree` (`apps/event-processor-service/src/commanders/repair-group-tree.command.ts`).
- Truy vấn cây ở `GroupRepository` (`group.repository.ts:25-152`): `findAncestors`, `findDescendants`, `findRoots`, `findChildren`, `findSelfAndAncestorsOfGroups`, `findPathNames` (`string_agg(name,' / ')`).

## 3. API (Ops) — `apps/ops/src/groups/**`

Global prefix = env `APP_OPS_PREFIX` (`apps/ops/src/main.ts:53`). Mọi route `@UseGuards(StaffGuard)`. `groups.module.ts:11-22` đăng ký module có path tĩnh trước `structure` (chứa `/groups/:id`). Cột "Quyền (tags)" = permission name trong `@ApiOperation.tags`; `READ` = `GROUP_READ_TAGS` (`VIEW`, `MANAGE`, `ASSIGN_RESPONSIBLE`, `group.constants.ts:178-182`).

| Method path | operationId | Quyền (tags) | Service |
|---|---|---|---|
| POST `/groups` | `create_group` | MANAGE | `GroupStructureService.create` |
| GET `/groups/tree`, `/groups/tree/flat`, `/groups/search`, `/groups/options` | `get_group_tree`, `get_group_tree_flat`, `search_groups`, `get_group_options` | READ | structure |
| GET `/groups` | `get_groups` | READ (đồng thời khai báo quyền `VIEW`) | `list` |
| GET `/groups/:id` | `get_group` | READ | `getDetail` |
| PUT `/groups/:id` | `update_group` | MANAGE | `update` (đổi tên/mô tả/cha) |
| GET `/groups/:id/move-preview`, `archive-preview`, `restore-preview` | `preview_move_group`, `preview_archive_group`, `preview_restore_group` | MANAGE | |
| POST `/groups/:id/archive`, `/groups/:id/restore` | `archive_group`, `restore_group` | MANAGE | |
| DELETE `/groups/:id` | `delete_group` | MANAGE | `remove` |
| GET `/groups/member-import-template` | `get_group_member_import_template` | MANAGE | `ImportGroupMemberService.buildTemplate` |
| GET `/groups/membership-logs` | `get_group_membership_logs` | `VIEW_MEMBERSHIP_LOG` | `findMembershipLogs` |
| GET `/groups/:id/members` | `get_group_members` | READ | `scope=DIRECT\|SUBTREE` |
| GET `/groups/:id/candidates` | `get_group_candidates` | MANAGE, ASSIGN_RESPONSIBLE | |
| POST/DELETE `/groups/:id/members`, POST `/groups/:id/members/remove-preview`, POST `/groups/:id/members/import` | `add_group_members`, `remove_group_members`, `preview_remove_group_members`, `import_group_members` | MANAGE | body `user_ids` tối đa 1000 (`group-member.dto.ts`) |
| GET `/groups/:id/responsibles` | `get_group_responsibles` | READ | |
| POST/DELETE `/groups/:id/managers` | `add_group_managers`, `remove_group_managers` | ASSIGN_RESPONSIBLE | |
| POST/DELETE `/groups/:id/mentors` | `add_group_mentors`, `remove_group_mentors` | ASSIGN_RESPONSIBLE | |
| GET `/groups/assignable-classes` | `get_group_assignable_classes` | MANAGE | |
| POST `/groups/:id/class-assignments/preview`, POST/GET `/groups/:id/class-assignments` | `preview_group_class_assignment`, `create_group_class_assignment`, `get_group_class_assignments` | MANAGE / READ | `class_ids` tối đa 100 |
| GET `.../class-assignments/:aid/auto-enroll-preview`; PATCH `.../:aid/auto-enroll`, `.../:aid/cascade`; DELETE `.../:aid` | `preview_group_auto_enroll`, `toggle_group_auto_enroll`, `toggle_group_cascade`, `delete_group_class_assignment` | MANAGE | |
| GET `/groups/:id/report/members`, `/children`, `/courses` | `get_group_report_members`, `..._children`, `..._courses` | READ | query `as_of=YYYY-MM-DD` |
| GET/PUT `/groups/settings` | `get_group_feature_settings`, `update_group_feature_settings` | `tags: []` | `GroupFeatureSettingsService` |
| GET `/groups/tracking/groups`, `/groups/tracking/learners`, `/groups/tracking/learners/:userId/learning` | `get_group_tracking_groups`, `..._learners`, `..._learning` | `tags: []`, security group `group_tracking` | `GroupTrackingService` |
| GET `/users/:id/group-relations`, `/users/:id/group-responsibilities` | `get_user_group_relations`, `get_user_group_responsibilities` | READ | `GroupUserRelationService` |
| PUT/DELETE `/users/:id/primary-manager` | `set_user_primary_manager`, `remove_user_primary_manager` | ASSIGN_RESPONSIBLE | |
| GET `/users/:id/transfer-responsibilities/preview`, POST `/users/:id/transfer-responsibilities` | `preview_transfer_group_responsibilities`, `transfer_group_responsibilities` | ASSIGN_RESPONSIBLE | |
| POST `/lark/webhook` | (middleware verify `LarkWebhookMiddleware`) | — | `LarkWebhookService.handleEvent` |

API phía học viên (`apps/lms`): GET `/me/managers` (`users.controller.ts:121-128`, `LmsGuard`) -> `LMSUserService.myManagers` (`apps/lms/src/users/users.service.ts:157-189`) -> `GroupManagerResolver.resolveLearnerManagers(user_id, undefined, true)`; thứ tự `PRIMARY`, `GROUP`, `INHERITED`, bỏ chính học viên khỏi danh sách quản lý nhóm (`group-manager.resolver.ts:112-161`).

Mã lỗi nhóm `640001-640026` (`libs/constants/src/lib/exceptions/exceptions.code.ts`, khối `// * Group`; không có `640002`; `GROUP_NOT_IN_SCOPE` là 403, còn lại 400/404). Exception: `libs/exceptions/src/lib/group/group.exception.ts`.

### Quyền: cơ chế `security`/`tags`
- `ScanOperationService.discoverControllers` (`libs/modules/src/lib/scan-operation/scan-operation.service.ts:84-121`) đọc `swagger/apiOperation`: `tags` thành danh sách permission của route (`group: apiOperation.tags`); chỉ `security[0]` được dùng để khai báo permission hiển thị (`:91-93`).
- 4 permission được khai báo qua các route đại diện: `get_groups` (VIEW), `create_group` (MANAGE), `add_group_managers` (ASSIGN_RESPONSIBLE), `get_group_membership_logs` (VIEW_MEMBERSHIP_LOG) (`group.constants.ts:132-175`, dùng ở các controller). Các route khác dùng `GROUP_SECURITY` (không `name`) và chỉ gắn `tags`.
- `scanAndSyncPermissions` bỏ qua môi trường `LOCAL` (`permission.service.ts:63-66`).
- `StaffGuard` -> `OpsAuthService.authorize` (`apps/ops/src/auth/ops-auth.service.ts:143-180`): `payload.sub` là **staff.id**; role nằm `ROLE_WHITE_LIST` hoặc route nằm `ROUTE_WHITE_LIST` thì qua luôn (`:166-174`); còn lại `PermissionCommonService.checkCanAcceptRoles` (`permission.service.ts:93-140`), và **route chưa có dòng Casbin nào thì mặc định cho qua** (`:99-110`).
- Hệ quả: `GET/PUT /groups/settings` và 3 route `groups/tracking/*` có `tags: []` nên chưa có dòng Casbin (cho tới khi BA gán), mọi staff qua `StaffGuard` đều gọi được. Phạm vi dữ liệu của tracking do code giới hạn theo quan hệ quản lý (mục 6).

## 4. Các đường ghi vào bảng nhóm (đầy đủ theo grep `origin/staging`)

| Bảng | Nơi ghi | Cách |
|---|---|---|
| `groups` | `group-tree.service.ts:65-71` (dịch số), `:74-81` (insert), `:101-108` (delete + kéo số), `:153-172` (move), `:198-205` (rebuild) | SQL thô / `manager.save` / `manager.delete`; luôn trong `withTreeLock` |
| `groups` | `group-structure.service.ts:199` (đổi tên/mô tả), `:336-345` (archive: cả nhánh `ACTIVE` -> `ARCHIVED`, `archived_root_id = id` được bấm), `:397-406` (restore: `id = :id OR archived_root_id = :id`) | `manager.update` / query builder |
| `groups` | `group-hr-sync.service.ts:268-278` (tạo), `:288` (đổi tên), `:297` (move), `:335-358` (nhóm gốc `__TENANT_ROOT__`, chuyển nhóm HR gốc mồ côi xuống dưới), `:444-448` (archive) | trong `withTreeLock` |
| `group_user_instances` | `group-membership.service.ts:57-72` (`openMembership`, `INSERT … ON CONFLICT DO NOTHING`), `:113-123` (`closeMembership`, `UPDATE deleted_at = now(), reason, deleted_by`) | dùng bởi `GroupMemberService.add/remove`, `ImportGroupMemberService`, `GroupHrSyncService.syncPeople` |
| `group_user_instances` | `group-relation.service.ts:177-185` (`openRole` MANAGER/MENTOR), `:207-214` (`closeRole`, `reason = ROLE_REVOKED`) | query builder |
| `group_user_instances` | `group-user-relation.service.ts:227-248` (`transfer`: đóng vai cũ `RESPONSIBILITY_TRANSFERRED`, mở vai mới cho người nhận) | |
| `group_user_instances` | `group-leave.service.ts:209-215` (`left_notified_at = now()` có điều kiện `IS NULL`) | |
| `group_user_instances` | `group-structure.service.ts:427-433` (xoá cứng mọi dòng của nhóm trước khi xoá nhóm) | DELETE thật |
| `group_class_instances` | `group-assignment.service.ts:280-289` (insert), `:749` (`update` công tắc), `:485` (`softDelete`) | trong transaction của service |
| `group_feature_settings` | `group-feature-settings.service.ts:33-46` (insert mặc định `orIgnore`), `:82` (`save`), seed `1792000002000` | |
| `class_user_report_logs` | `apps/background-job-service/src/group-report/group-report-job.service.ts:97-109` (đóng phiên bản), `:110-122` (mở phiên bản) | SQL thô trong transaction, chỉ job này ghi |
| `notification_groups` | `libs/modules/src/lib/notification/notification.service.ts:478-490` (tạo), `:906-915` (sửa: `softDelete` rồi `insert`) | |
| `users.primary_manager_user_id` | `group-user-relation.service.ts:300-329` (khoá `pessimistic_write` dòng user, ghi `field_change_logs`) | |
| `class_user_instances.group_source_ids` | `group-source.service.ts:60-82` (`array_append/array_remove`), `group-assignment.service.ts:506-511` | SQL thô |
| `class_mentor_instances` | `group-mentor-class.service.ts:200-283` (`syncClassMentors`, thêm dòng `source_type = GROUP`, xoá dòng nguồn `GROUP`) | |
| `class_user_quiz_settings.staff_id` | `group-mentor-grading.service.ts:84-93` (người chấm mặc định) | SQL thô |
| `class_user_instances` (lượt ghi danh) | `GroupEnrollmentService.enroll` -> `ClassCommonService.addStudent(…, 'GROUP', false)` (`group-enrollment.service.ts:167-171`); gỡ: `ClassCommonService.removeStudent` (`group-leave.service.ts:493`, `group-assignment.service.ts:543`) | |

Lịch sử vào/ra đọc bằng `withDeleted: true` hoặc SQL thô (`group-structure.service.ts:812-819`, `group-user-instance.repository.ts:251-299`).

## 5. Luồng sự kiện (Kafka)

Topic (`libs/constants/src/lib/kafka/kafka.constants.ts:74-79`) đều thuộc `MICRO_SERVICES.EVENT_PROCESSOR.TOPICS`, consumer `apps/event-processor-service/src/app/app.controller.ts:87-109,250-252`. Producer `KafkaService.sendTopic(topic, payload, key)` tự gắn `tenant_id` và `requestId` (`libs/modules/src/lib/kafka/kafka.service.ts:70-76`); consumer đọc `tenant_id` trong `RequestQueryRunnerInterceptor` (`request-query-runner.interceptor.ts:28-49`), thiếu thì RLS chặn hết.

| Topic | Ai phát (key) | Consumer -> service | Việc làm |
|---|---|---|---|
| `GROUP_ENROLLMENT_REQUESTED` `{user_id, assignment_ids, trigger}` | `GroupAssignmentService.publishEnrollments` (`:812-829`), `GroupMembershipService.publishJoined` (`:134-171`), `GroupStructureService.publishRestoredEnrollments` (`:710-753`); key `user_id` | `GroupEnrollmentService.process` | xem luồng A |
| `GROUP_MEMBER_LEFT` `{group_user_instance_id, to_group_id?, import_log_id?}` | `GroupMembershipService.publishLeft` (`:216-234`) từ `GroupMemberService.remove`, import `REMOVE`, hr-sync | `GroupLeaveService.process` | luồng B |
| `GROUP_SOURCE_SYNC_USER` `{user_id, add_group_ids, remove_group_ids}` | `publishSourceSync` (`membership.service.ts:181-206`), `fanOutGroup` (`source.service.ts:97-148`) | `GroupSourceService.syncUser` | cập nhật `group_source_ids` |
| `GROUP_SOURCE_SYNC_GROUP` `{group_id, add_group_ids, remove_group_ids}` | **chỉ** `GroupStructureService.publishSourceSync` (`:222-243`) khi Ops đổi nhóm cha (`:210`) | `GroupSourceService.fanOutGroup` | tách theo từng thành viên của nhánh, lô 1000 |
| `GROUP_HR_EVENT` `{type, open_department_id? \| union_id?}` | `LarkWebhookService.publishHrEvent` (`lark-webhook.service.ts:244-261`; key `tenant_id` cho phòng ban, `union_id` cho người) | `GroupHrSyncService.handleEvent` | luồng C |
| `IMPORT_GROUP_MEMBER` (một dòng tệp) | `ImportGroupMemberService.sendJobToQueue` (`import-group-member.service.ts:256-271`) | `ImportKafkaService.importGroupMember` -> `processRow` | luồng D |

Consumer Kafka retry: `consumer.retry.maxRetryTime = 5000` (`event-processor-service/src/main.ts`, phần `consumer`); không thấy outbox: producer gọi `sendTopic` sau commit (ví dụ `group-assignment.service.ts:300-309`).

### Luồng A — ghi danh theo luật đứng (`group-enrollment.service.ts:47-150`)
1. Tenant chưa bật `class_assignment_enabled` thì bỏ qua (`:54`).
2. Bỏ qua user không tồn tại / `is_operator` / `BLOCKED` (`:62-74`).
3. `GroupScopeService.findAssignmentsForUser` (`group-scope.service.ts:74-95`): quan hệ giao có nhóm giao `ACTIVE` và user là `MEMBER` đang mở ở chính nhóm đó hoặc nhóm con khi `cascade_to_children`; chỉ giữ id có trong payload (`:79-86`).
4. Gộp theo lớp; lớp không còn nhận (`isClassAccepting`: status `DRAFT`/`PUBLIC`, lớp `FIXED` chưa quá `finished_at`, `class-accepting.ts`) thì ghi `field_change_logs` `GROUP_ENROLLMENT` kèm lý do rồi bỏ qua (`:126-130`); đã có lượt ở lớp thì giữ nguyên (`:135-138`).
5. Còn lại `ClassCommonService.addStudent({classId, user:[id]}, 'GROUP', false)` (`:167`). Lỗi trong `enroll` bị `catch` và chỉ log (`:181-187`), message coi như xử lý xong.
6. Cuối cùng `GroupSourceService.syncUser` thêm các nhóm giao vào `group_source_ids` của lượt (kể cả lượt thêm tay) (`:145-149`).

### Luồng B — rời nhóm (`group-leave.service.ts:85-165`)
Chỉ xử lý lượt `MEMBER` đã đóng (`:94`). User `BLOCKED`: chỉ bớt nhóm nguồn (`:127-131`). Trong một transaction (`processClasses :371-454`): bớt nhóm vừa rời và tổ tiên khỏi `group_source_ids`; với lượt nguồn `GROUP` ở lớp do nhóm/tổ tiên (cascade) giao: còn nhóm khác giao thì giữ (có log), `READY_TO_LEARN` thì `removeStudent` + log "Điều chuyển", `IN_PROGRESS`/`COMPLETED` thì giữ và gửi mail `GROUP_MEMBER_LEFT_WITH_PROGRESS` sau commit. Chống gửi trùng: chỉ lần đặt được `left_notified_at` từ NULL mới gửi (`:209-219`). Người nhận mail: quản lý chính (to) + quản lý theo nhóm (cc), không có thì quản lý nhóm tổ tiên gần nhất khác user, hết thì `MAIL_CONST.ADMIN_MAIL` kèm link hồ sơ (`:246-270,295-339`). Lượt gỡ bằng tệp cập nhật `import_logs.result.totalManagerNotifiedRows` (`:173-191`).

### Luồng C — đồng bộ nhân sự Lark (`group-hr-sync.service.ts`)
Nguồn qua `HrStructureProvider` (trừu tượng) -> `LarkHrStructureProvider` (`lark-hr-structure.provider.ts`, phòng ban cha `'0'` coi là gốc `:5,99`; người nghỉ khi `is_resigned || is_exited` `:119`). Kích hoạt:
- Sự kiện: webhook `contact.department.*`/`contact.user.*` -> `GROUP_HR_EVENT` (chỉ phát khi `hr_sync_enabled`, `lark-webhook.service.ts:252`). `handleEvent` (`:70-113`) bỏ qua nếu cờ tắt hoặc thiếu id; lỗi được log rồi `throw` (Kafka có thể gửi lại).
- Job đêm 01:00 `Asia/Ho_Chi_Minh` cho từng tenant (`group-hr-sync-job.service.ts:7-8,26-35`) gọi `syncAll`.
- Lệnh `sync-group-structure [--tenant_id] [--allow-empty-source]` (`sync-group-structure.command.ts:30-54`).
`syncAll` (`:121-183`): đọc toàn bộ nguồn, một transaction `withTreeLock` để đảm bảo nhóm gốc `__TENANT_ROOT__` (tên = tên tenant), upsert phòng ban cha trước (`sortParentFirst`), rồi lưu trữ nhóm `HR_SYNC` `ACTIVE` không còn ở nguồn (nguồn rỗng mà DB còn nhóm thì bỏ qua trừ khi `allow_empty_source`, `:421-429`); sau đó đồng bộ người theo lô 200 (`syncPeople :501-633`): nối `users.lark_union_id`, người chưa có tài khoản bị bỏ qua (log), so nhóm mong muốn (nhóm sâu nhất trong mỗi nhánh phòng ban, `deepestGroupIds :660-683`; không có phòng ban thì nhóm gốc) với lượt `MEMBER` đang mở ở nhóm `HR_SYNC`; đóng lượt thừa (`RESIGNED` / `HR_TRANSFERRED` nếu cùng lần có lượt mới / `HR_REMOVED`), mở lượt thiếu (`HR_SYNCED`) trong một transaction, sau commit phát `GROUP_MEMBER_LEFT` rồi `publishJoined`. Người còn lượt `HR_SYNC` nhưng vắng khỏi nguồn thì rời với `RESIGNED` (`:159-172`). Mọi bước ghi `field_change_logs` `GROUP_SYNC`.

### Luồng D — nhập thành viên bằng tệp (`import-group-member.service.ts`)
`POST /groups/:id/members/import` (`action = ADD|REMOVE`, tệp `.csv|.xlsx`, cột `employee_code` hoặc `email`, không được có cột `group_id|action|actor_staff_id`, `:36-38,91-124`). `processFileImportToQueue` (lớp `BaseImportService`) tạo `import_logs` rồi phát từng dòng `IMPORT_GROUP_MEMBER`; consumer chạy `receiveJobFromQueue` (`:189-248`): nhóm phải `MANUAL` và `ACTIVE`; tìm user theo `employee_code` hoặc email mặc định, chỉ `type = STUDENT`, `ACTIVE`, không `is_super_student`; test account bị từ chối; `ADD` kiểm tra xung đột tổ tiên/hậu duệ rồi `openMembership(IMPORT_ADDED)` + `publishJoined`; `REMOVE` đóng lượt `IMPORT_REMOVED` + `publishLeft(…, import_log_id)`. Không đi qua queue Bull `import.processor.ts`.

## 6. Quản lý, mentor, theo dõi, báo cáo

- **Quản lý theo nhóm tính lúc đọc**: `resolveGroupManagers` (`group-manager.resolver.ts:38-87`) lấy quản lý trực tiếp, không có thì của tổ tiên gần nhất có quản lý (nguồn `DIRECT`/`INHERITED`). Mentor chỉ trực tiếp (`findEffectiveMentors :170-182`). Quản lý/mentor `BLOCKED` không có hiệu lực (`findEffectiveByGroups` lọc `u.status IS DISTINCT FROM BLOCKED`, `group-user-instance.repository.ts:49-62`) nhưng dòng vẫn lưu.
- **Gán**: `GroupAssigneeValidator` (`assignee/group-assignee.validator.ts:19-49`) yêu cầu `type = STUDENT` và `status = ACTIVE`. Gán mentor còn yêu cầu học viên đã có staff đi kèm (khớp `keycloak_user_id` hoặc email mặc định = `staff_details.email`): `GroupOpsAccessService.assertHasStaffs` (`ops-access/group-ops-access.service.ts:28-36`) ném `GROUP_MENTOR_STAFF_REQUIRED`; code không tạo staff. Gán quản lý không cần staff. Mail `GROUP_RESPONSIBILITY_ASSIGNED` gửi cho quản lý mới (không gửi cho mentor) (`group-relation.service.ts:98-99,227-270`).
- **Mentor -> lớp**: khi nhóm được giao lớp hoặc mentor được gán, thêm staff của mentor vào `class_mentor_instances` nguồn `GROUP`; mentor đầu tiên của lớp rỗng thành mentor chính; gỡ mentor nhóm không xoá nếu mentor đã chấm bài (`group-mentor-class.service.ts:230-247`) hoặc còn nhóm khác giao lớp (`:161-176`). Người chấm mặc định: `group_source_ids` theo thứ tự, mentor được gán sớm nhất của nhóm nguồn đầu tiên có mentor (`group-mentor-grading.service.ts:48-79`).
- **Theo dõi nhánh** (`group-tracking.service.ts`): staff -> user bằng `findManagerUserId` (khớp `keycloak_user_id` hoặc email mặc định, user chưa `BLOCKED`, `:308-328`); phạm vi = thành viên các nhánh người đó quản lý trực tiếp + học viên có `primary_manager_user_id` = người đó, loại operator/super student/BLOCKED (`user.repository.ts:21-47`); ngoài phạm vi: nhóm lọc -> `GROUP_NOT_IN_SCOPE` 403 (`:97`), xem dữ liệu học -> `ForbidenSAPPException` (`:225`); user khác tenant -> 404 (`:214-220`). Chỉ tính lớp `type = LESSON` (`CLASS_TYPE.LESSON`, `:142`).
- **Báo cáo** (`group-report.service.ts`): `as_of` phải nằm trong `[MIN(valid_from) của tenant, hôm nay)` (`:275-282`), nếu không `GROUP_REPORT_DATE_OUT_OF_RANGE`. Chế độ hiện tại đọc `class_user_instances`; chế độ quá khứ đọc `class_user_report_logs` và dựng thành viên/giao lớp tại mốc từ `created_at`/`deleted_at` đổi sang giờ `Asia/Ho_Chi_Minh` (`buildCtes :335-424`). Phạm vi = mọi nhóm trong nhánh (cả `ARCHIVED`, vì `scope_groups` không lọc `status`, `:405-409`), mọi quan hệ giao trong nhánh bất kể `cascade_to_children`, chỉ lớp `LESSON` (`assigned :418-422`). Công thức: có nghĩa vụ = `status <> CANCELED OR quá hạn`; quá hạn = `status <> COMPLETED AND finished_at < cutoff` (`:383-394`).
- **Job chụp** (`group-report-job.service.ts`): 23:55 mỗi đêm cho mọi tenant (`:42`); với user đang `MEMBER` hoặc còn phiên bản mở, đóng phiên bản khi giá trị đổi (`valid_to = hôm nay`) rồi mở phiên bản mới (`valid_from = hôm nay`) (`:92-131`); `DESIRED_SQL` (`:13-25`) chỉ lấy lượt của user còn là `MEMBER` ở nhóm chưa xoá.

## 7. Điểm nối với module khác

| Điểm nối | Chi tiết |
|---|---|
| Ghi danh lớp | `ClassCommonService.addStudent(studentAndIdClass, sourceType, isSystem, classUserType?, query_runner?)` (`libs/modules/src/lib/class/class.service.ts:7786-7967`) chọn strategy theo loại lớp (`class-add-student-strategies/{default,lesson,foundation}-add-student.strategy.ts`), `source_type` đi tới `createClassUserForAddingStudent` (`:7155-7191`, gán `source_type` ở `:7191`). Luồng nhóm truyền `isSystem = false`, nên `sendMailWhenAddStudent` chạy nhánh gửi mail chào mừng (`:7724`, điều kiện `!is_system` ở `:13477`). Kiểm tra sức chứa đã bị comment (`class.service.ts:7544`). |
| Danh sách học viên lớp (Ops) | `apps/ops/src/class/class.service.ts:96-124` trả `meta.capacity/current_count/is_over_capacity`; mỗi học viên có `source_groups` tính trực tiếp từ thành viên hiện tại + quan hệ giao `ACTIVE` (`:136-175`), KHÔNG đọc `group_source_ids`. |
| Gỡ lớp khỏi nhóm | `GroupAssignmentService.remove` (`:476-520`): từ chối nếu có người đã `COMPLETED` hoặc đã học section (`has_learners`, `:484,700-715`); xoá mềm quan hệ, gỡ mentor nhóm, `array_remove` nhóm khỏi `group_source_ids`, gỡ các lượt mồ côi (nguồn `GROUP`, `READY_TO_LEARN`, chỉ còn nhóm này) qua `removeStudent`. |
| `users` | `primary_manager_user_id`, `lark_union_id` (nối HR), `employee_code`, `is_operator`, `is_super_student`, `status` (`BLOCKED` loại khỏi mọi đếm). |
| Thông báo | `NotificationService.resolveGroupRecipients` (`libs/modules/src/lib/notification/notification.service.ts:1180-1219`): nhóm phải cùng tenant và `ACTIVE`; người nhận = thành viên cả nhánh (đã loại kiểm thử/BLOCKED) chốt lúc lưu. |
| Lark | `libs/services/src/lib/lark/lark.service.ts` (`getDepartment :91`, `getUserByUnionId :103`, `listAllDepartments :115`, `listAllUsers :199`). Webhook chỉ chạy trong tenant mặc định `subdomain = 'upbase'` (`lark-webhook.service.ts:93-99`, `libs/constants/src/lib/tenant/tenant.constants.ts:17`). `UserLarkSyncService` không đụng bảng nhóm. |
| Cache | `lmsPermissionService.clearCache(user_id)` khi thêm học viên vào lớp (`class.service.ts:13471-13475`). Cache nhóm: `group:feature-settings:<tenant_id>` (mục 8). |

## 8. Cờ tính năng theo tenant
`GroupFeatureSettingsService` (`libs/modules/src/lib/group/common/group-feature-settings.service.ts`): `getSettings` tạo dòng mặc định nếu thiếu (`:33-46`); `getFlags` đọc Redis (`REDIS_CLIENT` trực tiếp, TTL 3600s, key `group:feature-settings:<tenant_id>`, lỗi Redis bị nuốt `:93-108`); `update` `save` rồi `DEL` key (`:74-85`). Nơi kiểm tra cờ: `hr_sync_enabled` ở `group-hr-sync.service.ts:72,123`, `group-hr-sync-job.service.ts:44`, `lark-webhook.service.ts:252`; `class_assignment_enabled` ở `group-assignment.service.ts:250` (chỉ khi tạo quan hệ giao), `group-enrollment.service.ts:54`, và hiển thị ở `getDetail` (`group-structure.service.ts:653`).

## 9. Gotcha đã xác minh trong code

- **G1. Xoá nhóm là xoá cứng.** `GroupStructureService.remove` xoá cứng mọi dòng `group_user_instances` của nhóm (`:427-433`) rồi `removeNode` dùng `manager.delete` (`group-tree.service.ts:101`); cột `groups.deleted_at` và comment migration ("xoá mềm", `create-group-tables.ts:66-67`) không phản ánh đường xoá này. Điều kiện: nhóm lá, `MANUAL`, chưa từng có lượt `MEMBER` hay quan hệ giao (kể cả đã xoá mềm, `hasHistory :812-819`).
- **G2. Đổi cha do đồng bộ HR không phát `GROUP_SOURCE_SYNC_GROUP`.** Topic này chỉ có một nơi phát (`group-structure.service.ts:239`); `moveNode` trong `group-hr-sync.service.ts:297,358` không phát, nên `group_source_ids` của lượt ghi danh không được cập nhật khi nhánh HR đổi cha.
- **G3. Nhóm `HR_SYNC` đã lưu trữ không có đường khôi phục trong code.** Upsert chỉ sửa tên/cha, không đổi `status` (`group-hr-sync.service.ts:286-308`); `restore` từ chối nhóm không `MANUAL` (`group-structure.service.ts:390`). Lưu trữ HR làm từng nhóm một (`archived_root_id = id` của chính nó, `:444-448`), không kéo cả nhánh.
- **G4. Một người có thể là thành viên nhiều nhóm HR cùng lúc** (mỗi nhánh phòng ban của người đó lấy nhóm sâu nhất, `deepestGroupIds :660-683`). Ràng buộc "không đồng thời ở tổ tiên và hậu duệ" chỉ được kiểm bằng code (`findRelatedMemberships`, `group-user-instance.repository.ts:214-242`; dùng ở `GroupMemberService.add :340`, import `:214`), không có ràng buộc DB; DB chỉ chặn trùng (nhóm, user, vai) đang mở.
- **G5. Cờ `class_assignment_enabled` chỉ chặn tạo quan hệ giao và việc ghi danh.** `toggleAutoEnroll`, `toggleCascade`, `remove` không kiểm cờ (`group-assignment.service.ts:410-520`).
- **G6. Lỗi ghi danh bị nuốt.** `GroupEnrollmentService.enroll` bắt mọi lỗi `addStudent` và chỉ log (`:181-187`); không có retry theo Kafka cho trường hợp này.
- **G7. Ghi danh qua nhóm gửi mail chào mừng và không kiểm sức chứa** (mục 7). Ops chỉ hiển thị `is_over_capacity`.
- **G8. Hai nguồn "nhóm nguồn" của một lượt**: cột `group_source_ids` (dùng cho đếm `enrolled_via_group_count`, người chấm mặc định, gỡ lớp) và phép tính trực tiếp ở Ops `getSourceGroupsOfStudents`; hai nơi có thể lệch nếu một sự kiện Kafka chưa chạy.
- **G9. Gán mentor/quản lý được phép trên nhóm `HR_SYNC`** (chỉ kiểm `status = ACTIVE`, `group-relation.service.ts:337-340`), trong khi thành viên và cây của nhóm `HR_SYNC` là chỉ đọc.
- **G10. Mentor cần staff có sẵn; không có role `GROUP_RESPONSIBLE` nữa.** Comment cột `group_user_instances.user_id` trong `create-group-tables.ts:72-73` còn nói hệ thống tự tạo staff, nhưng code chỉ tra staff có sẵn (`group-ops-access.service.ts:68-148`) và migration `1792000007000` đã gỡ role. Comment entity/migration và hành vi code lệch nhau.
- **G11. `GroupTrackingService.roles()` không có route** (`group-tracking.service.ts:268-282`); `GroupRolesDto` không dùng ở controller.
- **G12. Route không có `tags` thì không bị Casbin chặn** (`permission.service.ts:99-110`): `/groups/settings` và `/groups/tracking/*` (mục 3).
- **G13. Báo cáo gồm nhóm đã lưu trữ và mọi quan hệ giao trong nhánh** (mục 6), kể cả khi nhóm giao không bật `cascade_to_children`; trong khi luật ghi danh chỉ xét nhóm giao `ACTIVE` (`group-scope.service.ts:81`).
- **G14. Phiên bản báo cáo gắn nhãn theo ngày của lần chụp 23:55**: `valid_from`/`valid_to` = ngày Việt Nam của thời điểm chạy job (`group-report-job.service.ts:93`), cho nên `as_of = hôm nay` bị từ chối (`group-report.service.ts:279`).
- **G15. Webhook Lark chỉ phục vụ tenant `upbase`** (mục 7); tenant khác chỉ đồng bộ bằng job đêm hoặc lệnh.
- **G16. Phát Kafka sau commit, không outbox**: lỗi giữa commit và `sendTopic` làm mất sự kiện (ví dụ `GroupAssignmentService.assign :290-309`); các tác vụ sửa chữa tương ứng là `ENROLL_MISSING` (`toggleAutoEnroll`) và lệnh `sync-group-structure`.
- **G17. `TenantIdSubscriber` chỉ gán `tenant_id` cho insert qua entity** (`tenant-id.subscriber.ts:27-36`); job báo cáo dùng SQL thô nên chép `tenant_id` từ `class_user_instances` (`group-report-job.service.ts:14,114`).

## 10. Test
Không có file `*.spec.ts` nào cho vùng Group trên staging (toàn repo có 13 file spec, không file nào trong `group/`, `groups/`, `group-*`). Cách verify của repo là curl theo `openspec/conventions/verification.md`.
