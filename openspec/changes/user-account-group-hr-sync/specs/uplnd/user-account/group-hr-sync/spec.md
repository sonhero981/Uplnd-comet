# Spec Delta

## Purpose

Đồng bộ cây phòng ban và thành viên từ hệ thống nhân sự thành các nhóm nguồn `Đồng bộ` trên UpLMS, chạy nền và tự sửa chênh lệch, trong đó hệ thống nhân sự là hệ gốc và UpLnD chỉ đọc, đồng thời không làm mất lịch sử khi người hay phòng ban biến mất khỏi nguồn.

## ADDED Requirements

### Requirement: Dựng nhóm đồng bộ từ cây tổ chức
Mỗi lần đồng bộ, hệ thống SHALL đọc cây phòng ban của hệ thống nhân sự rồi dựng hoặc cập nhật các nhóm tương ứng với nguồn `Đồng bộ`, nhóm cha và nhóm con theo đúng cây của nguồn. Hệ thống SHALL NOT ghi bất kỳ dữ liệu nào ngược về hệ thống nhân sự.

#### Scenario: Cây mới ở nguồn
- **WHEN** hệ thống nhân sự có phòng ban `ECOM` và phòng ban con `Trung tâm vận hành 1` chưa có nhóm tương ứng
- **THEN** đồng bộ tạo hai nhóm nguồn `Đồng bộ`, nhóm con nằm dưới nhóm cha

#### Scenario: Đổi tên hoặc đổi cha ở nguồn
- **WHEN** một phòng ban ở nguồn đổi tên hoặc chuyển sang phòng ban cha khác
- **THEN** lần đồng bộ sau cập nhật nhóm tương ứng theo nguồn

#### Scenario: Không ghi ngược
- **WHEN** đồng bộ chạy
- **THEN** không có yêu cầu ghi nào được gửi tới hệ thống nhân sự

### Requirement: Thành viên ở nhóm sâu nhất
Hệ thống SHALL gắn mỗi người vào nhóm sâu nhất trên nhánh của họ và SHALL NOT gắn vào các nhóm cha trên đường đi. Người thuộc nhiều nhánh SHALL là thành viên của nhiều nhóm sâu nhất, mỗi nhánh một nhóm.

#### Scenario: Người ở nhánh sâu
- **WHEN** một người thuộc `ECOM / Trung tâm vận hành 1 / Growth 1 / Sub-Growth 1`
- **THEN** người đó là thành viên của `Sub-Growth 1`, không phải của ba nhóm cha

#### Scenario: Người thuộc hai nhánh
- **WHEN** một người thuộc hai phòng ban ở hai nhánh khác nhau
- **THEN** người đó là thành viên của hai nhóm sâu nhất, mỗi nhánh một nhóm

### Requirement: Nhóm cha bao trùm nhánh con khi đọc
Ở mọi màn đọc dữ liệu (số thành viên, báo cáo, phạm vi quản lý), nhóm cha SHALL bao trùm toàn bộ người của nhánh con dù quan hệ thành viên chỉ gắn ở nhóm sâu nhất.

#### Scenario: Số thành viên của nhóm cha
- **WHEN** xem số thành viên của nhóm cha mà mọi thành viên chỉ gắn ở nhóm con
- **THEN** số đó gồm người ở mọi nhóm con

### Requirement: Nhóm đồng bộ chỉ đọc về cơ cấu và thành viên
Trên UpLMS Ops, hệ thống SHALL khoá sửa thông tin, thêm hoặc gỡ thành viên, di chuyển và xoá đối với nhóm nguồn `Đồng bộ`; cơ cấu và thành viên chỉ đổi qua hệ thống nhân sự. Nhóm đồng bộ SHALL vẫn nhận nội dung giao, quản lý và mentor, vì đó là dữ liệu của UpLnD.

#### Scenario: Thao tác bị khoá
- **WHEN** người vận hành mở chi tiết nhóm đồng bộ
- **THEN** các nút sửa thông tin, thêm và gỡ thành viên, di chuyển, xoá không hiện và có dòng giải thích

#### Scenario: Việc vẫn làm được
- **WHEN** người vận hành giao nội dung, gán quản lý hoặc gán mentor cho nhóm đồng bộ
- **THEN** thao tác thành công như với nhóm tự tạo

