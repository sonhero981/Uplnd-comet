Tech design: e:\Upbase-comet\uplnd_po_workflow\intents\261005-group\inception\tech-design\fe-technical-design.md @ 17c4b85

# Design

Tài liệu trên là thiết kế **FE** v2.2 (bản demo mock) và đã lỗi thời so với staging; `tech-design.md` vẫn là template trống nên **chưa có tech design BE** trong repo PO. Các lựa chọn BE dưới đây lấy từ code trên `origin/staging` của `lms-be` và từ change `upbase-221100-group` của repo đó, không chép lại. Quy ước FE đúng hơn ở `ops-fe:features/group/CLAUDE.md`.

## Context

Xem `proposal.md` cho lý do. Các dẫn chiếu `repo:path:line` đọc từ `origin/staging`. Codekb cả 4 repo đang `NO_STORE`, nên mọi điều dưới đây đã kiểm trực tiếp trên code.

**Hiện trạng đã có trên staging:**
- Vai trò là dòng trong `group_user_instances` với `role` thuộc `MEMBER`, `MANAGER`, `MENTOR` (`lms-be:libs/constants/src/lib/group/group.constants.ts:17`); chỉ mục duy nhất trên dòng đang mở theo `(group_id, user_id, role)` (`libs/database/migrations/1792000001000-create-group-tables.ts:200`).
- Quản lý chính là cột `users.primary_manager_user_id` (`create-group-tables.ts:300`).
- Quản lý và mentor: `apps/ops/src/groups/relations/group-relation.controller.ts` (người phụ trách `:37`, quản lý `:56` `:76`, mentor `:96` `:116`) và `group-relation.service.ts` (`addManagers` `:89`, gửi `MAIL-GRP-02` ở `:99`, `addMentors` `:125`). Quản lý chính và chuyển phụ trách ở `apps/ops/src/groups/user-relations/group-user-relation.controller.ts` (`:72`, `:92`, `:112`, `:133`).
- Kế thừa và phạm vi: `libs/modules/src/lib/group/manager/group-manager.resolver.ts` (`resolveGroupManagers` `:38`, `resolveNoManagerFlags` `:96`, `resolveLearnerManagers` `:112`, phạm vi theo dõi `:185` `:196`).
- Mentor vào lớp: `libs/modules/src/lib/group/mentor-class/group-mentor-class.service.ts` (`addGroupMentorsToClasses` `:36`, `removeStaleMentors` `:154`, người chấm mặc định `syncDefaultGraders` `:109`); mentor nguồn nhóm đánh dấu `class_mentor_instances.source_type` (`create-group-tables.ts:293`).
- Theo dõi nhánh: `apps/ops/src/groups/tracking/group-tracking.controller.ts` (`groups` `:31`, `learners` `:49`, `learners/:userId/learning` `:68`); cờ `is_group_manager`, `is_group_mentor` ở `group-tracking.service.ts:279-280`.
- Học viên xem quản lý: `GET /me/managers` ở `apps/lms/src/users/users.controller.ts:121`.
- `ops-fe`: `tabs/SupervisorsTab.tsx`, `AssignSupervisorModal/`, `TransferResponsibilitiesModal/`, `components/student/`, `components/myTeam/`, `pages/my-team/`; `lms-fe`: khối `MyManagers` từ `@lms/feature-user` gắn ở `apps/lms-pro/src/app/[page]/page.tsx:194`, gọi `libs/api/api/profile/index.ts:17`.

**Độ lệch giữa PRD v0.6 (spec theo) và v0.11 draft / code:**

| Chủ đề | PRD v0.6 | PRD v0.11 draft / code |
|---|---|---|
| Quản lý, mentor vào UpLMS Ops | Dùng chính tài khoản học viên, chỉ thấy màn của vai (BR-16.7, BR-12.7) | Dùng tài khoản staff do quản trị viên tạo, khớp theo `keycloak_user_id` hoặc email; hệ thống không tự tạo staff; gán mentor phải có staff, gán quản lý thì không (`group-ops-access.service.ts:28-56`, lỗi `GROUP_MENTOR_STAFF_REQUIRED`) |
| Tài khoản `BLOCKED` | Chỉ nêu "tài khoản đã khoá không xuất hiện" ở ô chọn | Quan hệ vẫn lưu nhưng không tính là quản lý hay mentor có hiệu lực (BR-13.9, `group-relation.service.ts:67`, resolver `:164`) |
| Tự chỉ định, tự chuyển | Không nêu | Không tự chỉ định mình quản lý chính (BR-11.8), không chuyển phụ trách cho chính mình (BR-13.8) |
| Học viên xem quản lý | Danh sách quản lý của học viên | API không gồm chính học viên đó (BR-17.5) |
| Người chấm mặc định | Mặc định giao theo mentor nhóm (AC12.2) | Đã làm (UPLND-411), không đè bài mentor chính đã giao lại (`group-mentor-grading.service.ts:17`) |
| Quyền Ops cho người được gán | Không nêu | Role hạn chế cho staff tự tạo của quản lý và mentor (UPLND-472) |

