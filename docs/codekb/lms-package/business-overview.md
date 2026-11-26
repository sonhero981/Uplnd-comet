# Business Overview — lms-package

> Quét mức overview (Depth Minimal) trên `origin/main` @ `448d575`. Mọi `file:line` dưới đây là của `origin/main`. Quy ước của repo: `README.md` chỉ có một dòng tiêu đề `# lms-package` (`README.md:1`) và `origin/main` không có `.claude/` nào, nên không có file quy ước nào để trỏ tới; thông tin vận hành nằm rải ở `README.md` của từng package (xem `code-quality-assessment.md`).

## Mục đích

`lms-package` là monorepo pnpm + turbo (`package.json:2,5`, `pnpm-workspace.yaml:1-3`) chứa các thư viện dùng chung `@upbase-tech/*` cho các portal UpBase LMS: `ops-fe` (portal vận hành), `lms-fe` (`lms-pro`, `lms-test`). Repo không có ứng dụng chạy được, chỉ có thư viện và một preset cấu hình (`configs/tailwind-config`). Thư viện được publish lên GitHub Packages của org `UpBase-Tech` (`.npmrc:2`, `packages/*/package.json` mục `publishConfig`).

## Nhóm chức năng theo package

| Nhóm | Package (version trong `package.json`) | Làm gì |
|---|---|---|
| Nền tảng portal (SaaS / white-label) | `@upbase-tech/auth-package` 1.0.1 | SSO Keycloak: token giữ trong bộ nhớ, check-sso, đăng xuất OIDC (`packages/auth-package/package.json:4`, `README.md:3-9`) |
| | `@upbase-tech/design-tokens` 1.0.0 | Token màu/font/bo góc thành CSS variable `--up-*`, theme AntD, preset Tailwind (`packages/design-tokens/README.md:3`) |
| | `@upbase-tech/tenant-context` 1.0.0 | Chở dữ liệu tổ chức (tenant) từ payload `GET /me` (`packages/tenant-context/README.md:3-4`) |
| Component dùng chung | `@upbase-tech/upbase-common-package` 1.0.6 | Editor TipTap (`UpbaseEditor`, `UpbaseEditorV2`) và lịch (`UpbaseCalendar`, `UpbaseCalendarV2`) (`packages/common-package/src/index.tsx:4-7`) |
| | `@upbase-tech/upbase-notification` 1.0.6 | Drawer thông báo (`packages/notification-package/src/index.tsx:38,184`) |
| | `@upbase-tech/upbase-ui` 1.0.0 | Gói thử nghiệm, chỉ xuất `UI_VERSION`, `UiVersionBadge` (`packages/ui/src/index.tsx:5-7`; mô tả "test transitive dependency", `packages/ui/package.json:4`) |
| Học tập / kết quả | `@upbase-tech/explanation-package` 1.1.0 | Hiển thị lời giải / làm quiz, bọc trong Shadow DOM (`packages/explanation-package/src/index.tsx:46-96`) |
| | `@upbase-tech/quiz-result-package` 1.0.4 | Bảng kết quả quiz (`packages/quiz-result-package/src/index.tsx:25`) |
| | `@upbase-tech/test-result-package` 1.0.2 | Trang kết quả bài thi (`packages/test-result-package/src/index.tsx:21`) |
| | `@upbase-tech/student-dashboard-package` 1.0.3 | Dashboard tiến độ học viên: khoá thường hoặc khoá thi (`packages/student-dashboard-package/src/index.tsx:38-61`) |
| Cấu hình dùng chung | `@upbase/tailwind-config` 0.0.0 (private, không publish) | Preset Tailwind chuẩn của monorepo (`configs/tailwind-config/package.json:2-4`, `README.md:3-6`) |

## Ai dùng

Chỉ những gì đã xác minh bằng `git grep "@upbase-tech/" origin/staging -- '*package.json'` ở các repo anh em (chi tiết ở `dependencies.md`): `ops-fe` và `lms-fe` dùng thư viện này; `lms-be` không có tham chiếu nào.

## Ghi chú nghiệp vụ

- Các package "nền tảng portal" phục vụ hướng white-label theo tổ chức: `design-tokens` README nói "nền cho white-label theo tổ chức" (`packages/design-tokens/README.md:3`); `tenant-context` README nêu rõ mình chỉ "chở" dữ liệu, không "áp" (`packages/tenant-context/README.md:14-21`).
- Tiêu chí tách package đã được viết thành quy tắc trong README của `tenant-context` (`:23`: "Mỗi lần định thêm một trong bốn việc trên vào đây, câu trả lời là không").
- Không quét: logic nghiệp vụ chi tiết bên trong các component học tập (xem `shallow.paths` ở `reverse-engineering-timestamp.md`).
