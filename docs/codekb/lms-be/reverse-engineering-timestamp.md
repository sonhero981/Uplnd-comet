# Reverse Engineering Timestamp

## Run Record

- Date: 2026-11-18
- Commit: a2f4821d139b52edcd763759fbbf25fa801bd80e (`origin/staging`, "Merge remote-tracking branch 'origin/feature/group' into staging", 2026-11-17)
- Base ref đã ghi: `origin/staging` (sau `git fetch origin`; working tree của `E:\Upbase-comet\lms-be` đang ở `main`, không phải thứ được ghi lại, và không bị checkout/pull/sửa).
- Cách đọc code: chỉ qua git: `git show origin/staging:<path>`, `git grep -n <pattern> origin/staging -- <paths>`, `git ls-tree`, `git diff`/`git log` giữa các ref. Không đọc working tree cho code được trích dẫn. Không dùng CodeGraph (chỉ lập chỉ mục working tree `main`).
- Loại quét: focused scan vùng Group (LMS-F002), Minimal ở phần còn lại của repo, một agent (lead-only path), không dùng engine.
- Quy ước của repo (chỉ trỏ tới, không sao chép): `CLAUDE.md`, `openspec/README.md`, `openspec/conventions/{backend,database,patterns,verification,git,domain}.md`. Thư mục `.claude/` của repo không quét.
- Hạn chế đã biết: vì bị ngắt giữa chừng nên một số file chỉ đọc một phần (ghi `path#Lx-Ly`); controller Group ngoài `group.controller.ts` chỉ đọc qua decorator; không chạy lint/test/typecheck.

## WIP branches

Nhánh remote chưa merge (theo `git branch -r --sort=-committerdate`, so với `origin/staging`). Đây KHÔNG phải code hiện có.

