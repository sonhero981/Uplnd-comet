# Area: Group (Nhóm học viên, LMS-F002)

> `origin/staging` @ `40f66b247`, đọc qua git. Ghi chú của team: `ops-fe:features/group/CLAUDE.md` (đọc trước khi sửa; mục "Đối chiếu CLAUDE.md" bên dưới liệt kê chỗ nó đã lỗi thời so với code). Quy ước repo: `ops-fe:.claude/CLAUDE.md`, `.claude/rules/*`.
> Đường dẫn rút gọn: `G/` = `ops-fe:features/group/src/`.

## 1. Route map

| Route (`GROUP_ROUTES`, `G/constant/index.ts:7-17`) | Trang | Guard (`G/routes.tsx`) |
|---|---|---|
| `/groups` | `pages/groups/index.tsx` → `GroupList` | `withAuthComponents` + `PermissionRoute [VIEW, MANAGE, ASSIGN]` (`:15,19-23`) |
| `/groups/membership-log` | `pages/membership-log` → `GroupLog` (SCR17) | `PermissionRoute [VIEW_MEMBERSHIP_LOG]` (`:29-33`); **khai trước** route chi tiết (`:53-58`) |
| `/groups/:id/*` | `pages/groups/[id].tsx` → `GroupDetail` | như `/groups` (`:24-28`) |
| `/my-team` (SCR24) | `pages/my-team/index.tsx` | chỉ `withAuthComponents` (`:36`); trang tự chặn bằng `useIsTeamManager` → `PageAccessDenied` (`pages/my-team/index.tsx:13-14`) |
| `/my-team/learners/:id` (SCR25) | `pages/my-team/learner.tsx` | như trên; lỗi `FORBIDDEN` cũng ra `PageAccessDenied` (`:20-22`) |

Điều hướng vào log: `?groupId=` từ tab Members (`MembersTab.tsx:83`), `?userId=` từ hồ sơ học viên (`components/student/StudentGroupsCard.tsx:32`); `GroupLog` đọc cả hai (`GroupLog/GroupLog.tsx:42-44`). Breadcrumb quay về đúng trang danh sách nhờ `sessionStorage` (`utils/group-list-url.ts:8-22`).

## 2. Tab map (chi tiết nhóm)

Năm tab theo URL `/groups/:id/<tab>` (`GROUP_DETAIL_TAB`, `constant/index.ts:26-32`; render ở `GroupDetail.tsx:31-37,56-70`); đường dẫn trơn `/groups/:id` tự chuyển sang `info` (`:44-49`).

| Tab (nhãn `GROUP_LABELS.tabs`) | Component | Hook chính | Cờ khoá |
|---|---|---|---|
| `info` — "Overview" | `tabs/GroupInfoTab` → `shared/GroupInfoFormCard` (sửa tại chỗ, `useEditMode`) | `useUpdateGroup` | ẩn khi `readOnly \|\| isArchived \|\| !canManage` (`GroupInfoFormCard.tsx:120`) |
| `members` | `tabs/MembersTab` | `useGroupMembers`, `useRemoveMembers`, `useRemoveMembersPreview`, `ImportMembersModal`, `AddMemberModal` | `readOnly = synced \|\| isArchived \|\| !canManage` (`MembersTab.tsx:55`) |
| `content` — "Assigned Classes" | `tabs/AssignedContentTab` + `AssignContentDialog` | `useAssignedContent`, `useSetCascade`, `useSetAutoEnroll`, `useRemoveAssignedClass` | `isArchived \|\| !canManage` (`AssignedContentTab.tsx:38`); **không** khoá theo `SYNCED` |
| `supervisors` — "People in Charge" | `tabs/SupervisorsTab` + `AssignSupervisorModal` | `useSupervisors`, `useAssignSupervisors`, `useRemoveSupervisor` | `isArchived \|\| !canAssignSupervisor` (`SupervisorsTab.tsx:108`) |
| `report` | `tabs/ReportTab` (View by Members / Sub-groups / Courses) | `useGroupReport` | không có cờ khoá |

Ba cờ của `GroupDetailContext`: `readOnly` (= nhóm `SYNCED`), `isArchived`, kèm `id/group/isLoading` (`context/GroupDetailContext.tsx:6-17`, tính ở `GroupDetail.tsx:27-28`).

