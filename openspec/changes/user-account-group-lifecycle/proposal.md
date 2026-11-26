# Proposal

PRD: LMS-F002

Nguồn: PRD `261005-group` v0.6 (`inception/prd/prd.md`, approved 2026-10-22), Unit U6 (US19, US20). Change 6/6 của batch `lms-f002-group` (`.comet/batches/lms-f002-group.json`), phụ thuộc `class-group-content-assignment` (luật đứng, nguồn lượt ghi danh) và `user-account-group-hr-sync` (người điều chuyển, nghỉ việc theo đồng bộ). PRD ghi U6 không release độc lập được: cần cả đồng bộ lẫn luật đứng mới có tình huống để xử lý.

## Why

Có nhóm và luật đứng rồi thì người rời nhóm (bị gỡ tay, điều chuyển, nghỉ việc) để lại các lượt ghi danh nhận qua nhóm cũ. Áp một luật cho cả ba trường hợp sẽ hoặc mất dữ liệu học, hoặc chặn việc hợp lệ: gỡ hết thì người đang học dở mất tiến độ không khôi phục được; giữ hết thì người chưa học vẫn nằm trong lớp của phòng cũ. Vì vậy phải tách theo từng khoá: **chưa học** thì hệ thống tự gỡ (không cần hỏi ai), **đang học dở hoặc đã học xong** thì hệ thống không tự quyết mà báo cho người quyết, và **nghỉ việc** thì chỉ đánh dấu, không xoá, vì báo cáo được tính ra từ dữ liệu (xoá lượt là xoá chính thứ báo cáo đọc).

## What Changes

- **Xét từng khoá khi người rời nhóm (US19, US20):** hai luật áp cho từng khoá nhận qua nhóm cũ, không áp cho cả người.
- **Tự gỡ khoá chưa học (US19):** khoá chưa có hoạt động học nào, nhận qua nhóm cũ, thì tự gỡ khỏi lớp, ghi nhật ký với lý do `Điều chuyển`; khoá thêm tay giữ nguyên. Sau đó nếu người đó vào nhóm mới thì luật đứng của nhóm mới chạy bình thường.
- **Giữ lượt khi nhóm khác còn giao (US19):** nếu người đó vẫn là thành viên của một nhóm khác đang giao đúng lớp, không gỡ, lượt ghi danh giữ nguyên với nguồn là nhóm còn lại, nhật ký có dòng *Giữ lại vì nhóm `<tên nhóm>` vẫn giao*.
- **Báo quản lý khi còn nghĩa vụ học (US20):** khoá đang học dở hoặc đã học xong thì không tự gỡ, lượt ghi danh giữ nguyên tới khi có người xử lý, và hệ thống gửi một email `MAIL-GRP-01` gộp mọi khoá còn lại, kèm tình trạng từng khoá, đường dẫn hồ sơ và câu cảnh báo cố định về việc gỡ khỏi lớp sẽ xoá tiến độ.
- **Người nhận email:** quản lý chính ở dòng người nhận và các quản lý khác đồng gửi; không có quản lý chính thì mọi quản lý theo nhóm; không có quản lý nào thì quản trị viên hệ thống. Không bao giờ gửi cho chính người rời nhóm: bỏ họ rồi lên quản lý của nhóm cha gần nhất, hết cây thì quản trị viên.
- **Nghỉ việc:** lượt ghi danh giữ nguyên trạng thái đã kết thúc, không bị xoá, không gửi email.

## Ngoài phạm vi

- Người vận hành xem trước rồi mới cho gỡ tự động; hoàn tác một lần gỡ tự động.
- Nút xử lý ngay trong email, nhắc lại sau N ngày nếu quản lý chưa xử lý, gửi cho L&D.
- Chức năng chuyển lớp (hệ thống chưa có: muốn chuyển thì gỡ khỏi lớp cũ, thêm vào lớp mới, học lại từ đầu) và hộp xác nhận gỡ học viên khỏi lớp bên chức năng Lớp (Vấn đề tồn đọng #6 của PRD, thuộc chức năng Lớp).
- Nội dung chữ cuối cùng của template email (BA hoặc vận hành soạn); BE cung cấp sự kiện và dữ liệu.

## Capabilities

### New Capabilities
- `uplnd/user-account/group-member-leave`: xử lý từng khoá khi người rời nhóm (tự gỡ khoá chưa học, giữ khoá còn nghĩa vụ, giữ lượt khi nhóm khác còn giao, nghỉ việc) và email `MAIL-GRP-01` báo quản lý, gồm người nhận và quy tắc gửi (US19, US20).

### Modified Capabilities

Không có. `openspec/specs/` chưa có capability nào.

## Impact

- **Hiện trạng cần biết trước khi làm:** phần lớn đã có trên `origin/staging`, nên change này đối chiếu rồi chỉ làm phần chênh.
  - `lms-be`: `libs/modules/src/lib/group/leave/group-leave.service.ts` (`process` xét từng lớp, `processClasses`, `removeGroupSources`, `notifyManagers`, `resolveMailRecipients`), consumer `apps/event-processor-service/src/app/group-member-left.handler.ts` (topic `process_group_member_left`), mail type `GROUP_MEMBER_LEFT_WITH_PROGRESS` và template `apps/notification-service/src/assets/templates/group/group_member_left_with_progress.mjml`, cột `group_user_instances.left_notified_at`.
  - Hai tác vụ nghiệm thu còn mở ở `lms-be:upbase-221100-group`: 19.3 (rời nhóm, điều chuyển, nghỉ việc và `MAIL-GRP-01`) và 19.4 (nhập tệp gỡ có người đang học) chạm trực tiếp phạm vi này.
  - Không có thao tác FE: kết quả thấy qua nhật ký thành viên và hồ sơ người học. Quản lý xử lý bằng chức năng Lớp hiện có.
- **Lệch PRD v0.6 và v0.11 draft:** người nhận bỏ tài khoản `BLOCKED`, mail gửi quản lý không có đường dẫn hồ sơ (chỉ mail gửi quản trị viên có), kết quả nhập tệp có số người đã báo quản lý; xem `design.md`.
- **Repo bị chạm:** chỉ `lms-be`.
- **Module:** User (`user-account`) vì xử lý bắt đầu từ sự kiện rời nhóm của thành viên; `openspec/products.yaml` đăng ký capability khi archive.

## Repos

- lms-be: xử lý sự kiện rời nhóm theo từng lớp, chọn người nhận, gửi `MAIL-GRP-01` một lần cho mỗi lần rời nhóm.
