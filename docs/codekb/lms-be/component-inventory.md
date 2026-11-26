# Component Inventory — lms-be

> `origin/staging` @ `a2f4821`. Cấp ứng dụng/lib là shallow; các component Group ở cấp service là sâu. Heading của mục "Group" dùng đúng tên class (khớp `analyzed.components` trong `reverse-engineering-timestamp.md`).

## Ứng dụng (`apps/`)

| Component | Trách nhiệm | Phụ thuộc chính |
|---|---|---|
| `apps/ops` | API quản trị staff, webhook Lark, mount `GroupsModule` (`apps/ops/src/app/app.module.ts:107`) | `libs/modules` (`ShareModule`), `libs/database`, Kafka |
| `apps/lms` | API học viên | `libs/modules`, `libs/database` |
| `apps/event-processor-service` | consumer Kafka + lệnh vận hành | `libs/modules` |
| `apps/background-job-service` | cron theo tenant | `TenantContextService`, `libs/modules` |
| `apps/notification-service` | gửi mail/thông báo từ topic `NOTIFICATION_SERVICE` | template MJML |
| `apps/video-service`, `apps/mock-test-service` | xử lý video; thi thử | không quét |

## Thư viện (`libs/`)

`libs/modules` (logic nghiệp vụ, ~50 thư mục `src/lib/*`), `libs/database` (143 entity, repository, 55 migration, `extends/` cho tenant), `libs/constants`, `libs/interface` (DTO), `libs/services` (lark, keycloak, kafka, redis, s3, fcm, mailer, cloudflare, casbin, sapp-ai), `libs/exceptions`, `libs/utils`, `libs/validation`, `libs/configuration`, `libs/swagger`.

## Group — entity và repository

### Group
Entity `libs/database/src/lib/entities/group/group.entity.ts`; `GroupRepository` (`group.repository.ts`): truy vấn cây theo `left/right`, đường dẫn tên.
### GroupUserInstance
Entity + `GroupUserInstanceRepository` (`group-user-instance.repository.ts`): lượt thành viên/quản lý/mentor, đếm thành viên nhánh, nhóm quản lý, thành viên liên quan (tổ tiên/hậu duệ), nhật ký vào/ra.
### GroupClassInstance
Entity + `GroupClassInstanceRepository` (rỗng): quan hệ nhóm-lớp.
### GroupFeatureSettings
Entity + `GroupFeatureSettingsRepository`: hai cờ theo tenant.
### ClassUserReportVersion
Entity `class-user-report-version.entity.ts` (bảng `class_user_report_logs`) + repository rỗng.
### NotificationGroup
Entity `notification/notification-group.entity.ts` (bảng `notification_groups`).

## Group — service dùng chung (`libs/modules/src/lib/group`)

| Component | Trách nhiệm |
|---|---|
| `GroupTreeService` | thêm/dời/xoá/dựng lại cây, khoá advisory theo tenant |
| `GroupMembershipService` | mở/đóng lượt thành viên, phát `GROUP_*` sau commit |
| `GroupScopeService` | phạm vi giao lớp, thành viên nhánh, đếm |
| `GroupSourceService` | cập nhật `group_source_ids`, fan-out khi nhánh đổi vị trí |
| `GroupEnrollmentService` | xử lý `GROUP_ENROLLMENT_REQUESTED` |
| `GroupLeaveService` | xử lý `GROUP_MEMBER_LEFT`, mail báo quản lý |
| `GroupHrSyncService` | đồng bộ phòng ban/người từ HR |
| `LarkHrStructureProvider` | adapter Lark cho `HrStructureProvider` |
| `GroupManagerResolver` | quản lý hiệu lực (kế thừa lúc đọc), mentor, phạm vi theo dõi |
| `GroupMentorClassService` | mentor nhóm <-> mentor lớp (`class_mentor_instances`) |
| `GroupMentorGradingService` | người chấm mặc định theo mentor nhóm |
| `GroupOpsAccessService` | tra staff đi kèm của học viên (không tạo staff) |
| `GroupAssigneeValidator` | điều kiện tài khoản được gán quản lý/mentor |
| `GroupFeatureSettingsService` | cờ tính năng + cache Redis |
| `ImportGroupMemberService` | nhập thành viên bằng tệp (`libs/modules/src/lib/import`) |

## Group — API Ops (`apps/ops/src/groups`)

| Component | Trách nhiệm |
|---|---|
| `GroupStructureService` | tạo/sửa/di chuyển/lưu trữ/khôi phục/xoá, cây, danh sách, chi tiết |
| `GroupMemberService` | danh sách, ứng viên, thêm, gỡ, nhật ký vào/ra, import |
| `GroupRelationService` | quản lý/mentor của nhóm |
| `GroupUserRelationService` | quan hệ phía học viên, quản lý chính, chuyển phụ trách |
| `GroupAssignmentService` | giao lớp, công tắc, gỡ lớp, xem trước |
| `GroupReportService` | báo cáo hiện tại và theo mốc quá khứ |
| `GroupTrackingService` | màn theo dõi của quản lý |
| `GroupFeatureSettingsController` | đọc/ghi cờ tenant |

## Group — consumer, job, lệnh

`GroupEnrollmentRequestedHandler`, `GroupMemberLeftHandler`, `GroupSourceSyncGroupHandler`, `GroupSourceSyncUserHandler`, `GroupHrEventHandler` (`apps/event-processor-service/src/app`); `GroupHrSyncJobService`, `GroupReportJobService` (`apps/background-job-service/src`); `SyncGroupStructureCommand`, `RepairGroupTreeCommand`; `LarkWebhookService` (`apps/ops/src/lark`).

## Hạ tầng tenant/auth (đọc sâu một phần)

`TenantContextService`, `RequestQueryRunnerMiddleware`, `RequestQueryRunnerInterceptor`, `TenantIdSubscriber`, `TenantOwnershipService` (`libs/database/src/lib/extends`); `StaffGuard`, `OpsAuthService` (`apps/ops/src/auth`); `PermissionCommonService`, `ScanOperationService` (`libs/modules/src/lib/{permission,scan-operation}`); `KafkaService` (`libs/modules/src/lib/kafka/kafka.service.ts`).
