Tech design: e:\Upbase-comet\uplnd_po_workflow\intents\261005-group\inception\tech-design\fe-technical-design.md @ 17c4b85

# Design

Tài liệu trên là thiết kế **FE** v2.2 và không có phần nào cho change này (US19, US20 không có thao tác FE). `tech-design.md` vẫn là template trống nên **chưa có tech design BE** trong repo PO. Các lựa chọn BE dưới đây lấy từ code trên `origin/staging` của `lms-be` và từ change `upbase-221100-group` của repo đó, không chép lại.

## Context

Xem `proposal.md` cho lý do. Các dẫn chiếu `repo:path:line` đọc từ `origin/staging`. Codekb cả 4 repo đang `NO_STORE`, nên mọi điều dưới đây đã kiểm trực tiếp trên code.

**Hiện trạng đã có trên staging:**
- Sự kiện rời nhóm do `group-membership.service.ts:229` phát lên topic `process_group_member_left` (`libs/constants/src/lib/kafka/kafka.constants.ts:76`), consumer `apps/event-processor-service/src/app/group-member-left.handler.ts:14` gọi `GroupLeaveService.process`.
- `libs/modules/src/lib/group/leave/group-leave.service.ts`: `process` `:85` (xét từng lớp của lượt thành viên vừa đóng), `processClasses` `:371` (lượt `READY_TO_LEARN` thì gỡ khỏi lớp `:436`, `IN_PROGRESS` hoặc `COMPLETED` thì giữ và gom để báo `:445`), `removeGroupSources` `:465` (bớt nhóm vừa rời và tổ tiên khỏi nhóm nguồn của lượt), `notifyManagers` `:202`, `resolveMailRecipients` `:295`.
- Tài khoản `BLOCKED` không đổi lượt ghi danh nào, chỉ bớt nhóm nguồn (`:122-127`).
- Mỗi lần rời nhóm gửi tối đa một mail: đặt `left_notified_at` nguyên tử (`UPDATE ... WHERE left_notified_at IS NULL`) rồi mới phát mail, lỗi gửi chỉ ghi log (`:194-213`); cột ở `libs/database/migrations/1792000005000-add-group-member-reason-actor.ts:31`.
- Mail type `GROUP_MEMBER_LEFT_WITH_PROGRESS` (`libs/constants/src/lib/mail/mail.ts:699`), template `apps/notification-service/src/assets/templates/group/group_member_left_with_progress.mjml`.

**Độ lệch giữa PRD v0.6 (spec theo) và v0.11 draft / code:**

| Chủ đề | PRD v0.6 | PRD v0.11 draft / code |
|---|---|---|
| Đường dẫn hồ sơ trong email | Mọi email có đường dẫn tới hồ sơ người rời nhóm | Mail gửi quản lý **không** có đường dẫn, chỉ mail gửi quản trị viên có nút `View profile` (BR-20.9, `group-leave.service.ts:245`) |
| Người nhận `BLOCKED` | Không nêu | Bỏ tài khoản `BLOCKED` khỏi người nhận (`resolveMailRecipients` `:288`, BR-13.9) |
| Nghỉ việc | Lượt ghi danh đánh dấu kết thúc | Suy từ tài khoản `BLOCKED`, không đổi lượt, không gửi mail (`:122-127`) |
| Lỗi gửi mail | Không nêu | Chỉ ghi log, không rollback lần rời nhóm (`:194`) |
| Kết quả nhập tệp gỡ | Không nêu | Kết quả lần nhập có số người đang học đã báo quản lý, tính từ `left_notified_at` (`refreshImportNotifiedCount` `:173`, BR-4.6) |
| Trạng thái "chưa học" | Chưa có hoạt động học nào (BR-19.1) | Trạng thái lượt `READY_TO_LEARN`; cần xác nhận hai định nghĩa trùng nhau |

Spec theo v0.6 ở mức kết quả; dòng đầu là điểm cần PO quyết vì đổi nội dung email nghiệm thu. Các dòng còn lại là việc đối chiếu trong `tasks.md`.

## Goals / Non-Goals

**Goals:**
- Chốt hợp đồng hành vi cho xử lý người rời nhóm làm chuẩn nghiệm thu cho `lms-be`.
- Bảo đảm không đường nào làm mất tiến độ học: chỉ gỡ khoá chưa có hoạt động học, mọi khoá còn lại giữ nguyên cho tới khi có người quyết.
- Một lần rời nhóm tối đa một email, kể cả khi xử lý lại hoặc song song.

**Non-Goals:**
- Giao diện xử lý ngay trong email, nhắc lại, gửi L&D.
- Đổi hộp xác nhận gỡ học viên khỏi lớp bên chức năng Lớp.
- Nội dung chữ cuối cùng của template email.

## Decisions

