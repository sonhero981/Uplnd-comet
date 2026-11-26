Tech design: e:\Upbase-comet\uplnd_po_workflow\intents\261005-group\inception\tech-design\fe-technical-design.md @ 17c4b85

# Design

Tài liệu trên là thiết kế **FE** v2.2 (bản demo mock) và đã lỗi thời so với staging; `tech-design.md` vẫn là template trống nên **chưa có tech design BE** trong repo PO. Các lựa chọn BE dưới đây lấy từ code trên `origin/staging` của `lms-be` và từ change `upbase-221100-group` của repo đó, không chép lại. Quy ước FE đúng hơn nằm ở `ops-fe:features/group/CLAUDE.md`.

## Context

Xem `proposal.md` cho lý do. Các dẫn chiếu `repo:path:line` đọc từ `origin/staging`, không phải nhánh đang checkout. Codekb cả 4 repo đang `NO_STORE`, nên mọi điều dưới đây đã kiểm trực tiếp trên code.

**Hiện trạng đã có trên staging:**
- Quan hệ nhóm-lớp ở bảng `group_class_instances` với `cascade_to_children`, `auto_enroll` và chỉ mục duy nhất `(group_id, class_id)` khi chưa xoá (`lms-be:libs/database/migrations/1792000001000-create-group-tables.ts:211-226`).
- Tám endpoint giao lớp ở `apps/ops/src/groups/assignments/group-assignment.controller.ts`: lớp giao được `:41`, xem trước `:60`, giao `:79`, danh sách `:98`, xem trước tự ghi danh `:118`, đổi tự ghi danh `:137`, đổi chảy xuống `:162`, gỡ `:187`.
- Luật đứng: `libs/modules/src/lib/group/enrollment/group-enrollment.service.ts` (`process` `:47`), điều kiện lớp đang nhận học viên ở `class-accepting.ts` (`DRAFT` hoặc `PUBLIC`, lớp `FIXED` chưa qua `finished_at`).
- Nguồn nhiều nhóm của một lượt: cột `class_user_instances.group_source_ids uuid[]` (`1792000004000-add-group-source-ids-to-class-user-instances.ts:12`) và nguồn lượt `GROUP` (`create-group-tables.ts:313`).
- `ops-fe`: `features/group/src/components/groups/AssignContentDialog/`, `tabs/AssignedContentTab.tsx`, dịch vụ `services/assign-content.service.ts`, nối API thật.

**Độ lệch giữa PRD v0.6 (spec theo) và v0.11 draft (code theo)** cho các US của change:

| Chủ đề | PRD v0.6 | PRD v0.11 draft / code |
|---|---|---|
| Lớp đang nhận học viên | Không định nghĩa, chỉ "lớp đã kết thúc không xuất hiện" | Lớp nháp hoặc công khai; lớp `FIXED` chưa qua ngày kết thúc (BR-7.4, `class-accepting.ts`) |
| Điều kiện chặn gỡ lớp | "đã có người trong nhóm học lớp đó" | Có ít nhất một người phát sinh hoạt động học, kể cả đã hoàn thành; kiểm lại lúc gỡ (BR-7.10, `group-assignment.service.ts:374`, `:706`) |
| Công tắc *Chảy xuống nhánh con* | Chọn lúc giao | Đổi được sau khi giao (BR-7.12, endpoint `:162`) |
| Cờ bật giao nội dung theo tenant | Không có | Chưa bật cờ thì nút giao không hiện và request bị từ chối (BR-7.13, bảng `group_feature_settings`) |
| Nhật ký đổi công tắc | Nhật ký cùng loại với nhật ký thành viên | Nhật ký hệ thống, chưa có màn xem (BR-8.5, BR-15.5) |
| Thời gian học riêng của nhóm | Không có | Có trong code (UPLND-509, `LearningPeriodFields.tsx`), các điểm dùng đang comment tắt ở `ops-fe` |

Spec chỉ ghi phần v0.6, cộng một hành vi mà v0.6 chưa nêu nhưng an toàn và code đã làm: kiểm lại điều kiện lúc gỡ lớp. Các dòng còn lại là việc đối chiếu trong `tasks.md`.

## Goals / Non-Goals

**Goals:**
- Chốt hợp đồng hành vi cho giao lớp và luật đứng làm chuẩn nghiệm thu chung cho `lms-be` và `ops-fe`.
- Tách rõ phần đã có khỏi phần chênh để `tasks.md` chỉ chứa đối chiếu và việc chênh.
- Giữ ràng buộc C2 (một người một lượt) và C4 (luật đứng theo luật của Lớp): không viết đường ghi danh riêng cho nhóm.

**Non-Goals:**
- Đổi cơ chế ghi danh của Lớp hoặc luồng thêm học viên sẵn có.
- Tự gỡ khỏi lớp và email khi rời nhóm; thời gian học riêng của nhóm (UPLND-509), không thuộc PRD v0.6.

## Decisions

