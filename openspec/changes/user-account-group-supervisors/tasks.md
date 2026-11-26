# Tasks

Mọi path code đọc từ `origin/staging` của từng repo. Báo cáo đối chiếu ghi ở `docs/superpowers/reports/`. Build `lms-be` kiểm bằng `yarn --cwd ../lms-be test` (repo không có script `build`), `ops-fe` bằng `pnpm --dir ../ops-fe build:ops-fe`, `lms-fe` bằng `pnpm --dir ../lms-fe build`. Change này phụ thuộc `user-account-group-foundation`.

## 1. [lms-be] Quản lý, quản lý chính, chuyển phụ trách và email (group-managers)

- [ ] 1.1 Đối chiếu 10 requirement của `uplnd/user-account/group-managers` với `apps/ops/src/groups/relations`, `user-relations` và `libs/modules/src/lib/group/manager`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-managers-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test chứng minh
- [ ] 1.2 Chốt với PO hoặc Tech PIC từng dòng lệch ở bảng Context của `design.md`, trước hết là cách quản lý và mentor vào UpLMS Ops (tài khoản học viên hay staff do quản trị viên tạo), rồi tài khoản `BLOCKED`, chặn tự chỉ định và tự chuyển; ghi quyết định vào `design.md` và sửa các requirement tương ứng ở `group-managers`, `group-mentors`, `group-branch-tracking`; xong khi bảng không còn dòng chưa quyết
- [ ] 1.3 Kiểm kế thừa và nhóm trống quản lý bằng nhóm 4 cấp: nhóm chưa gán kế thừa nhóm cha gần nhất, gán riêng thì ngừng kế thừa, đổi quản lý nhóm cha đổi theo ngay, không ai trên nhánh thì có cờ trống quản lý; xong khi test cho cả bốn ca xanh
- [ ] 1.4 Kiểm một người nhiều vai: thành viên được gán quản lý và mentor của cùng nhóm giữ nguyên lượt ghi danh, gỡ vai này không gỡ vai kia, số thành viên không đếm dòng quản lý hay mentor; xong khi test xanh
- [ ] 1.5 Kiểm quản lý chính và chuyển phụ trách: tối đa một quản lý chính, thay thì người cũ mất, nhật ký mỗi lần gán thay gỡ, chuyển từ A sang B chuyển cả quản lý và mentor, không đụng quản lý chính, ghi nhật ký số nhóm; xong khi test xanh
- [ ] 1.6 Kiểm `MAIL-GRP-02`: gán hai người một lần ra hai email, kế thừa và người đã là quản lý không nhận, chuyển 5 nhóm trong đó 2 nhóm B đã quản lý ra một email liệt 3 nhóm, chuyển không có nhóm mới thì không email, chỉ định/thay quản lý chính gửi người mới, gỡ chỉ định và gán mentor không gửi; xong khi test kiểm đúng số email theo từng ca
- [ ] 1.7 Sửa phần lệch/thiếu đã chốt ở 1.1 và 1.2, mỗi chỗ kèm test tương ứng scenario trong spec; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 2. [lms-be] Mentor của nhóm (group-mentors)

- [ ] 2.1 Đối chiếu 7 requirement của `uplnd/user-account/group-mentors` với `libs/modules/src/lib/group/mentor-class` và `apps/ops/src/groups/relations`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-mentors-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test
- [ ] 2.2 Kiểm mentor đi theo nhóm vào lớp: giao lớp cho nhóm có mentor thêm mentor nguồn `GROUP` vào lớp, mentor đầu tiên mang nhãn chịu trách nhiệm chính, gỡ mentor khỏi nhóm gỡ khỏi lớp trừ mentor thêm tay và mentor còn thuộc nhóm khác đang giao lớp đó; xong khi test xanh cho cả bốn ca
- [ ] 2.3 Kiểm người chấm mặc định: lớp nhận nhóm A và B có hai mentor thì bài của người từ nhóm A giao mentor A, mentor chính giao lại được và lần tính lại sau không đè bài đã giao lại; mentor vừa là học viên của lớp tự chấm bài của mình; xong khi test xanh
- [ ] 2.4 Sửa phần lệch/thiếu đã chốt ở 2.1 và 1.2, mỗi chỗ kèm test; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 3. [lms-be] Theo dõi nhánh và quản lý của học viên (group-branch-tracking, learner-managers)

- [ ] 3.1 Đối chiếu 6 requirement của `group-branch-tracking` và 4 requirement của `learner-managers` với `apps/ops/src/groups/tracking`, `libs/modules/src/lib/group/scope` và `GET /me/managers`, ghi bảng đạt/lệch/thiếu vào `docs/superpowers/reports/group-tracking-be.md`; xong khi mỗi requirement có một dòng kèm `lms-be:path:line` hoặc tên test
- [ ] 3.2 Kiểm phạm vi theo dõi: quản lý nhóm cha thấy người ở mọi nhóm con, người thuộc hai nhánh được cả hai quản lý thấy, học viên nhận mình làm quản lý chính thấy ở nhánh khác, người vừa quản lý một nhóm vừa có vai trò xem toàn công ty chỉ thấy nhánh mình, loại tài khoản kiểm thử và người nghỉ việc; xong khi test xanh cho từng ca
- [ ] 3.3 Kiểm sắp xếp và lọc của `GET /groups/tracking/learners`: mặc định theo số khoá quá hạn giảm dần, lọc theo nhóm và có/không quá hạn, phân trang, hồ sơ một người gồm cả khoá nhận qua nhánh khác; xong khi test xanh và phản hồi phân trang đúng meta
- [ ] 3.4 Kiểm `GET /me/managers`: thứ tự quản lý chính, theo nhóm, kế thừa, mỗi người một lần, chỉ trả họ tên, ảnh, email (không số điện thoại), không lộ nhóm, trả rỗng khi chưa có quản lý; xong khi test xanh
- [ ] 3.5 Sửa phần lệch/thiếu đã chốt ở 3.1 và 1.2, mỗi chỗ kèm test; xong khi `yarn --cwd ../lms-be test` các test mới đều xanh