**D1. Xử lý bất đồng bộ qua Kafka theo từng lượt thành viên vừa đóng.** Gỡ thủ công, nhập tệp, đồng bộ đều đóng lượt `group_user_instances` rồi phát `GROUP_MEMBER_LEFT`; một consumer duy nhất áp luật (`group-leave.service.ts:85`). Lý do: một nơi áp luật cho cả ba đường rời nhóm, và việc gỡ khỏi lớp có thể nặng (Foundation đi kèm) không nên chạy trong request của người vận hành. Phương án đã xét: gọi luật ngay trong từng đường rời nhóm (ba chỗ dễ lệch nhau). Đánh đổi: kết quả đến sau; nghiệm thu phải chờ consumer xong.

**D2. Quyết định theo trạng thái lượt ghi danh, từng lớp một.** `processClasses` duyệt các lượt nguồn nhóm ở lớp nhóm vừa rời hoặc tổ tiên có chảy xuống (`:371-445`): `READY_TO_LEARN` gỡ khỏi lớp theo luồng gỡ học viên hiện có; `IN_PROGRESS`/`COMPLETED` giữ và gom lại. Phương án đã xét: quyết theo người (trái BR-19.5, một khoá dở làm kẹt các khoá chưa học).

**D3. Nguồn nhiều nhóm quyết định gỡ hay giữ.** `removeGroupSources` bớt nhóm vừa rời và tổ tiên khỏi mảng `group_source_ids` của lượt khi nhóm đó không còn bao trùm người đó (`:465`); chỉ khi mảng rỗng mới coi là hết nguồn và mới xét gỡ, nên "nhóm khác còn giao" tự động giữ lượt (BR-3.7, BR-19.7). Phụ thuộc quyết định D4 của change `class-group-content-assignment`.

**D4. Chống gửi trùng bằng một câu lệnh nguyên tử.** `left_notified_at` chỉ đặt được một lần cho một lượt thành viên (`WHERE left_notified_at IS NULL`, `:208-213`) và mail chỉ phát cho lần xử lý đặt được; xử lý lại hay song song không gửi thêm. Phương án đã xét: cờ trong bộ nhớ hoặc khoá phân tán (không sống qua khởi động lại, thêm hạ tầng). Đánh đổi: nếu gửi lỗi sau khi đặt cờ thì không gửi lại tự động; code chỉ ghi log. Cần PO hoặc Tech PIC xác nhận có chấp nhận (xem Risks).

**D5. Người nhận tính theo thứ bậc, loại người rời nhóm trước.** `resolveMailRecipients` đặt quản lý chính ở `to` và các quản lý nhóm vừa rời ở `cc`, bỏ chính người rời và tài khoản `BLOCKED`; rỗng thì đi lên quản lý của tổ tiên gần nhất khác họ, hết cây thì quản trị viên (`:288-331`). Dùng cùng bộ phân giải quản lý với change `user-account-group-supervisors` (`resolveGroupManagers`) thay vì tự dựng cây.

## Risks / Trade-offs

- **[Email không gửi lại nếu lỗi sau khi đặt `left_notified_at`]** → Có thể làm một trường hợp "trôi đi mà không ai nhận", trái BR-20.4. Task đo hành vi khi dịch vụ mail lỗi; **cần người dùng hoặc Tech PIC quyết** có thêm cơ chế gửi lại hay chấp nhận, vì đổi nghiệm thu `Một email cho một lần rời nhóm`.
- **[Đường dẫn hồ sơ: v0.6 mọi email, code chỉ mail quản trị viên]** → Lý do ngầm là quản lý chưa chắc vào được UpLMS Ops. Chốt cùng quyết định "quản lý vào Ops thế nào" của change `user-account-group-supervisors`; sửa requirement `Email MAIL-GRP-01 báo quản lý` nếu đổi.
- **[`READY_TO_LEARN` so với "chưa có hoạt động học"]** → Hai định nghĩa có thể lệch ở ca biên (đã mở nhưng chưa ghi hoạt động). Test các ca biên trước khi tin.
- **[Gỡ khỏi lớp xoá tiến độ không khôi phục được]** → Chỉ áp cho khoá chưa có hoạt động học nên không mất tiến độ; tuy vậy cần test để khoá đã có hoạt động không bao giờ rơi vào nhánh tự gỡ.
- **[Hai tác vụ nghiệm thu còn mở ở `lms-be` (19.3, 19.4)]** → Cùng phạm vi; ghi chéo để không làm hai lần.
- **[Chưa có codekb]** → Chạy `/comet-codekb` cho `lms-be` trước `/comet-build`.

## Migration Plan

Cột `left_notified_at`, mail type và template đã có trên staging; change này không thêm migration trừ khi một task chênh cần. Luật chạy khi tenant bật giao nội dung (lần bật thứ hai của `group_feature_settings`), vì trước đó chưa có lượt nguồn nhóm để xử lý. Hoàn tác là tắt cờ; lượt ghi danh đã gỡ khoá chưa học không khôi phục được nhưng đó là các khoá chưa có hoạt động học.
