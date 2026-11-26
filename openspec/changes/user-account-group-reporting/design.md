Tech design: e:\Upbase-comet\uplnd_po_workflow\intents\261005-group\inception\tech-design\fe-technical-design.md @ 17c4b85

# Design

Tài liệu trên là thiết kế **FE** v2.2 (bản demo mock) và đã lỗi thời so với staging; `tech-design.md` vẫn là template trống nên **chưa có tech design BE** trong repo PO. Các lựa chọn BE dưới đây lấy từ code trên `origin/staging` của `lms-be` và từ change `upbase-221100-group` của repo đó, không chép lại. Quy ước FE đúng hơn ở `ops-fe:features/group/CLAUDE.md`.

## Context

Xem `proposal.md` cho lý do. Các dẫn chiếu `repo:path:line` đọc từ `origin/staging`. Codekb cả 4 repo đang `NO_STORE`, nên mọi điều dưới đây đã kiểm trực tiếp trên code.

**Hiện trạng đã có trên staging:**
- Ba endpoint trong `lms-be:apps/ops/src/groups/report/group-report.controller.ts`: `GET /groups/:id/report/members` (`:29`), `.../children` (`:49`), `.../courses` (`:69`), tham số `as_of` (không truyền là hiện tại), kết quả phân trang kèm `meta.earliest_as_of`.
- Logic ở `group-report.service.ts`: `members` `:82`, `children` `:160`, `courses` `:217`, kiểm mốc `resolveMark` `:268`, CTE dùng chung `:325`.
- Bảng phiên bản trạng thái lượt ghi danh `class_user_report_logs` (`status`, `completed_sections`, `total_sections`, `finished_at`, `user_status`, `valid_from`, `valid_to`) với chỉ mục duy nhất trên dòng đang mở (`create-group-tables.ts:258-282`); job chụp chạy 23:55 giờ Việt Nam (`apps/background-job-service/src/group-report/group-report-job.service.ts:38-42`).
- `ops-fe`: `features/group/src/components/groups/tabs/ReportTab.tsx`, `shared/reportColumns.tsx`; `ops-fe:features/group/CLAUDE.md` ghi báo cáo đã nối API thật, còn `services/mock-report.ts` trong cây.

**Độ lệch giữa PRD v0.6 (spec theo) và v0.11 draft (code theo):**

| Chủ đề | PRD v0.6 | PRD v0.11 draft / code |
|---|---|---|
| Báo cáo quá khứ | Là một phần của US18 (BR-18.1, BR-18.2, BR-18.7) | Tách thành US22 làm sau (CR8, DEC135); code vẫn làm cùng đợt, chờ PO ra CR |
| Cây nhóm của quá khứ | Không nêu | Nhóm và nhánh con gom theo **cây nhóm hiện tại**, không dựng lại cây quá khứ (BR-22.2) |
| Định nghĩa trạng thái lượt | Chỉ nêu tên cột (hoàn thành, đang học, quá hạn, chưa bắt đầu) | Bốn trạng thái loại trừ nhau, định nghĩa ở BR-18.9 |
| Giới hạn mốc | Ngày sớm nhất là ngày bật tính năng | Ngày sớm nhất là ngày job chụp chạy lần đầu, mốc trước hôm nay, múi giờ Việt Nam, chụp lỡ một ngày thì lệch tối đa một ngày (BR-22.3) |
| Nhóm lá ở danh sách nhóm con | Danh sách trống và ghi rõ nhóm không có nhóm con (AC18.5) | `meta.has_children = false` thì FE ẩn bảng (comment ở controller `:49`) |

Spec theo v0.6 và lấy định nghĩa bốn trạng thái từ v0.11 vì v0.6 không đủ để kiểm thử (tổng bốn trạng thái bằng số có nghĩa vụ). Các dòng còn lại là việc đối chiếu trong `tasks.md`.

## Goals / Non-Goals

**Goals:**
- Chốt hợp đồng hành vi của tab Báo cáo làm chuẩn nghiệm thu chung cho `lms-be` và `ops-fe`.
- Bảo đảm O5: báo cáo cùng mốc luôn ra cùng số, kể cả khi thành viên và trạng thái học đổi sau đó.
- Tách rõ phần đã có khỏi phần chênh để `tasks.md` chỉ chứa đối chiếu và việc chênh.

**Non-Goals:**
- Dashboard SIS, xuất tệp, gửi báo cáo định kỳ, so sánh hai mốc.
- Dựng lại cây nhóm của quá khứ.
- Đặt ngưỡng hiệu năng thay Tech PIC (PRD chỉ nêu "không chặn giao diện").

## Decisions

