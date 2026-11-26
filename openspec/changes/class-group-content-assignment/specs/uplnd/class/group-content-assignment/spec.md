# Spec Delta

## Purpose

Cho nhân sự vận hành giao lớp cho một nhóm học viên trên UpLMS Ops bằng một thao tác, chọn có chảy xuống nhánh con và có tự ghi danh người vào sau hay không, xem trước ai sẽ vào lớp, theo dõi các lớp đã giao và gỡ lớp khỏi nhóm khi chưa có ai học.

## ADDED Requirements

### Requirement: Giao lớp cho nhóm
Hệ thống SHALL cho người có quyền quản lý nhóm giao một hoặc nhiều lớp cho nhóm đang `Đang dùng`. Hệ thống SHALL giao theo lớp, không theo khoá, và SHALL NOT tự tìm lớp theo khoá.

#### Scenario: Giao nhiều lớp
- **WHEN** người vận hành chọn 2 lớp và xác nhận giao cho nhóm `Fulfillment HCM`
- **THEN** cả hai lớp xuất hiện ở tab *Nội dung được giao* của nhóm, và mọi thành viên hiện tại của nhóm vào hai lớp đó

#### Scenario: Nhóm đã lưu trữ
- **WHEN** nhóm ở trạng thái `Lưu trữ`
- **THEN** hệ thống không cho giao lớp mới cho nhóm đó

#### Scenario: Không giao theo khoá
- **WHEN** người vận hành chọn giao nội dung
- **THEN** ô chọn chỉ liệt kê lớp cụ thể, không có lựa chọn khoá

### Requirement: Chỉ giao được lớp đang nhận học viên
Ô chọn lớp SHALL chỉ liệt kê lớp đang nhận học viên, tìm được theo tên lớp và tên khoá. Lớp đã kết thúc SHALL NOT xuất hiện, và yêu cầu giao một lớp đã kết thúc SHALL bị từ chối.

#### Scenario: Tìm lớp
- **WHEN** người vận hành gõ tên khoá vào ô chọn lớp
- **THEN** ô liệt kê các lớp đang nhận học viên của khoá đó

#### Scenario: Lớp đã kết thúc
- **WHEN** một lớp đã kết thúc
- **THEN** lớp không có trong ô chọn và request giao lớp đó bị từ chối

### Requirement: Hai công tắc khi giao
Hộp giao nội dung SHALL có hai công tắc, cả hai mặc định tắt: *Chảy xuống nhánh con* và *Tự ghi danh người vào sau*. Khi *Chảy xuống nhánh con* bật, người ở các nhóm con SHALL cũng vào lớp.

#### Scenario: Mặc định
- **WHEN** người vận hành mở hộp giao nội dung
- **THEN** hai công tắc đều tắt, công tắc *Tự ghi danh người vào sau* hiện chuỗi `New group members will be automatically enrolled to this group's existing course`

#### Scenario: Chảy xuống nhánh con
- **WHEN** giao lớp cho nhóm cha với công tắc *Chảy xuống nhánh con* bật
- **THEN** thành viên của mọi nhóm con vào lớp, và khi tắt công tắc thì chỉ thành viên trực tiếp của nhóm cha vào lớp

### Requirement: Xem trước khi giao
Hệ thống SHALL hiện khối xem trước trước khi xác nhận giao, gồm số người sẽ vào lớp, số người đã có trong lớp và số người bị bỏ qua kèm lý do. Việc xem trước SHALL NOT tạo dữ liệu nào.

#### Scenario: Xem trước có người đã trong lớp
- **WHEN** nhóm có 55 người, 5 người đã được thêm tay vào lớp được chọn và 1 người là tài khoản kiểm thử
- **THEN** khối xem trước hiện 49 người sẽ vào, 5 người đã có trong lớp, 1 người bị bỏ qua kèm lý do