## 4. [ops-fe] Tab Người phụ trách, hồ sơ học viên và chuyển phụ trách

- [ ] 4.1 Đối chiếu tab *Người phụ trách* (gán quản lý, mentor, nguồn quan hệ gán trực tiếp hay kế thừa, *Gán riêng cho nhóm này*), nhãn *Chưa có quản lý* và bộ lọc, hồ sơ học viên (khối *Nhóm đang thuộc*, khối *Quản lý* xếp chính, theo nhóm, kế thừa, *Chỉ định/Thay quản lý chính*, *Gỡ chỉ định*) và `TransferResponsibilitiesModal` với spec trên app chạy với API staging, ghi bảng đạt/lệch vào `docs/superpowers/reports/group-supervisors-fe.md`; xong khi mỗi requirement có kết quả quan sát được
- [ ] 4.2 Kiểm hộp chuyển phụ trách: bước xem trước hiện số nhóm, số người bị ảnh hưởng, người nhận, và việc chuyển không đổi quản lý chính hiển thị trên hồ sơ từng người; xong khi cả hai ca quan sát được
- [ ] 4.3 Kiểm tab *Mentor* ở chi tiết lớp (`features/class-and-course`) có cột *Phụ trách nhóm* và nhãn người chịu trách nhiệm chính; xong khi quan sát được trên lớp có nhóm và lớp chỉ có mentor thêm tay
- [ ] 4.4 Áp quyết định ở 1.2 cho giao diện (cách quản lý và mentor vào Ops, hiển thị tài khoản `BLOCKED`) và sửa phần lệch/thiếu rồi chạy `pnpm --dir ../ops-fe build:ops-fe`; xong khi build pass và mọi dòng lệch trong báo cáo FE đã đóng hoặc có quyết định hoãn có lý do

## 5. [ops-fe] Màn My Team (theo dõi nhánh)

- [ ] 5.1 Đối chiếu màn My Team (`pages/my-team`, `components/myTeam`, `useTeamAccess`) với spec `group-branch-tracking`, ghi bảng đạt/lệch vào `docs/superpowers/reports/group-my-team-fe.md`; xong khi mỗi requirement có kết quả quan sát được
- [ ] 5.2 Kiểm menu và route chỉ hiện khi `is_group_manager` (và màn chấm bài khi `is_group_mentor`), người không phải quản lý không thấy, bảng đúng cột, sắp xếp mặc định theo số khoá quá hạn, ô chọn nhóm khi quản lý nhiều nhóm, bộ lọc quá hạn, phân trang, không có phần trăm tiến độ từng khoá, hồ sơ một người mở đủ khoá; xong khi chạy đủ các ca với tài khoản quản lý thật trên staging
- [ ] 5.3 Sửa phần lệch/thiếu ở 5.1 và 5.2 theo quyết định ở 1.2 và chạy `pnpm --dir ../ops-fe build:ops-fe`; xong khi build pass và mọi dòng lệch trong báo cáo đã đóng hoặc có quyết định hoãn có lý do

## 6. [lms-fe] Khối Quản lý của tôi (learner-managers)

- [ ] 6.1 Đối chiếu khối `MyManagers` (`@lms/feature-user`) gắn ở `apps/lms-pro/src/app/[page]/page.tsx` với 4 requirement của `learner-managers`: nhiều quản lý, quản lý chính đứng đầu có nhãn, chỉ ảnh/họ tên/email, không số điện thoại, không thông tin nhóm, câu trạng thái rỗng đúng nguyên văn; ghi bảng đạt/lệch vào `docs/superpowers/reports/learner-managers-fe.md`; xong khi mỗi requirement có kết quả quan sát được trên app chạy với API staging
- [ ] 6.2 Sửa phần lệch/thiếu ở 6.1 (nếu có) và chạy `pnpm --dir ../lms-fe build`; xong khi build pass và bảng báo cáo không còn dòng lệch chưa xử lý

## Workflow follow-up

- Chạy `/comet-codekb` cho `lms-be`, `ops-fe`, `lms-fe` trước `/comet-build` (cả ba đang `NO_STORE`).
- Đối chiếu bộ spec của change này với `lms-be:openspec/changes/upbase-221100-group/specs/group/{people-relations,branch-tracking}` và ghi lệch còn lại vào báo cáo verify.
- Khi archive: thêm `group-managers`, `group-mentors`, `group-branch-tracking`, `learner-managers` vào `openspec/products.yaml` (module `user-account`, repo `lms-be`, `ops-fe`, `lms-fe`, feature `LMS-F002`) và chạy `/comet-codekb refresh`.
