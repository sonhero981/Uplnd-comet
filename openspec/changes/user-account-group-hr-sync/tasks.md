# Tasks

Mọi path code đọc từ `origin/staging` của từng repo. Báo cáo đối chiếu ghi ở `docs/superpowers/reports/`. Build `lms-be` kiểm bằng `yarn --cwd ../lms-be test` (repo không có script `build`), `ops-fe` bằng `pnpm --dir ../ops-fe build:ops-fe`. Change này phụ thuộc `user-account-group-foundation`.

## 1. [lms-be] Đồng bộ cơ cấu từ hệ thống nhân sự (group-hr-sync)

- [ ] 1.1 Đối chiếu 10 requirement của `uplnd/user-account/group-hr-sync` với `libs/modules/src/lib/group/hr-sync`, các consumer ở `apps/event-processor-service/src/app` và job `group-hr-sync`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-hr-sync-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test chứng minh
- [ ] 1.2 Chốt với PO hoặc Tech PIC từng dòng lệch ở bảng Context của `design.md`, trước hết là nhóm gốc `Ancestor` và người không thuộc phòng ban nào, rồi lý do vào/ra nhóm và cách chạy; ghi quyết định vào `design.md` và nếu bỏ `Ancestor` thì sửa requirement `Thành viên ở nhóm sâu nhất`; xong khi bảng không còn dòng chưa quyết
- [ ] 1.3 Kiểm dựng cây và thành viên bằng provider giả: cây 4 cấp, người ở `Sub-Growth 1` chỉ ở nhóm sâu nhất, người thuộc hai nhánh có hai nhóm, đổi tên và đổi cha ở nguồn cập nhật đúng; xong khi test xanh và đếm thành viên nhóm cha vẫn gồm nhánh con
- [ ] 1.4 Kiểm biến mất khỏi nguồn: người không còn ở nguồn đóng lượt với `Nghỉ việc` và không xoá dòng, người chuyển phòng có dòng rời `Điều chuyển` cùng thời điểm với dòng vào, phòng ban bị xoá chuyển nhóm sang `Lưu trữ` và giữ lượt, nguồn rỗng không lưu trữ hàng loạt; xong khi test cho thấy không dòng nào bị xoá cứng
- [ ] 1.5 Kiểm tự sửa chênh lệch: dừng một lần đồng bộ giữa chừng, gửi sự kiện trùng và sai thứ tự, chạy lại đồng bộ toàn bộ; xong khi cây và thành viên về đúng nguồn không cần dọn tay và lô lỗi không để lại trạng thái áp một phần
- [ ] 1.6 Kiểm không chặn giao diện và không ghi ngược: đồng bộ lần đầu với 53 nhóm / 384 người chạy nền (đo thời gian chạy và ghi vào báo cáo 1.1), và provider ghi nhận không có lời gọi ghi nào tới nguồn; xong khi có số đo và test khẳng định không ghi ngược
- [ ] 1.7 Sửa phần lệch/thiếu đã chốt ở 1.1 và 1.2, mỗi chỗ kèm test tương ứng scenario trong spec; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 2. [ops-fe] Hiển thị và khoá nhóm đồng bộ

- [ ] 2.1 Đối chiếu nhãn nguồn ở danh sách, khối thông tin (nguồn, *Last synced*, số thành viên), ẩn nút sửa/thêm gỡ thành viên/di chuyển/xoá, dòng giải thích, và các việc vẫn làm được (giao nội dung, gán quản lý, gán mentor) của `features/group` với spec trên app chạy với API staging, ghi bảng đạt/lệch vào `docs/superpowers/reports/group-hr-sync-fe.md`; xong khi mỗi requirement có kết quả quan sát được
- [ ] 2.2 Kiểm nhóm đồng bộ chưa có lần đồng bộ nào hiện *Last synced* trống thay vì lỗi, và nhóm lưu trữ do nguồn xoá hiện nhãn *Lưu trữ* cùng thành viên còn nguyên; xong khi cả hai ca quan sát được
- [ ] 2.3 Áp quyết định ở 1.2 cho giao diện (nhóm gốc `Ancestor` hiển thị thế nào, số thành viên ở khối thông tin là hiện tại hay của lần đồng bộ gần nhất) và sửa phần lệch/thiếu rồi chạy `pnpm --dir ../ops-fe build:ops-fe`; xong khi build pass và mọi dòng lệch trong báo cáo FE đã đóng hoặc có quyết định hoãn có lý do

## Workflow follow-up

- Chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build` (cả hai đang `NO_STORE`).
- Đối chiếu bộ spec của change này với `lms-be:openspec/changes/upbase-221100-group/specs/group/hr-sync` và ghi lệch còn lại vào báo cáo verify.
- Khi archive: thêm `group-hr-sync` vào `openspec/products.yaml` (module `user-account`, repo `lms-be`, `ops-fe`, feature `LMS-F002`) và chạy `/comet-codekb refresh`.
