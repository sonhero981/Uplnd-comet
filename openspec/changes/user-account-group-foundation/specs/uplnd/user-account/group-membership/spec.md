# Spec Delta

## Purpose

Cho nhân sự vận hành quản lý thành viên của nhóm học viên trên UpLMS Ops, thêm và gỡ thủ công hoặc theo tệp, đồng thời lưu mọi lần vào và ra nhóm kèm thời điểm và lý do để tra nhật ký và làm nền dựng lại thành viên tại một mốc quá khứ cho báo cáo.

## ADDED Requirements

### Requirement: Một người thuộc nhiều nhóm
Hệ thống SHALL cho một người là thành viên của nhiều nhóm cùng lúc, ở nhiều nhánh khác nhau.

#### Scenario: Thêm người đang thuộc nhóm khác
- **WHEN** người vận hành thêm vào nhóm B một người đang là thành viên nhóm A
- **THEN** người đó trở thành thành viên của cả A và B

### Requirement: Loại tài khoản kiểm thử
Hệ thống SHALL NOT cho tài khoản kiểm thử xuất hiện ở bất kỳ màn thành viên nào của nhóm, kể cả khi bật mọi bộ lọc và trong ô tìm kiếm khi thêm thành viên, và SHALL NOT cho thêm tài khoản đó vào nhóm.

#### Scenario: Tìm người để thêm
- **WHEN** người vận hành tìm người để thêm vào nhóm bằng tên, mã nhân viên hoặc email của một tài khoản kiểm thử
- **THEN** tài khoản đó không có trong kết quả

#### Scenario: Danh sách thành viên
- **WHEN** người vận hành bật mọi bộ lọc ở tab Thành viên
- **THEN** tài khoản kiểm thử vẫn không hiện

### Requirement: Danh sách thành viên của nhóm
Hệ thống SHALL hiện tab Thành viên với các cột họ tên, mã nhân viên, email, phòng ban, ngày vào nhóm, trạng thái tài khoản; lọc theo trạng thái tài khoản và theo vào trực tiếp hay thuộc nhánh con. Mặc định SHALL ẩn người đã nghỉ việc và có công tắc *Hiện cả người đã nghỉ*.

#### Scenario: Mặc định ẩn người nghỉ việc
- **WHEN** người vận hành mở tab Thành viên
- **THEN** người đã nghỉ việc không hiện cho đến khi bật công tắc *Hiện cả người đã nghỉ*

#### Scenario: Lọc vào trực tiếp
- **WHEN** người vận hành lọc *vào trực tiếp*
- **THEN** bảng chỉ hiện người được gắn thẳng vào nhóm này, không hiện người của nhóm con

### Requirement: Tìm học viên để thêm vào nhóm
Hệ thống SHALL tìm học viên theo họ tên, mã nhân viên hoặc email, hiện tối đa 20 kết quả mỗi lần và tải thêm khi cuộn. Người đã ở trong nhóm SHALL hiện mờ kèm nhãn *Đã trong nhóm* và không chọn lại được.

#### Scenario: Người đã trong nhóm
- **WHEN** kết quả tìm kiếm có người đã là thành viên của nhóm
- **THEN** dòng đó hiện mờ với nhãn *Đã trong nhóm* và không chọn được

#### Scenario: Cuộn tải thêm
- **WHEN** có hơn 20 kết quả và người dùng cuộn tới cuối danh sách
- **THEN** hệ thống tải thêm kết quả tiếp theo

### Requirement: Thêm thành viên thủ công
Hệ thống SHALL cho người có quyền quản lý nhóm thêm một hoặc nhiều học viên có tài khoản vào nhóm `Tự tạo` đang `Đang dùng`. Hệ thống SHALL ghi mỗi người được thêm vào nhật ký thành viên với lý do `Thêm tay`.

#### Scenario: Thêm nhiều người
- **WHEN** người vận hành chọn 3 học viên và xác nhận thêm
- **THEN** cả 3 trở thành thành viên và có 3 dòng nhật ký `Vào nhóm`, lý do `Thêm tay`, kèm thời điểm

#### Scenario: Nhóm đồng bộ hoặc đã lưu trữ
- **WHEN** nhóm có nguồn `Đồng bộ` hoặc trạng thái `Lưu trữ`
- **THEN** nút Thêm và Gỡ không hiện (nhóm đồng bộ hiện *Thành viên nhóm này do hệ thống nhân sự quyết định*) và request thêm hoặc gỡ bị từ chối