Spec theo v0.6 ở mức kết quả. Dòng **đầu tiên** là điểm cần PO quyết (xem Risks) vì đổi hợp đồng nghiệm thu `Mentor vào UpLMS Ops bằng danh tính học viên` và `Quản lý vào UpLMS Ops bằng danh tính học viên`. Các dòng còn lại là việc đối chiếu trong `tasks.md`.

## Goals / Non-Goals

**Goals:**
- Chốt hợp đồng hành vi cho quản lý, mentor, quản lý chính, theo dõi nhánh và khối quản lý của học viên làm chuẩn nghiệm thu chung cho `lms-be`, `ops-fe`, `lms-fe`.
- Giữ một nguồn sự thật cho mọi quan hệ người với nhóm (dòng quan hệ có vai trò), suy ra kế thừa khi đọc.
- Tách rõ phần đã có khỏi phần chênh để `tasks.md` chỉ chứa đối chiếu và việc chênh.

**Non-Goals:**
- Phân quyền chi tiết giữa các quản lý, quản lý tự giao bài, chặn tự chấm bài.
- Tự động tạo tài khoản staff cho người được gán (việc của quản trị viên theo code hiện tại).
- Báo cáo cộng dồn và email khi người rời nhóm (các change khác của batch).

## Decisions

**D1. Một người nhiều vai là nhiều dòng quan hệ, không phải nhiều bảng.** `group_user_instances` có `role` và chỉ mục duy nhất trên `(group_id, user_id, role)` dòng đang mở, nên một người vừa MEMBER, MANAGER, MENTOR của một nhóm là ba dòng độc lập; gán hay gỡ vai này không động vai kia (BR-9.8). Phương án đã xét: bảng riêng cho quản lý và cho mentor (đúng ngữ nghĩa hơn nhưng nhân đôi lịch sử vào/ra và các truy vấn "ai thuộc nhóm"). Hệ quả: mọi truy vấn thành viên phải lọc `role = MEMBER`.

**D2. Kế thừa tính khi đọc.** `resolveGroupManagers` lấy quản lý trực tiếp, không có thì toàn bộ quản lý trực tiếp của tổ tiên gần nhất có quản lý (`group-manager.resolver.ts:38`); `resolveNoManagerFlags` suy cờ trống quản lý từ cùng nguồn (`:96`). Đổi quản lý nhóm cha có hiệu lực ngay ở mọi nhóm con (BR-10.5). Phương án đã xét: sao chép quản lý xuống nhóm con khi gán (đọc nhanh nhưng phải đồng bộ mỗi lần đổi cây hoặc đổi quản lý, và phân biệt không nổi quan hệ kế thừa với quan hệ gán trực tiếp).

**D3. Quản lý chính là cột trên người dùng.** `users.primary_manager_user_id` bảo đảm tối đa một quản lý chính (BR-11.1) bằng cấu trúc dữ liệu, không bằng kiểm tra. `resolveLearnerManagers` xếp chính, theo nhóm, kế thừa, mỗi người xuất hiện một lần với loại đứng trước (`:112`). Phương án đã xét: dòng quan hệ có vai trò thứ tư (cần ràng buộc "tối đa một" bằng chỉ mục riêng). Đánh đổi: không có lịch sử thay đổi quản lý chính trên chính cột; lịch sử nằm ở nhật ký (BR-11.6).

