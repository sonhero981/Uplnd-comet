# Spec Delta

## Purpose

Cho học viên thấy ai là quản lý của mình và cách liên hệ ngay trong hồ sơ trên UpLMS, chỉ để xem, không lộ cơ cấu nhóm của học viên.

## ADDED Requirements

### Requirement: Khối Quản lý của tôi
Hồ sơ học viên trên UpLMS SHALL có khối *Quản lý của tôi* liệt kê tất cả quản lý của học viên, không chỉ một người. Quản lý chính SHALL đứng đầu và có nhãn phân biệt với quản lý theo nhóm.

#### Scenario: Một quản lý chính và hai quản lý theo nhóm
- **WHEN** học viên có một quản lý chính và hai quản lý theo nhóm
- **THEN** khối hiện ba người, quản lý chính đứng đầu với nhãn phân biệt

### Requirement: Thông tin hiển thị của quản lý
Mỗi dòng SHALL hiện ảnh đại diện, họ tên và email của quản lý và SHALL NOT hiện số điện thoại.

#### Scenario: Một dòng quản lý
- **WHEN** học viên xem một dòng quản lý
- **THEN** thấy ảnh, họ tên và email, không thấy số điện thoại

### Requirement: Chỉ xem và không lộ cơ cấu
Học viên SHALL chỉ xem được khối này, không sửa được quan hệ quản lý. Khối SHALL NOT cho biết học viên thuộc nhóm nào.

#### Scenario: Mở khối
- **WHEN** học viên mở khối *Quản lý của tôi*
- **THEN** không có thao tác sửa quan hệ quản lý và không có thông tin học viên thuộc nhóm nào

### Requirement: Trạng thái rỗng
Khi học viên không có quản lý nào, khối SHALL hiện dòng *Chưa có thông tin quản lý. Liên hệ bộ phận vận hành nếu cần.*

#### Scenario: Chưa có quản lý
- **WHEN** học viên không có quản lý chính và không thuộc nhóm nào có quản lý
- **THEN** khối hiện *Chưa có thông tin quản lý. Liên hệ bộ phận vận hành nếu cần.*