### Requirement: Gỡ thành viên thủ công
Hệ thống SHALL cho người có quyền quản lý nhóm gỡ một hoặc nhiều thành viên trực tiếp khỏi nhóm `Tự tạo` đang `Đang dùng`, ghi nhật ký `Rời nhóm` với lý do `Thêm tay`, và SHALL NOT xoá dòng lịch sử vào nhóm của họ.

#### Scenario: Gỡ người chưa học khoá nào
- **WHEN** người vận hành gỡ một người chưa học khoá nào giao qua nhóm này
- **THEN** người đó rời nhóm và nhật ký có dòng `Rời nhóm`, lý do `Thêm tay`; việc gỡ khỏi các lớp chưa học do luật vòng đời nhân sự xử lý

#### Scenario: Gỡ người thuộc nhánh con
- **WHEN** người vận hành chọn gỡ một người chỉ thuộc một nhóm con của nhóm này
- **THEN** hệ thống không gỡ người đó ở nhóm này, vì chỉ gỡ được thành viên trực tiếp

### Requirement: Xem trước khi gỡ thành viên
Hệ thống SHALL hiện hộp xác nhận trước khi gỡ, nêu số người sẽ gỡ và, nếu có người đang học dở hoặc đã học xong nội dung giao qua nhóm này, cảnh báo trước.

#### Scenario: Có người đang học dở
- **WHEN** trong số người sắp gỡ có người đang học dở một lớp giao qua nhóm
- **THEN** hộp xác nhận cảnh báo trước việc người đó vẫn rời nhóm nhưng lượt ghi danh được giữ nguyên

### Requirement: Gỡ người còn nghĩa vụ học
Hệ thống SHALL vẫn gỡ người có khoá đang học dở hoặc đã học xong khỏi nhóm, SHALL giữ nguyên lượt ghi danh của họ, và SHALL ghi nhận sự kiện rời nhóm để luật vòng đời nhân sự quyết định việc báo cho quản lý.

#### Scenario: Gỡ người đang học dở
- **WHEN** người vận hành gỡ một người đang học dở một lớp giao qua nhóm
- **THEN** người đó rời nhóm, lượt ghi danh ở lớp đó không bị gỡ, và sự kiện rời nhóm kèm lý do được ghi nhận

#### Scenario: Gỡ người đã nghỉ việc
- **WHEN** người vận hành gỡ một người đã nghỉ việc khỏi nhóm
- **THEN** người đó rời nhóm và lượt ghi danh của họ giữ nguyên trạng thái đã kết thúc, không bị xoá

### Requirement: Nhập thành viên theo tệp
Hệ thống SHALL cho thêm hoặc gỡ thành viên bằng một tệp `.csv` hoặc `.xlsx` mỗi lần, sau khi người dùng chọn hành động *Thêm vào nhóm* hoặc *Gỡ khỏi nhóm*. Hệ thống SHALL cung cấp tệp mẫu `.xlsx` có tiêu đề cột và một dòng ví dụ. Xử lý SHALL chạy nền, không chặn giao diện.

#### Scenario: Tải tệp mẫu
- **WHEN** người dùng bấm *Tải tệp mẫu*
- **THEN** người dùng nhận tệp `.xlsx` có sẵn tiêu đề cột và một dòng ví dụ

#### Scenario: Chưa chọn hành động
- **WHEN** người dùng chưa chọn *Thêm vào nhóm* hoặc *Gỡ khỏi nhóm*
- **THEN** hệ thống không cho tải tệp lên

#### Scenario: Sai định dạng hoặc nhiều tệp
- **WHEN** người dùng chọn tệp không phải `.csv` hoặc `.xlsx`, hoặc chọn hai tệp cùng lúc
- **THEN** hệ thống báo lỗi ngay và không tải lên

#### Scenario: Gỡ qua tệp người đang học dở
- **WHEN** tệp gỡ có người đang học dở
- **THEN** người đó vẫn rời nhóm và được xử lý như khi gỡ thủ công

### Requirement: Kết quả và log của lần nhập tệp
Hệ thống SHALL xử lý từng dòng độc lập: dòng hợp lệ thành công, dòng lỗi không chặn dòng còn lại. Hệ thống SHALL báo *Đã xử lý N dòng: thành công X, lỗi Y* kèm nút *Xem log*, và log SHALL nêu mỗi dòng lỗi gồm số dòng trong tệp, giá trị đã nhập và lý do ở cột riêng. Hệ thống SHALL phân biệt ba loại lỗi: không tìm thấy người, người đã ở trong nhóm, tài khoản kiểm thử.

