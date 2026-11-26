# Proposal

PRD: LMS-F002

Nguồn: PRD `261005-group` v0.6 (`inception/prd/prd.md`, approved 2026-10-22), Unit U4 (US9, US10, US11, US12, US13) và U5 (US16, US17). Change 5/6 của batch `lms-f002-group` (`.comet/batches/lms-f002-group.json`), phụ thuộc `user-account-group-foundation`.

## Why

Quản lý trực tiếp hiện không có công cụ nào để xem tiến độ học của riêng những người mình phụ trách, vì hệ thống không biết ai quản lý ai (mục tiêu O3). Dự án Gamification cũng đang chờ chức năng này cho bộ lọc theo nhóm. Quan hệ người với nhóm gồm ba thứ khác nhau: **quản lý** (xem và theo dõi), **mentor** (đi theo nhóm vào lớp và chấm bài) và **quản lý chính** (đích danh trên hồ sơ, cho người báo cáo chéo nhánh). Gom chúng chung một change vì cùng đọc một quan hệ, cùng gửi một loại email (`MAIL-GRP-02`), và màn theo dõi nhánh chỉ có nghĩa khi quan hệ quản lý đã có.

## What Changes

- **Quản lý của nhóm (US9, US10, US13):** gán nhiều quản lý cho một nhóm, một người quản lý nhiều nhóm; kế thừa từ nhóm cha gần nhất khi nhóm chưa gán (tính lúc đọc); gán riêng thì ngừng kế thừa; nhóm trống quản lý có nhãn và bộ lọc, không chặn thao tác; chuyển toàn bộ phụ trách (quản lý và mentor) từ người này sang người khác, có xem trước, không đụng quản lý chính.
- **Quản lý chính trên hồ sơ học viên (US11):** tối đa một người, đứng đầu mọi loại quản lý, không đổi phạm vi dữ liệu; là dữ liệu của UpLnD nên gán được dù thông tin học viên đồng bộ từ nhân sự.
- **Mentor của nhóm (US12):** mentor gắn vào nhóm, tự thành mentor trong lớp nhóm được giao và chỉ phụ trách người đến từ nhóm đó; mentor đầu tiên của lớp là người chịu trách nhiệm chính; gỡ mentor khỏi nhóm gỡ khỏi lớp do quan hệ đó sinh ra, không đụng mentor thêm tay.
- **Email `MAIL-GRP-02`:** gửi người được gán quản lý trực tiếp, người nhận chuyển phụ trách (một email gộp, chỉ liệt nhóm mới), người được chỉ định quản lý chính; không gửi khi kế thừa hay gán mentor.
- **Màn theo dõi nhánh trên UpLMS Ops (US16):** danh sách người trong toàn bộ nhánh mình phụ trách, sắp theo số khoá quá hạn giảm dần, lọc theo nhóm và có/không quá hạn, phân trang, đọc theo quan hệ quản lý chứ không theo vai trò hệ thống.
- **Khối *Quản lý của tôi* trên UpLMS cho học viên (US17):** liệt kê quản lý, quản lý chính đứng đầu, chỉ ảnh, tên, email; học viên không thấy mình thuộc nhóm nào.

## Ngoài phạm vi

- Phân quyền chi tiết giữa các quản lý trong một nhóm; quản lý tự nhận nhóm; quản lý tự giao bài hay sửa thời hạn học của người mình phụ trách.
- Chặn tự chấm bài: tạm cho phép người vừa là mentor vừa là thành viên tự chấm bài của mình (rủi ro đã chấp nhận ở PRD).
- Chỉ định nhiều quản lý chính, chỉ định hàng loạt bằng tệp, tự chọn người thay thế khi chuyển phụ trách, chuyển một phần danh sách.
- Phân công mentor theo từng người trong nhóm (mentor chỉ gắn vào nhóm).
- Xuất danh sách ra tệp, nhắn tin cho quản lý, báo cáo cộng dồn (change `user-account-group-reporting`), email khi người rời nhóm (change `user-account-group-lifecycle`).

## Capabilities

### New Capabilities
- `uplnd/user-account/group-managers`: gán và kế thừa quản lý của nhóm, nhóm trống quản lý, quản lý chính trên hồ sơ học viên, chuyển toàn bộ phụ trách, email `MAIL-GRP-02` (US9, US10, US11, US13).
- `uplnd/user-account/group-mentors`: mentor gắn nhóm, đi theo nhóm vào lớp, phụ trách đúng người từ nhóm, người chịu trách nhiệm chính, gỡ mentor (US12).
- `uplnd/user-account/group-branch-tracking`: màn theo dõi nhánh của quản lý trên UpLMS Ops, phạm vi đọc theo quan hệ quản lý (US16).
- `uplnd/user-account/learner-managers`: khối *Quản lý của tôi* cho học viên trên UpLMS (US17).

### Modified Capabilities

Không có. `openspec/specs/` chưa có capability nào.

## Impact

- **Hiện trạng cần biết trước khi làm:** phần lớn đã có trên `origin/staging`, nên change này đối chiếu rồi chỉ làm phần chênh.
  - `lms-be`: `apps/ops/src/groups/relations/` (quản lý, mentor), `apps/ops/src/groups/user-relations/` (quản lý chính, chuyển phụ trách), `apps/ops/src/groups/tracking/` (màn theo dõi nhánh và cờ `is_group_manager`, `is_group_mentor`), `libs/modules/src/lib/group/{manager,mentor-class,ops-access,scope}/`, `GET /me/managers` ở `apps/lms/src/users/users.controller.ts`, cột `users.primary_manager_user_id`, mail type `GROUP_RESPONSIBILITY_ASSIGNED`.
  - `ops-fe`: `features/group/src/components/groups/tabs/SupervisorsTab.tsx`, `AssignSupervisorModal/`, `TransferResponsibilitiesModal/`, `components/student/` (khối quản lý và chuyển phụ trách trên hồ sơ học viên), `components/myTeam/` và `pages/my-team/`.
  - `lms-fe`: khối `MyManagers` đã có trong `@lms/feature-user`, gắn ở `apps/lms-pro/src/app/[page]/page.tsx`, gọi `GET /users/me/managers`.
- **Lệch PRD v0.6 và v0.11 draft** (cách người được gán vào UpLMS Ops, tài khoản `BLOCKED`, chặn tự gán): xem `design.md`.
- **Repo bị chạm:** `lms-be`, `ops-fe`, `lms-fe`. Không chạm `lms-package`.
- **Module:** User (`user-account`) vì quan hệ quản lý và mentor gắn với người dùng; `openspec/products.yaml` đăng ký bốn capability khi archive.

## Repos

- lms-be: API quản lý, mentor, quản lý chính, chuyển phụ trách, theo dõi nhánh, quản lý của học viên, email.
- ops-fe: tab Người phụ trách, hồ sơ học viên (quản lý chính, nhóm đang thuộc, chuyển phụ trách), màn My Team.
- lms-fe: khối *Quản lý của tôi* trong hồ sơ học viên.