| Nhánh | Trạng thái so với staging | Chạm vùng Group? |
|---|---|---|
| `origin/feature/group` | 0 commit trước, 17 commit sau; là tổ tiên của staging (đã merge) | đã nằm trong staging |
| `origin/feature/uplnd-sprint-4/uplnd-484-485-manager-relations` | 2 commit chưa nằm trong staging theo SHA (`9862729`, merge `5038a7a`), staging đi trước 10 commit; nội dung API "quản lý của học viên" (`/me/managers`, `myManagers`, `resolveLearnerManagers`) đã vào staging qua commit `1ebf12b`/`eb4ca4c` (#18). `git diff origin/staging origin/<nhánh>` chỉ còn cho thấy nhánh thiếu các thay đổi mới hơn của staging, không thêm gì mới ở vùng Group | có (6 file group: `apps/ops/src/groups/tracking/*`, `libs/interface/src/lib/dto/group/{lms,tracking}/*`, `group-manager.resolver.ts`) nhưng không còn khác biệt thêm |
| `origin/comet-group` | 3 commit trước, 423 sau; thêm `openspec/schemas/*`, `skills-lock.json`, sửa `package.json`/`yarn.lock` (nền cũ) | không có file group trong `apps/`/`libs/` |
| `origin/feat/first_table_refactor` | 1 commit (2026-09-23) tiền-nhóm: "add tenant, update db structure, force db pool per request"; chạm `libs/database/src/lib/entities/group/group.entity.ts` (entity cũ, trước khi viết lại ở `1792000000000`) | entity cũ, lỗi thời |
| `origin/feature/gamification_implement_wp5_7_8` (3), `origin/hotfix/505-event-test` (2), `origin/main` (2), `origin/mcp` (1) | chưa merge theo SHA | không chạm file group |
| Các nhánh còn lại (`feature/gamification*`, `feat/multi_tenant_database`, `hotfix/*`, `init-lms`, `feature/feature/237/envoy-gateway`, `feat/add_logic_catalog_for_course_and_class`, `feature/uplnd-sprint-3/uplnd-401-…`) | 0 commit trước staging (đã nằm trong staging) | không |

## Scope of Analysis

```yaml
scope_version: 1
kind: partial
intent: codekb
fingerprint: unknown (không cài engine; độ mới = commit + analyzed.paths)
commit: a2f4821
analyzed:
  paths:
    - package.json
    - jest.config.ts
    - .eslintrc.json#L1-L50
    - .husky/pre-commit
    - .husky/commit-msg
    - .github/workflows/deploy-staging.yml#L1-L60
    - libs/database/migrations/1792000000000-drop-legacy-group-department-business-unit.ts#L1-L71
    - libs/database/migrations/1792000001000-create-group-tables.ts
    - libs/database/migrations/1792000002000-seed-group-feature-settings.ts
    - libs/database/migrations/1792000004000-add-group-source-ids-to-class-user-instances.ts
    - libs/database/migrations/1792000005000-add-group-member-reason-actor.ts#L1-L70
    - libs/database/migrations/1792000006000-add-type-to-class-user-report-logs.ts
    - libs/database/migrations/1792000007000-drop-group-responsible-role.ts
    - libs/database/src/lib/entities/group/
    - libs/database/src/lib/repositories/group/
    - libs/database/src/lib/repositories/user/user.repository.ts#L1-L70
    - libs/database/src/lib/extends/request-query-runner.interceptor.ts
    - libs/database/src/lib/extends/request-query-runner.middleware.ts
    - libs/database/src/lib/extends/tenant-context.service.ts#L20-L185
    - libs/database/src/lib/extends/tenant-id.subscriber.ts
    - libs/database/src/lib/extends/tenant-ownership.service.ts#L1-L60
    - libs/constants/src/lib/group/group.constants.ts
    - libs/constants/src/lib/kafka/kafka.constants.ts#L1-L100
    - libs/constants/src/lib/exceptions/exceptions.code.ts#L625-L690
    - libs/interface/src/lib/dto/group/kafka/
    - libs/interface/src/lib/dto/group/report/
    - libs/interface/src/lib/dto/group/lms/
    - libs/modules/src/lib/group/tree/
    - libs/modules/src/lib/group/membership/
    - libs/modules/src/lib/group/scope/
    - libs/modules/src/lib/group/source/
    - libs/modules/src/lib/group/enrollment/
    - libs/modules/src/lib/group/hr-sync/
    - libs/modules/src/lib/group/manager/
    - libs/modules/src/lib/group/mentor-class/
    - libs/modules/src/lib/group/ops-access/
    - libs/modules/src/lib/group/assignee/
    - libs/modules/src/lib/group/common/
    - libs/modules/src/lib/group/group.module.ts
    - libs/modules/src/lib/group/leave/group-leave.service.ts#L1-L500
    - libs/modules/src/lib/import/import-group-member.service.ts
    - libs/modules/src/lib/kafka/kafka.service.ts#L60-L130
    - libs/modules/src/lib/permission/permission.service.ts#L40-L140
    - libs/modules/src/lib/scan-operation/scan-operation.service.ts
    - libs/modules/src/lib/class/class-add-student-strategies/
    - libs/modules/src/lib/class/class.service.ts#L7155-L7200
    - libs/modules/src/lib/class/class.service.ts#L7525-L7550
    - libs/modules/src/lib/class/class.service.ts#L7681-L7735
    - libs/modules/src/lib/class/class.service.ts#L7770-L7830
    - libs/modules/src/lib/class/class.service.ts#L7925-L7990
    - libs/modules/src/lib/class/class.service.ts#L13469-L13485
    - libs/modules/src/lib/notification/notification.service.ts#L395-L500
    - libs/modules/src/lib/notification/notification.service.ts#L880-L945
    - libs/modules/src/lib/notification/notification.service.ts#L1180-L1219
    - apps/ops/src/main.ts#L1-L90
    - apps/ops/src/auth/guard/staff.guard.ts
    - apps/ops/src/auth/ops-auth.service.ts
    - apps/ops/src/class/class.service.ts#L85-L185
    - apps/ops/src/lark/lark-webhook.service.ts#L40-L270
    - apps/ops/src/groups/groups.module.ts
    - apps/ops/src/groups/structure/group-structure.service.ts
    - apps/ops/src/groups/structure/group.controller.ts
    - apps/ops/src/groups/assignments/group-assignment.service.ts
    - apps/ops/src/groups/relations/group-relation.service.ts
    - apps/ops/src/groups/user-relations/group-user-relation.service.ts#L95-L563
    - apps/ops/src/groups/members/group-member.service.ts#L55-L494
    - apps/ops/src/groups/report/group-report.service.ts#L1-L180
    - apps/ops/src/groups/report/group-report.service.ts#L270-L484
    - apps/ops/src/groups/tracking/group-tracking.service.ts
    - apps/ops/src/groups/tracking/group-tracking.controller.ts#L1-L35
    - apps/ops/src/groups/settings/group-feature-settings.controller.ts
    - apps/lms/src/users/users.controller.ts#L109-L130
    - apps/lms/src/users/users.service.ts#L145-L215
    - apps/event-processor-service/src/main.ts#L15-L60
    - apps/event-processor-service/src/app/app.controller.ts#L87-L109
    - apps/event-processor-service/src/app/app.controller.ts#L250-L252
    - apps/event-processor-service/src/app/group-enrollment-requested.handler.ts
    - apps/event-processor-service/src/app/group-member-left.handler.ts
    - apps/event-processor-service/src/app/group-source-sync-group.handler.ts
    - apps/event-processor-service/src/app/group-source-sync-user.handler.ts
    - apps/event-processor-service/src/app/group-hr-event.handler.ts
    - apps/event-processor-service/src/commanders/sync-group-structure.command.ts
    - apps/event-processor-service/src/commanders/repair-group-tree.command.ts
    - apps/background-job-service/src/group-hr-sync/
    - apps/background-job-service/src/group-report/
  components:
    - Group
    - GroupUserInstance
    - GroupClassInstance
    - GroupFeatureSettings
    - ClassUserReportVersion
    - NotificationGroup
shallow:
  paths:
    - apps/ops/src/groups/members/group-member.controller.ts
    - apps/ops/src/groups/relations/group-relation.controller.ts
    - apps/ops/src/groups/user-relations/group-user-relation.controller.ts
    - apps/ops/src/groups/assignments/group-assignment.controller.ts
    - apps/ops/src/groups/report/group-report.controller.ts
    - apps/ops/src/groups/user-relations/group-user-relation.service.ts#L1-L94
    - apps/ops/src/groups/members/group-member.service.ts#L495-L700
    - libs/modules/src/lib/group/leave/group-leave.service.ts#L501-L700
    - libs/database/migrations/1792000003000-seed-group-responsible-role.ts
    - libs/interface/src/lib/dto/group/structure/
    - libs/interface/src/lib/dto/group/members/
    - libs/interface/src/lib/dto/group/relations/
    - libs/interface/src/lib/dto/group/user-relations/
    - libs/interface/src/lib/dto/group/assignments/
    - libs/interface/src/lib/dto/group/settings/
    - libs/interface/src/lib/dto/group/tracking/
    - libs/exceptions/src/lib/group/
    - libs/modules/src/lib/class/class.service.ts
    - libs/modules/src/lib/user/
    - libs/modules/src/lib/notification/notification.service.ts
    - libs/services/src/lib/lark/
    - libs/services/src/lib/redis/
    - apps/notification-service/
    - apps/lms/
    - apps/ops/src/
    - apps/video-service/
    - apps/mock-test-service/
    - apps/background-job-service/src/app/
    - libs/modules/src/lib/
    - libs/database/src/lib/entities/
    - libs/database/migrations/
    - libs/constants/src/lib/
    - libs/utils/
    - libs/validation/
    - libs/swagger/
    - libs/configuration/
    - deploy/
    - docker-compose.yml
```