#### Scenario: Tệp lẫn dòng hợp lệ và dòng lỗi
- **WHEN** tệp thêm 10 dòng trong đó 3 dòng lỗi
- **THEN** 7 dòng thành công được thêm vào nhóm, kết quả báo *Đã xử lý 10 dòng: thành công 7, lỗi 3* và log liệt kê đúng 3 dòng lỗi

#### Scenario: Ba loại lỗi
- **WHEN** tệp có một người không tìm thấy, một người đã trong nhóm và một tài khoản kiểm thử
- **THEN** log ghi ba lý do riêng biệt cho ba dòng đó

#### Scenario: Ghi nhật ký dòng thành công
- **WHEN** một dòng trong tệp xử lý thành công
- **THEN** nhật ký thành viên có dòng tương ứng với lý do `Nhập tệp`

### Requirement: Lịch sử vào và ra nhóm
Hệ thống SHALL lưu mỗi lần một người vào hoặc ra khỏi một nhóm kèm thời điểm, lý do (`Thêm tay`, `Nhập tệp`, `Đồng bộ`, `Nghỉ việc`, `Điều chuyển`) và người thao tác. Hệ thống SHALL NOT xoá lịch sử này, kể cả khi người đó nghỉ việc hoặc nhóm bị lưu trữ, và SHALL đủ để dựng lại ai thuộc nhóm nào tại một mốc quá khứ.

#### Scenario: Người rời rồi vào lại
- **WHEN** một người bị gỡ khỏi nhóm rồi được thêm lại sau đó
- **THEN** lịch sử có hai lượt riêng, mỗi lượt có thời điểm vào và ra của nó

#### Scenario: Nhóm lưu trữ
- **WHEN** nhóm bị lưu trữ
- **THEN** toàn bộ lịch sử vào ra của nhóm vẫn còn

#### Scenario: Dựng lại thành viên tại mốc quá khứ
- **WHEN** hệ thống cần danh sách thành viên của nhóm tại ngày T trong quá khứ
- **THEN** danh sách dựng được chỉ từ lịch sử, gồm cả người sau đó đã rời nhóm hoặc nghỉ việc

### Requirement: Nhật ký thay đổi thành viên
Hệ thống SHALL cho tra nhật ký thay đổi thành viên với các cột thời điểm, người bị thay đổi, nhóm, hành động (`Vào nhóm` hoặc `Rời nhóm`), lý do và người thao tác; lọc theo khoảng thời gian, nhóm, người, lý do; mặc định dòng mới nhất lên đầu. Nhật ký SHALL chỉ đọc và SHALL giữ toàn bộ, không giới hạn thời gian, không dọn.

#### Scenario: Dòng do đồng bộ
- **WHEN** một dòng nhật ký do đồng bộ tự ghi
- **THEN** cột người thao tác hiện *Hệ thống*

#### Scenario: Lọc theo khoảng thời gian
- **WHEN** người dùng lọc một khoảng thời gian bất kỳ kể từ ngày bật tính năng
- **THEN** nhật ký trả đủ mọi dòng trong khoảng đó, không thiếu dòng cũ

#### Scenario: Không sửa, không xoá
- **WHEN** người dùng xem một dòng nhật ký
- **THEN** không có thao tác sửa hay xoá, và request sửa hoặc xoá dòng bị từ chối

#### Scenario: Đổi tên nhóm không vào nhật ký
- **WHEN** một nhóm đổi tên
- **THEN** nhật ký thành viên không có dòng mới

#### Scenario: Lối vào có lọc sẵn
- **WHEN** người dùng vào nhật ký từ chi tiết một nhóm, hoặc từ hồ sơ một học viên
- **THEN** bộ lọc nhóm hoặc bộ lọc người đã chọn sẵn nhóm hoặc người đó

### Requirement: Quyền xem nhật ký thành viên
Hệ thống SHALL tách quyền xem nhật ký thành viên khỏi quyền quản lý nhóm.

#### Scenario: Không có quyền xem nhật ký
- **WHEN** người không có quyền xem nhật ký thành viên mở nhật ký
- **THEN** hệ thống từ chối với lỗi không đủ quyền