Màn danh sách (`GroupList.tsx`): mặc định dạng **Bảng** (`VIEW_KEY='group-list-view-mode-v2'`, `:30,36-38`), nhớ lựa chọn trong `localStorage`; dạng Cây = `GroupTreeChart` (`@xyflow/react`); bấm nhóm ở dạng Cây mở `GroupQuickDrawer` (3 tab Overview/Members/Managers, `GroupQuickDrawer.tsx:17-22`) chứ không vào chi tiết. Tạo nhóm bằng `GroupCreate` = `BaseModal` nhiều bước (`GroupCreate.tsx:6,15-16,33`). Bộ lọc tách "đang gõ" / "đã áp dụng" (`GroupList.tsx:39-62`).

Nơi dùng ngoài feature: `StudentGroupSection` (3 thẻ `StudentGroupsCard`, `StudentManagersCard`, `StudentResponsibilitiesCard`) xuất ở `G/index.ts:15` và nhúng ở `ops-fe:features/user/src/components/student-profile/student-setting/index.tsx:34`. `TransferResponsibilitiesModal` mở từ `StudentResponsibilitiesCard` (`:52`).

## 3. Dữ liệu: API thật hay mock

**Gần như toàn bộ đã là API thật.** Mọi hook trong `G/hooks/*` (trừ ngoại lệ dưới) gọi `useFeature().LearnerGroupAPI`.

| Vùng | Thật? | Hook / endpoint |
|---|---|---|
| Cây | thật | `useGroupTree` → `GET groups/tree/flat` (lùi về `GET groups/tree` từng cấp nếu 404) (`hooks/useGroups.ts:38-45`, `services/api-adapter.ts:187-201`) |
| Bảng | thật | `useGroupTable` → `GET groups` (`useGroups.ts:54-95`) |
| Chi tiết, tạo, sửa, di chuyển | thật | `GET/POST/PUT groups[/:id]`, `move-preview` (`useGroupDetail.ts`, `useGroupMutations.ts:10-81`) |
| Lưu trữ, khôi phục, xoá | thật | `archive-preview`, `POST archive/restore`, `DELETE` (`useGroupMutations.ts:83-134`) |
| Ô chọn nhóm có `path` | thật | `useGroupPathSelect` → `GET groups/options` (`useGroups.ts:111-194`) |
| Thành viên, ứng viên, gỡ-xem-trước, nhật ký | thật | `useGroupMembers.ts` (`GET groups/:id/members`, `candidates`, `POST members/remove-preview`, `GET groups/membership-logs`) |
| Nhập tệp | thật, không qua hook | `ModalImport` → `POST groups/:id/members/import` + poll `import-logs/:id` |
| Giao lớp | thật | `useGroupContent.ts` (`class-assignments`, `assignable-classes`, `preview`, `auto-enroll`, `cascade`) |
| Quản lý/mentor | thật | `useSupervisors.ts` (`responsibles`, `managers`, `mentors`) |
| Báo cáo | thật | `useGroupReport` → `report/{members,children,courses}` (`useGroupContent.ts:209-248`) |
| My Team, SCR25 | thật | `useMyTeam.ts` → `groups/tracking/*` |
| Quan hệ trên hồ sơ học viên, chuyển phụ trách | thật | `peopleKeys` hooks → `users/:id/group-relations|group-responsibilities|primary-manager|transfer-responsibilities` (`useSupervisors.ts:64-157`, client ở `apps/ops-fe/src/apis/learner-group/user-relations.ts`) |
| Cờ `isManager`/`isMentor` | thật | `GET /me` (`libs/hooks/src/permission/useTeamAccess.ts:5,14-19`) |

