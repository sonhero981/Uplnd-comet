# Spec Delta

## Purpose

Cho nhân sự vận hành gán người quản lý cho nhóm học viên và chỉ định quản lý chính trên hồ sơ học viên, để hệ thống biết ai phụ trách ai: quản lý kế thừa theo cây, nhóm trống quản lý được cảnh báo, phụ trách chuyển được từ người này sang người khác, và người được gán được báo bằng email.

## ADDED Requirements

### Requirement: Gán nhiều quản lý cho nhóm
Hệ thống SHALL cho người có quyền gán người phụ trách gán một hoặc nhiều người làm quản lý của một nhóm `Đang dùng`. Một nhóm SHALL có nhiều quản lý và một người SHALL quản lý nhiều nhóm ở nhiều nhánh.

#### Scenario: Gán nhiều người
- **WHEN** người vận hành gán hai người làm quản lý của nhóm `Growth 1`
- **THEN** cả hai hiện ở tab *Người phụ trách* với nguồn quan hệ là gán trực tiếp

#### Scenario: Quản lý nhiều nhóm
- **WHEN** một người đã quản lý nhóm A được gán thêm làm quản lý nhóm B ở nhánh khác
- **THEN** quan hệ ở nhóm A giữ nguyên

### Requirement: Ai được chọn làm quản lý
Ô chọn người quản lý SHALL chỉ liệt kê tài khoản học viên đang hoạt động. Tài khoản kiểm thử, tài khoản trả lời bình luận và tài khoản đã khoá SHALL NOT xuất hiện.

#### Scenario: Tìm người để gán
- **WHEN** người vận hành tìm theo tên hoặc email trong ô chọn quản lý
- **THEN** kết quả chỉ gồm tài khoản học viên đang hoạt động

### Requirement: Một người nhiều vai trong một nhóm
Quản lý SHALL là tài khoản học viên của chính người đó. Trong một nhóm, một người SHALL được đồng thời là quản lý, mentor và thành viên; gán hay gỡ vai này SHALL NOT gỡ vai khác. Người quản lý SHALL không tự động thành mentor và ngược lại.

#### Scenario: Thành viên được gán quản lý
- **WHEN** người vận hành gán làm quản lý một người đang là thành viên của chính nhóm đó
- **THEN** người đó giữ tư cách thành viên và lượt ghi danh, và khi gỡ vai quản lý họ không bị gỡ khỏi nhóm

#### Scenario: Quản lý không thành mentor
- **WHEN** một người được gán làm quản lý của nhóm
- **THEN** người đó không tự trở thành mentor của nhóm

### Requirement: Gán quản lý cho nhóm đồng bộ
Hệ thống SHALL cho gán quản lý cho cả nhóm nguồn `Đồng bộ`, vì đó là dữ liệu của UpLnD chứ không của hệ thống nhân sự.

#### Scenario: Nhóm đồng bộ
- **WHEN** người vận hành gán quản lý cho nhóm nguồn `Đồng bộ`
- **THEN** thao tác thành công như với nhóm tự tạo

### Requirement: Quản lý kế thừa theo cây
Nhóm chưa gán quản lý SHALL kế thừa toàn bộ quản lý của nhóm cha gần nhất có quản lý, đi ngược lên tối đa tới nhóm gốc. Quan hệ kế thừa SHALL được tính khi đọc và SHALL NOT lưu thành dữ liệu riêng.

#### Scenario: Hiển thị kế thừa
- **WHEN** nhóm chưa gán quản lý và nhóm cha gần nhất có quản lý
- **THEN** tab *Người phụ trách* hiện quản lý đó kèm dòng *Kế thừa từ nhóm `<tên nhóm cha>`*

#### Scenario: Gán riêng thì ngừng kế thừa
- **WHEN** người vận hành bấm *Gán riêng cho nhóm này* và gán một người
- **THEN** nhóm ngừng kế thừa toàn bộ, khối kế thừa biến mất, kể cả khi nhóm cha có nhiều quản lý hơn

#### Scenario: Đổi quản lý của nhóm cha
- **WHEN** người vận hành đổi quản lý của nhóm cha
- **THEN** mọi nhóm con đang kế thừa hiện quản lý mới ở lần mở kế tiếp, không cần thao tác ở nhóm con

### Requirement: Nhóm trống quản lý
Hệ thống SHALL coi nhóm là trống quản lý khi không có ai gán trực tiếp và không kế thừa được từ nhánh trên. Danh sách nhóm SHALL gắn nhãn *Chưa có quản lý* và có bộ lọc *Chỉ nhóm chưa có quản lý*. Cảnh báo SHALL chỉ hiển thị và SHALL NOT chặn thao tác nào.

#### Scenario: Nhóm trống quản lý
- **WHEN** không nhóm nào trên nhánh, tính tới nhóm gốc, có quản lý
- **THEN** nhóm mang nhãn *Chưa có quản lý* và bộ lọc *Chỉ nhóm chưa có quản lý* trả về nhóm đó

#### Scenario: Nhóm kế thừa được
- **WHEN** nhóm kế thừa được quản lý từ nhóm cha
- **THEN** nhóm không có nhãn *Chưa có quản lý*

