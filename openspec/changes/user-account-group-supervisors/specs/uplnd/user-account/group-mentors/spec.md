# Spec Delta

## Purpose

Cho nhân sự vận hành gán mentor cho nhóm học viên để mentor đi theo nhóm vào lớp và phụ trách đúng những người đến từ nhóm đó, mà không ảnh hưởng tới mentor được thêm tay vào lớp.

## ADDED Requirements

### Requirement: Gán mentor cho nhóm
Hệ thống SHALL cho người có quyền gán người phụ trách gán một hoặc nhiều mentor cho nhóm `Đang dùng`. Ô chọn SHALL chỉ liệt kê tài khoản học viên đang hoạt động. Việc gán mentor SHALL NOT gửi email nào.

#### Scenario: Tìm mentor
- **WHEN** người vận hành tìm mentor để gán cho nhóm
- **THEN** kết quả chỉ gồm tài khoản học viên đang hoạt động và việc gán không gửi email

#### Scenario: Nhóm đồng bộ
- **WHEN** người vận hành gán mentor cho nhóm nguồn `Đồng bộ`
- **THEN** thao tác thành công như với nhóm tự tạo

### Requirement: Mentor đi theo nhóm vào lớp
Khi một nhóm có mentor được giao một lớp, mentor của nhóm SHALL tự thành mentor trong lớp đó. Tab *Mentor* của lớp SHALL có cột *Phụ trách nhóm* ghi tên nhóm; mentor thêm tay SHALL để trống cột này.

#### Scenario: Giao lớp cho nhóm có mentor
- **WHEN** nhóm có mentor được giao một lớp
- **THEN** mentor xuất hiện ở tab *Mentor* của lớp với cột *Phụ trách nhóm* là tên nhóm

#### Scenario: Mentor thêm tay
- **WHEN** một mentor được thêm tay vào lớp
- **THEN** cột *Phụ trách nhóm* của mentor đó để trống

### Requirement: Mentor chỉ phụ trách người đến từ nhóm
Mentor đến từ nhóm SHALL chỉ phụ trách những người đến từ nhóm đó chứ không phụ trách cả lớp. Một lớp nhận nhiều nhóm SHALL có nhiều mentor, mỗi người phụ trách phần của mình. "Phụ trách" SHALL là cách giao việc, không chặn quyền: bài của người từ nhóm A mặc định giao cho mentor của nhóm A, và mentor chính của lớp vẫn xem được mọi bài và giao lại.

#### Scenario: Lớp nhận hai nhóm
- **WHEN** lớp nhận nhóm A và nhóm B, mỗi nhóm một mentor
- **THEN** tab *Mentor* có hai dòng, bài của người từ nhóm A mặc định giao cho mentor nhóm A và bài của người từ nhóm B cho mentor nhóm B

#### Scenario: Mentor chính giao lại
- **WHEN** mentor chính của lớp muốn giao một bài sang mentor khác
- **THEN** mentor chính xem được mọi bài và giao lại được, việc giao mặc định không đè bài đã giao lại

### Requirement: Mentor đầu tiên là người chịu trách nhiệm chính
Mentor đầu tiên được thêm vào lớp SHALL là người chịu trách nhiệm chính, và người vận hành SHALL đổi được nhãn này sang mentor khác.

#### Scenario: Lớp chưa có mentor
- **WHEN** lớp chưa có mentor và nhóm đầu tiên được giao
- **THEN** mentor của nhóm đó mang nhãn người chịu trách nhiệm chính và người vận hành đổi được sang mentor khác

### Requirement: Gỡ mentor khỏi nhóm
Gỡ mentor khỏi nhóm SHALL gỡ họ khỏi các lớp mà quan hệ đó sinh ra. Mentor đã được thêm tay vào lớp từ trước SHALL không bị gỡ, và mentor thêm tay SHALL không bị ảnh hưởng bởi thay đổi ở nhóm.

#### Scenario: Gỡ mentor nhóm
- **WHEN** người vận hành gỡ mentor khỏi nhóm
- **THEN** mentor bị gỡ khỏi các lớp sinh ra từ quan hệ này

#### Scenario: Mentor vừa thêm tay vừa theo nhóm
- **WHEN** mentor đó đã được thêm tay vào lớp từ trước
- **THEN** mentor không bị gỡ khỏi lớp đó

#### Scenario: Mentor còn thuộc nhóm khác đang giao lớp
- **WHEN** mentor còn là mentor của một nhóm khác cũng đang giao đúng lớp đó
- **THEN** mentor vẫn ở lại lớp

### Requirement: Mentor vào UpLMS Ops bằng danh tính học viên
Mentor của nhóm SHALL là tài khoản học viên của chính người đó. Khi đăng nhập UpLMS Ops, tài khoản này SHALL chỉ thấy màn chấm bài của các lớp mình là mentor và SHALL không thấy màn quản trị khác. Danh sách mentor của lớp và danh sách người chấm SHALL nhận tài khoản học viên.

#### Scenario: Mentor đăng nhập Ops
- **WHEN** mentor đăng nhập UpLMS Ops bằng danh tính học viên của mình
- **THEN** mentor chỉ thấy màn chấm bài của các lớp mình là mentor

### Requirement: Mentor tự chấm bài của mình
Người vừa là mentor vừa là thành viên của cùng một lớp SHALL tạm được tự chấm bài của mình; hệ thống SHALL NOT chặn việc này ở đợt này.

#### Scenario: Mentor cũng là học viên của lớp
- **WHEN** một mentor cũng là thành viên của lớp mình làm mentor
- **THEN** bài của chính họ có trong danh sách chấm và họ chấm được
