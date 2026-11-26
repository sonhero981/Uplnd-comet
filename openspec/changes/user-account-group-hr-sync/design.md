Tech design: e:\Upbase-comet\uplnd_po_workflow\intents\261005-group\inception\tech-design\fe-technical-design.md @ 17c4b85

# Design

Tài liệu trên là thiết kế **FE** v2.2 (bản demo mock) và đã lỗi thời so với staging; `tech-design.md` vẫn là template trống nên **chưa có tech design BE** trong repo PO. Các lựa chọn BE dưới đây lấy từ code trên `origin/staging` của `lms-be` và từ change `upbase-221100-group` của repo đó, không chép lại. Quy ước FE đúng hơn ở `ops-fe:features/group/CLAUDE.md`.

## Context

Xem `proposal.md` cho lý do. Các dẫn chiếu `repo:path:line` đọc từ `origin/staging`. Codekb cả 4 repo đang `NO_STORE`, nên mọi điều dưới đây đã kiểm trực tiếp trên code.

**Hiện trạng đã có trên staging:**
- Adapter nguồn nhân sự `libs/modules/src/lib/group/hr-sync/hr-structure.provider.ts`: lớp trừu tượng `HrStructureProvider` với `getDepartment`, `getPerson`, `listDepartments`, `listPeople`; bản Lark ở `lark-hr-structure.provider.ts`.
- `group-hr-sync.service.ts`: `handleEvent` `:70` (áp một sự kiện phòng ban hoặc người), `syncAll` `:121` (đồng bộ toàn bộ tenant), `upsertDepartments` `:227`, `archiveMissing` `:409`, `syncPeople` `:501`, `deepestGroupIds` `:660`, `generateCode` `:772`. Người biến mất đóng lượt với lý do `RESIGNED` (`:160`), chuyển phòng `HR_TRANSFERRED` (`:553-556`).
- Ba consumer ở `apps/event-processor-service/src/app/` (`group-hr-event.handler.ts`, `group-source-sync-group.handler.ts`, `group-source-sync-user.handler.ts`), job đêm `apps/background-job-service/src/group-hr-sync/group-hr-sync-job.service.ts:26`, hai lệnh `sync-group-structure` và `repair-group-tree`.
- Nhóm đồng bộ có `external_id` với chỉ mục duy nhất `UQ_groups_tenant_external` (`libs/database/migrations/1792000001000-create-group-tables.ts:174`), cờ `hr_sync_enabled` theo tenant (`1792000002000-seed-group-feature-settings.ts:14`).
- `ops-fe`: `features/group/src/components/groups/GroupDetail/GroupDetail.tsx:27` ẩn nút theo `readOnly = source === SYNCED`, hiện *Last synced* ở chi tiết (`:138`) và drawer xem nhanh (`GroupQuickDrawer.tsx:103`).

**Độ lệch giữa PRD v0.6 (spec theo) và v0.11 draft / code:**

| Chủ đề | PRD v0.6 | PRD v0.11 draft / code |
|---|---|---|
| Cách chạy | Theo lô, không cần tức thời (BR-5.9) | Theo sự kiện của Lark cộng một lần đồng bộ toàn bộ mỗi đêm sửa chênh lệch (BR-5.9 v0.11, `handleEvent`, `group-hr-sync-job.service.ts:26`) |
| Nhóm gốc `Ancestor` | Không có | Code tạo nhóm gốc theo tên tenant, dời các nhóm gốc đồng bộ xuống dưới nó, và người không thuộc phòng ban nào vào nhóm này (`ensureRootGroup` `:324`, `:636`) |
| Lý do rời nhóm | Một lý do `Đồng bộ` cho mọi thay đổi (BR-5.10) | `Nghỉ việc` (`RESIGNED`) và `Điều chuyển` (`HR_TRANSFERRED`) cho lượt rời, theo danh sách năm lý do ở `group-membership` |
| Số thành viên ở khối thông tin | "Số thành viên lần đồng bộ gần nhất" | Số thành viên hiện tại, đếm lúc đọc (`group-structure.service.ts:625-632`); *lần đồng bộ gần nhất* lấy từ log `GROUP_SYNC` mới nhất |
| Nguồn trả rỗng | Không nêu | Không lưu trữ hàng loạt khi nguồn rỗng, trừ khi truyền `allow_empty_source` (`:121`, `:423`) |
| Mã nhóm đồng bộ | Không nêu | Sinh từ tên phòng ban, trùng thì nối `_1`, `_2` (`generateCode` `:772`) |
| Cờ bật theo tenant | Không có | `hr_sync_enabled`; tenant chưa bật thì job đêm bỏ qua |

Spec theo v0.6 ở mức kết quả (nhóm đúng cây, thành viên đúng nhóm sâu nhất, rời có thời điểm, tự sửa), không ràng buộc cách chạy theo lô hay theo sự kiện; cộng hai hành vi an toàn code đã làm (nguồn rỗng không lưu trữ hàng loạt, tách `Nghỉ việc` khỏi `Điều chuyển`). Phần còn lại là việc đối chiếu trong `tasks.md`.

## Goals / Non-Goals

**Goals:**
- Chốt hợp đồng hành vi của nguồn đồng bộ làm chuẩn nghiệm thu chung cho `lms-be` và `ops-fe`.
- Giữ hệ thống nhân sự là hệ gốc: không ghi ngược, mất người/phòng ban chỉ đóng lượt hoặc lưu trữ, không xoá.
- Tách rõ phần đã có khỏi phần chênh để `tasks.md` chỉ chứa đối chiếu và việc chênh.

