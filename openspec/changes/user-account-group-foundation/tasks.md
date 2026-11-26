# Tasks

Mọi path code đọc từ `origin/staging` của từng repo. Báo cáo đối chiếu ghi ở `docs/superpowers/reports/`. Build `lms-be` kiểm bằng `yarn --cwd ../lms-be test` (repo không có script `build`), `ops-fe` bằng `pnpm --dir ../ops-fe build:ops-fe`.

## 1. [lms-be] Cây nhóm và danh sách (group-structure)

- [ ] 1.1 Đối chiếu 16 requirement của `uplnd/user-account/group-structure` với `apps/ops/src/groups/structure` và `libs/modules/src/lib/group/tree`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-foundation-be-structure.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test chứng minh
- [ ] 1.2 Chốt với PO hoặc Tech PIC từng dòng lệch ở bảng Context của `design.md` (US1 mã nhóm, US2, US6, US14, US15) và ghi quyết định vào `design.md`; xong khi bảng không còn dòng nào chưa có quyết định, và nếu mã nhóm đổi sang tự cấp thì hai requirement `Tạo nhóm`, `Mã nhóm duy nhất và không đổi` trong spec đã sửa theo
- [ ] 1.3 Sửa phần lệch/thiếu đã được chốt ở 1.1 và 1.2 (gồm kiểm lại lọc và tìm theo mã, trả cả nhóm đang dùng lẫn lưu trữ ở `GET /groups`), mỗi chỗ kèm test tương ứng với scenario trong spec; xong khi `yarn --cwd ../lms-be test` chạy các test mới đều xanh
- [ ] 1.4 Kiểm bốn scenario rủi ro ở tầng API, không chỉ qua giao diện: hai người tạo cùng tên cùng lúc, di chuyển nhóm vào nhánh con của chính nó, tạo nhánh sâu hơn 6 cấp, và hai tenant dùng cùng mã nhóm; xong khi có test hoặc truy vấn `SET ROLE app_role` cho thấy tenant kia không thấy dữ liệu

## 2. [lms-be] Thành viên và nhật ký (group-membership)

- [ ] 2.1 Đối chiếu 13 requirement của `uplnd/user-account/group-membership` với `apps/ops/src/groups/members` và `libs/modules/src/lib/group/membership`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-foundation-be-membership.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test
- [ ] 2.2 Kiểm lịch sử vào/ra (nền C3): người bị gỡ rồi thêm lại có hai lượt riêng, dựng thành viên của nhóm tại ngày T từ `group_user_instances` ra đúng cả người sau đó nghỉ việc, nhóm lưu trữ không mất dòng nào; xong khi có test chạy các ca này và xanh
- [ ] 2.3 Kiểm nhập tệp đầu cuối: tệp thêm 10 dòng có 3 dòng lỗi (không tìm thấy, đã trong nhóm, tài khoản kiểm thử) ra 7 thành công, `GET /api/v1/import-logs/<log_id>` trả đúng 10 dòng với lý do từng dòng lỗi, rồi tệp gỡ có người đang học dở; xong khi kết quả khớp spec `Kết quả và log của lần nhập tệp`. Đây trùng task 19.4 còn mở của `lms-be:upbase-221100-group`, ghi chéo để không làm hai lần
- [ ] 2.4 Kiểm gỡ người còn nghĩa vụ học và người đã nghỉ việc: người rời nhóm, lượt ghi danh giữ nguyên, sự kiện rời nhóm kèm lý do đến được `group-member-left.handler.ts`; xong khi test cho thấy lượt ghi danh không đổi và sự kiện được phát. Phần tự gỡ khỏi lớp và email `MAIL-GRP-01` để change `user-account-group-lifecycle`
- [ ] 2.5 Sửa phần lệch/thiếu đã chốt ở 2.1 đến 2.4 (gồm chỉ gỡ được thành viên trực tiếp và bộ lọc vào trực tiếp/nhánh con), mỗi chỗ kèm test; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 3. [ops-fe] Danh sách nhóm, tạo, sửa, di chuyển, lưu trữ

