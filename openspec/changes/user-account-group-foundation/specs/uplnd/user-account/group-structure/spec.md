# Spec Delta

## Purpose

Cho nhân sự vận hành dựng và duy trì cây nhóm học viên nhiều cấp trên UpLMS Ops: tạo, sửa, di chuyển, lưu trữ, khôi phục, xoá nhóm, xem cây hoặc bảng và tìm kiếm, trong đó nguồn và trạng thái của nhóm quyết định thao tác nào được phép.

## ADDED Requirements

### Requirement: Tạo nhóm
Hệ thống SHALL cho người có quyền quản lý nhóm tạo nhóm với tên (bắt buộc, tối đa 255 ký tự sau khi bỏ khoảng trắng đầu cuối), mã nhóm (bắt buộc), mô tả (tối đa 1000 ký tự) và nhóm cha (không bắt buộc). Nhóm mới luôn có nguồn `Tự tạo` và trạng thái `Đang dùng`; người dùng không chọn được hai giá trị này.

#### Scenario: Tạo nhóm gốc
- **WHEN** người có quyền quản lý nhóm tạo nhóm với tên và mã hợp lệ, để trống nhóm cha
- **THEN** hệ thống tạo nhóm ở cấp gốc với nguồn `Tự tạo` và trạng thái `Đang dùng`

#### Scenario: Request gửi kèm nguồn và trạng thái
- **WHEN** request tạo nhóm cố gửi nguồn `Đồng bộ` hoặc trạng thái `Lưu trữ`
- **THEN** hệ thống bỏ qua hai giá trị đó và tạo nhóm `Tự tạo`, `Đang dùng`

#### Scenario: Tên không hợp lệ
- **WHEN** tên bỏ trống hoặc chỉ có dấu cách, hoặc dài 256 ký tự, hoặc mô tả dài 1001 ký tự
- **THEN** hệ thống từ chối lưu và báo lỗi cho trường tương ứng, riêng tên trống báo *Tên nhóm không được để trống*

#### Scenario: Giá trị đúng ngưỡng
- **WHEN** tên dài đúng 255 ký tự và mô tả dài đúng 1000 ký tự
- **THEN** hệ thống lưu được nhóm

#### Scenario: Không có quyền
- **WHEN** người không có quyền quản lý nhóm gọi thao tác tạo
- **THEN** hệ thống từ chối với lỗi không đủ quyền và không tạo nhóm

### Requirement: Mã nhóm duy nhất và không đổi
Hệ thống SHALL giữ mã nhóm duy nhất trong phạm vi một tổ chức và SHALL NOT cho sửa mã sau khi nhóm đã tạo.

#### Scenario: Mã trùng
- **WHEN** người dùng lưu nhóm với mã đã tồn tại trong tổ chức
- **THEN** hệ thống báo *Mã nhóm đã tồn tại* và không lưu

#### Scenario: Sửa nhóm đã tạo
- **WHEN** người dùng mở form sửa một nhóm `Tự tạo`
- **THEN** ô mã nhóm bị khoá với chú thích *Mã nhóm không thay đổi được*, và request gửi mã khác bị bỏ qua

#### Scenario: Hai tổ chức dùng cùng mã
- **WHEN** hai tổ chức khác nhau mỗi nơi tạo một nhóm có cùng mã
- **THEN** cả hai nhóm được tạo và mỗi tổ chức chỉ thấy nhóm của mình

### Requirement: Sửa thông tin nhóm
Hệ thống SHALL cho sửa tên, mô tả và nhóm cha của nhóm `Tự tạo`. Việc sửa thông tin nhóm SHALL NOT sinh dòng nào trong nhật ký thành viên.

#### Scenario: Đổi tên nhóm
- **WHEN** người có quyền đổi tên một nhóm `Tự tạo`
- **THEN** tên mới được lưu và nhật ký thành viên không có dòng mới