#### Scenario: Chưa xác nhận
- **WHEN** người vận hành xem trước rồi huỷ
- **THEN** không có lượt ghi danh nào được tạo và không có lớp nào được gắn vào nhóm

### Requirement: Danh sách nội dung được giao
Tab *Nội dung được giao* SHALL hiện bảng gồm tên lớp, khoá học, thời hạn lớp, số người đã vào qua nhóm này, ngày giao và trạng thái hai công tắc.

#### Scenario: Số người đã vào qua nhóm này
- **WHEN** một lớp có 30 lượt ghi danh sinh qua nhóm đang xem và 5 lượt thêm tay
- **THEN** cột *Số người đã vào qua nhóm này* hiện 30

### Requirement: Công tắc tự ghi danh theo từng cặp nhóm và lớp
Hệ thống SHALL đặt công tắc *Tự ghi danh* ở từng cặp nhóm với lớp, bật tắt ngay trên dòng của lớp và lưu ngay khi đổi. Đổi công tắc của lớp này SHALL NOT đổi công tắc của lớp khác.

#### Scenario: Hai lớp, hai công tắc
- **WHEN** nhóm được giao lớp A và lớp B, người vận hành tắt công tắc của lớp A
- **THEN** công tắc của lớp B giữ nguyên và thay đổi được lưu ngay

#### Scenario: Bật khi còn người chưa vào lớp
- **WHEN** người vận hành bật công tắc trong lúc nhóm có N người chưa vào lớp
- **THEN** hộp xác nhận hỏi *Nhóm này có N người chưa vào lớp. Ghi danh luôn cho họ?* với hai nút *Ghi danh luôn* và *Chỉ áp dụng cho người vào sau*

#### Scenario: Chọn Ghi danh luôn
- **WHEN** người vận hành chọn *Ghi danh luôn*
- **THEN** N người đó vào lớp

#### Scenario: Chọn Chỉ áp dụng cho người vào sau
- **WHEN** người vận hành chọn *Chỉ áp dụng cho người vào sau*
- **THEN** không ai trong N người đó được thêm, chỉ người vào nhóm từ giờ trở đi tự vào lớp

#### Scenario: Tắt công tắc
- **WHEN** người vận hành tắt công tắc
- **THEN** hộp xác nhận báo *Người gia nhập nhóm từ giờ sẽ không tự vào lớp này. Người đã vào vẫn học bình thường.* và không ai bị gỡ khỏi lớp

### Requirement: Ghi nhật ký đổi công tắc
Hệ thống SHALL ghi mỗi lần đổi trạng thái công tắc tự ghi danh kèm người thao tác và thời điểm.

#### Scenario: Đổi công tắc
- **WHEN** người vận hành bật công tắc của một lớp
- **THEN** nhật ký có một dòng ghi người thao tác, thời điểm và trạng thái mới

### Requirement: Gỡ lớp khỏi nhóm
Hệ thống SHALL chỉ cho gỡ một lớp khỏi nhóm khi chưa có người trong nhóm học lớp đó, tức chưa có hoạt động học nào được ghi nhận ở lớp. Khi đã có người học, nút *Gỡ lớp* SHALL không hiện và request gỡ SHALL bị từ chối.

#### Scenario: Chưa có người học
- **WHEN** nhóm được giao lớp nhưng chưa ai trong nhóm có hoạt động học ở lớp đó
- **THEN** nút *Gỡ lớp* hiện và gỡ được

#### Scenario: Đã có người học
- **WHEN** đã có ít nhất một người trong nhóm học lớp đó
- **THEN** nút *Gỡ lớp* không hiện, thay bằng *Đã có học viên trong lớp này, không gỡ được*, và request gỡ bị từ chối

#### Scenario: Có người học sau khi mở màn
- **WHEN** người vận hành bấm gỡ lớp, nhưng giữa lúc đó đã có người phát sinh hoạt động học
- **THEN** hệ thống kiểm lại điều kiện lúc gỡ và từ chối
