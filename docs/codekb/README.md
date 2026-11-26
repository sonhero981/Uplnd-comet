# codekb

Bản chụp code đã kiểm, dùng lại cho mọi change. Sinh bởi `/comet-codekb` (AWS AI-DLC Reverse Engineering).
CURRENT khi `git log <commit>..origin/<base> -- <analyzed.paths>` rỗng (`node scripts/codekb-status.mjs`).

Lần quét đầu (2026-11-18) là **quét tập trung** (`kind: partial`): đào sâu vùng Group (LMS-F002) và các điểm nối, phần còn lại ở mức cấu trúc nông. Mỗi `reverse-engineering-timestamp.md` ghi rõ `analyzed.paths` (đã đọc sâu) và `shallow.paths` (chỉ đọc cấu trúc). Đọc codekb để biết nên nhìn đâu, rồi kiểm lại đúng dòng bạn dựa vào trong code.

## Bức tranh xuyên repo

| Chủ đề | Tóm tắt | Chi tiết |
|---|---|---|
| Group xuyên ba repo | Backend, giao diện vận hành và hồ sơ học viên cùng làm LMS-F002; phần lớn đã có trên `origin/staging` | [lms-be areas/group](lms-be/areas/group.md) · [ops-fe areas/group](ops-fe/areas/group.md) · [lms-fe areas/learner-profile](lms-fe/areas/learner-profile.md) |
| Đa tenant | Backend cô lập tenant bằng Postgres RLS (bảng nhóm bật `ENABLE` và `FORCE ROW LEVEL SECURITY`) | [lms-be architecture, mục hạ tầng](lms-be/architecture.md) |
| Xác thực | `ops-fe` và `lms-fe` đều đăng nhập qua Keycloak | [ops-fe architecture](ops-fe/architecture.md) · [lms-fe architecture](lms-fe/architecture.md) |
| Phân quyền | BE gắn quyền bằng cơ chế `security` cộng `tags` ở controller; `ops-fe` ẩn lối vào theo `TITLE_LEARNER_GROUP_GR`, BE vẫn chặn thật | [lms-be areas/group, mục Quyền](lms-be/areas/group.md) · [ops-fe areas/group, mục Quyền](ops-fe/areas/group.md) |
| Dữ liệu phía FE | Cả hai FE dùng react-query v3 và nối API qua tầng riêng; `ops-fe` nhận API qua `FeatureContext` | [ops-fe architecture](ops-fe/architecture.md) · [lms-fe architecture](lms-fe/architecture.md) |
| Hợp đồng BE mà FE đang sống chung | Các chỗ lệch contract Group giữa BE và `ops-fe` (phân trang, DTO snake_case, cây lấy một lần, thân của DELETE...) | [ops-fe areas/group, mục Gotcha](ops-fe/areas/group.md) |
| Gói dùng chung | `ops-fe` và `lms-fe` dùng `@upbase-tech/*` (auth, design-tokens...); `lms-be` không tham chiếu | [lms-package dependencies](lms-package/dependencies.md) |
| Sự kiện bất đồng bộ của Group | Ghi danh, rời nhóm, đồng bộ Lark và nhập tệp chạy qua Kafka và job nền | [lms-be areas/group, mục Luồng sự kiện](lms-be/areas/group.md) |

### Chỗ tài liệu cũ không còn đúng với code (đã kiểm)

| Tài liệu | Lệch | Chi tiết |
|---|---|---|
| `fe-technical-design.md` v2.2 (repo PO), mô tả bản demo mock | Nhiều mục không còn đúng: route đã gate theo quyền, API tên `LearnerGroupAPI`, cây lấy một lần bằng `tree/flat`, 5 route và 5 tab, `generate-customer` đã làm | [ops-fe areas/group, mục 8 và mục 3](ops-fe/areas/group.md) |
| `ops-fe:features/group/CLAUDE.md` | Một số ghi chú lỗi thời (cây từng cấp, `useTeamAccess` mock, state trong bộ nhớ) | [ops-fe areas/group, mục 8](ops-fe/areas/group.md) |
| PRD v0.6 so với code | Vào Ops của quản lý và mentor, khôi phục nhóm đồng bộ, xoá nhóm là xoá thật, mốc quá khứ của báo cáo | [lms-be code-quality và areas/group](lms-be/areas/group.md) |
| Domain KB ở repo PO (`domain/12-data-model.md`, `14-api-surface.md`) | Mô tả nhóm phẳng cũ; trên staging đã thay bằng cây nhóm và bảng mới | [lms-be areas/group, mục 1](lms-be/areas/group.md) |

## Store chuẩn AWS (9 file)

| Repo | Commit origin/<base> | kind | verified_date | Intent |
|---|---|---|---|---|
| [lms-package](lms-package/) | `448d575` (`origin/main`) | partial | 2026-11-18 | codekb |
| [lms-be](lms-be/) | `a2f4821` (`origin/staging`) | partial | 2026-11-18 | codekb |
| [ops-fe](ops-fe/) | `40f66b247` (`origin/staging`) | partial | 2026-11-18 | codekb |
| [lms-fe](lms-fe/) | `baf430fa7` (`origin/staging`) | partial | 2026-11-18 | codekb |

## Danh mục vùng (areas/)

| Area | Repo chính | Mô tả |
|---|---|---|
| [group](lms-be/areas/group.md) | lms-be | Mô hình dữ liệu nhóm, cây nested set, endpoint Ops, mọi đường ghi, bốn luồng sự kiện, 17 gotcha |
| [group](ops-fe/areas/group.md) | ops-fe | Route và tab, API thật hay mock, adapter DTO, query-key, quyền, 16 gotcha, đối chiếu với tài liệu cũ |
| [learner-profile](lms-fe/areas/learner-profile.md) | lms-fe | Trang hồ sơ học viên và khối `MyManagers` (US17) |
