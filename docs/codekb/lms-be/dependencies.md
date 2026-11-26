# Dependencies — lms-be

> `origin/staging` @ `a2f4821`. Phiên bản khai báo ở [technology-stack.md](technology-stack.md). Mức shallow trừ phần Group.

## Phụ thuộc nội bộ (alias `@sapp/*`)

```mermaid
flowchart TD
  apps --> modules[@sapp/modules]
  apps --> database[@sapp/database]
  apps --> interface[@sapp/interface]
  apps --> constants[@sapp/constants]
  modules --> database
  modules --> services[@sapp/services]
  modules --> interface
  modules --> constants
  modules --> exceptions[@sapp/exceptions]
  database --> constants
  interface --> constants
```
Fallback: `apps/*` phụ thuộc mọi lib; `libs/modules` phụ thuộc `database`, `services`, `interface`, `constants`, `exceptions`; `database` và `interface` phụ thuộc `constants`. Đây là quan hệ thấy qua import ở vùng Group (ví dụ `group-leave.service.ts:1-29`, `group-structure.service.ts:1-70`), không phải kết quả công cụ phân tích đồ thị. Ràng buộc biên module: `@nx/enforce-module-boundaries` cho phép `*` -> `*` (`.eslintrc.json`), tức không thực thi chặn.

Vùng Group: `libs/modules/src/lib/group/group.module.ts` gom 12 module con; `apps/ops/src/groups/*` import `@sapp/modules` (service dùng chung) chứ không ngược lại. `ImportGroupMemberService` (`libs/modules/src/lib/import`) phụ thuộc `GroupMembershipService` và `GroupLeaveService`. `GroupSourceService` phụ thuộc `GroupMentorGradingService`; `GroupEnrollmentService` phụ thuộc `ClassCommonService` (`libs/modules/src/lib/class/class.service.ts`, file hơn 18 nghìn dòng).

Vòng phụ thuộc: chưa phát hiện cụ thể vòng nào ở vùng Group (không chạy công cụ phân tích vòng).

## Phụ thuộc giữa dịch vụ lúc chạy

| Từ | Tới | Cơ chế |
|---|---|---|
| `ops`, `lms`, `background-job` | `event-processor`, `notification` | Kafka `sendTopic` (kèm `tenant_id`, `requestId`) |
| Mọi app | PostgreSQL | TypeORM, một connection theo request/message/job, `app.tenant_id` |
| Mọi app | Redis | cache, Bull queue, socket.io adapter |
| `ops` | Keycloak | JWT, gateway Envoy (`deploy/envoy`) |
| `ops`, `event-processor`, `background-job` | Lark Open API | `@larksuiteoapi/node-sdk` qua `libs/services/src/lib/lark` (đồng bộ danh bạ, webhook) |
| `notification-service` | SendGrid/SMTP | `@sendgrid/mail`, `nodemailer` |

## Phụ thuộc ngoài đáng chú ý

NestJS 10, TypeORM 0.3.20 (+ `typeorm-adapter` cho Casbin), `kafkajs`, `ioredis`, `bull`, `casbin`/`nest-authz`, `@larksuiteoapi/node-sdk`, `@aws-sdk/*`, `@elastic/elasticsearch`, `firebase-admin`, `exceljs`/`xlsx`, `sharp`, `mjml`. Mọi thứ khác xem `package.json`. Chưa chạy `yarn audit`/kiểm tra lỗi thời nên không đánh giá phiên bản cũ.

## Phụ thuộc lên các repo anh em

Repo này là nguồn API cho `ops-fe` và `lms-fe`; hợp đồng gamification ghi ở `docs/gamification/contract.md` (`CLAUDE.md` của repo). Không thấy phụ thuộc vào `lms-package` trong phần đã quét (chưa kiểm `package.json` cho `@upbase-tech/*`: grep tên gói không thấy ở danh sách dependencies đã đọc).
