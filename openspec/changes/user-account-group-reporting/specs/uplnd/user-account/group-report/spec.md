# Spec Delta

## Purpose

Cho nhân sự vận hành xem số liệu học cộng dồn theo nhóm và theo cả nhánh ngay trong chi tiết nhóm trên UpLMS Ops, ở thời điểm hiện tại hoặc tại một mốc quá khứ, để báo cáo theo cơ cấu tổ chức và để báo cáo cũ luôn ra đúng con số đã chốt.

## ADDED Requirements

### Requirement: Tab Báo cáo trong chi tiết nhóm
Chi tiết nhóm SHALL có tab *Báo cáo* với ô chọn *Mốc thời gian* mặc định *Hiện tại*, ô *Xem theo* gồm *Thành viên*, *Nhóm con*, *Khoá* mặc định *Thành viên*, và ba danh sách có phân trang. Dashboard hiện có SHALL không đổi và không có bộ lọc nhóm.

#### Scenario: Mở tab lần đầu
- **WHEN** người vận hành mở tab *Báo cáo* của một nhóm
- **THEN** màn hiện danh sách *Thành viên* ở mốc *Hiện tại* và có thể chuyển sang *Nhóm con* hoặc *Khoá*

#### Scenario: Danh sách dài
- **WHEN** một danh sách có nhiều hơn một trang
- **THEN** danh sách được phân trang

#### Scenario: Dashboard không đổi
- **WHEN** người vận hành mở dashboard
- **THEN** dashboard không có bộ lọc nhóm

### Requirement: Phạm vi thành viên của báo cáo
Số liệu của một nhóm SHALL gồm toàn bộ người ở nhánh con của nó và SHALL NOT có công tắc bật tắt nhánh con. Mỗi người SHALL được đếm một lần dù thuộc nhiều nhóm trong nhánh.

#### Scenario: Nhóm cha
- **WHEN** người vận hành xem báo cáo của nhóm cha có hai nhóm con
- **THEN** số liệu gồm thành viên của nhóm cha và của cả hai nhóm con

#### Scenario: Người ở hai nhóm con
- **WHEN** một người là thành viên của cả hai nhóm con
- **THEN** người đó chỉ được đếm một lần ở số liệu của nhóm cha

### Requirement: Báo cáo theo thành viên
Danh sách *Thành viên* SHALL hiện mỗi người một dòng gồm họ tên, nhóm của họ trong nhánh, số khoá có nghĩa vụ, hoàn thành, đang học, quá hạn, chưa bắt đầu và tiến độ trung bình.

#### Scenario: Nhóm cha
- **WHEN** xem danh sách theo thành viên của một nhóm cha
- **THEN** danh sách gồm thành viên của mọi nhóm con, mỗi người một dòng và cột *Nhóm* là nhóm của người đó

### Requirement: Báo cáo theo nhóm con
Danh sách *Nhóm con* SHALL chỉ gồm các nhóm con trực tiếp của nhóm đang xem. Mỗi dòng SHALL cộng dồn cả nhánh của nhóm con đó và hiện số người có nghĩa vụ, hoàn thành, tỉ lệ hoàn thành, quá hạn, chưa bắt đầu và tiến độ trung bình.

#### Scenario: Nhóm có nhóm con
- **WHEN** nhóm đang xem có ba nhóm con trực tiếp, mỗi nhóm con lại có nhóm cháu
- **THEN** danh sách có đúng ba dòng, mỗi dòng cộng dồn cả nhánh của nhóm con đó

#### Scenario: Nhóm không có nhóm con
- **WHEN** nhóm đang xem không có nhóm con
- **THEN** danh sách trống và ghi rõ nhóm không có nhóm con

### Requirement: Báo cáo theo khoá
Danh sách *Khoá* SHALL hiện mỗi dòng một khoá và lớp gồm số người có nghĩa vụ, hoàn thành, tỉ lệ hoàn thành, quá hạn và chưa bắt đầu, tính trên người trong phạm vi nhóm đang xem.

#### Scenario: Khoá được giao cho nhánh
- **WHEN** một lớp được giao cho một nhóm trong nhánh và có lượt ghi danh của người trong phạm vi
- **THEN** lớp đó có một dòng trong danh sách theo khoá