**Mock còn sót** (đã xác nhận bằng grep import giá trị):
- `canDeleteGroup` của `services/lifecycle.service.ts:250-272` vẫn được `GroupRowActions` gọi (`GroupRowActions.tsx:26-28,94`). Hàm đọc state mock trong bộ nhớ (`groups`, `countMembers`, `MOCK_ASSIGNED_CONTENT`); với id UUID thật các nguồn đó rỗng nên (suy luận từ mock-state.ts:48-53,73-89 và mock-data.ts:146-147) hàm trả `allowed: true` cho mọi nhóm thật, nút Delete luôn bật, BE chặn bằng mã `640009` (`en.exceptions.json:2299-2300`).
- `useMyAccess` (`hooks/useMyTeam.ts:119-125`) gọi `peopleService.getMyAccess()` mock, **không có nơi nào dùng** (grep toàn repo chỉ ra định nghĩa).
- Chỉ còn lại kiểu: `IClassOption` từ `services/mock-data` (`AssignContentDialog.tsx:25` …), `IAssignPreview`, `SupervisorRole` từ `group.service`.
- Mã chết (không còn gọi): `supervisors.service.ts`, `mock-report.ts`, `getReport` ở `group-tabs.service.ts`, các hàm My Team ở `people.service.ts`, `hooks/useStudentSearch.ts` (chỉ `shared/PersonSelect.tsx:9,38` dùng nó, nên **không** chết hẳn).
- Phần khung "Learning period" (UPLND-509) comment tắt ở `AssignContentDialog.tsx:26,36,64-70`; tên trường BE là giả định (`services/api-adapter-assign.ts:61-67`).

## 4. Adapter DTO và client

- Client: `LearnerGroupAPI extends LearnerGroupUserRelationsAPI`, 45 static method dùng `fetcher` (`apps/ops-fe/src/apis/learner-group/index.ts:71-305`, `user-relations.ts:14-51`). Danh sách endpoint: `api-documentation.md`.
- Contract (snake_case, đúng BE): `libs/core/src/types/learner-group.ts` (773 dòng), `learner-group-people.ts`; `ILearnerGroupAPI` ở `learner-group.ts:554`.
- Adapter (camelCase, `IGroup`...) tách 5 file, tất cả re-export từ `services/api-adapter.ts:250-255`:

| Hàm | Ánh xạ | Dòng |
|---|---|---|
| `fromListItem` | `GroupListItemDto` → `IGroup`; `level=0`, không có `description`; `noManager` chỉ khi nhóm ACTIVE | `api-adapter.ts:43-60` |
| `fromTreeItem`, `buildTreeFromFlat`, `buildTreeByLevel`, `buildTree`, `filterTree` | cây; `level` tính sau; `managers` rỗng (DTO cây không có quản lý) | `:66-84,124-219` |
| `fromDetail` | `GroupDetailDto` → `IGroup`; `managers: []` | `:86-99` |
| `toOption` | `GroupPathItemDto` → option có `path` | `:106-113` |
| `fromMovePreview`, `fromArchivePreview` | `subGroupCount = group_count - 1` | `:228-248` |
| `fromMemberItem`, `fromCandidate`, `fromMembershipLog`, `toAccountStatusParam` | thành viên, `direct` suy từ `member_groups`; log không có `id`/người thao tác | `api-adapter-members.ts:24-149` |
| `fromAssignment`, `fromAssignableClass`, `toLearningPeriodsBody` | `IAssignedContent.id` = id **lượt giao** | `api-adapter-assign.ts:143-165` |
| `fromResponsibles`, `fromReport*`, `fromTrackingLearner(ing)` | quản lý/mentor, báo cáo (BE trả 0-100), My Team (`notStarted = 0`) | `api-adapter-people.ts:24-140` |
| `fromUserRelations`, `fromUserResponsibilities`, `fromTransferPreview`, `toRelationError` | hồ sơ học viên | `api-adapter-relations.ts:20-94` |

Enum lệch tên: `LearnerGroupSource.SYNCED = 'HR_SYNC'` ở BE, `GroupSource.SYNCED = 'SYNCED'` ở feature (`learner-group.ts:47-50` vs `types/index.ts:8-13`), đổi ở `toSource` (`api-adapter.ts:28-29`).

## 5. Query-key map

