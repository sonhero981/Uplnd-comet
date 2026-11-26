# Proposal

PRD: LMS-F002

Nguồn: PRD `261005-group` v0.6 (`inception/prd/prd.md`, approved 2026-10-22), Unit U2 (US5). Change 4/6 của batch `lms-f002-group` (`.comet/batches/lms-f002-group.json`), phụ thuộc `user-account-group-foundation`.

## Why

Cơ cấu tổ chức đã tồn tại đầy đủ trên Lark (384 nhân sự, 53 phòng ban, 4 cấp) nhưng UpLnD chỉ đồng bộ được danh sách người, không đồng bộ cơ cấu. Nếu chỉ có nhóm tự tạo thì vận hành phải dựng lại cây bằng tay và tự theo kịp mỗi khi cơ cấu đổi, đúng việc dễ sót mà dự án này muốn bỏ. Cây tổ chức đồng bộ là **một nguồn** tạo nhóm, không phải bản chất của chức năng: nhóm vẫn có thể tự tạo và cắt ngang cơ cấu. Nguồn thứ hai này phải chạy nền, không ghi ngược về hệ nhân sự, và không làm mất lịch sử khi người hay phòng ban biến mất khỏi nguồn.

## What Changes

- **Nhóm nguồn `Đồng bộ` (US5):** mỗi lần đồng bộ đọc cây phòng ban từ hệ thống nhân sự rồi dựng hoặc cập nhật các nhóm tương ứng; UpLnD chỉ đọc, không ghi ngược.
- **Thành viên ở nhóm sâu nhất:** người được gắn vào nhóm sâu nhất trên nhánh của họ, không gắn vào nhóm cha trên đường đi; người thuộc nhiều nhánh có nhiều nhóm sâu nhất. Nhóm cha vẫn bao trùm nhánh con ở mọi màn đọc.
- **Biến mất khỏi nguồn:** người không còn trong nguồn thì ghi rời nhóm kèm thời điểm, không xoá dòng quan hệ; phòng ban biến mất thì nhóm chuyển sang `Lưu trữ`, không xoá.
- **Nhóm đồng bộ chỉ đọc về cơ cấu và thành viên**, nhưng vẫn nhận nội dung giao, quản lý và mentor. Chi tiết nhóm hiện nguồn, lần đồng bộ gần nhất và số thành viên.
- **Chạy nền, tự sửa:** đồng bộ lần đầu chạm 53 nhóm và 384 người không chặn giao diện; lần chạy lỗi giữa chừng thì lần sau tự sửa chênh lệch, không ai phải dọn tay. Mỗi thay đổi thành viên ghi nhật ký với lý do và người thao tác là *Hệ thống*.

## Ngoài phạm vi

- Đồng bộ ngược từ UpLnD về hệ thống nhân sự; nút chạy đồng bộ thủ công cho người vận hành; xem trước thay đổi rồi mới áp.
- Nhóm cho nhân sự vận hành.
- Xử lý khi người đổi phòng ban liên quan tới lớp đã giao (tự gỡ khỏi khoá chưa học, email `MAIL-GRP-01`): change `user-account-group-lifecycle`. Change này chỉ ghi nhận người rời nhóm cũ và vào nhóm mới.
- Luật đứng ghi danh khi người vào nhóm đồng bộ: change `class-group-content-assignment`.

## Capabilities

### New Capabilities
- `uplnd/user-account/group-hr-sync`: dựng nhóm đồng bộ từ cây tổ chức, gắn thành viên vào nhóm sâu nhất, xử lý người và phòng ban biến mất khỏi nguồn, nhóm đồng bộ chỉ đọc, chạy nền và tự sửa chênh lệch (US5).

### Modified Capabilities

Không có. `openspec/specs/` chưa có capability nào. Phần giao diện khoá sửa nhóm đồng bộ đã nằm ở `group-structure` của change `user-account-group-foundation`.

## Impact

- **Hiện trạng cần biết trước khi làm:** phần lớn đã có trên `origin/staging`, nên change này đối chiếu rồi chỉ làm phần chênh.
  - `lms-be`: `libs/modules/src/lib/group/hr-sync/` (`group-hr-sync.service.ts` gồm `handleEvent`, `syncAll`; adapter `hr-structure.provider.ts` và `lark-hr-structure.provider.ts`), consumer ở `apps/event-processor-service/src/app/` (`group-hr-event.handler.ts`, `group-source-sync-group.handler.ts`, `group-source-sync-user.handler.ts`), job đêm `apps/background-job-service/src/group-hr-sync/`, lệnh `sync-group-structure` và `repair-group-tree`, cờ `hr_sync_enabled` theo tenant.
  - `ops-fe`: `features/group` đã ẩn nút sửa theo `source` và hiện *Last synced* ở chi tiết và drawer xem nhanh.
- **Lệch PRD v0.6 và v0.11 draft** cùng các hành vi chỉ có ở code (nhóm gốc `Ancestor` của tenant, đồng bộ theo sự kiện, cờ bật theo tenant): xem `design.md`.
- **Repo bị chạm:** `lms-be`, `ops-fe`.
- **Module:** User (`user-account`) vì đồng bộ nhóm và thành viên gắn với tài khoản; `openspec/products.yaml` đăng ký capability khi archive.

## Repos

- lms-be: adapter hệ thống nhân sự, đồng bộ theo sự kiện và toàn bộ, job đêm, lệnh vận hành.
- ops-fe: nhãn nguồn, khối thông tin nhóm đồng bộ, ẩn nút sửa, dòng giải thích.