**D1. Công tắc nằm ở cặp nhóm-lớp, không ở nhóm.** `auto_enroll` và `cascade_to_children` là cột của `group_class_instances` (`create-group-tables.ts:211-226`), nên đổi công tắc lớp này không động tới lớp kia và đúng BR-8.1. Phương án đã xét: một công tắc cho cả nhóm (trái PRD, mất khả năng giao hai lớp với hai chính sách khác nhau).

**D2. Luật đứng chạy bất đồng bộ qua Kafka.** Giao lớp, người vào nhóm và bật công tắc đều phát `GROUP_ENROLLMENT_REQUESTED` (`group-structure.service.ts:745`, `group-membership.service.ts:128`); consumer `apps/event-processor-service/src/app/group-enrollment-requested.handler.ts` gọi `GroupEnrollmentService.process`. Lý do: nhóm 55 người cho lớp có Foundation sinh 110 lượt, không được chặn giao diện (NFR của US7). Phương án đã xét: chạy đồng bộ trong request (đơn giản hơn nhưng timeout với nhóm lớn). Đánh đổi: giao diện chỉ thấy kết quả sau khi job xong, nên xem trước phải là lời gọi đọc riêng, không tạo dữ liệu.

**D3. Ghi danh đi qua luồng thêm học viên của Lớp với nguồn `GROUP`.** `group-enrollment.service.ts:153` gọi luồng thêm học viên sẵn có; chiến lược theo loại lớp (`add-student-strategy.factory.ts:11`, gồm Foundation) và việc chống trùng do luồng đó lo. Nhờ vậy C4 đúng mà không có ngoại lệ riêng và Foundation chạy "miễn phí" (BR-7.7). Phương án đã xét: viết đường ghi danh riêng cho nhóm (dễ lệch luật của Lớp, nhân đôi logic Foundation).

**D4. Nhiều nhóm nguồn lưu bằng mảng trên lượt ghi danh.** `group_source_ids uuid[]` giữ id các nhóm nguồn của một lượt; rời một nhóm thì bớt một phần tử, lượt còn nguyên khi mảng chưa rỗng. Phương án đã xét: bảng nối lượt-nhóm (chuẩn hoá hơn nhưng thêm join cho mọi truy vấn lượt ghi danh, một bảng đã rất nóng). Hậu quả: truy vấn "người này do nhóm nào" dùng toán tử mảng.

**D5. Điều kiện lớp đang nhận học viên gom về một hàm.** `isClassAccepting` (`class-accepting.ts`) là nơi duy nhất quyết định; ô chọn lớp, xem trước và luật đứng đều dùng nó, tránh ba nơi ba định nghĩa. Luật đứng gặp lớp không còn nhận thì ghi `field_change_logs` loại `GROUP_CLASS` rồi dừng, không ném lỗi (`group-enrollment.service.ts:191`), khớp "dừng im lặng".

**D6. Gỡ lớp chặn bằng "có người học", tính khi đọc và kiểm lại khi gỡ.** `can_remove = !has_learners` (`group-assignment.service.ts:374`), `has_learners` suy từ tiến độ học của lượt ghi danh (`:706`). Phương án đã xét: cờ lưu sẵn (lệch khi có hoạt động học mới). FE chỉ ẩn nút, BE vẫn từ chối request gỡ.

**D7. Cảnh báo vượt sức chứa tính khi đọc.** `is_over_capacity = capacity !== null && current_count > capacity` ở `apps/ops/src/class/class.service.ts:120`; FE hiện một dòng, không chặn (`ops-fe:features/class-and-course/src/components/classes/create/ListUser.tsx:170`).

## Risks / Trade-offs

- **[Bảng lệch v0.6/v0.11]** → Mỗi dòng là một task đối chiếu có người quyết (PO hoặc Tech PIC); không tự sửa code theo bản nào. Cùng quyết định với change `user-account-group-foundation` về cách xử lý lệch.
- **[Luật đứng chạy nền, kết quả trễ]** → Xem trước là lời gọi đọc; nghiệm thu bằng truy vấn số lượt sau khi job xong, không dựa phản hồi tức thời của request giao.
- **[Hai nhóm kích hoạt song song cho cùng một người]** → Chống trùng ở luồng thêm học viên (D3); phải có test đồng thời, đây là scenario `Hai nhóm cùng kích hoạt song song` và là task 19.2 còn mở của `lms-be`.
- **[Mảng `group_source_ids` lệch khi rời nhóm]** → Bớt nguồn và quyết định giữ hay gỡ lượt thuộc change `user-account-group-lifecycle`; change này chỉ đảm bảo thêm nguồn đúng.
- **[Thời gian học riêng của nhóm đang comment tắt ở FE]** → Ngoài PRD v0.6; không thêm vào spec, ghi chú để Tech PIC quyết khi nào mở.
- **[Chưa có codekb]** → Chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build`.

## Migration Plan

Bảng và cột đã có trên staging; change này không thêm migration trừ khi một task chênh cần. Giao nội dung bật theo tenant qua `group_feature_settings` (`create-group-tables.ts:134`), bật hai lần: lần 1 chỉ đồng bộ cây và thành viên, lần 2 mới mở giao nội dung. Hoàn tác là tắt cờ của tenant; lượt ghi danh đã sinh không bị gỡ.
