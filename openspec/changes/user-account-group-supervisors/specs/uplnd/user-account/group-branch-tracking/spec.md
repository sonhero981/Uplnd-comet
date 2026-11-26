# Spec Delta

## Purpose

Cho quản lý theo dõi trên UpLMS Ops toàn bộ dữ liệu học của những người trong nhánh mình phụ trách, và chỉ những người đó, đọc theo quan hệ quản lý chứ không theo vai trò hệ thống, để biết ai cần nhắc.

## ADDED Requirements

### Requirement: Màn theo dõi nhánh
Hệ thống SHALL có màn theo dõi nhánh trên UpLMS Ops hiện bảng gồm họ tên, nhóm, số khoá quá hạn, số khoá đang học, số khoá hoàn thành và lần học gần nhất, sắp xếp mặc định theo số khoá quá hạn giảm dần. Bảng SHALL có phân trang và SHALL NOT hiện phần trăm tiến độ từng khoá.

#### Scenario: Mở màn
- **WHEN** quản lý mở màn theo dõi nhánh
- **THEN** bảng hiện người trong nhánh mình phụ trách, người cần chú ý nhất (nhiều khoá quá hạn nhất) lên đầu

#### Scenario: Danh sách dài
- **WHEN** quản lý phụ trách hàng trăm người
- **THEN** danh sách được phân trang

### Requirement: Bộ lọc của màn theo dõi
Màn SHALL có ô chọn nhóm khi quản lý phụ trách nhiều nhóm, mặc định hiện tất cả, và bộ lọc có khoá quá hạn hay không.

#### Scenario: Lọc theo nhóm và quá hạn
- **WHEN** quản lý chọn một nhóm và lọc *có khoá quá hạn*
- **THEN** danh sách chỉ còn người thoả cả hai điều kiện

### Requirement: Phạm vi theo quan hệ quản lý
Màn SHALL hiện người trong toàn bộ nhánh quản lý phụ trách, gồm cả nhóm con, cộng học viên nhận người đó làm quản lý chính. Màn SHALL đọc theo quan hệ quản lý và SHALL NOT đọc theo vai trò hệ thống: người vừa quản lý một nhóm vừa có vai trò xem toàn công ty SHALL chỉ thấy người trong nhánh mình phụ trách.

#### Scenario: Quản lý nhóm cha
- **WHEN** quản lý của một nhóm mở màn
- **THEN** quản lý thấy người của nhóm đó và của mọi nhóm con

#### Scenario: Có vai trò xem toàn công ty
- **WHEN** một người vừa quản lý một nhóm vừa có vai trò xem toàn công ty mở màn này
- **THEN** họ chỉ thấy người trong nhánh mình phụ trách

### Requirement: Xem toàn bộ dữ liệu học của một người
Khi quản lý bấm vào một người, hồ sơ SHALL mở ra với toàn bộ dữ liệu học của người đó, kể cả khoá nhận qua nhánh khác. Người thuộc hai nhánh SHALL được quản lý của cả hai nhánh cùng thấy đủ dữ liệu.

#### Scenario: Người thuộc hai nhánh
- **WHEN** một người thuộc nhánh của quản lý X và nhánh của quản lý Y
- **THEN** cả X và Y cùng thấy toàn bộ dữ liệu học của người đó

#### Scenario: Khoá nhận qua nhánh khác
- **WHEN** quản lý mở hồ sơ một người có khoá nhận qua nhánh khác
- **THEN** hồ sơ hiện cả khoá đó

### Requirement: Loại tài khoản kiểm thử và người nghỉ việc
Màn SHALL NOT hiện tài khoản kiểm thử, và ở chế độ xem hiện tại SHALL NOT hiện người đã nghỉ việc.

#### Scenario: Danh sách hiện tại
- **WHEN** quản lý xem màn theo dõi
- **THEN** danh sách không có tài khoản kiểm thử và không có người đã nghỉ việc

### Requirement: Quản lý vào UpLMS Ops bằng danh tính học viên
Quản lý SHALL đăng nhập UpLMS Ops bằng tài khoản học viên của mình, chính tài khoản đã được gán làm quản lý. Ở UpLMS Ops tài khoản này SHALL chỉ thấy màn theo dõi nhánh, cộng màn chấm bài nếu cũng là mentor. Hệ thống SHALL NOT có bản màn theo dõi nhánh ở portal học viên.

#### Scenario: Quản lý đăng nhập Ops
- **WHEN** quản lý đăng nhập UpLMS Ops bằng tài khoản học viên đã được gán làm quản lý
- **THEN** quản lý chỉ thấy màn theo dõi nhánh

#### Scenario: Người không phải quản lý
- **WHEN** một học viên không phải quản lý của ai đăng nhập UpLMS Ops bằng danh tính học viên
- **THEN** không có mục menu theo dõi nhánh