**Non-Goals:**
- Hệ thống nhân sự khác ngoài Lark: adapter cho phép thêm sau, nhưng không có yêu cầu trong PRD này.
- Nút chạy đồng bộ thủ công cho người vận hành, xem trước thay đổi.
- Quyết định nhóm gốc `Ancestor` có nên giữ không: để PO chốt (xem Risks).

## Decisions

**D1. Adapter về một cấu trúc chuẩn.** `HrStructureProvider` trả `HrDepartment` và `HrPerson` (`external_id`, `parent_external_id`, `is_deleted`, `department_external_ids`, `is_resigned`); lõi đồng bộ không biết Lark. Phương án đã xét: gọi thẳng SDK Lark trong lõi (ít lớp hơn nhưng cứng vào một nguồn, khó kiểm thử bằng dữ liệu giả). Hệ quả: có thể kiểm thử đồng bộ bằng provider giả mà không cần Lark thật.

**D2. Đồng bộ idempotent theo trạng thái mong muốn, không theo diff sự kiện.** Mỗi sự kiện đọc lại phòng ban hoặc người từ nguồn rồi áp (`syncDepartment` `:192`, `syncPerson` `:473`); `syncPeople` tính tập nhóm sâu nhất mong muốn của từng người, đóng lượt thừa và mở lượt thiếu (`:494-569`). Đó là lý do lần chạy sau tự sửa chênh lệch do lỡ sự kiện hay lỗi giữa chừng. Phương án đã xét: áp trực tiếp nội dung sự kiện (nhanh nhưng lệch nếu mất sự kiện hay đến sai thứ tự).

**D3. Một lô một transaction.** Đóng lượt thừa, mở lượt thiếu và ghi nhật ký cùng nằm trong một transaction (`group-hr-sync.service.ts:569`); lô lỗi thì lô đó không áp một phần. Phương án đã xét: một transaction cho toàn bộ tenant (đúng "tất cả hoặc không" nhưng khoá lâu và hỏng toàn bộ vì một người).

**D4. Biến mất là đóng lượt, không xoá.** Người không còn ở nguồn: đóng lượt `MEMBER` đang mở với lý do `RESIGNED` (`:160`); phòng ban biến mất: chuyển nhóm sang `ARCHIVED` rồi giữ lượt (`archiveDepartments` `:387`). Đồng nhất với quyết định D2 của change `user-account-group-foundation` (lịch sử là xoá mềm trên bảng quan hệ), nên báo cáo quá khứ đọc được.

**D5. Nguồn rỗng không đủ để lưu trữ hàng loạt.** `archiveMissing` từ chối lưu trữ khi `source_ids` rỗng mà nhóm đang có, trừ khi `allow_empty_source` (`:423`). Lý do: nguồn lỗi hay mất quyền trả rỗng sẽ làm lưu trữ cả cây. Lệnh `sync-group-structure` có tuỳ chọn tương ứng để vận hành chủ động.

**D6. Lệnh vận hành tách khỏi nút giao diện.** `sync-group-structure` (chạy lần đầu hoặc sửa) và `repair-group-tree` (đánh lại `left`/`right`) là lệnh của kỹ sư, không phải nút người vận hành, nên không trái "không có nút chạy thủ công" của PRD.

## Risks / Trade-offs

- **[Cách chạy: v0.6 theo lô, code theo sự kiện cộng đêm]** → Spec chỉ ràng buộc kết quả nên không xung đột; task đối chiếu ghi rõ để PO biết thực tế là sự kiện.
- **[Nhóm gốc `Ancestor` không có trong PRD v0.6]** → Làm đổi cây người dùng thấy (thêm một cấp trên 5 khối) và đổi số thành viên của nhóm gốc. **Cần PO quyết khi duyệt Open** vì ảnh hưởng nghiệm thu `Thành viên ở nhóm sâu nhất`; không để thành câu hỏi mở.
- **[Lỗi giữa chừng một lô]** → Lô đó không áp một phần (D3) và lần chạy sau áp lại (D2); cần test cho cả hai.
- **[Sự kiện Lark đến sai thứ tự hoặc trùng]** → D2 đọc lại trạng thái hiện tại nên không phụ thuộc thứ tự; cần test gửi trùng và đảo thứ tự.
- **[Người không thuộc phòng ban nào]** → Code đưa vào nhóm `Ancestor`; PRD không nêu. Ghi vào lệch, chờ PO.
- **[Tenant chưa bật `hr_sync_enabled`]** → Job đêm bỏ qua nên tính năng "chạy" nhưng không có dữ liệu; mô tả rõ trong báo cáo verify.
- **[Chưa có codekb]** → Chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build`.

## Migration Plan

Bảng, cột `external_id` và cờ `hr_sync_enabled` đã có trên staging; change này không thêm migration trừ khi một task chênh cần. Bật theo tenant qua `group_feature_settings`, lần 1 chỉ đồng bộ cây và thành viên, chưa chạy luật đứng. Chạy `sync-group-structure` cho lần đầu, sau đó job đêm giữ đồng bộ. Hoàn tác là tắt cờ; nhóm và lịch sử đã sinh được giữ nguyên.
