Tech design: e:\Upbase-comet\uplnd_po_workflow\intents\261005-group\inception\tech-design\fe-technical-design.md @ 17c4b85

# Design

Tài liệu trên chỉ là thiết kế **FE** (v2.2, dựng theo bản demo mock-data). `tech-design.md` của PRD vẫn là template trống, nên **chưa có tech design BE** trong repo PO: các lựa chọn kỹ thuật BE ghi ở đây, lấy từ code đã có trên `origin/staging` của `lms-be` và từ change `upbase-221100-group` trong luồng OpenSpec riêng của repo đó (`lms-be:openspec/changes/upbase-221100-group/design.md`), không chép lại.

## Context

Xem `proposal.md` (mục Why, Impact) cho lý do. Phần dưới chỉ ghi điều ảnh hưởng tới cách làm.

**Hiện trạng: phần lớn khung nhóm đã chạy trên staging.** Mọi dẫn chiếu `repo:path:line` dưới đây đọc từ `origin/staging` (không phải nhánh đang checkout, vì `lms-be`, `ops-fe` đang ở `main`).

- `lms-be`: module `apps/ops/src/groups/` gồm `structure/group.controller.ts` (tạo `:48`, cây `:65`, cây phẳng `:78`, danh sách `:95`, tìm `:109`, ô chọn `:123`, chi tiết `:141`, sửa `:155`, `move-preview` `:173`, `archive-preview` `:191`, lưu trữ `:209`, khôi phục `:246`, xoá `:265`) và `members/group-member.controller.ts` (tệp mẫu `:64`, `membership-logs` `:84`, thành viên `:102`, ứng viên `:122`, thêm `:141`, `remove-preview` `:161`, gỡ `:179`, nhập tệp `:198`). Bảng ở `libs/database/migrations/1792000001000-create-group-tables.ts`.
- `ops-fe`: `features/group` đã có trên staging, nối API thật cho cơ cấu nhóm, thành viên, nhật ký vào ra. Quy ước và các chỗ lệch hợp đồng BE ghi ở `ops-fe:features/group/CLAUDE.md` (đọc trước khi sửa feature này).
- Không có codekb: `node scripts/codekb-status.mjs` báo cả 4 repo `NO_STORE`, nên mọi điều dưới đây đã được kiểm trực tiếp trên code, không dựa codekb.

**Nguồn yêu cầu và độ lệch.** PRD đã duyệt gần nhất là v0.6 (repo PO). Code staging làm theo PRD **v0.11, trạng thái draft** ở `upbase-specs/intents/261005-group/inception/prd/prd.md` (CR7 đến CR9, chưa duyệt). Spec của change này theo **v0.6** (bản người dùng đã chọn) cộng hai hành vi v0.6 chưa nói mà code đã làm đúng (chỉ gỡ thành viên trực tiếp, quyền xem tách khỏi quyền quản lý). Bảng lệch cho các US của change:

| US | PRD v0.6 (spec theo) | PRD v0.11 draft (code đang theo) |
|---|---|---|
| US1 | Người dùng nhập mã nhóm, trùng thì báo lỗi | Mã nhóm tự tạo do hệ thống cấp (`group-structure.service.ts:106`, request gửi mã bị bỏ qua) |
| US2 | Không nêu trường hợp nhánh đã có người học | Nhánh có người phát sinh hoạt động học vẫn di chuyển được, không hồi tố (BR-2.4, BR-2.5); nhật ký di chuyển chỉ ghi hệ thống, chưa có màn xem (BR-2.6, BR-15.5) |
| US6 | Mặc định Cây, có công tắc *Hiện nhóm đã lưu trữ* | Graph/Table, mặc định Table; bỏ công tắc lưu trữ, dùng bộ lọc trạng thái; thêm cột Parent group |
| US14 | Xoá khi chưa có thành viên, chưa giao nội dung | Thêm điều kiện không có nhóm con (BR-14.1), hộp xác nhận xoá (BR-14.8), khôi phục cả nhánh cùng lần lưu trữ (BR-14.9) |
| US15 | Cột *Người thao tác*, lọc theo nhóm/người/lý do | Nhật ký giới hạn theo nhóm đang chọn, bỏ cột người thao tác nhưng vẫn lưu để truy vết |

## Goals / Non-Goals

