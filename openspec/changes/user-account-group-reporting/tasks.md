# Tasks

Mọi path code đọc từ `origin/staging` của từng repo. Báo cáo đối chiếu ghi ở `docs/superpowers/reports/`. Build `lms-be` kiểm bằng `yarn --cwd ../lms-be test` (repo không có script `build`), `ops-fe` bằng `pnpm --dir ../ops-fe build:ops-fe`. Change này phụ thuộc `user-account-group-foundation` và `class-group-content-assignment`.

## 1. [lms-be] Ba API báo cáo và bản chụp trạng thái (group-report)

- [ ] 1.1 Đối chiếu 10 requirement của `uplnd/user-account/group-report` với `apps/ops/src/groups/report`, `class_user_report_logs` và job `group-report`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-report-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test chứng minh
- [ ] 1.2 Chốt với PO hoặc Tech PIC từng dòng lệch ở bảng Context của `design.md`, trước hết là báo cáo quá khứ có thuộc đợt này không (US18 v0.6 hay US22 v0.11), cây nhóm gom theo cây hiện tại, ngày sớm nhất chọn được; ghi quyết định vào `design.md` và nếu tách quá khứ thì chuyển hai requirement tương ứng sang change sau; xong khi bảng không còn dòng chưa quyết
- [ ] 1.3 Kiểm số liệu đúng trên bộ dữ liệu có nhóm cha và hai nhóm con, một người ở hai nhóm con, một tài khoản kiểm thử, một người nghỉ việc; đối chiếu ba danh sách với truy vấn SQL độc lập; xong khi số khớp, người ở hai nhóm con chỉ đếm một lần và tổng bốn trạng thái bằng số có nghĩa vụ
- [ ] 1.4 Kiểm chạy lại cùng mốc ra cùng số: chốt mốc T, sau đó thêm thành viên, cho một người nghỉ việc, đổi trạng thái học của một lượt, chạy job chụp rồi gọi lại ba API tại T; xong khi ba API trả đúng số trước đó. Task 19.6 của `lms-be:upbase-221100-group` đã `PASS` ngày 13/11, chạy lại trên staging để xác nhận
- [ ] 1.5 Kiểm giới hạn mốc: mốc trước `earliest_as_of`, mốc là hôm nay và mốc tương lai bị từ chối, `meta.earliest_as_of` được trả; xong khi test cho thấy từ chối đúng và FE lấy được ngày sớm nhất
- [ ] 1.6 Đo thời gian phản hồi ba API trên nhóm gốc quy mô thật (53 nhóm, 384 người) ở hiện tại và ở một mốc quá khứ, ghi vào báo cáo 1.1; xong khi có số đo và Tech PIC xác nhận ngưỡng chấp nhận được
- [ ] 1.7 Sửa phần lệch/thiếu đã chốt ở 1.1 và 1.2, mỗi chỗ kèm test tương ứng scenario trong spec; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 2. [ops-fe] Tab Báo cáo trong chi tiết nhóm

- [ ] 2.1 Đối chiếu tab *Báo cáo* (ô *Mốc thời gian*, ô *Xem theo*, ba bảng, phân trang) của `features/group` với spec trên app chạy với API staging, ghi bảng đạt/lệch vào `docs/superpowers/reports/group-report-fe.md`; xong khi mỗi requirement có kết quả quan sát được
- [ ] 2.2 Kiểm ô mốc: mặc định *Hiện tại*, ngày sớm nhất lấy từ `meta.earliest_as_of`, ngày trước đó và từ hôm nay trở đi không chọn được; xong khi cả ba ca quan sát được
- [ ] 2.3 Kiểm bảng *Nhóm con* với nhóm có nhóm con (đúng số dòng, cộng dồn nhánh) và nhóm lá (spec đòi danh sách trống kèm câu ghi rõ nhóm không có nhóm con, code đang ẩn bảng khi `has_children = false`); xong khi hành vi khớp quyết định ở 1.2 hoặc được ghi là lệch có người nhận
- [ ] 2.4 Kiểm `services/mock-report.ts` còn được import ở đâu không và báo kết quả; xong khi có danh sách nơi dùng hoặc xác nhận không còn nơi nào dùng (không xoá khi chưa được yêu cầu)
- [ ] 2.5 Sửa phần lệch/thiếu ở 2.1 đến 2.3 theo quyết định ở 1.2 và chạy `pnpm --dir ../ops-fe build:ops-fe`; xong khi build pass và mọi dòng lệch trong báo cáo FE đã đóng hoặc có quyết định hoãn có lý do

## Workflow follow-up

- Chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build` (cả hai đang `NO_STORE`).
- Đối chiếu bộ spec của change này với `lms-be:openspec/changes/upbase-221100-group/specs/group/report` và ghi lệch còn lại vào báo cáo verify.
- Khi archive: thêm `group-report` vào `openspec/products.yaml` (module `user-account`, repo `lms-be`, `ops-fe`, feature `LMS-F002`) và chạy `/comet-codekb refresh`.