#### Scenario: Nhánh chưa giao lớp nào
- **WHEN** không nhóm nào trong nhánh được giao lớp, hoặc nhánh không có thành viên
- **THEN** các danh sách trả trống thay vì báo lỗi

### Requirement: Trạng thái lượt ghi danh trong chỉ số
Mỗi lượt ghi danh SHALL thuộc đúng một trạng thái: *Hoàn thành* nếu đã hoàn thành khoá; *Quá hạn* nếu chưa hoàn thành mà hạn học đã qua; *Đang học* nếu đã có hoạt động học, chưa hoàn thành, chưa quá hạn; *Chưa bắt đầu* nếu chưa có hoạt động học nào. Số *có nghĩa vụ* SHALL bằng tổng bốn trạng thái.

#### Scenario: Bốn trạng thái loại trừ nhau
- **WHEN** một danh sách có 100 lượt ghi danh
- **THEN** tổng số hoàn thành, quá hạn, đang học và chưa bắt đầu bằng 100

#### Scenario: Quá hạn khác chưa bắt đầu
- **WHEN** một lượt chưa có hoạt động học nào nhưng hạn học đã qua
- **THEN** lượt đó tính là *Quá hạn*, không tính là *Chưa bắt đầu*

### Requirement: Loại tài khoản kiểm thử và người đã nghỉ việc
Báo cáo SHALL NOT tính tài khoản kiểm thử ở mọi chỉ số, ở cả chế độ hiện tại và quá khứ. Chế độ *Hiện tại* SHALL loại người đã nghỉ việc.

#### Scenario: Chế độ hiện tại
- **WHEN** nhóm có một tài khoản kiểm thử và một người đã nghỉ việc, xem ở mốc *Hiện tại*
- **THEN** cả hai không được tính ở bất kỳ danh sách nào

### Requirement: Báo cáo tại mốc quá khứ
Khi người dùng chọn một ngày trong quá khứ, cả ba danh sách SHALL tính theo danh sách thành viên và trạng thái học tại ngày đó, gồm cả người sau này đã nghỉ việc nếu lúc đó họ còn làm. Chạy lại cùng mốc SHALL cho đúng số cũ dù sau đó có người mới vào, có người nghỉ việc hay đổi trạng thái học.

#### Scenario: Người sau này nghỉ việc
- **WHEN** quý 3 chốt "48/55 hoàn thành" rồi tháng 10 có 7 người nghỉ việc, mở lại báo cáo mốc cuối quý 3
- **THEN** báo cáo vẫn ra 48/55, không ra 41/48

#### Scenario: Chạy lại cùng mốc
- **WHEN** sau khi xem mốc T, hệ thống thêm một thành viên mới, một người nghỉ việc và đổi trạng thái học của một lượt, rồi người dùng xem lại mốc T
- **THEN** ba danh sách ra đúng số như lần xem trước

### Requirement: Giới hạn của mốc thời gian
Ngày sớm nhất chọn được SHALL là ngày bật tính năng và mốc quá khứ SHALL trước hôm nay. Hệ thống SHALL từ chối mốc ngoài khoảng đó và SHALL cho giao diện biết ngày sớm nhất để không cho chọn.

#### Scenario: Mốc trước ngày bật
- **WHEN** người dùng chọn ngày trước ngày bật tính năng
- **THEN** ngày đó không chọn được trên giao diện và request với ngày đó bị từ chối

#### Scenario: Mốc từ hôm nay trở đi
- **WHEN** request gửi mốc là hôm nay hoặc ngày trong tương lai
- **THEN** hệ thống từ chối, vì xem hôm nay dùng chế độ *Hiện tại*

### Requirement: Tính toán không chặn giao diện
Hệ thống SHALL tính báo cáo ở backend và SHALL phản hồi cho nhóm lớn (nhiều cấp, hàng trăm người) mà không chặn giao diện của người dùng khác.

#### Scenario: Nhóm gốc lớn
- **WHEN** người vận hành xem báo cáo của nhóm gốc có hàng trăm người qua nhiều cấp
- **THEN** trang đầu của danh sách trả về, phần còn lại tải khi phân trang
