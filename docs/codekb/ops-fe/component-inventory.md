# Component Inventory — ops-fe

> `origin/staging` @ `40f66b247`. Danh mục UI/hook/util dùng chung của chính repo: `ops-fe:.claude/inventory/01-ui.md`, `02-hooks-utils.md`, `03-core.md`, `04-state.md` (không chép). Ở đây chỉ liệt kê cấu phần đã đọc: feature `group` (sâu) và các điểm nối. Mỗi mục `###` là một component; tên heading được `reverse-engineering-timestamp.md` dùng nguyên văn.

## Feature module

### groupModule
`AppModule` của feature Group: `name:'group'`, `routes: groupRoutes`, `pageLink: GROUP_ROUTES`, `sidebarIds:[ID_SIDE_BAR.GROUP]` (`ops-fe:features/group/src/index.ts:5-10`). Phụ thuộc `@ops/core|ui|hooks|state|utils|hoc|_metronic|style|assets`, `@xyflow/react`.

### AppRouter
Dựng `<Routes>` từ `modules[].routes` (`apps/ops-fe/src/routes/AppRouter.tsx:26-70`).

### HomeRedirect
Chọn trang vào mặc định theo `useTeamAccess` (`apps/ops-fe/src/routes/HomeRedirect.tsx:9-19`).

## Group — trang và khung

`features/group/src/` (viết tắt `G/`).

### GroupList
`components/groups/GroupList/GroupList.tsx`: bộ lọc, chuyển Cây/Bảng, bảng `Table`, mở `GroupCreate`/`GroupQuickDrawer`. Dùng `useGroupTree`, `useGroupTable`, `useGroupPermissions`. Kèm `GroupListFilters.tsx`, `groupListColumns.tsx`.

### GroupTreeChart
`GroupTreeChart/` (`GroupTreeChart.tsx`, `GroupFlowNode.tsx`, `layout.ts`, `useTreeDrag.ts`, `useLayoutTransition.ts`, `DetachDropZone.tsx`, `TreeSearchCard.tsx`): sơ đồ React Flow, bố cục dọc/ngang, kéo thả đổi nhóm cha, tìm và nhảy tới nhóm. Hằng số bố cục ở `layout.ts:6-29` (`NODE_W=230`, `V_GAP=96`...).

### GroupQuickDrawer
`GroupQuickDrawer/` (`GroupQuickDrawer.tsx`, `QuickMembersTab.tsx`, `QuickManagersTab.tsx`): drawer 50vw, ba tab Overview/Members/Managers (`GroupQuickDrawer.tsx:17-25`).

### GroupCreate
`GroupCreate/` (`GroupCreate.tsx`, `GroupCreateMembersStep.tsx`, `GroupPeopleBlock.tsx`): `BaseModal` + `Processbar` nhiều bước, dùng `GroupForm`; `useCreateGroup`.

### GroupForm
`GroupForm/` (`GroupForm.tsx`, `GroupFormFields.tsx`, `schema.ts`): RHF + zod (`name` ≤ 255, `code` ≤ 50, `description` ≤ 1000) (`GroupForm/schema.ts:3-14`).

### GroupDetail
`GroupDetail/GroupDetail.tsx`: header, `BaseTabs` theo route, `GroupDetailProvider` (`:89-90`).

### GroupRowActions
`GroupRowActions/GroupRowActions.tsx`: menu View/Archive/Restore/Delete, hộp xác nhận `PopupConfirm`; còn gọi `canDeleteGroup` mock (`:26-28,94`).

### MoveGroupConfirm
`MoveGroupConfirm/MoveGroupConfirm.tsx`: hộp xác nhận SCR3, `useMovePreview` + `useMoveGroup` (`:34,37`).

## Group — tab và hộp thoại

### GroupInfoTab
`tabs/GroupInfoTab.tsx` bọc `shared/GroupInfoFormCard` (sửa tại chỗ).

### MembersTab
`tabs/MembersTab.tsx` (+ `removeMembersBody.ts`): bảng thành viên, lọc, gỡ theo lô có xem trước, mở nhập tệp/thêm thành viên.

### AssignedContentTab
`tabs/AssignedContentTab.tsx` (+ `assignedContentColumns.tsx`): lớp đã giao, công tắc auto-enroll/cascade, gỡ lớp.

### SupervisorsTab
`tabs/SupervisorsTab.tsx`: quản lý/mentor (trực tiếp + kế thừa).

### ReportTab
`tabs/ReportTab.tsx`: Segmented Members/Sub-groups/Courses, `useGroupReport`.

### AssignContentDialog
`AssignContentDialog/` (`AssignContentDialog.tsx`, `AssignPreviewPanel.tsx`, `assignClassColumns.tsx`, `LearningPeriodFields.tsx`, `useAssignPreviewResult.ts`): SCR12; ngưỡng nhóm lớn `LARGE_GROUP=100` là giả định FE (`:53`).

