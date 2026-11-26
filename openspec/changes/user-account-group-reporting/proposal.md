# Proposal

PRD: LMS-F002

Nguồn: PRD `261005-group` v0.6 (`inception/prd/prd.md`, approved 2026-10-22), US18 của Unit U7. Change 3/6 của batch `lms-f002-group` (`.comet/batches/lms-f002-group.json`), phụ thuộc `user-account-group-foundation` (cây nhóm, lịch sử thành viên) và `class-group-content-assignment` (nhóm có lớp để báo cáo).

## Why

Hệ thống không cộng dồn được số liệu học theo cơ cấu tổ chức, vì không có cấu trúc nào để cộng theo. Có nhóm rồi thì người vận hành cần xem cả phòng, cả khối đang học thế nào, và xem lại quý trước ra đúng con số đã chốt (mục tiêu O4, O5). Báo cáo trong hệ này được tính ra từ dữ liệu chứ không lưu sẵn, nên nếu người nghỉ việc bị xoá khỏi dữ liệu thì báo cáo cũ đổi số: "48/55" thành "41/48". Vì vậy báo cáo quá khứ phải đọc từ lịch sử thành viên và trạng thái học tại mốc, không tính lại từ danh sách hôm nay.

## What Changes

- **Tab Báo cáo trong chi tiết nhóm (US18, BR-18.8):** cạnh các tab Thành viên, Nội dung được giao, Người phụ trách. Có ô chọn *Mốc thời gian* (*Hiện tại* hoặc *Một ngày trong quá khứ*, mặc định hiện tại) và ô *Xem theo* (*Thành viên*, *Nhóm con*, *Khoá*).
- **Ba danh sách có phân trang:** theo thành viên (mỗi người một dòng kèm nhóm của họ), theo nhóm con (chỉ con trực tiếp, mỗi dòng cộng dồn cả nhánh), theo khoá. Chỉ số: số có nghĩa vụ, hoàn thành, đang học, quá hạn, chưa bắt đầu, tỉ lệ, tiến độ trung bình. Tách *chưa bắt đầu* khỏi *quá hạn* vì hai thứ đòi hai cách xử lý.
- **Phạm vi:** số liệu của một nhóm gồm toàn bộ người ở nhánh con, không có công tắc tắt; loại tài khoản kiểm thử; chế độ hiện tại loại người đã nghỉ việc, chế độ quá khứ vẫn tính nếu lúc đó họ còn làm.
- **Mốc quá khứ:** thành viên và trạng thái học tính tại mốc đã chọn; chạy lại cùng mốc ra đúng số cũ; ngày sớm nhất chọn được là ngày bật tính năng.

## Ngoài phạm vi

- Sửa dashboard SIS hay thêm bộ lọc nhóm vào dashboard (BR-18.8: đợt này chỉ làm tab Báo cáo).
- Hẹn giờ gửi báo cáo qua email, xuất báo cáo ra tệp, so sánh hai mốc cạnh nhau.
- Màn theo dõi nhánh của quản lý (US16, change `user-account-group-supervisors`).
- Dựng lại **cây nhóm** của quá khứ: mốc quá khứ chỉ dựng lại thành viên và trạng thái học (xem `design.md`).

## Capabilities

### New Capabilities
- `uplnd/user-account/group-report`: tab Báo cáo của chi tiết nhóm, ba danh sách theo thành viên, nhóm con, khoá, cộng dồn nhánh con, ở hiện tại hoặc một mốc quá khứ (US18).

### Modified Capabilities

Không có. `openspec/specs/` chưa có capability nào.

## Impact

- **Hiện trạng cần biết trước khi làm:** phần lớn đã có trên `origin/staging`, nên change này đối chiếu rồi chỉ làm phần chênh.
  - `lms-be`: `apps/ops/src/groups/report/` (ba endpoint `GET /groups/:id/report/{members,children,courses}`), bảng phiên bản trạng thái lượt ghi danh `class_user_report_logs` (`1792000001000-create-group-tables.ts`, `1792000006000-add-type-to-class-user-report-logs.ts`), job chụp `apps/background-job-service/src/group-report/`. Task 19.6 của `lms-be:upbase-221100-group` ("báo cáo quá khứ chạy lại ra cùng số") đã đánh dấu `PASS` ngày 13/11.
  - `ops-fe`: `features/group/src/components/groups/tabs/ReportTab.tsx` và `shared/reportColumns.tsx`, nối API thật; `services/mock-report.ts` còn trong cây.
- **Lệch PRD v0.6 và v0.11 draft:** v0.11 tách báo cáo quá khứ thành US22 để làm sau, v0.6 gộp trong US18, còn code làm cả hai; xem bảng ở `design.md`.
- **Repo bị chạm:** `lms-be`, `ops-fe`.
- **Module:** User (`user-account`) vì báo cáo nằm trong chi tiết nhóm; `openspec/products.yaml` đăng ký capability khi archive.

## Repos

- lms-be: ba API báo cáo, job chụp trạng thái cuối ngày, kiểm tra mốc.
- ops-fe: tab Báo cáo, ô chọn mốc và dạng xem, ba bảng.
