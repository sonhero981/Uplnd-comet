# Spec Delta

## Purpose

Quy định luật đứng ghi danh qua nhóm: ai thuộc nhóm được giao một lớp thì có lượt ghi danh ở lớp đó, người vào nhóm sau tự nhận khi công tắc bật, và luật này luôn theo luật của Lớp, không có ngoại lệ riêng cho đường đi qua nhóm.

## ADDED Requirements

### Requirement: Luật đứng ghi danh
Giao lớp cho nhóm SHALL là một luật đứng chứ không phải sao chép danh sách một lần: ai thuộc nhóm được giao lớp thì vào lớp. Luật SHALL chạy nền ở ba thời điểm: lúc giao lớp, lúc có người vào nhóm khi công tắc *Tự ghi danh* bật, và lúc bật công tắc.

#### Scenario: Lúc giao
- **WHEN** lớp được giao cho nhóm có 55 thành viên
- **THEN** các thành viên hiện tại vào lớp mà không chặn giao diện

#### Scenario: Người vào nhóm khi công tắc bật
- **WHEN** công tắc *Tự ghi danh* của một lớp đang bật và có người vào nhóm bằng thêm tay, nhập tệp hoặc đồng bộ
- **THEN** người đó tự vào lớp

#### Scenario: Người vào nhóm khi công tắc tắt
- **WHEN** công tắc đang tắt và có người vào nhóm
- **THEN** người đó không tự vào lớp, người vận hành phải thêm tay

### Requirement: Giao không hồi tố
Luật đứng SHALL NOT ghi danh người đã rời nhóm trước thời điểm giao.

#### Scenario: Người đã rời nhóm
- **WHEN** một người rời nhóm vào ngày 1 và lớp được giao cho nhóm vào ngày 5
- **THEN** người đó không vào lớp

### Requirement: Một người một lượt ghi danh
Hệ thống SHALL tạo tối đa một lượt ghi danh cho một người ở một lớp, dù người đó được thêm tay, thuộc nhóm được giao lớp, hoặc thuộc nhiều nhóm cùng giao lớp.

#### Scenario: Vừa thêm tay vừa thuộc nhóm
- **WHEN** một người đã được thêm tay vào lớp rồi thuộc nhóm được giao lớp đó
- **THEN** người đó vẫn chỉ có một lượt ghi danh

#### Scenario: Hai nhóm cùng kích hoạt song song
- **WHEN** hai nhóm cùng giao một lớp và cùng lúc ghi danh một người thuộc cả hai
- **THEN** chỉ có một lượt ghi danh được tạo

### Requirement: Nguồn của lượt ghi danh
Hệ thống SHALL ghi lại nguồn của lượt ghi danh sinh qua nhóm để phân biệt với lượt thêm tay. Một lượt SHALL có thể có nhiều nhóm nguồn khi nhiều nhóm cùng giao một lớp, mỗi nhóm là một nguồn.

#### Scenario: Phân biệt với thêm tay
- **WHEN** một lớp có người được thêm tay và người được ghi danh qua nhóm
- **THEN** hai loại lượt phân biệt được bằng nguồn

#### Scenario: Hai nhóm là hai nguồn
- **WHEN** hai nhóm cùng giao một lớp cho cùng một người
- **THEN** lượt ghi danh duy nhất của người đó có cả hai nhóm làm nguồn

### Requirement: Luật đứng theo luật của Lớp
Luật đứng SHALL tuân theo luật của Lớp. Hệ thống SHALL chỉ ghi danh vào lớp đang nhận học viên và SHALL NOT có ngoại lệ riêng cho đường đi qua nhóm.

#### Scenario: Lớp đã kết thúc
- **WHEN** luật đứng chạy nền gặp lớp đã kết thúc
- **THEN** không ai được thêm vào lớp, hệ thống không báo lỗi cho ai và ghi một dòng vào nhật ký

### Requirement: Vượt sức chứa không chặn
Hệ thống SHALL vẫn ghi danh khi số học viên vượt sức chứa của lớp. Tab *Học viên* của lớp SHALL hiện một dòng ở đầu danh sách *Lớp này giới hạn N học viên, hiện có M người* và SHALL NOT hiện thông báo tức thời hay hộp xác nhận.

#### Scenario: Lớp đầy
- **WHEN** lớp giới hạn 50 học viên đã có 50 người và nhóm 10 người được giao lớp
- **THEN** cả 10 người vẫn vào lớp và tab *Học viên* hiện *Lớp này giới hạn 50 học viên, hiện có 60 người*

#### Scenario: Chưa vượt
- **WHEN** số học viên chưa vượt sức chứa hoặc lớp không đặt sức chứa
- **THEN** tab *Học viên* không hiện dòng cảnh báo

### Requirement: Lớp có Foundation
Khi một lớp có lớp Foundation gắn kèm, người vào lớp chính qua nhóm SHALL vào cả lớp Foundation, theo hành vi sẵn có của Lớp.

#### Scenario: Lớp chính có Foundation
- **WHEN** nhóm 55 người được giao một lớp có Foundation
- **THEN** mỗi người có một lượt ở lớp chính và một lượt ở Foundation, tổng 110 lượt

### Requirement: Bỏ qua tài khoản kiểm thử
Luật đứng SHALL bỏ qua tài khoản kiểm thử ở mọi bước.

#### Scenario: Tài khoản kiểm thử trong nhóm
- **WHEN** một tài khoản kiểm thử nằm trong nhóm được giao lớp
- **THEN** tài khoản đó không có lượt ghi danh và không được tính vào số người sẽ vào lớp

### Requirement: Nhóm lưu trữ dừng luật đứng
Khi nhóm bị lưu trữ, luật đứng SHALL ngừng chạy và không ai mới vào lớp qua nhóm đó. Lượt ghi danh đã sinh SHALL không đổi.

#### Scenario: Lưu trữ nhóm đang tự ghi danh
- **WHEN** nhóm có công tắc *Tự ghi danh* bật bị lưu trữ, rồi luật đứng được kích hoạt lại cho nhóm đó
- **THEN** không ai mới vào lớp qua nhóm, lượt ghi danh đã sinh không đổi và người đang học dở vẫn học bình thường