#### Scenario: Nhóm đồng bộ
- **WHEN** người dùng mở chi tiết nhóm nguồn `Đồng bộ`
- **THEN** nút Sửa không hiện, thay bằng dòng *Nhóm này đồng bộ từ hệ thống nhân sự, không chỉnh sửa trên UpLMS*, và request sửa bất kỳ trường nào của nhóm này bị từ chối

### Requirement: Nhóm cha cùng nguồn và đang dùng
Hệ thống SHALL chỉ nhận làm nhóm cha một nhóm cùng nguồn với nhóm con và đang `Đang dùng`. Ô chọn nhóm cha của nhóm `Tự tạo` SHALL chỉ liệt kê nhóm `Tự tạo` đang `Đang dùng`.

#### Scenario: Chọn nhóm cha hợp lệ
- **WHEN** người dùng tạo nhóm con và chọn nhóm cha là nhóm `Tự tạo` đang `Đang dùng`
- **THEN** nhóm con được tạo nằm dưới nhóm cha đó

#### Scenario: Nhóm cha khác nguồn hoặc đã lưu trữ
- **WHEN** request chọn nhóm cha là nhóm `Đồng bộ`, hoặc nhóm `Tự tạo` đang `Lưu trữ`
- **THEN** hệ thống từ chối và không tạo hay sửa nhóm

### Requirement: Cây nhóm không giới hạn số cấp
Hệ thống SHALL NOT giới hạn số cấp của cây nhóm và SHALL NOT có cấu hình số cấp tối đa.

#### Scenario: Nhánh sâu
- **WHEN** người dùng tạo liên tiếp các nhóm con để nhánh sâu 7 cấp trở lên
- **THEN** hệ thống vẫn tạo được và không báo lỗi về số cấp

### Requirement: Di chuyển nhánh
Hệ thống SHALL cho di chuyển một nhóm `Tự tạo` cùng toàn bộ nhánh con sang nhóm cha khác `Tự tạo` đang `Đang dùng`, hoặc ra làm nhóm gốc. Hệ thống SHALL chặn việc di chuyển một nhóm vào chính nó hoặc vào nhánh con của nó.

#### Scenario: Di chuyển hợp lệ
- **WHEN** người có quyền xác nhận di chuyển nhóm `Growth 1` sang nhóm cha `Trung tâm vận hành 2`
- **THEN** nhánh nằm dưới nhóm cha mới, mọi nhóm trong nhánh giữ nguyên thành viên

#### Scenario: Thả vào nhánh con của chính nó
- **WHEN** người dùng di chuyển một nhóm vào chính nó hoặc vào nhóm con của nó
- **THEN** hệ thống chặn và báo *Không thể di chuyển một nhóm vào nhánh con của chính nó*, giao diện hiện vị trí thả viền đỏ

#### Scenario: Nhóm đồng bộ
- **WHEN** người dùng cố di chuyển nhóm nguồn `Đồng bộ`, hoặc chọn nó làm nhóm cha mới của một nhóm khác nguồn
- **THEN** hệ thống từ chối; nhóm đồng bộ không kéo thả được và ô nhóm cha của nó không sửa được

#### Scenario: Nội dung đã giao không đổi
- **WHEN** một nhánh được di chuyển sang nhóm cha mới có nội dung đã giao
- **THEN** nội dung đã giao cho các nhóm trong nhánh không đổi và nội dung giao cho nhóm cha mới không tự áp cho nhánh vừa chuyển

### Requirement: Xem trước và ghi lại lần di chuyển
Hệ thống SHALL hiện hộp xác nhận trước khi di chuyển, gồm tên nhánh, số nhóm con, số người bị ảnh hưởng, nhóm cha cũ và mới. Mỗi lần di chuyển SHALL được ghi lại: nhánh nào, từ đâu sang đâu, ai làm, lúc nào.

#### Scenario: Hộp xác nhận
- **WHEN** người dùng thả một nhóm vào vị trí hợp lệ
- **THEN** vị trí thả hiện viền xanh và hộp xác nhận hiện đủ năm thông tin kèm nút *Di chuyển* và *Huỷ*