### Requirement: Thông tin nhóm đồng bộ
Chi tiết nhóm đồng bộ SHALL hiện nguồn, lần đồng bộ gần nhất và số thành viên của lần đó. Danh sách nhóm SHALL hiện nhãn nguồn riêng cho nhóm đồng bộ.

#### Scenario: Khối thông tin
- **WHEN** người vận hành mở chi tiết một nhóm đồng bộ đã chạy ít nhất một lần
- **THEN** khối thông tin hiện nguồn `Đồng bộ`, thời điểm đồng bộ gần nhất và số thành viên

#### Scenario: Chưa đồng bộ lần nào
- **WHEN** nhóm đồng bộ chưa có bản ghi đồng bộ nào
- **THEN** lần đồng bộ gần nhất hiện trống thay vì báo lỗi

### Requirement: Người biến mất khỏi nguồn
Khi một người không còn trong nguồn (nghỉ việc), hệ thống SHALL ghi rời nhóm kèm thời điểm với lý do `Nghỉ việc` và SHALL NOT xoá dòng quan hệ, để báo cáo quá khứ đọc được lịch sử.

#### Scenario: Người nghỉ việc
- **WHEN** một người có mặt ở lần đồng bộ trước nhưng không còn ở nguồn ở lần đồng bộ sau
- **THEN** quan hệ thành viên của họ ở mọi nhóm đồng bộ được ghi rời nhóm kèm thời điểm với lý do `Nghỉ việc`, dòng không bị xoá

### Requirement: Người đổi phòng ban
Khi một người đổi sang phòng ban khác ở nguồn, hệ thống SHALL ghi rời nhóm cũ với lý do `Điều chuyển` và vào nhóm sâu nhất mới với lý do `Đồng bộ`, cùng thời điểm đồng bộ.

#### Scenario: Chuyển phòng
- **WHEN** một người chuyển từ `Growth 1` sang `Growth 2` ở nguồn
- **THEN** nhật ký có dòng rời `Growth 1` lý do `Điều chuyển` và dòng vào `Growth 2` lý do `Đồng bộ`, cùng thời điểm

### Requirement: Phòng ban biến mất khỏi nguồn
Khi một phòng ban không còn ở nguồn, hệ thống SHALL chuyển nhóm tương ứng sang `Lưu trữ` và SHALL NOT xoá nhóm hay thành viên của nó.

#### Scenario: Phòng ban bị xoá ở nguồn
- **WHEN** một phòng ban bị xoá ở hệ thống nhân sự
- **THEN** nhóm tương ứng chuyển sang `Lưu trữ`, thành viên và lịch sử giữ nguyên

#### Scenario: Nguồn trả rỗng
- **WHEN** nguồn không trả về phòng ban nào ở một lần đồng bộ toàn bộ
- **THEN** hệ thống không lưu trữ hàng loạt nhóm đồng bộ, trừ khi người vận hành hệ thống yêu cầu rõ ràng

### Requirement: Đồng bộ chạy nền và tự sửa chênh lệch
Đồng bộ SHALL chạy nền, không chặn giao diện và không cần tức thời. Khi một lần đồng bộ lỗi giữa chừng, lần chạy kế tiếp SHALL tự sửa mọi chênh lệch giữa UpLnD và nguồn mà không cần ai dọn tay.

#### Scenario: Đồng bộ lần đầu
- **WHEN** đồng bộ lần đầu chạm 53 nhóm và 384 người cùng lúc
- **THEN** giao diện vẫn dùng được trong lúc đồng bộ chạy

#### Scenario: Lỗi giữa chừng
- **WHEN** một lần đồng bộ dừng sau khi đã cập nhật một phần cây
- **THEN** lần chạy sau đưa cây và thành viên về đúng nguồn, không để lại nhóm hoặc quan hệ lệch

### Requirement: Nhật ký thay đổi thành viên do đồng bộ
Mỗi thay đổi thành viên do đồng bộ gây ra SHALL được ghi nhật ký một dòng với lý do tương ứng và người thao tác là *Hệ thống*.

#### Scenario: Đồng bộ thay đổi thành viên
- **WHEN** đồng bộ thêm hai người vào nhóm và gỡ một người khỏi nhóm khác
- **THEN** nhật ký thành viên có ba dòng, cột người thao tác hiện *Hệ thống*