#### Scenario: Cảnh báo không chặn
- **WHEN** nhóm mang nhãn *Chưa có quản lý*
- **THEN** mọi thao tác trên nhóm vẫn làm được

### Requirement: Quản lý chính trên hồ sơ học viên
Hệ thống SHALL cho chỉ định tối đa một quản lý chính đích danh cho mỗi học viên ở khối *Quản lý* của hồ sơ. Quản lý chính SHALL đứng đầu mọi loại quản lý nhưng SHALL NOT đổi phạm vi dữ liệu: xem được một người thì xem toàn bộ dữ liệu học của họ, bất kể loại quản lý.

#### Scenario: Thay quản lý chính
- **WHEN** người vận hành chỉ định quản lý chính cho học viên đã có quản lý chính
- **THEN** nút hiện *Thay quản lý chính*, người cũ bị thay và học viên không bao giờ có hai quản lý chính

#### Scenario: Thứ tự hiển thị
- **WHEN** người vận hành mở Overview của hồ sơ học viên
- **THEN** khối *Quản lý* xếp quản lý chính đầu tiên với nhãn riêng, rồi quản lý theo nhóm, rồi quản lý kế thừa, và khối *Nhóm đang thuộc* hiện đường dẫn từ gốc của từng nhóm hoặc *Chưa thuộc nhóm nào*

#### Scenario: Cùng thấy dữ liệu
- **WHEN** một người là quản lý chính của học viên và người khác là quản lý theo nhóm
- **THEN** cả hai thấy cùng toàn bộ dữ liệu học của học viên đó

### Requirement: Quản lý chính là dữ liệu của UpLnD
Quan hệ quản lý chính SHALL là dữ liệu của UpLnD và SHALL NOT vướng ràng buộc thông tin học viên không sửa được trên Ops. Hệ thống SHALL ghi nhật ký mỗi lần gán, thay hoặc gỡ quản lý chính.

#### Scenario: Học viên đồng bộ từ nhân sự
- **WHEN** người vận hành chỉ định quản lý chính cho học viên có thông tin đồng bộ từ hệ thống nhân sự
- **THEN** thao tác thành công và nhật ký ghi lần gán

#### Scenario: Gỡ chỉ định
- **WHEN** người vận hành gỡ quản lý chính
- **THEN** học viên chỉ còn quản lý theo nhóm và nhật ký ghi lần gỡ

### Requirement: Chuyển toàn bộ phụ trách
Hệ thống SHALL cho chuyển toàn bộ quan hệ quản lý và mentor của một người sang người thay thế bằng một thao tác, có bước xem trước. Hộp xác nhận SHALL hiện số nhóm, số người bị ảnh hưởng và người nhận. Việc chuyển SHALL NOT đụng quản lý chính gắn trên hồ sơ từng người và SHALL ghi nhật ký: từ ai sang ai, bao nhiêu nhóm, lúc nào.

#### Scenario: Chuyển từ A sang B
- **WHEN** người vận hành chuyển toàn bộ phụ trách từ A sang B sau bước xem trước và xác nhận
- **THEN** B nhận mọi quan hệ quản lý và mentor của A và quản lý chính gắn trên hồ sơ học viên không đổi

#### Scenario: Nhật ký
- **WHEN** việc chuyển hoàn tất
- **THEN** nhật ký ghi từ ai sang ai, bao nhiêu nhóm, lúc nào

### Requirement: Email MAIL-GRP-02
Hệ thống SHALL gửi email `MAIL-GRP-02` cho người được gán trực tiếp làm quản lý của một nhóm, người nhận chuyển phụ trách và người được chỉ định quản lý chính, mỗi người một email riêng. Hệ thống SHALL NOT gửi khi quan hệ kế thừa, khi người đó đã là quản lý của chính nhóm đó, khi gỡ chỉ định quản lý chính, hoặc khi gán hay chuyển mentor.

#### Scenario: Gán hai người một lần
- **WHEN** người vận hành gán trực tiếp hai người trong một thao tác
- **THEN** mỗi người nhận một email ghi nhóm, người gán, thời điểm, số người trong nhánh gồm nhóm con và đường dẫn tới màn theo dõi nhánh, và nhóm con kế thừa quan hệ đó không gửi thêm

#### Scenario: Chuyển phụ trách gộp
- **WHEN** B nhận chuyển 5 nhóm, trong đó B đã quản lý sẵn 2 nhóm
- **THEN** B nhận đúng một email liệt 3 nhóm mới; nếu B đã quản lý sẵn mọi nhóm được chuyển thì không có email nào

#### Scenario: Chỉ định quản lý chính
- **WHEN** người vận hành chỉ định hoặc thay quản lý chính
- **THEN** chỉ người mới được chỉ định nhận một email cho hồ sơ đó; gỡ chỉ định hoặc chỉ định lại chính người đang là quản lý chính thì không có email

#### Scenario: Gán mentor
- **WHEN** người vận hành gán hoặc chuyển mentor
- **THEN** không có email `MAIL-GRP-02` nào được gửi