#### Scenario: Ghi lần di chuyển
- **WHEN** người dùng xác nhận di chuyển
- **THEN** hệ thống ghi một dòng gồm nhánh, nhóm cha cũ, nhóm cha mới, người thao tác và thời điểm

### Requirement: Lưu trữ và khôi phục nhóm
Hệ thống SHALL cho lưu trữ nhóm đang `Đang dùng`: nhóm và toàn bộ nhánh con chuyển sang `Lưu trữ`, thành viên và lịch sử giữ nguyên, luật đứng ngừng thêm người mới qua nhóm. Hệ thống SHALL cho khôi phục nhóm `Lưu trữ` về `Đang dùng`.

#### Scenario: Lưu trữ nhóm có nhánh con
- **WHEN** người dùng lưu trữ một nhóm có nhóm con
- **THEN** hộp xác nhận nêu số thành viên, số lớp đang giao, số nhóm bị lưu trữ theo và hệ quả; sau xác nhận nhóm cùng cả nhánh con chuyển sang `Lưu trữ`

#### Scenario: Dữ liệu giữ nguyên
- **WHEN** một nhóm đã lưu trữ
- **THEN** danh sách thành viên và lịch sử không đổi, lượt ghi danh đã sinh không đổi, người đang học dở học tiếp bình thường, và nhóm vẫn xuất hiện trong nhật ký

#### Scenario: Khôi phục
- **WHEN** người dùng bấm *Khôi phục* ở nhóm `Lưu trữ`
- **THEN** nhóm về trạng thái `Đang dùng`

### Requirement: Xoá nhóm
Hệ thống SHALL chỉ cho xoá nhóm chưa từng có thành viên và chưa từng được giao nội dung. Nhóm đã có một trong hai SHALL chỉ lưu trữ được.

#### Scenario: Nhóm tạo nhầm
- **WHEN** nhóm chưa từng có thành viên và chưa từng giao nội dung
- **THEN** nút Xoá hiện và xoá được nhóm

#### Scenario: Nhóm đã có lịch sử
- **WHEN** nhóm đã từng có thành viên hoặc đã từng được giao nội dung, kể cả khi hiện không còn ai
- **THEN** nút Xoá không hiện, màn hiện *Nhóm đã có lịch sử, chỉ lưu trữ được*, và request xoá bị từ chối

### Requirement: Danh sách nhóm dạng cây
Hệ thống SHALL hiện danh sách nhóm mặc định ở dạng Cây, mở đầu chỉ có các nhóm gốc đã gấp, và SHALL chỉ tải nhánh người dùng vừa mở. Màn SHALL nhớ dạng xem (Cây hoặc Bảng) người dùng chọn gần nhất.

#### Scenario: Mở lần đầu
- **WHEN** người dùng mở danh sách nhóm lần đầu
- **THEN** dạng Cây hiện các nhóm gốc ở trạng thái gấp, mỗi dòng gồm tên nhóm, số thành viên và nhãn nguồn nếu là nhóm đồng bộ

#### Scenario: Mở một nhánh
- **WHEN** người dùng mở một nhánh
- **THEN** chỉ nhóm con của nhánh đó được tải

#### Scenario: Nhớ dạng xem
- **WHEN** người dùng chuyển sang dạng Bảng rồi mở lại màn sau đó
- **THEN** màn hiện dạng Bảng

### Requirement: Danh sách nhóm dạng bảng
Hệ thống SHALL hiện dạng Bảng với các cột tên nhóm, mã, nguồn, số thành viên, người quản lý, trạng thái, cập nhật lần cuối; lọc kết hợp theo nguồn, cấp, trạng thái, người quản lý; sắp xếp theo tên, số thành viên, ngày cập nhật; phân trang mặc định 20 dòng.

#### Scenario: Phân trang
- **WHEN** có 21 nhóm thoả bộ lọc
- **THEN** trang đầu hiện 20 dòng và có trang thứ hai; có đúng 20 nhóm thì chỉ có một trang

