# Reverse Engineering Timestamp

## Run Record

- Date: 2026-11-18
- Commit: 40f66b247 (`origin/staging`, đầy đủ `40f66b247907f318fda9672656096781f13b1d54`, "Feature/uplnd sprint 3/group (#106)", 2026-11-17 15:33 +0700)
- Base ref: `origin/staging` sau `git fetch origin`; working tree của repo đang ở `main` và **không** được ghi nhận.
- Cách đọc code: chỉ qua git (`git -C E:/Upbase-comet/ops-fe show origin/staging:<path>`, `grep -n <pattern> origin/staging -- <paths>`, `ls-tree`), không checkout/pull/sửa repo. Không dùng CodeGraph để trích dẫn.
- Chế độ: focused scan vùng Group (LMS-F002), độ sâu Minimal ở phần còn lại; một agent (lead-only), không dùng engine AI-DLC (fingerprint `unknown`).
- Đối chiếu bắt buộc đã đọc: `.claude/CLAUDE.md`, `.claude/rules/01`, `03`, `07`, `08`, `features/group/CLAUDE.md` (đầy đủ). Các tệp `.claude/inventory/*`, `.claude/rules/02,04,05,06`, `.claude/commands|agents|docs` không quét, chỉ trỏ tới.
- Tệp đối chiếu ngoài repo: `fe-technical-design.md` v2.2 (một phần: §1, §2-§6, §8, §10, §13) và `prd.md` (front matter `version: 0.6`, vài AC/BR) của intent `261005-group`.
- Hạn chế: chưa chạy app, chưa chạy typecheck/lint; hành vi trên staging thật chưa kiểm.

## WIP branches

Nhánh remote chưa merge, xếp theo `git branch -r --sort=-committerdate`. Chúng **không phải code hiện có**. Lưu ý: `origin/staging` có 13066 commit và merge-base với các nhánh dưới là `bb5df1b9a` (cũ), nên số "behind" vô nghĩa; so sánh dùng `git diff origin/staging...<nhánh>`.

