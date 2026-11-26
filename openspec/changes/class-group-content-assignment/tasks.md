# Tasks

Mọi path code đọc từ `origin/staging` của từng repo. Báo cáo đối chiếu ghi ở `docs/superpowers/reports/`. Build `lms-be` kiểm bằng `yarn --cwd ../lms-be test` (repo không có script `build`), `ops-fe` bằng `pnpm --dir ../ops-fe build:ops-fe`. Change này phụ thuộc `user-account-group-foundation`.

## 1. [lms-be] Giao lớp cho nhóm (group-content-assignment)

- [ ] 1.1 Đối chiếu 8 requirement của `uplnd/class/group-content-assignment` với `apps/ops/src/groups/assignments`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-assignment-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test chứng minh
- [ ] 1.2 Chốt với PO hoặc Tech PIC từng dòng lệch ở bảng Context của `design.md` (định nghĩa lớp đang nhận học viên, điều kiện chặn gỡ lớp, công tắc chảy xuống đổi được sau khi giao, cờ giao nội dung theo tenant, nhật ký đổi công tắc) và ghi quyết định vào `design.md`; xong khi bảng không còn dòng chưa có quyết định
- [ ] 1.3 Kiểm gỡ lớp: `can_remove` ẩn khi có hoạt động học, và request gỡ vẫn bị từ chối khi có người phát sinh hoạt động học giữa lúc mở màn và lúc gỡ; xong khi có test chạy cả hai ca và xanh
- [ ] 1.4 Sửa phần lệch/thiếu đã chốt ở 1.1 và 1.2, mỗi chỗ kèm test tương ứng scenario trong spec; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 2. [lms-be] Luật đứng ghi danh (group-enrollment)

- [ ] 2.1 Đối chiếu 9 requirement của `uplnd/class/group-enrollment` với `libs/modules/src/lib/group/enrollment` và `group-membership.service.ts`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-enrollment-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test
- [ ] 2.2 Kiểm luật đứng ở ba thời điểm cùng chống trùng: giao lớp, người vào nhóm khi công tắc bật và tắt, bật công tắc với `Ghi danh luôn` và `Chỉ áp dụng cho người vào sau`, và hai nhóm cùng giao một lớp cho một người chạy song song; xong khi mọi ca cho đúng một lượt với đủ nhóm nguồn. Trùng task 19.2 còn mở của `lms-be:upbase-221100-group`, ghi chéo để không làm hai lần
- [ ] 2.3 Kiểm các cửa của Lớp: lớp đã kết thúc dừng im lặng và có dòng `field_change_logs`, vượt sức chứa vẫn ghi danh, lớp có Foundation ra 110 lượt cho nhóm 55 người, tài khoản kiểm thử bị bỏ qua ở xem trước và luật đứng; xong khi từng ca có test hoặc truy vấn số lượt chứng minh
- [ ] 2.4 Kiểm giao không hồi tố và nhóm lưu trữ: người rời nhóm trước thời điểm giao không vào lớp, luật đứng không thêm ai khi nhóm đã lưu trữ và lượt đã sinh không đổi; xong khi có test chạy hai ca và xanh
- [ ] 2.5 Sửa phần lệch/thiếu đã chốt ở 2.1 đến 2.4, mỗi chỗ kèm test; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 3. [ops-fe] Hộp giao nội dung, tab Nội dung được giao, cảnh báo sức chứa

- [ ] 3.1 Đối chiếu hộp giao nội dung (ô chọn lớp, hai công tắc, khối xem trước), tab *Nội dung được giao* (cột, nút *Gỡ lớp*) và công tắc từng lớp của `features/group` với hai spec trên app chạy với API staging, ghi bảng đạt/lệch vào `docs/superpowers/reports/group-assignment-fe.md`; xong khi mỗi requirement có kết quả quan sát được
- [ ] 3.2 Kiểm công tắc *Tự ghi danh*: hai lớp có hai công tắc độc lập, bật khi còn N người chưa vào lớp hiện đúng câu hỏi và hai nút, tắt hiện đúng câu báo và không ai bị gỡ, thay đổi lưu ngay; xong khi chạy đủ bốn ca trên staging và khớp spec
- [ ] 3.3 Kiểm dòng cảnh báo vượt sức chứa ở tab *Học viên* của lớp (`features/class-and-course`): lớp đặt giới hạn 50 có 60 người hiện *Lớp này giới hạn 50 học viên, hiện có 60 người*, lớp không đặt giới hạn thì không hiện, không có thông báo tức thời hay hộp xác nhận; xong khi cả hai ca quan sát được
- [ ] 3.4 Áp quyết định ở 1.2 cho giao diện (công tắc chảy xuống đổi sau khi giao, ẩn nút khi chưa bật cờ giao nội dung, thời gian học riêng đang comment tắt) và sửa phần lệch/thiếu; xong khi bảng 3.1 không còn dòng lệch chưa xử lý và `pnpm --dir ../ops-fe build:ops-fe` pass

## Workflow follow-up

- Chạy `/comet-codekb` cho `lms-be` và `ops-fe` trước `/comet-build` (cả hai đang `NO_STORE`).
- Đối chiếu bộ spec của change này với `lms-be:openspec/changes/upbase-221100-group/specs/group/content-assignment` và `class/enrollment`, ghi lệch còn lại vào báo cáo verify.
- Khi archive: thêm `group-content-assignment`, `group-enrollment` vào `openspec/products.yaml` (module `class`, repo `lms-be`, `ops-fe`, feature `LMS-F002`) và chạy `/comet-codekb refresh`.
