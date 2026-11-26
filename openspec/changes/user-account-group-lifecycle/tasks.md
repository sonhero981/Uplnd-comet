# Tasks

Mọi path code đọc từ `origin/staging` của `lms-be`. Báo cáo đối chiếu ghi ở `docs/superpowers/reports/`. Build `lms-be` kiểm bằng `yarn --cwd ../lms-be test` (repo không có script `build`). Change này chỉ chạm `lms-be` và phụ thuộc `class-group-content-assignment` cùng `user-account-group-hr-sync`.

## 1. [lms-be] Xử lý khoá khi người rời nhóm (US19)

- [ ] 1.1 Đối chiếu 7 requirement đầu của `uplnd/user-account/group-member-leave` (xét từng khoá, tự gỡ, nhật ký, luật đứng nhóm mới, giữ lượt khi nhóm khác còn giao, khoá còn nghĩa vụ, nghỉ việc) với `libs/modules/src/lib/group/leave/group-leave.service.ts` và `apps/event-processor-service/src/app/group-member-left.handler.ts`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-leave-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test chứng minh
- [ ] 1.2 Chốt với PO hoặc Tech PIC từng dòng lệch ở bảng Context của `design.md`, trước hết là đường dẫn hồ sơ trong email (mọi email hay chỉ mail quản trị viên) và cơ chế khi gửi mail lỗi sau khi đã đặt `left_notified_at`; ghi quyết định vào `design.md` và sửa requirement tương ứng; xong khi bảng không còn dòng chưa quyết
- [ ] 1.3 Kiểm tự gỡ theo từng khoá: người rời nhóm có một khoá chưa học, một khoá đang học dở, một khoá thêm tay thì chỉ khoá chưa học bị gỡ, nhật ký ghi lý do `Điều chuyển`, hai khoá còn lại giữ nguyên; xong khi test xanh cho ba ca
- [ ] 1.4 Kiểm ca biên "chưa học": khoá đã mở nhưng chưa ghi hoạt động học, khoá có hoạt động học nhưng chưa hoàn thành, khoá hoàn thành, lượt đã huỷ; so định nghĩa `READY_TO_LEARN` với "chưa có hoạt động học nào" (BR-19.1); xong khi không khoá nào đã có hoạt động học rơi vào nhánh tự gỡ
- [ ] 1.5 Kiểm giữ lượt khi nhóm khác còn giao: người rời nhóm A vẫn ở nhóm B, cả hai giao lớp L thì lượt ở L giữ nguyên với nguồn còn nhóm B, nhật ký có dòng *Giữ lại vì nhóm B vẫn giao*, không email; rời cả hai nhóm thì mới xét gỡ; xong khi test xanh. Trùng task 19.3 còn mở của `lms-be:upbase-221100-group`, ghi chéo để không làm hai lần
- [ ] 1.6 Kiểm điều chuyển và nghỉ việc đầu cuối qua đồng bộ: người chuyển từ nhóm có `auto_enroll` sang nhóm khác thì khoá chưa học bị gỡ và vào lớp của nhóm mới, người bị xoá ở nguồn có lượt rời `Nghỉ việc`, lượt ghi danh giữ trạng thái kết thúc và không có email; xong khi test xanh
- [ ] 1.7 Sửa phần lệch/thiếu đã chốt ở 1.1 và 1.2, mỗi chỗ kèm test tương ứng scenario trong spec; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 2. [lms-be] Email MAIL-GRP-01 báo quản lý (US20)

- [ ] 2.1 Đối chiếu 4 requirement cuối của `group-member-leave` (email `MAIL-GRP-01`, người nhận, không gửi cho chính người rời nhóm, một email cho một lần rời nhóm) với `group-leave.service.ts` (`notifyManagers`, `resolveMailRecipients`) và mail type `GROUP_MEMBER_LEFT_WITH_PROGRESS`, ghi tiếp vào `docs/superpowers/reports/group-leave-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test
- [ ] 2.2 Kiểm điều kiện bắn email: người rời nhóm còn khoá đang học dở hoặc đã học xong thì gửi đúng một email gộp mọi khoá kèm tình trạng, đường dẫn hồ sơ theo quyết định ở 1.2 và câu cảnh báo cố định đúng nguyên văn; chưa học khoá nào, nghỉ việc, hay nhóm khác còn giao thì không bắn; xong khi test kiểm số email và nội dung từng ca
- [ ] 2.3 Kiểm người nhận: có quản lý chính thì chính ở `to` và các quản lý khác ở `cc`, không có quản lý chính thì mọi quản lý theo nhóm ở `to`, không có quản lý nào thì quản trị viên, người rời nhóm bị loại kể cả khi là quản lý duy nhất (lên quản lý của nhóm cha gần nhất có quản lý khác họ, hết cây thì quản trị viên), tài khoản `BLOCKED` bị loại; xong khi test xanh cho từng ca
- [ ] 2.4 Kiểm chống gửi trùng và lỗi gửi: xử lý lại cùng một sự kiện và hai consumer song song chỉ ra một email; khi dịch vụ mail lỗi, ghi nhận kết quả (có gửi lại không) và đối chiếu với quyết định ở 1.2; xong khi có test hoặc báo cáo hành vi khi lỗi
- [ ] 2.5 Kiểm nhập tệp gỡ có người đang học dở: người vẫn rời nhóm, quản lý nhận email như khi gỡ thủ công, kết quả lần nhập ghi số người đã báo quản lý; xong khi khớp spec và đối chiếu với task 19.4 còn mở của `lms-be:upbase-221100-group`
- [ ] 2.6 Sửa phần lệch/thiếu ở 2.1 đến 2.5 theo quyết định ở 1.2, mỗi chỗ kèm test; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## Workflow follow-up

- Chạy `/comet-codekb` cho `lms-be` trước `/comet-build` (đang `NO_STORE`).
- Đối chiếu bộ spec của change này với `lms-be:openspec/changes/upbase-221100-group/specs/class/enrollment` và `group/content-assignment` (phần rời nhóm, `MAIL-GRP-01`) và ghi lệch còn lại vào báo cáo verify.
- Khi archive: thêm `group-member-leave` vào `openspec/products.yaml` (module `user-account`, repo `lms-be`, feature `LMS-F002`) và chạy `/comet-codekb refresh`.