| Nhánh | Commit cuối | Chạm vùng Group? | Ghi chú |
|---|---|---|---|
| `origin/chore/uplnd-513` | 2026-11-16 `chore(uplnd-514): upgrade vulnerable deps and clean up unused packages` | không (0 tệp `features/group`/`learner-group`) | nâng phụ thuộc, lint script; 3 commit trên merge-base |
| `origin/hotfix/uplnd-sprint-4/event-test` và `.../event-test-fix-conflict` | 2026-11-10 `fix: remove unused columns from event test and participants tables` | không | sửa bảng event test |
| `origin/feature/manager-group` | 2026-10-26 `feat: update ui group manager` (+ `feat: demo ui manager group`) | **có** (48 tệp thuộc `features/group`, kèm `useMenuData`, `package.json`) | bản demo UI chạy bằng mock mà `fe-technical-design.md` mô tả; nội dung đã được thay thế bằng feature Group trên staging (#106) nhưng nhánh chưa là tổ tiên của `origin/staging` |
| `origin/feature/uplnd-sprint-3/uplnd-401-gamification-points-based-levels`, `origin/feature/uplms-sprint-1|2/gamification-feature`, `origin/hotfix/uplms-sprint-2/edit-staff-profile-issues`, `origin/fix/uplms-sprint-1/grading-issues` | 2026-10-07 … 10-28 | không xét (không liên quan Group) | chưa kiểm chi tiết |

`origin/main` ở 2026-11-05 (`Merge Sprint 2: Gamification (#87)`) chưa có feature Group; `origin/staging` đã có.

Change OpenSpec đang mở trong repo ops-fe: `openspec/changes/uplnd-group-sprint-4` (chưa đọc).

## Scope of Analysis

```yaml
scope_version: 1
kind: partial
intent: codekb
fingerprint: unknown (không cài engine; độ mới = commit + analyzed.paths)
commit: 40f66b247
analyzed:
  paths:
    - features/group/CLAUDE.md
    - features/group/package.json
    - features/group/src/index.ts
    - features/group/src/routes.tsx
    - features/group/src/constant/index.ts
    - features/group/src/context/GroupDetailContext.tsx
    - features/group/src/pages/
    - features/group/src/hooks/groupKeys.ts
    - features/group/src/hooks/useGroupPermissions.ts
    - features/group/src/hooks/useGroupDetail.ts
    - features/group/src/hooks/useGroupMutations.ts
    - features/group/src/hooks/useGroups.ts
    - features/group/src/hooks/useGroupMembers.ts#L1-L205
    - features/group/src/hooks/useGroupContent.ts#L1-L250
    - features/group/src/hooks/useSupervisors.ts#L1-L160
    - features/group/src/hooks/useMyTeam.ts#L1-L125
    - features/group/src/services/api-adapter.ts
    - features/group/src/services/api-adapter-members.ts#L1-L150
    - features/group/src/services/api-adapter-assign.ts#L1-L170
    - features/group/src/services/api-adapter-people.ts#L1-L145
    - features/group/src/services/api-adapter-relations.ts#L1-L100
    - features/group/src/services/group.service.ts
    - features/group/src/services/lifecycle.service.ts#L1-L20
    - features/group/src/services/lifecycle.service.ts#L235-L280
    - features/group/src/services/mock-state.ts#L1-L110
    - features/group/src/services/mock-data.ts#L146-L158
    - features/group/src/types/index.ts#L1-L80
    - features/group/src/utils/group-list-url.ts
    - features/group/src/utils/server-error.ts
    - features/group/src/components/groups/GroupDetail/GroupDetail.tsx
    - features/group/src/components/groups/GroupList/GroupList.tsx#L1-L200
    - features/group/src/components/groups/GroupList/GroupListFilters.tsx
    - features/group/src/components/groups/GroupRowActions/GroupRowActions.tsx
    - features/group/src/components/groups/GroupTreeChart/useTreeDrag.ts#L1-L140
    - features/group/src/components/groups/GroupTreeChart/GroupTreeChart.tsx#L56-L100
    - features/group/src/components/groups/GroupLog/GroupLog.tsx#L40-L100
    - features/group/src/components/groups/ImportMembersModal/ImportMembersModal.tsx
    - features/group/src/components/groups/GroupForm/schema.ts
    - features/group/src/components/groups/AssignContentDialog/AssignContentDialog.tsx#L1-L120
    - features/group/src/components/groups/tabs/MembersTab.tsx#L82-L104
    - features/group/src/components/student/StudentGroupSection.tsx
    - apps/ops-fe/src/module-registry.ts
    - apps/ops-fe/src/index.tsx
    - apps/ops-fe/src/bootstrap.ts
    - apps/ops-fe/src/App.tsx
    - apps/ops-fe/src/routes/AppRouter.tsx
    - apps/ops-fe/src/routes/HomeRedirect.tsx
    - apps/ops-fe/src/services/auth.ts
    - apps/ops-fe/src/apis/learner-group/
    - apps/ops-fe/src/apis/user/index.ts#L55-L70
    - apps/ops-fe/src/components/access-denied/index.tsx
    - apps/ops-fe/src/constants/sidebar.ts#L1-L60
    - apps/ops-fe/package.json
    - apps/ops-fe/vite.config.ts
    - apps/ops-fe/tsconfig.json
    - apps/ops-fe/tsconfig.group-check.json
    - apps/ops-fe/public/IMPORT_GROUP_MEMBER_TEMPLATE.xlsx
    - libs/core/src/types/learner-group.ts#L1-L330
    - libs/core/src/types/learner-group.ts#L554-L773
    - libs/core/src/types/learner-group-people.ts#L1-L200
    - libs/core/src/types/common.ts#L38-L47
    - libs/core/src/constants/permission.ts#L120-L140
    - libs/core/src/constants/permission.ts#L220-L236
    - libs/state/src/context/FeatureContext.tsx
    - libs/state/src/context/SidebarContext.tsx
    - libs/state/src/context/UserProvider.tsx#L1-L260
    - libs/service/src/request.ts#L1-L335
    - libs/service/src/en.exceptions.json#L2260-L2350
    - libs/hooks/src/permission/useHasPermission.tsx
    - libs/hooks/src/permission/useTeamAccess.ts
    - libs/hooks/src/permission/useIsTeamManager.ts
    - libs/hooks/src/permission/useMenuData.tsx#L1-L40
    - libs/hooks/src/permission/useMenuData.tsx#L790-L900
    - libs/hooks/src/use-app-mutation.tsx#L1-L60
    - libs/hooks/src/index.ts
    - libs/HOC/src/with-auth-components.tsx
    - libs/ui/src/common/permission-route/PermissionRoute.tsx
    - libs/ui/src/base/upload-file/ModalImport.tsx#L225-L300
    - features/notification/src/hooks/useRecipientGroups.ts#L1-L100
    - features/notification/src/components/notification/createNotiComponent/AddGroupToNoti.tsx#L28-L40
    - features/class-and-course/src/components/classes/profile/user/ListMentorClass.tsx#L92-L150
    - features/class-and-course/src/components/classes/profile/user/StudentList/ListStudent.tsx#L195-L204
    - features/class-and-course/src/components/classes/profile/user/StudentList/ListStudent.tsx#L560-L585
    - features/class-and-course/src/components/classes/profile/user/StudentList/ListStudent.tsx#L734-L750
    - features/class-and-course/src/components/classes/create/ListUser.tsx#L168-L180
    - features/class-and-course/src/components/classes/create/ListUser.tsx#L252-L262
    - features/user/src/components/student-profile/student-setting/index.tsx#L28-L40
    - features/schedule/src/routes.tsx#L94-L106
    - scripts/generate-customer.js#L1-L60
    - package.json
    - pnpm-workspace.yaml
    - tsconfig.base.json
    - configs/design-system.eslint.mjs#L1-L50
    - .github/workflows/deploy-staging.yml
    - .husky/pre-commit
  components:
    - groupModule
    - AppRouter
    - HomeRedirect
    - GroupList
    - GroupDetail
    - GroupRowActions
    - GroupTreeChart
    - GroupLog
    - MembersTab
    - AssignContentDialog
    - ImportMembersModal
    - StudentGroupSection
    - PermissionRoute
    - ModalImport
    - useAppMutation
    - useHasPermission
    - useMenuData
    - withAuthComponents
    - ListMentorClass
    - ListStudent
    - AddGroupToNoti
shallow:
  paths:
    - features/group/src/components/groups/GroupTreeChart/
    - features/group/src/components/groups/GroupQuickDrawer/
    - features/group/src/components/groups/GroupCreate/
    - features/group/src/components/groups/GroupForm/
    - features/group/src/components/groups/MoveGroupConfirm/
    - features/group/src/components/groups/AddMemberModal/
    - features/group/src/components/groups/AssignSupervisorModal/
    - features/group/src/components/groups/TransferResponsibilitiesModal/
    - features/group/src/components/groups/shared/
    - features/group/src/components/groups/tabs/
    - features/group/src/components/myTeam/
    - features/group/src/components/student/
    - features/group/src/services/
    - features/group/src/types/people.ts
    - features/group/src/hooks/useStudentSearch.ts
    - apps/ops-fe/src/apis/
    - apps/ops-fe/src/pages/
    - features/class-and-course/
    - features/user/
    - features/notification/
    - features/schedule/
    - features/gamification/
    - features/support/
    - features/grading/
    - features/dashboard/
    - features/department/
    - features/role/
    - features/test/
    - features/certificate/
    - features/marketing/
    - features/working-schedule/
    - features/video-streaming/
    - features/cache/
    - features/course-version/
    - libs/ui/
    - libs/core/
    - libs/hooks/
    - libs/utils/
    - libs/state/
    - libs/_metronic/
    - libs/styles/
    - libs/assets/
    - openspec/
    - scripts/
```