**Goals:**
- Chốt hợp đồng hành vi cho khung nhóm (hai capability trong `specs/`) làm chuẩn nghiệm thu chung cho `lms-be` và `ops-fe`.
- Tách rõ phần **đã có** khỏi phần **còn chênh** để `tasks.md` chỉ chứa việc đối chiếu và việc chênh, không thiết kế lại.
- Giữ ràng buộc C3: lịch sử vào/ra có thời điểm tồn tại trước khi dữ liệu tích luỹ, không đường nào xoá cứng dòng lịch sử.

**Non-Goals:**
- Viết lại module `groups` đã chạy trên staging hoặc đổi kiểu lưu cây.
- Quyết định thay PO giữa v0.6 và v0.11 (xem Risks, mục đầu).
- Luật đứng, đồng bộ Lark, quản lý/mentor, báo cáo, email vòng đời (các change khác của batch).

## Decisions

**D1. Cây lưu bằng nested set (`left`/`right`) cộng `parent_id`.** Bảng `groups` có `parent_id`, `left`, `right` (`create-group-tables.ts:150-170`). Kiểm vòng khi di chuyển bằng khoảng `left`/`right` (`group-structure.service.ts:274`), lưu trữ cả nhánh và đếm con bằng một truy vấn khoảng (`:300`, `:340`), số cấp không bị giới hạn. Phương án đã xét: closure table (đọc nhánh nhanh nhưng ghi nhiều dòng mỗi lần di chuyển, cần giữ đồng bộ), CTE đệ quy mỗi lần đọc (không cần giữ khoảng nhưng chậm khi đếm cộng dồn ở danh sách). Chọn giữ nested set vì đã chạy, đọc nhánh bằng một khoảng, và quy mô thật chỉ 53 nhóm / 384 người. Đánh đổi: di chuyển nhánh phải cập nhật lại khoảng của cả nhánh.

**D2. Lịch sử thành viên là xoá mềm trên chính bảng quan hệ, không có bảng log riêng.** `group_user_instances` có `created_at` (vào), `deleted_at` (ra), `reason`, `role` (`:185-198`), và chỉ mục duy nhất trên dòng đang mở (`:200`). Vào lại tạo dòng mới, nên dựng thành viên tại mốc T bằng `created_at <= T < deleted_at`; thêm cột người thao tác ở migration `1792000005000-add-group-member-reason-actor.ts`. Phương án đã xét: bảng log sự kiện riêng song song với bảng quan hệ (hai nơi phải luôn khớp, dễ lệch, đúng thứ C3 muốn tránh). Chọn một nguồn sự thật duy nhất. Nhật ký chỉ-đọc (`GET /groups/membership-logs`) là một lát cắt của chính bảng này; việc ghi nhận di chuyển nhánh, luật đứng... là loại log hệ thống khác (BR-15.5), không cần màn xem.

**D3. Cô lập tenant bằng Postgres RLS.** Mọi bảng nhóm bật `ENABLE` và `FORCE ROW LEVEL SECURITY` (`create-group-tables.ts:367-368`); mã nhóm duy nhất theo tenant qua chỉ mục `UQ_groups_tenant_code` (`:171`). Đáp ứng yêu cầu "duy nhất trong tổ chức" mà không cần kiểm ở tầng code.

**D4. Di chuyển nhánh là `PUT /groups/:id` với `parent_id`, kèm `GET /groups/:id/move-preview`.** Không có endpoint move riêng (`ops-fe:features/group/CLAUDE.md`, mục Gotchas). Preview trả số nhóm con, số người ảnh hưởng và `reason_code` khi bị chặn (`GROUP_SYNCED_READ_ONLY`, `GROUP_ARCHIVED`, `GROUP_PARENT_INVALID`, `GROUP_MOVE_INTO_DESCENDANT`, `group-structure.service.ts:264-275`). FE chặn sớm bằng `checkDropLocally` (`useTreeDrag.ts`) chỉ để viền xanh/đỏ, BE là chốt cuối. Phương án đã xét: tính luật chỉ ở FE (không an toàn khi gọi API trực tiếp).

**D5. Số thành viên tính khi đọc, không lưu.** Truy vấn con theo khoảng `left`/`right` đếm người không trùng, loại tài khoản kiểm thử và người đã nghỉ việc (`group-structure.service.ts:550`). FE không tự cộng (bỏ `countMembers` của mock). Đổi nhóm cha hay thêm người đều không cần cập nhật số đã lưu.