### AssignSupervisorModal
`AssignSupervisorModal/AssignSupervisorModal.tsx`: gán quản lý/mentor, ứng viên từ `useGroupCandidates` với `role` (`:17,44`).

### AddMemberModal
`AddMemberModal/AddMemberModal.tsx`: thêm thành viên (SCR7), ứng viên từ `useGroupCandidates`.

### ImportMembersModal
`ImportMembersModal/ImportMembersModal.tsx`: bọc `ModalImport` (`type='GROUP_MEMBER'`), tệp ≤ 5MB, `.xlsx/.csv` (`:35-55`).

### TransferResponsibilitiesModal
`TransferResponsibilitiesModal/TransferResponsibilitiesModal.tsx`: SCR20, chọn người nhận, xem trước, chuyển (`:76-82`).

### GroupLog
`GroupLog/GroupLog.tsx`: SCR17, lọc theo nhóm/người/lý do/khoảng ngày; `useGroupLog`.

## Group — dùng chung và nhúng ngoài

### shared
`components/groups/shared/`: `GroupBadges`, `ToggleSwitch`, `PeoplePickerModal`, `PersonSelect`, `EntityLink`, `ManagerCell`, `MetaItem`, `PrimarySegmented`, `groupPathSelect`, `memberColumns`, `reportColumns`, `supervisorColumns`, `SupervisorActionCell`, `ActionMenuItem`, `GroupEmptyState`, `GroupInfoFormCard`.

### StudentGroupSection
`components/student/` (`StudentGroupSection`, `StudentGroupsCard`, `StudentManagersCard`, `StudentResponsibilitiesCard`, `SetPrimaryManagerModal`): xuất ở `G/index.ts:15`, nhúng ở `features/user/.../student-setting/index.tsx:34`.

### MyTeamList
`components/myTeam/` (`MyTeamList.tsx`, `TeamLearnerProfile.tsx`, `GroupLinks.tsx`): SCR24/SCR25; dưới 768px bảng thành thẻ.

## Group — hook

| Hook | Tệp |
|---|---|
| `useGroupPermissions` | `hooks/useGroupPermissions.ts` |
| `useGroupTree`, `useGroupTable`, `useGroupPathSelect` | `hooks/useGroups.ts` |
| `useGroupDetail` | `hooks/useGroupDetail.ts` |
| `useCreateGroup`, `useUpdateGroup`, `useMoveGroup`, `useMovePreview`, `useArchivePreview`, `useArchiveGroup`, `useRestoreGroup`, `useDeleteGroup` | `hooks/useGroupMutations.ts` |
| `useGroupMembers`, `useGroupCandidates`, `useRemoveMembersPreview`, `useGroupLog`, `useAddMembers`, `useRemoveMembers` | `hooks/useGroupMembers.ts` |
| `useAssignedContent`, `useClassOptions`, `useAssignContent`, `useAssignPreview`, `useSetCascade`, `useSetAutoEnroll`, `useAutoEnrollPreview`, `useRemoveAssignedClass`, `useGroupReport` | `hooks/useGroupContent.ts` |
| `useSupervisors`, `useAssignSupervisors`, `useRemoveSupervisor`, `useGroupRelations`, `useSetPrimaryManager`, `useRemovePrimaryManager`, `useResponsibilities`, `useTransferPreview`, `useTransferResponsibilities` | `hooks/useSupervisors.ts` |
| `useMyTeam`, `useTeamLearner`, `useMyTeamGroups`, `useMyAccess` (mock, không dùng) | `hooks/useMyTeam.ts` |

## Lib dùng bởi Group (đã đọc)

### PermissionRoute
`libs/ui/src/common/permission-route/PermissionRoute.tsx:13-24`.

### ModalImport
`libs/ui/src/base/upload-file/ModalImport.tsx`: `type` union có `GROUP_MEMBER`, prop `action` (`:37-40,240-242`); cấu hình cột log `ImportLogTableDetailHeader.ts:334`.

### useAppMutation
`libs/hooks/src/use-app-mutation.tsx:30-60` (Group không dùng).

### useHasPermission
`libs/hooks/src/permission/useHasPermission.tsx:13-43`.

### useMenuData
`libs/hooks/src/permission/useMenuData.tsx` (mục Group ở `:811-830,882-889`).

### withAuthComponents
`libs/HOC/src/with-auth-components.tsx:4-19`.

## Điểm nối ở feature khác

### ListMentorClass
`features/class-and-course/.../classes/profile/user/ListMentorClass.tsx:101-148`: cột "Group in charge" từ `source_groups`.

### ListStudent
`features/class-and-course/.../StudentList/ListStudent.tsx`: cột "Nguồn" (`:563-581`), cảnh báo vượt sức chứa từ `meta` BE (`:197-203,739-744`).

### AddGroupToNoti
`features/notification/.../createNotiComponent/AddGroupToNoti.tsx` + `hooks/useRecipientGroups.ts`: chọn nhóm người nhận qua `getOptions`.
