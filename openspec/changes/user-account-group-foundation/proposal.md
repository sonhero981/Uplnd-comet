# Proposal

PRD: LMS-F002

Nguồn: PRD `261005-group` v0.6 (`inception/prd/prd.md`, approved 2026-10-22), Unit U1 (US1, US2, US3, US4, US6) cùng US14 và US15 của U7. Đây là change 1/6 của batch `lms-f002-group` (xem `.comet/batches/lms-f002-group.json`); các change sau phụ thuộc vào nó.

## Why

Hệ thống chưa có cách gom học viên thành một tập hợp ổn định: mọi thứ phải đi qua Lớp, mà Lớp gắn với một khoá học và có thời hạn. L&D phải chọn tay 55 người hay nhập file mỗi lần giao bài cho một phòng ban, người mới vào phòng bị bỏ sót (mục tiêu O1, O2). Khung nhóm này là nền cho mọi phần còn lại của LMS-F002: giao nội dung, quản lý, báo cáo đều đọc cây nhóm và quan hệ thành viên của nó.

Lịch sử vào/ra nhóm có thời điểm (ràng buộc C3) phải tồn tại **trước** khi dữ liệu bắt đầu tích luỹ. Nếu thiếu, giai đoạn đầu mất vĩnh viễn và báo cáo quá khứ (O4, O5) không dựng lại được. Vì vậy nhật ký thành viên đi cùng khung nhóm, không để sang change sau.

## What Changes

- **Cây nhóm nhiều cấp (US1, US2):** tạo/sửa nhóm với tên, mô tả, nhóm cha; nhóm do người dùng tự tạo luôn có nguồn `Tự tạo` và trạng thái `Đang dùng`; nhóm cha phải cùng nguồn và đang `Đang dùng`. Di chuyển một nhánh sang nhóm cha khác, chặn thả vào chính nó hoặc nhánh con của nó, giữ nguyên thành viên và nội dung đã giao, ghi nhật ký lần di chuyển. **Không giới hạn số cấp** (CR6 đã bỏ giới hạn 6 cấp của v0.3).
- **Danh sách nhóm (US6):** dạng Cây tải dần theo nhánh và dạng Bảng có lọc (nguồn, cấp, trạng thái, người quản lý), sắp xếp, phân trang 20 dòng. Số thành viên đếm cả nhánh con, loại tài khoản kiểm thử và người đã nghỉ việc. Tìm kiếm trả đường dẫn đầy đủ từ gốc. Nhóm `Lưu trữ` ẩn mặc định ở mọi ô chọn nhóm.
- **Thành viên (US3, US4):** thêm/gỡ thủ công và theo lô bằng tệp `.csv`/`.xlsx` (một tệp mỗi lần, chọn hành động *Thêm* hoặc *Gỡ* trước), dòng lỗi không chặn dòng hợp lệ, log lỗi theo dòng phân biệt ba loại lỗi. Một người thuộc nhiều nhóm; tài khoản kiểm thử không bao giờ xuất hiện. Nhóm nguồn `Đồng bộ` chỉ đọc ở phía giao diện và API.
- **Lưu trữ nhóm (US14):** lưu trữ cả nhánh con, giữ nguyên thành viên và lịch sử, khôi phục được; chỉ xoá được nhóm chưa từng có thành viên và chưa từng giao nội dung.
- **Nhật ký thành viên (US15):** mỗi lần vào/ra nhóm lưu kèm thời điểm và lý do (`Thêm tay`, `Nhập tệp`, `Đồng bộ`, `Nghỉ việc`, `Điều chuyển`), không xoá, không dọn, chỉ đọc; tra theo khoảng thời gian, nhóm, người, lý do. Đây là nền cho báo cáo quá khứ (C3).
- **Hợp đồng với các change sau:** gỡ người đang học dở vẫn gỡ khỏi nhóm, và change này chỉ phát sự kiện/ghi nhận để luật vòng đời xử lý (email `MAIL-GRP-01`, tự gỡ khỏi lớp chưa học thuộc change `user-account-group-lifecycle`).

## Ngoài phạm vi

- Đồng bộ cơ cấu từ Lark (change `user-account-group-hr-sync`): ở change này nhóm `Đồng bộ` chỉ được thể hiện là chỉ đọc.
- Giao nội dung cho nhóm, luật đứng, tự ghi danh (change `class-group-content-assignment`).
- Quản lý, mentor, kế thừa, màn theo dõi nhánh (change `user-account-group-supervisors`); báo cáo cộng dồn (change `user-account-group-reporting`).
- Sao chép nhóm, gộp nhóm, di chuyển nhiều nhánh cùng lúc, hoàn tác di chuyển hoặc nhập tệp, nhập tệp để tạo nhóm hàng loạt, xuất danh sách hay nhật ký ra tệp, lưu trữ hàng loạt.
- Mời người ngoài tổ chức, người dùng tự xin vào nhóm.

## Capabilities

### New Capabilities
- `uplnd/user-account/group-structure`: cây nhóm không giới hạn số cấp, nguồn và trạng thái nhóm, tạo/sửa/di chuyển nhánh, lưu trữ/khôi phục/xoá, danh sách Cây và Bảng, tìm kiếm kèm đường dẫn, số thành viên cộng dồn nhánh (US1, US2, US6, US14).
- `uplnd/user-account/group-membership`: một người thuộc nhiều nhóm, thêm/gỡ thành viên thủ công và theo tệp, lịch sử vào/ra theo thời điểm và lý do, nhật ký thành viên chỉ đọc (US3, US4, US15).

### Modified Capabilities

Không có. `openspec/specs/` của repo này chưa có capability nào, nên cả hai là capability mới. Hai capability này mang ranh giới giống hai spec `group/structure` và `group/membership` mà `lms-be` đã viết trong luồng OpenSpec riêng của repo đó.

## Impact

- **Hiện trạng cần biết trước khi làm:** phần lớn khung nhóm đã có trên `origin/staging`, vì vậy change này không phải làm mới từ đầu mà phải đối chiếu từng yêu cầu với code đã có và chỉ làm phần chênh lệch:
  - `lms-be`: module `apps/ops/src/groups/` (structure, members, report, relations, assignments, tracking), migration `libs/database/migrations/1792000001000-create-group-tables.ts`, change `upbase-221100-group` trong `openspec/changes/` của repo đó (100/104 task, spec viết theo PRD v0.11).
  - `ops-fe`: `features/group` đã có trên staging, nối API `learner-group` thật (PR #100 đến #106).
  - Tài liệu FE `fe-technical-design.md` v2.2 mô tả bản demo mock-data trên nhánh `feature/manager-group`, đã lỗi thời so với staging.
- **Lệch giữa PRD v0.6 và code staging** (chi tiết và hướng xử lý ở `design.md`): mã nhóm (v0.6 cho nhập tay, BE sinh tự động), PRD đã lên v0.11 trong repo `lms-be` nhưng repo PO chỉ có v0.6.
- **Repo bị chạm:** `lms-be`, `ops-fe`. Không chạm `lms-fe` và `lms-package`.
- **Module:** User (`user-account`, module 06) vì màn nằm dưới *Quản lý tổ chức* của Ops và quan hệ chính là người với nhóm; `openspec/products.yaml` đăng ký hai capability khi archive.

## Repos

- lms-be: API nhóm, thành viên, nhật ký và job nhập tệp.
- ops-fe: màn Danh sách nhóm (Cây, Bảng), form tạo/sửa, chi tiết nhóm (tab Thành viên, Nhật ký), nhập tệp.