| Factory | Key | Dùng ở |
|---|---|---|
| `groupKeys.all` | `['groups']` | invalidate mọi mutation (`useGroupMutations.ts:24…`) |
| `groupKeys.tree(f)` | `['groups','tree',f]` | `useGroupTree` |
| `groupKeys.table(f,p,s)` | `['groups','table',f,p,s]` | `useGroupTable` |
| `groupKeys.detail(id)` | `['groups','detail',id]` | `useGroupDetail` |
| `groupKeys.members(id,k,status,p)` | `['groups','members',id,k,status,p]` — **không có `pageSize`** | `useGroupMembers` |
| `groupKeys.content(id)` | `['groups','content',id]` | `useAssignedContent` |
| `groupKeys.supervisors(id)` | `['groups','supervisors',id]` | `useSupervisors` |
| `groupKeys.membershipLog(f,p)` | `['groups','membership-log',f,p]` | `useGroupLog` |
| `groupKeys.report(id,v,p)` | `['groups','report',id,v,p]` | `useGroupReport` |
| inline dưới `groupKeys.all` | `'path-options'`, `'path-option'`, `'move-preview'`, `'archive-preview'`, `'class-options'` | `useGroups.ts:124,157`, `useGroupMutations.ts:69,87`, `useGroupContent.ts:63` |
| `peopleKeys` | `all`, `relations(userId)`, `responsibilities(userId)`, `transferPreview(from,to)` | `useSupervisors.ts:64-70`; nhiều mutation chỉ invalidate `relations(userId)` (`:95,106`) |
| `myTeamKeys` | `['group-my-team']`, `list`, `groups`, `access`, `learner` | `useMyTeam.ts:14-19,82` |
| ngoài feature | `['notificationRecipientGroups', ...]` | `ops-fe:features/notification/src/hooks/useRecipientGroups.ts:47` (không dưới `['groups']`, nên mutation Group **không** làm mới nó) |

## 6. Quyền

Khoá (`libs/core/src/constants/permission.ts:132-137`): `gr_view_learner_group`, `gr_manage_learner_group`, `gr_assign_group_responsible`, `gr_view_group_membership_log`.

- `canView` = VIEW \|\| MANAGE \|\| ASSIGN (`hooks/useGroupPermissions.ts:13-22`; cùng luật ở route `routes.tsx:15` và menu `useMenuData.tsx:28-34`).
- Nút ẩn/hiện: `canManage` (tạo, sửa, thêm/gỡ thành viên, giao lớp, vòng đời), `canAssignSupervisor` (tab People in Charge, thẻ Managers/Responsibilities), `canViewMembershipLog` (liên kết log).
- Sidebar: mục cha `ID_SIDE_BAR.GROUP='group-management'` hiện khi `visibleSidebarList` có id đó **hoặc** `isTeamManager`; con `Group List` theo `canViewLearnerGroup`, con `My Team` theo `isTeamManager`, độc lập nhau (`useMenuData.tsx:811-830,882-889`). Id con: `LEARNER_GROUP_LIST`, `MY_TEAM` (`permission.ts:228-232`).
- `HomeRedirect`: có cờ manager và không có vai Ops nào thì vào `MY_TEAM` thay vì `PROFILE_OVERVIEW` (`apps/ops-fe/src/routes/HomeRedirect.tsx:9-19`; còn `TODO(api)`).
- `ILearnerGroupDetail.allowed_actions` (`learner-group.ts:78-89,116`) **được khai nhưng FE không đọc ở đâu** (grep `allowed_actions` ngoài khai báo/ghi chú: 0). FE tự suy ẩn/hiện từ `source`, `status` và quyền.

## 7. Gotcha đã kiểm trên code