#### Scenario: Lọc kết hợp
- **WHEN** người dùng chọn nhiều điều kiện lọc cùng lúc
- **THEN** bảng chỉ hiện nhóm thoả mọi điều kiện

### Requirement: Số thành viên của nhóm
Hệ thống SHALL tính số thành viên của một nhóm gồm cả người ở mọi nhóm con, đếm mỗi người một lần, và SHALL NOT tính tài khoản kiểm thử hay người đã nghỉ việc.

#### Scenario: Cộng dồn nhánh
- **WHEN** nhóm cha có 3 người trực tiếp và hai nhóm con có tổng 10 người khác nhau
- **THEN** số thành viên của nhóm cha là 13

#### Scenario: Người ở hai nhánh
- **WHEN** một người là thành viên của hai nhóm cùng nằm dưới một nhóm cha
- **THEN** số thành viên của nhóm cha chỉ đếm người đó một lần

#### Scenario: Loại tài khoản kiểm thử và người nghỉ việc
- **WHEN** nhóm có một tài khoản kiểm thử và một người đã nghỉ việc
- **THEN** cả hai không được tính vào số thành viên

### Requirement: Tìm kiếm nhóm kèm đường dẫn
Hệ thống SHALL tìm nhóm theo tên và mã. Khi kết quả là một nhóm con, hệ thống SHALL hiện đường dẫn đầy đủ từ gốc.

#### Scenario: Kết quả là nhóm con
- **WHEN** người dùng tìm `Growth 1` và nhóm đó nằm dưới `ECOM / Trung tâm vận hành 1`
- **THEN** kết quả hiện `ECOM / Trung tâm vận hành 1 / Growth 1`

### Requirement: Nhóm lưu trữ ẩn mặc định
Hệ thống SHALL ẩn nhóm `Lưu trữ` mặc định ở danh sách và ở mọi ô chọn nhóm. Danh sách SHALL có công tắc *Hiện nhóm đã lưu trữ*.

#### Scenario: Công tắc tắt
- **WHEN** công tắc *Hiện nhóm đã lưu trữ* tắt
- **THEN** nhóm `Lưu trữ` không xuất hiện ở danh sách và ở bất kỳ ô chọn nhóm nào

#### Scenario: Công tắc bật
- **WHEN** người dùng bật công tắc
- **THEN** nhóm `Lưu trữ` hiện chữ xám kèm nhãn *Lưu trữ*, nhưng ô chọn nhóm khác vẫn không liệt kê chúng

### Requirement: Nhóm đồng bộ chỉ đọc về cơ cấu
Hệ thống SHALL khoá mọi thao tác sửa cơ cấu của nhóm nguồn `Đồng bộ` trên UpLMS Ops: sửa thông tin, di chuyển, xoá. Nhóm đồng bộ SHALL có nhãn nguồn riêng ở danh sách.

#### Scenario: Nhãn nguồn
- **WHEN** danh sách có cả nhóm `Đồng bộ` và nhóm `Tự tạo`
- **THEN** chỉ nhóm đồng bộ có nhãn nguồn

#### Scenario: Thao tác bị từ chối
- **WHEN** request sửa, di chuyển hoặc xoá nhắm vào nhóm `Đồng bộ`
- **THEN** hệ thống từ chối

### Requirement: Quyền xem và quản lý nhóm
Hệ thống SHALL tách quyền xem nhóm khỏi quyền quản lý nhóm. Người chỉ có quyền xem SHALL xem được danh sách và chi tiết nhưng không thực hiện được thao tác tạo, sửa, di chuyển, lưu trữ, khôi phục, xoá.

#### Scenario: Chỉ có quyền xem
- **WHEN** người chỉ có quyền xem nhóm mở danh sách nhóm
- **THEN** danh sách hiện đầy đủ và các nút thao tác ghi không hiện, request thao tác ghi bị từ chối