- [ ] 3.1 Đối chiếu các màn Danh sách (Cây, Bảng), form tạo/sửa, di chuyển có xác nhận, lưu trữ, khôi phục, xoá của `features/group` với spec `group-structure` trên app chạy với API staging, ghi bảng đạt/lệch vào `docs/superpowers/reports/group-foundation-fe-structure.md`; xong khi mỗi requirement có kết quả quan sát được ghi lại
- [ ] 3.2 Áp quyết định ở 1.2 cho giao diện (dạng xem mặc định, công tắc *Hiện nhóm đã lưu trữ* hay bộ lọc trạng thái, ô nhập mã hay mã tự cấp, điều kiện hiện nút Xoá) và sửa phần lệch/thiếu; xong khi bảng 3.1 không còn dòng lệch chưa xử lý và `pnpm --dir ../ops-fe build:ops-fe` pass
- [ ] 3.3 Kiểm dạng Cây tải dần: mở một nhánh chỉ gọi đúng một request lấy con của nhánh đó, mở lần đầu chỉ hiện nhóm gốc đã gấp, tìm kiếm hiện đường dẫn đầy đủ từ gốc, nhớ dạng xem lần chọn gần nhất; xong khi có test hoặc ghi nhận request mạng chứng minh
- [ ] 3.4 Kiểm nhóm lưu trữ ẩn ở danh sách và ở mọi ô chọn nhóm (ô chọn nhóm cha, bộ lọc, ô chọn nhóm ở các màn khác dùng nhóm), người chỉ có quyền xem không thấy nút ghi; xong khi các ca này có test hoặc ảnh chụp màn

## 4. [ops-fe] Thành viên, nhập tệp, nhật ký

- [ ] 4.1 Đối chiếu tab Thành viên (cột, bộ lọc, ẩn người nghỉ việc mặc định, nhãn *Đã trong nhóm*, ẩn nút Thêm/Gỡ ở nhóm đồng bộ và nhóm lưu trữ, cảnh báo trước khi gỡ người đang học dở) với spec `group-membership`, ghi bảng đạt/lệch vào `docs/superpowers/reports/group-foundation-fe-membership.md`; xong khi mỗi requirement có kết quả quan sát được
- [ ] 4.2 Kiểm nhập tệp trên app: chưa chọn hành động thì không tải được, tệp sai định dạng hoặc hai tệp báo ngay, kết quả *Đã xử lý N dòng: thành công X, lỗi Y* và log ba loại lỗi (hợp đồng `action` trong FormData, `log_id` so với `logId`); xong khi chạy đủ ba ca trên staging và khớp spec
- [ ] 4.3 Kiểm Nhật ký thành viên: cột, bộ lọc khoảng thời gian/nhóm/người/lý do, mới nhất lên đầu, không có thao tác sửa xoá, lối vào có lọc sẵn từ chi tiết nhóm và từ hồ sơ học viên (hồ sơ học viên thuộc `features/user`); xong khi lối vào từ hồ sơ học viên hoạt động hoặc được ghi thành lệch có người nhận
- [ ] 4.4 Sửa phần lệch/thiếu ở 4.1 đến 4.3 và chạy `pnpm --dir ../ops-fe build:ops-fe`; xong khi build pass và mọi dòng lệch trong ba bảng báo cáo FE đã đóng hoặc có quyết định hoãn có lý do

## Workflow follow-up

- Chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build` (cả hai đang `NO_STORE`).
- Đối chiếu bộ spec của change này với `lms-be:openspec/changes/upbase-221100-group/specs/group/{structure,membership}` và ghi lệch còn lại vào báo cáo verify.
- Khi archive: thêm `group-structure`, `group-membership` vào `openspec/products.yaml` (module `user-account`, repo `lms-be`, `ops-fe`, feature `LMS-F002`) và chạy `/comet-codekb refresh`.
