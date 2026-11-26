# Spec Delta

## Purpose

Quy định điều xảy ra với các khoá nhận qua nhóm khi một người rời nhóm (bị gỡ, điều chuyển hoặc nghỉ việc): việc đơn giản do hệ thống tự xử lý, việc còn dữ liệu học thì báo cho người quyết bằng email, và không bao giờ mất tiến độ học hay lịch sử.

## ADDED Requirements

### Requirement: Xét từng khoá khi người rời nhóm
Khi một người rời nhóm vì bị gỡ thủ công, nhập tệp gỡ hoặc điều chuyển, hệ thống SHALL xét từng khoá nhận qua nhóm đó. Hai luật tự gỡ và báo quản lý SHALL áp cho từng khoá, không áp cho cả người.

#### Scenario: Hai khoá, hai kết quả
- **WHEN** người rời nhóm có một khoá chưa học và một khoá đang học dở, cả hai nhận qua nhóm cũ
- **THEN** khoá chưa học bị gỡ, khoá đang học dở không bị gỡ và được báo cho quản lý

### Requirement: Tự gỡ khoá chưa học
Khoá nhận qua nhóm cũ mà người đó chưa có hoạt động học nào SHALL được hệ thống tự gỡ khỏi lớp, không hỏi ai. Khoá được thêm tay vào lớp SHALL giữ nguyên.

#### Scenario: Khoá chưa học
- **WHEN** một người rời nhóm và chưa có hoạt động học nào ở một khoá nhận qua nhóm cũ
- **THEN** hệ thống tự gỡ họ khỏi khoá đó mà không hỏi ai

#### Scenario: Khoá thêm tay
- **WHEN** người đó có khoá được thêm tay vào lớp
- **THEN** khoá đó giữ nguyên, không bị gỡ

### Requirement: Nhật ký lần tự gỡ
Mỗi lần hệ thống tự gỡ một khoá SHALL được ghi nhật ký với lý do `Điều chuyển`.

#### Scenario: Ghi nhật ký
- **WHEN** hệ thống tự gỡ một khoá chưa học
- **THEN** nhật ký có dòng ghi lần gỡ với lý do `Điều chuyển`

### Requirement: Luật đứng của nhóm mới chạy bình thường
Sau khi tự gỡ, nếu người đó vào nhóm mới thì luật đứng của nhóm mới SHALL chạy bình thường và người đó vào các lớp nhóm mới đang giao với công tắc tự ghi danh bật.

#### Scenario: Điều chuyển sang nhóm mới
- **WHEN** người đó vào nhóm mới đang giao một lớp với công tắc *Tự ghi danh* bật
- **THEN** người đó vào lớp đó theo luật đứng

### Requirement: Giữ lượt khi nhóm khác còn giao
Trước khi tự gỡ một khoá, hệ thống SHALL kiểm người đó có còn là thành viên của nhóm khác đang giao đúng lớp đó không. Nếu còn, hệ thống SHALL NOT gỡ, SHALL giữ nguyên lượt ghi danh với nguồn là nhóm còn lại, và SHALL ghi nhật ký *Giữ lại vì nhóm `<tên nhóm>` vẫn giao*. Việc này SHALL không sinh email.

#### Scenario: Hai nhóm cùng giao một lớp
- **WHEN** người rời nhóm A nhưng vẫn là thành viên nhóm B, và cả hai nhóm cùng giao lớp L
- **THEN** lượt ghi danh ở L giữ nguyên với nguồn là nhóm B, nhật ký có dòng *Giữ lại vì nhóm B vẫn giao*, và không có email

#### Scenario: Chỉ bớt một nguồn
- **WHEN** người rời một trong hai nhóm nguồn của một lượt
- **THEN** lượt chỉ bớt một nguồn và còn nguyên khi còn nguồn khác

### Requirement: Khoá còn nghĩa vụ học không tự gỡ
Khoá nhận qua nhóm cũ mà người đó đang học dở hoặc đã học xong SHALL NOT bị hệ thống tự gỡ. Lượt ghi danh SHALL giữ nguyên cho tới khi có người xử lý, không treo và không khoá.

#### Scenario: Khoá đang học dở
- **WHEN** người rời nhóm đang học dở một khoá nhận qua nhóm cũ
- **THEN** khoá đó không bị gỡ, lượt ghi danh giữ nguyên và người đó học tiếp bình thường

