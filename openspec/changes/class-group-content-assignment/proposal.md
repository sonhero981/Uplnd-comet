# Proposal

PRD: LMS-F002

Nguồn: PRD `261005-group` v0.6 (`inception/prd/prd.md`, approved 2026-10-22), Unit U3 (US7, US8). Change 2/6 của batch `lms-f002-group` (`.comet/batches/lms-f002-group.json`), phụ thuộc `user-account-group-foundation`.

## Why

Giao một khoá cho cả phòng hiện phải chọn tay từng người hoặc nhập tệp, và người vào phòng sau không ai nhớ gán bổ sung. Đây là Unit duy nhất mang lại giá trị thấy ngay (giao bài cho cả phòng bằng một thao tác) và đạt mục tiêu O1, O2 của PRD. Nhóm chỉ chứa người, nên nội dung vẫn phải đi qua Lớp: giao cho nhóm là **luật đứng** (ai thuộc nhóm thì vào lớp), không phải sao chép danh sách một lần. Sao chép một lần không khác gì nhập tệp và không đạt O2.

## What Changes

- **Giao lớp cho nhóm (US7):** chọn một hoặc nhiều **lớp** cụ thể đang nhận học viên (không giao theo khoá), kèm hai công tắc mặc định tắt: *Chảy xuống nhánh con* và *Tự ghi danh người vào sau*. Trước khi xác nhận có khối xem trước (số người sẽ vào, đã có, bị bỏ qua kèm lý do). Tab *Nội dung được giao* liệt kê lớp đã giao; nút *Gỡ lớp* ẩn khi đã có người học.
- **Công tắc tự ghi danh theo từng cặp nhóm-lớp (US8):** bật tắt ngay trên dòng của lớp, lưu ngay. Bật khi còn người chưa vào lớp thì hỏi *Ghi danh luôn* hay *Chỉ áp dụng cho người vào sau*. Tắt không gỡ ai. Mỗi lần đổi ghi nhật ký kèm người thao tác và thời điểm.
- **Luật đứng phía Lớp:** chạy nền ở ba thời điểm (lúc giao, lúc có người vào nhóm, lúc bật công tắc) và theo luật của Lớp: mỗi người một lượt ghi danh, một lượt có nhiều nhóm nguồn, lớp đã kết thúc thì dừng im lặng và ghi nhật ký, vượt sức chứa không chặn, lớp có Foundation thì vào cả Foundation, tài khoản kiểm thử bị bỏ qua, giao không hồi tố.
- **Cảnh báo vượt sức chứa (BR-7.6):** tab *Học viên* của lớp hiện một dòng *Lớp này giới hạn N học viên, hiện có M người*, không chặn thao tác nào.

## Ngoài phạm vi

- Tự gỡ khỏi lớp chưa học khi rời nhóm và email `MAIL-GRP-01` (change `user-account-group-lifecycle`).
- Đồng bộ Lark (change `user-account-group-hr-sync`): người vào nhóm qua đồng bộ kích hoạt luật đứng, nhưng bản thân đồng bộ không thuộc change này.
- Sửa cơ chế ghi danh của Lớp, giao theo lịch, giao lộ trình, gỡ hàng loạt nội dung khỏi nhiều nhóm, hẹn giờ bật tắt công tắc, điều kiện tự ghi danh phức tạp.
- Mentor đi theo nhóm vào lớp (change `user-account-group-supervisors`).

## Capabilities

### New Capabilities
- `uplnd/class/group-content-assignment`: giao lớp cho nhóm kèm hai công tắc, xem trước, bảng nội dung được giao, bật tắt tự ghi danh theo từng cặp nhóm-lớp, gỡ lớp khỏi nhóm (US7, US8).
- `uplnd/class/group-enrollment`: luật đứng ghi danh qua nhóm, một người một lượt với nhiều nhóm nguồn, dừng im lặng khi lớp kết thúc, sức chứa, Foundation, tài khoản kiểm thử, không hồi tố, cảnh báo vượt sức chứa ở màn học viên của lớp (US7, US8, ràng buộc C2, C4).

### Modified Capabilities

Không có. `openspec/specs/` chưa có capability nào. Hành vi ghi danh sẵn có của Lớp được dùng lại, không đổi.

## Impact

- **Hiện trạng cần biết trước khi làm:** phần lớn đã có trên `origin/staging`, nên change này đối chiếu rồi chỉ làm phần chênh.
  - `lms-be`: `apps/ops/src/groups/assignments/` (8 endpoint giao lớp), `libs/modules/src/lib/group/enrollment/` (luật đứng), `libs/modules/src/lib/group/scope/`, migration `1792000001000-create-group-tables.ts` (`group_class_instances`) và `1792000004000-add-group-source-ids-to-class-user-instances.ts`; cảnh báo vượt sức chứa ở `apps/ops/src/class/class.service.ts`.
  - `ops-fe`: `features/group/src/components/groups/AssignContentDialog/` và `tabs/AssignedContentTab.tsx` đã nối API thật; cảnh báo sức chứa ở `features/class-and-course`.
  - Hai tác vụ nghiệm thu còn mở ở `lms-be` (task 19.2 luật đứng ở ba thời điểm, 19.3 rời nhóm) chạm phạm vi này.
- **Lệch PRD v0.6 và v0.11 draft** (code theo v0.11) và các hành vi chỉ có ở code (thời gian học riêng của nhóm UPLND-509, cờ bật giao nội dung theo tenant): xem `design.md`.
- **Repo bị chạm:** `lms-be`, `ops-fe`.
- **Module:** Class (`class`, module 04) vì luật đứng sống trong ghi danh của Lớp; `openspec/products.yaml` đăng ký hai capability khi archive.

## Repos

- lms-be: API giao lớp, luật đứng chạy nền, nguồn lượt ghi danh, cảnh báo sức chứa.
- ops-fe: hộp giao nội dung, tab Nội dung được giao, công tắc từng lớp, dòng cảnh báo sức chứa ở tab Học viên của lớp.
