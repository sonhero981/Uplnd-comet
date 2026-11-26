# API Documentation — ops-fe (lớp client và endpoint đã gọi)

> `origin/staging` @ `40f66b247`. ops-fe không có API server; đây là tầng client và các endpoint `lms-be` app `ops` mà nó gọi. Chi tiết từng DTO Group nằm ở `ops-fe:libs/core/src/types/learner-group.ts` (đúng theo BE). Mức nông cho phần ngoài Group.

## Tầng client

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| axios instance `request` | `ops-fe:libs/service/src/request.ts:53-55` | `baseURL = process.env.VITE_API_PUBLIC` |
| `fetcher(url, cfg)` | `:57-64` | trả nguyên `res.data` (vỏ `{success,data,error}`); feature phải tự `.data` |
| `apiRequest<T>` | `:66-88` | throw `errorRes` của BE khi lỗi axios |
| `fetchFormData`, `fetchFormPutData`, `fetchFormJob`, `getJsonData` | `:280-335` | upload multipart, poll job import |
| Interceptor | `:90-114,116-170,202-278` | JSON header (bỏ qua FormData); gắn Bearer; 401 refresh một lần; toast lỗi (xem `architecture.md`) |
| API class | `ops-fe:apps/ops-fe/src/apis/<domain>/index.ts` (44 thư mục) | static class `XxxAPI`, inject qua `FeatureProvider` (`apps/ops-fe/src/index.tsx:131-193`) |

Phong bì phân trang của BE Group: `meta` ngang hàng `data` (`ILearnerGroupPaged`, `libs/core/src/types/learner-group.ts:42-45`), `meta.has_history` chỉ có ở `GET groups/:id/members`.

## Endpoint Group (`LearnerGroupAPI`, 45 method + 1 upload)

Client: `ops-fe:apps/ops-fe/src/apis/learner-group/index.ts` (số dòng bên dưới) và `user-relations.ts`.

| Nhóm | Method + đường dẫn | Method client (dòng) | Dùng ở |
|---|---|---|---|
| Cấu trúc | `GET groups` | `getList` (72) | `useGroupTable` |
| | `GET groups/tree` | `getTree` (78) | đường lui của `buildTree` |
| | `GET groups/tree/flat` | `getTreeFlat` (82) | `useGroupTree` |
| | `GET groups/search` | `search` (88) | không có nơi gọi |
| | `GET groups/options` | `getOptions` (94) | `useGroupPathSelect`, notification, `ListNotification`, `FilterMobile` |
| | `GET/POST/PUT/DELETE groups[/:id]` | `getDetail`, `create`, `update`, `remove` (100-139) | detail, create, update/move, delete |
| | `GET groups/:id/move-preview?target_parent_id` | `getMovePreview` (113) | `useMovePreview` |
| | `GET groups/:id/archive-preview`, `POST archive` | (120-126) | `GroupRowActions`, `useArchiveGroup` |
| | `GET groups/:id/restore-preview`, `POST restore` | (128-135) | restore preview không có nơi gọi |
| Thành viên | `GET groups/:id/members` | `getMembers` (143) | `useGroupMembers` (`scope=SUBTREE`) |
| | `GET groups/:id/candidates` | `getCandidates` (150) | `useGroupCandidates` (cũng `role=MANAGER|MENTOR`) |
| | `POST groups/:id/members` | `addMembers` (157) | `useAddMembers` |
| | `POST groups/:id/members/remove-preview` | (165) | `useRemoveMembersPreview` |
| | `DELETE groups/:id/members` (body `user_ids`) | `removeMembers` (173) | `useRemoveMembers` |
| | `GET groups/membership-logs` | (177) | `useGroupLog` |
| | `POST groups/:id/members/import` (multipart `file`, `action`) | không qua class | `ModalImport` (`ModalImport.tsx:253`) |
| Giao lớp | `GET groups/assignable-classes` | (185) | `useClassOptions` |
| | `POST groups/:id/class-assignments/preview` | (192) | `useAssignPreview` |
| | `POST/GET groups/:id/class-assignments` | `assignClasses`, `getAssignments` (199-210) | `useAssignContent`, `useAssignedContent` |
| | `GET .../:aid/auto-enroll-preview` | (213) | `useAutoEnrollPreview` |
| | `PATCH .../:aid/auto-enroll`, `PATCH .../:aid/cascade` | (220-240) | `useSetAutoEnroll`, `useSetCascade` |
| | `DELETE .../:aid` | `removeAssignment` (242) | `useRemoveAssignedClass` |
| Người phụ trách | `GET groups/:id/responsibles` | (248) | `useSupervisors` |
| | `POST/DELETE groups/:id/managers`, `.../mentors` | (252-266) | `useAssignSupervisors`, `useRemoveSupervisor` |
| Báo cáo | `GET groups/:id/report/{members,children,courses}` | (268-287) | `useGroupReport` |
| Tracking (My Team) | `GET groups/tracking/groups`, `groups/tracking/learners`, `groups/tracking/learners/:userId/learning` | (289-304) | `useMyTeamGroups`, `useMyTeam`, `useTeamLearner` |
| Quan hệ người dùng | `GET users/:id/group-relations`, `GET users/:id/group-responsibilities` | `user-relations.ts:15-23` | `useGroupRelations`, `useResponsibilities` |
| | `PUT/DELETE users/:id/primary-manager` | (25-34) | `useSetPrimaryManager`, `useRemovePrimaryManager` |
| | `GET users/:id/transfer-responsibilities/preview?to_user_id`, `POST .../transfer-responsibilities` | (36-50) | `useTransferPreview`, `useTransferResponsibilities` |
| Import log | `GET import-logs/:id` | `fetchFormJob` | `ModalImport` poll mỗi 3s (`ModalImport.tsx:271-277`) |
| Hồ sơ | `GET /me` | `UsersAPI.myprofile` (`apis/user/index.ts:59-61`) | `UserProvider`; có `is_group_manager`, `is_group_mentor` |

Xác thực/quyền cho mọi lời gọi: Bearer Keycloak; BE chặn theo quyền, FE chỉ ẩn lối vào. Mã lỗi Group: `en.exceptions.json` dòng 2267-2344. Ràng buộc BE ghi trong `areas/group.md` mục 7 (`page_size` ≤ 100, DELETE có thân, `log_id` vs `logId`).

## Phần ngoài Group (nông)

~57 API class được inject (`FeatureContext.tsx:4-67`): `CoursesAPI`, `ClassesAPI`, `UsersAPI`, `StaffAPI`, `RolesAPI`, `NotificationAPI`, `GamificationAPI`, `ImportLogAPI`, `UploadAPI`, `QuestionBankAPI`, `SurveyAPI`, `ShopBlogAPI`... Chưa liệt kê endpoint; xem `ops-fe:.claude/inventory/05-api.md`.