**D4. Phạm vi theo dõi = nhánh quản lý cộng học viên nhận mình làm quản lý chính.** Resolver trả nhóm quản lý trực tiếp cùng toàn bộ nhánh con (`:185`) và học viên là thành viên các nhánh đó cộng học viên có `primary_manager_user_id` là mình (`:196`); màn đọc theo quan hệ này chứ không theo vai trò hệ thống (BR-16.4). Đó là cách thoả BR-11.3: quản lý chính xem được dù học viên ở nhánh khác.

**D5. `MAIL-GRP-02` gửi sau khi quan hệ đã lưu, chỉ cho phần mới.** `addManagers` mở vai trong transaction rồi mới gửi mail cho người vừa được mở (`group-relation.service.ts:95-99`), nên người đã là quản lý không nhận lại; mail type `GROUP_RESPONSIBILITY_ASSIGNED` (`libs/constants/src/lib/mail/mail.ts:706`). Chuyển phụ trách gộp một email theo nhóm mới. Phương án đã xét: gửi trong transaction (mail đi nhưng giao dịch có thể rollback).

**D6. Mentor nguồn nhóm đánh dấu ở lớp.** `class_mentor_instances.source_type` phân biệt `MANUAL` với `GROUP`; gỡ mentor khỏi nhóm chỉ gỡ khỏi lớp khi người đó không còn là mentor của nhóm nào khác đang giao lớp (`removeStaleMentors` `:154`), nhờ vậy không đụng mentor thêm tay (BR-12.5, BR-12.6). Người chấm mặc định tính lại theo mentor nhóm, không đè bài mentor chính đã giao (`syncDefaultGraders` `:109`).

**D7. Quyền vào Ops tách khỏi quan hệ nhóm.** Cờ `is_group_manager`, `is_group_mentor` suy từ quan hệ (`group-tracking.service.ts:279-280`), FE đọc qua `GET /me` để hiện menu My Team (`useTeamAccess`); vào được Ops hay không là chuyện tài khoản staff đi kèm (`GroupOpsAccessService`). Phương án đã xét: hệ thống tự tạo staff khi gán (hợp v0.6 hơn nhưng cấp quyền Ops tự động, rủi ro bảo mật mà team đã chủ ý bỏ).

## Risks / Trade-offs

- **[Vào UpLMS Ops: v0.6 bằng tài khoản học viên, code cần staff do quản trị viên tạo]** → Spec hiện theo v0.6. Nếu PO chấp nhận mô hình staff thì sửa hai requirement `Mentor vào UpLMS Ops...` và `Quản lý vào UpLMS Ops...` thành "khi quản trị viên đã tạo tài khoản staff đi kèm". **Cần người dùng quyết khi duyệt Open**, vì đổi nghiệm thu US12 và US16; không để thành câu hỏi mở.
- **[Cả bảng lệch ở Context]** → Mỗi dòng còn lại là một task đối chiếu có người quyết (PO hoặc Tech PIC), không tự sửa code theo bản nào.
- **[Ma trận phân quyền Ops chưa ai đọc được (Vấn đề tồn đọng #2 của PRD)]** → Màn theo dõi nhánh đọc theo quan hệ quản lý nên không phụ thuộc, nhưng cách role hạn chế (UPLND-472) cho staff gán thế nào cần Dev xác nhận khi đối chiếu.
- **[Mentor tự chấm bài của mình]** → Rủi ro đã chấp nhận ở PRD (BR-12.8); ghi lại để chặn ở đợt sau.
- **[Nhiều quan hệ trên một bảng, quên lọc `role`]** → Test phải có ca người vừa thành viên vừa quản lý vừa mentor, và đếm thành viên không tính dòng quản lý hay mentor.
- **[Email gửi sau khi lưu]** → Nếu gửi lỗi, quan hệ vẫn có; cần kiểm cách ghi nhận và thử lại, ngoài PRD, ghi cho Tech PIC.
- **[Chưa có codekb]** → Chạy `/comet-codekb` cho `lms-be`, `ops-fe`, `lms-fe` trước `/comet-build`.

## Migration Plan

Bảng, cột `primary_manager_user_id`, mail type và template đã có trên staging; change này không thêm migration trừ khi một task chênh cần. Bật theo tenant qua `group_feature_settings`. Hoàn tác là tắt cờ; quan hệ đã lưu được giữ. Template `MAIL-GRP-02` (`group_responsibility_assigned.mjml`) do BA hoặc vận hành soạn nội dung cuối, BE chỉ cung cấp sự kiện và dữ liệu.