### Requirement: Người nghỉ việc
Khi người rời nhóm vì nghỉ việc, hệ thống SHALL giữ nguyên lượt ghi danh ở trạng thái đã kết thúc, SHALL NOT xoá và SHALL NOT gửi email.

#### Scenario: Nghỉ việc đang học dở
- **WHEN** một người nghỉ việc đang có khoá học dở nhận qua nhóm
- **THEN** lượt ghi danh giữ nguyên trạng thái đã kết thúc, không bị xoá và không có email nào được gửi

### Requirement: Email MAIL-GRP-01 báo quản lý
Hệ thống SHALL gửi email `MAIL-GRP-01` khi một người rời nhóm mà còn ít nhất một khoá đang học dở hoặc đã học xong nhận qua nhóm đó. Một lần rời nhóm SHALL chỉ gửi một email gộp mọi khoá còn lại. Email SHALL nêu ai rời nhóm nào và sang nhóm nào, danh sách khoá còn lại kèm tình trạng từng khoá, đường dẫn tới hồ sơ người đó và câu cảnh báo cố định *"Gỡ khỏi lớp sẽ xoá tiến độ đã học và không khôi phục được. Giữ nguyên lớp nếu muốn người này học tiếp."*

#### Scenario: Ba khoá đang học
- **WHEN** người rời nhóm còn ba khoá đang học
- **THEN** hệ thống gửi đúng một email liệt kê cả ba khoá kèm tình trạng từng khoá, đường dẫn hồ sơ và câu cảnh báo cố định

#### Scenario: Không bắn
- **WHEN** người rời nhóm chưa học khoá nào, hoặc nghỉ việc, hoặc với khoá đó vẫn thuộc nhóm khác đang giao đúng lớp
- **THEN** không có email nào được gửi cho khoá đó

### Requirement: Người nhận MAIL-GRP-01
Quản lý chính của người rời nhóm SHALL ở dòng người nhận và các quản lý khác ở dòng đồng gửi. Khi không có quản lý chính, mọi quản lý theo nhóm SHALL ở dòng người nhận. Khi không có quản lý nào, quản trị viên hệ thống SHALL nhận email, để không trường hợp nào trôi đi mà không ai nhận.

#### Scenario: Có quản lý chính
- **WHEN** người rời nhóm có quản lý chính và hai quản lý theo nhóm
- **THEN** quản lý chính ở dòng người nhận và hai quản lý kia ở dòng đồng gửi

#### Scenario: Không có quản lý chính
- **WHEN** người rời nhóm không có quản lý chính mà có hai quản lý theo nhóm
- **THEN** cả hai quản lý theo nhóm ở dòng người nhận

#### Scenario: Không có quản lý nào
- **WHEN** không ai quản lý người rời nhóm, kể cả kế thừa
- **THEN** quản trị viên hệ thống nhận email

### Requirement: Không gửi cho chính người rời nhóm
Người rời nhóm SHALL NOT là người nhận email nói về chính mình, kể cả khi họ là quản lý chính hoặc quản lý của nhóm đó. Hệ thống SHALL bỏ họ khỏi danh sách nhận; nếu không còn ai thì gửi quản lý của nhóm cha gần nhất có quản lý khác họ, hết cây thì gửi quản trị viên hệ thống.

#### Scenario: Người rời nhóm là quản lý duy nhất của nhóm
- **WHEN** người rời nhóm A đồng thời là quản lý duy nhất của nhóm A
- **THEN** họ không nhận email, quản lý của nhóm cha gần nhất có quản lý nhận thay

#### Scenario: Hết cây
- **WHEN** không nhóm nào trên nhánh có quản lý khác người rời nhóm
- **THEN** quản trị viên hệ thống nhận email

### Requirement: Một email cho một lần rời nhóm
Mỗi lần rời nhóm SHALL gửi tối đa một `MAIL-GRP-01`, kể cả khi sự kiện rời nhóm được xử lý lại hoặc xử lý song song.

#### Scenario: Xử lý lại
- **WHEN** sự kiện rời nhóm của một lần rời nhóm được xử lý hai lần
- **THEN** chỉ có một email được gửi