| # | Điều đã xác nhận | Bằng chứng |
|---|---|---|
| 1 | `GET groups` không trả ACTIVE + ARCHIVED cùng lúc; FE gửi `ACTIVE` hoặc `ARCHIVED`, "Archived" nằm ở ô Status | `useGroups.ts:70-77`, `GroupListFilters.tsx:50-53` |
| 2 | Không có endpoint move; di chuyển = `PUT groups/:id {parent_id}` | `useGroupMutations.ts:48-61`, `apis/learner-group/index.ts:108-111` |
| 3 | `page_size` BE tối đa 100; mọi query phân trang cần đủ `page_index` + `page_size` | `useGroups.ts:127-130`, `useMyTeam.ts:45-47` |
| 4 | Luật kéo thả tính ở FE (`checkDropLocally`), BE chốt bằng `move-preview` + `PUT` | `GroupTreeChart/useTreeDrag.ts:91-140` |
| 5 | `IAssignedContent.id` là id lượt giao, không phải id lớp | `api-adapter-assign.ts:143-152`, `useGroupContent.ts:146-157` |
| 6 | `DELETE groups/:id/members` và `managers/mentors` có thân | `apis/learner-group/index.ts:172-175,256-266` |
| 7 | `action` nhập tệp nằm trong FormData; `ModalImport` đọc `logId ?? log_id` | `ModalImport.tsx:240-242,273-277` |
| 8 | Tệp mẫu nhập là tĩnh `apps/ops-fe/public/IMPORT_GROUP_MEMBER_TEMPLATE.xlsx` (tồn tại), `templateFile="/IMPORT_GROUP_MEMBER_TEMPLATE.xlsx"` | `ImportMembersModal.tsx:62-63` |
| 9 | Danh sách thành viên luôn xin `SUBTREE`; bộ lọc Direct/Sub-group lọc **tại chỗ trong trang đã tải** nên phân trang và lọc không khớp nhau | `useGroupMembers.ts:34-40`, `MembersTab.tsx:96-101` |
| 10 | Ô tìm của `GroupLog` lọc tại chỗ trên trang hiện tại | `GroupLog.tsx:97-100` |
| 11 | Bộ lọc Manager chỉ có lựa chọn "Groups without a manager"; chưa lọc theo người (`TODO(api)`) | `GroupListFilters.tsx:58-81` |
| 12 | Nhóm cây lấy bằng một request `tree/flat`; nút cha không có trong kết quả thì thành gốc | `api-adapter.ts:116-144` |
| 13 | Nhóm đồng bộ không có Archive; giao nội dung vẫn cho (tab content không khoá theo `readOnly`) | `GroupRowActions.tsx:197-201`, `AssignedContentTab.tsx:38` |
| 14 | `LearnerGroupAPI.getRestorePreview` có khai nhưng không nơi nào gọi; `search` cũng không | `apis/learner-group/index.ts:88-91,128-130` (grep) |
| 15 | `TITLE_GROUPS_GR` (`gr_get_groups`…) vẫn dùng ở `features/class-and-course/.../group-receiver/GroupReceiverTable.tsx:2,33,37`, không thuộc feature này | `permission.ts:123-128` |
| 16 | React Flow là thư viện riêng của feature, khai ở `features/group/package.json` | `package.json:23` |

## 8. Đối chiếu `features/group/CLAUDE.md` (lỗi thời so với code)

| CLAUDE.md nói | Code thật |
|---|---|
| "Cây lấy từng cấp một… `GET /groups/tree`, `maxDepth=6`" (mục Gotchas, "Cây lấy từng cấp một") | Đường chính là `tree/flat` một request; từng cấp chỉ là đường lui khi 404 (`api-adapter.ts:154-201`) |
| `useTeamAccess` là "mock, chỉ bản dev" (mục My Team) — nhưng mục "Còn mock" lại nói đọc `GET /me` | Đọc `GET /me` (`useTeamAccess.ts:5-19`) |
| "F5 giữ cơ cấu nhóm, mất mọi thứ khác… thành viên, giao lớp, nhật ký vẫn là state trong bộ nhớ" | Thành viên, giao lớp, nhật ký đều qua API (hook ở mục 3) |
| `ID_SIDE_BAR.LIST_GROUP`/`CREATE_GROUP` của Recipients List | Hai id đã bị gỡ (UPLND-426); Recipients List nay dùng chính `LearnerGroupAPI.getOptions` (`permission.ts:224-233`, `useRecipientGroups.ts:44-57`) |
| `ListMentorClass` đọc `group_in_charge` | Đọc `source_groups` (mảng) (`ListMentorClass.tsx:101,130`) |
| Công tắc `Show archived` đổi `status` | Công tắc đã bỏ; dùng ô Status (`GroupList.tsx:116-117`, `useGroups.ts:70-73`) |
| Danh sách nợ kỹ thuật ở `openspec/changes/uplnd-423-424-group-foundation-list/progress.md` | Change đã nằm ở `openspec/changes/archive/uplnd-423-424-group-foundation-list/` |
| `GroupRowActions`: "canDeleteGroup là điều kiện xoá" (mục "Ba cờ khoá") | `canDeleteGroup` là hàm mock (mục 3) |

Còn chưa kiểm được bằng đọc code: hành vi trên app thật/staging (CLAUDE.md ghi "chưa kiểm hết trên app" cho người phụ trách, báo cáo, tracking).