**D6. Nhập tệp thành viên dùng hạ tầng import sẵn có.** `POST /groups/:id/members/import` (`group-member.controller.ts:198`) chạy nền qua `import.processor.ts` và `import_logs`; FE dùng `ModalImport` của `@ops/ui` với `type='GROUP_MEMBER'`, `action` (`ADD`/`REMOVE`) nằm trong FormData chứ không trong query (`ops-fe:features/group/CLAUDE.md`). Việc từng dòng độc lập (dòng lỗi không chặn dòng còn lại) là yêu cầu cần kiểm trên processor của nhóm lúc Build, chưa xác minh ở bước Open. Lệch cần sống chung: BE nhóm trả `log_id`, năm endpoint import khác trả `logId`.

**D7. Gỡ người còn nghĩa vụ học chỉ ghi lịch sử và phát sự kiện.** Change này dừng ở "người rời nhóm, lượt ghi danh giữ nguyên, sự kiện rời nhóm được ghi nhận". Việc tự gỡ khỏi lớp chưa học và email `MAIL-GRP-01` do consumer `apps/event-processor-service/src/app/group-member-left.handler.ts` xử lý, thuộc change `user-account-group-lifecycle`. Phương án đã xét: làm luôn luật vòng đời ở đây (kéo phụ thuộc vào luật đứng của change `class-group-content-assignment`, phá thứ tự batch).

**D8. Quyền tách xem / quản lý / xem nhật ký.** BE dùng `GROUP_PERMISSIONS` (`group-structure.service.ts:619-620`, cơ chế `security` cộng `tags` như Gamification), FE dùng `TITLE_LEARNER_GROUP_GR` (`libs/core/src/constants/permission.ts`), không dùng lại `TITLE_GROUPS_GR` hay `ID_SIDE_BAR.LIST_GROUP` vì đó là của Recipients List. Quyền quản lý bao hàm quyền xem. FE chỉ ẩn lối vào theo quyền, BE vẫn chặn thật.

## Risks / Trade-offs

- **[Mã nhóm: v0.6 nhập tay, code staging tự cấp]** → Spec hiện theo v0.6 (`Tạo nhóm`, `Mã nhóm duy nhất và không đổi`). Nếu PO chốt theo v0.11, sửa hai requirement này trước Design. **Cần người dùng quyết khi duyệt Open**, vì đổi hành vi nghiệm thu; không để thành câu hỏi mở.
- **[Cả bảng lệch ở Context]** → Mỗi dòng lệch tạo một task đối chiếu có người quyết (PO hoặc Tech PIC), không tự sửa code theo bản nào.
- **[Spec nằm ở hai nơi: `lms-be:openspec/changes/upbase-221100-group` và repo này]** → Dễ trôi lệch. Coi repo này là nơi theo dõi chung, ghi vào task cuối của change là đối chiếu hai bộ spec, không sao chép tự động.
- **[Tài liệu FE `fe-technical-design.md` v2.2 lỗi thời]** → Mô tả bản demo mock; staging đã nối API thật và đã có Info tab, My Team, đổi bố cục cây. Nguồn đúng hơn là `ops-fe:features/group/CLAUDE.md`. Đề nghị Tech PIC cập nhật tài liệu PO.
- **[Lệch hợp đồng BE mà FE đang sống chung]** → `GET /groups` không trả được active và archived cùng lúc, `GroupListItemDto` thiếu `allowed_actions`, `page_size` tối đa 100, `GET /groups?q=` chỉ lọc theo tên chưa theo mã (`ops-fe:features/group/CLAUDE.md`). Spec `Danh sách nhóm dạng bảng` và `Tìm kiếm nhóm` đòi lọc theo mã, nên đây là việc chênh thật, ghi vào tasks.
- **[Nested set tốn khi di chuyển nhánh lớn]** → Chấp nhận ở quy mô 53 nhóm; nếu tăng mạnh thì đo lại trước khi đổi kiểu lưu.
- **[Chưa có codekb]** → Cả 4 repo `NO_STORE`. Không dựa codekb; nên chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build` để subagent có ngữ cảnh.

## Migration Plan

Dữ liệu và bảng đã tồn tại trên staging; change này không thêm migration mới trừ khi một task chênh cần (kiểm lúc Build). Không có dữ liệu cũ phải chuyển: chức năng nhóm cũ đã bị `1792000000000-drop-legacy-group-department-business-unit.ts` xoá. Bật theo tenant qua `group_feature_settings` (`create-group-tables.ts:134`, seed ở `1792000002000-seed-group-feature-settings.ts`). Hoàn tác là tắt cờ của tenant, không xoá dữ liệu vì nhật ký phải giữ.