**D1. Báo cáo quá khứ đọc từ bản chụp có phiên bản, không tính lại từ trạng thái hiện tại.** `class_user_report_logs` giữ mỗi lượt ghi danh theo các đoạn `valid_from` đến `valid_to`; job đêm đóng phiên bản đã đổi và mở phiên bản mới (`group-report-job.service.ts:86-92`). Chỉ số tại mốc T lấy phiên bản có `valid_from <= T` và còn hiệu lực. Phương án đã xét: tính lại từ dữ liệu hiện tại (không cần job nhưng đúng là thứ làm "48/55" thành "41/48"), lưu nguyên một bản chụp đầy đủ mỗi ngày (đơn giản nhưng tăng dòng theo ngày × lượt, hầu hết giống hệt ngày trước). Chọn phiên bản vì chỉ ghi khi có thay đổi. Đánh đổi: có job phải chạy mỗi đêm; lỡ một ngày thì số liệu ngày đó lệch tối đa một ngày.

**D2. Thành viên tại mốc dựng từ lịch sử vào/ra nhóm.** `group_user_instances.created_at` đến `deleted_at` (`group-report.service.ts:344-353`) thay vì danh sách hiện tại, theo quyết định D2 của change `user-account-group-foundation`. Nhờ vậy người sau này nghỉ việc hay rời nhóm vẫn có mặt ở mốc cũ.

**D3. Trạng thái người dùng cũng có phiên bản.** "Đã nghỉ việc" suy từ tài khoản `BLOCKED` theo phiên bản tại mốc (`group-report.service.ts:357-361`, lấy `user_status` mới nhất có `valid_from <= T`, mặc định theo trạng thái hiện tại), không phải trạng thái hôm nay. Tài khoản kiểm thử loại bằng `is_operator IS NOT TRUE AND is_super_student IS NOT TRUE` (`:416`).

**D4. Ba endpoint tách theo danh sách, một tham số `as_of`.** Mỗi danh sách phân trang riêng nên FE chỉ gọi danh sách đang xem; tính bằng CTE chung ở `:325` thay vì lưu sẵn tổng theo nhóm. Phương án đã xét: bảng cộng dồn sẵn theo nhóm (đọc nhanh nhưng cộng dồn lịch sử theo cây phải sửa lại mỗi lần di chuyển nhánh). Chấp nhận tính khi đọc ở quy mô 53 nhóm / 384 người; đo lại nếu quy mô tăng (xem Risks).

**D5. Kiểm mốc ở BE, ngày sớm nhất trả trong `meta`.** `resolveMark` từ chối mốc trước `earliest_as_of` (ngày sớm nhất có bản chụp của tenant) hoặc từ hôm nay trở đi (`:279`); FE lấy `meta.earliest_as_of` để khoá ô chọn ngày, không tự suy.

## Risks / Trade-offs

- **[Báo cáo quá khứ nằm ngoài US18 ở PRD v0.11]** → Spec theo v0.6 (gồm quá khứ). Nếu PO chốt tách quá khứ sang CR riêng thì các requirement `Báo cáo tại mốc quá khứ` và `Giới hạn của mốc thời gian` chuyển sang một change sau; **cần người dùng quyết khi duyệt Open**, vì đổi phạm vi nghiệm thu.
- **[Gom theo cây hiện tại ở mốc quá khứ]** → Nếu nhánh bị di chuyển sau mốc T thì báo cáo mốc T gom theo cây mới. Spec chưa nói, v0.11 chấp nhận; ghi để PO biết và để không ai kỳ vọng dựng lại cây cũ.
- **[Job chụp lỡ một ngày]** → Số liệu ngày đó lấy theo bản chụp gần nhất trước đó, lệch tối đa một ngày. Cần cảnh báo vận hành khi job lỗi; ngoài PRD, ghi cho Tech PIC.
- **[Tính khi đọc trên nhánh lớn]** → Chưa có số đo. Task đo thời gian phản hồi ba API trên nhóm gốc quy mô thật và ghi vào báo cáo; ngưỡng do Tech PIC đặt, không tự đặt ở đây.
- **[`mock-report.ts` còn trong cây `ops-fe`]** → Có thể là dữ liệu thừa hoặc còn nhánh dùng; task kiểm rồi báo, không tự xoá.
- **[Chưa có codekb]** → Chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build`.

## Migration Plan

Bảng `class_user_report_logs` và job đã có trên staging; change này không thêm migration trừ khi một task chênh cần. Ngày sớm nhất chọn được là ngày job chụp chạy lần đầu của tenant, nên bật job cùng lúc bật tính năng theo tenant (`group_feature_settings`). Hoàn tác là tắt cờ tenant; bản chụp đã có được giữ, không xoá.
