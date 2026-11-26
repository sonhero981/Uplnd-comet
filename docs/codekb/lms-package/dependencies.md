# Dependencies — lms-package

> `origin/main` @ `448d575`. Phần "ai dùng" lấy bằng `git grep -n "@upbase-tech/" origin/staging -- '*package.json'` ở các repo anh em (chỉ đọc qua git). Commit `origin/staging` tại thời điểm quét: `ops-fe` `40f66b247`, `lms-fe` `baf430fa7`, `lms-be` `a2f4821`. Chỉ xét file `package.json`; import trong mã nguồn của consumer không được kiểm tra.

## Phụ thuộc nội bộ giữa các package trong repo

| Từ | Tới | Bằng chứng |
|---|---|---|
| `upbase-common-package` | `@upbase-tech/upbase-ui` (`workspace:^`), external khi build | `packages/common-package/package.json:68`, `vite.lib.config.ts:39` |
| `@upbase/tailwind-config` | không có package nào khai nó trong `dependencies` (README hướng dẫn dùng qua `presets: [require("@upbase/tailwind-config")]`) | `configs/tailwind-config/README.md:14-15`, các `package.json` đã đọc |
| Các package còn lại | không phụ thuộc lẫn nhau | `package.json` của từng package |

`design-tokens` và `tenant-context` cố ý không import nhau (`packages/design-tokens/README.md:43`; `packages/tenant-context/README.md:16-21`).

## Dependency ngoài (nhóm chính, range)

Xem bảng đầy đủ ở `technology-stack.md`. Điểm cần nhớ: `antd ^5.29.3` là dependency (không phải peer) ở `common`, `explanation`, `notification`, `student-dashboard` (`dependencies`), còn là peer `^5.0.0` ở `notification`, `quiz-result`, `student-dashboard`, `test-result` (`packages/*/package.json`). `keycloak-js` là peer của `auth-package` và bị đánh dấu external (`packages/auth-package/vite.lib.config.ts:29`).

## Consumer: repo nào dùng package nào (`origin/staging`, đã xác minh)

| Package | `ops-fe` | `lms-fe` | `lms-be` |
|---|---|---|---|
| `auth-package` | `1.0.1` (`apps/ops-fe/package.json:39`, `libs/state/package.json:33`, `libs/HOC/package.json:18`) | `1.0.1` (`apps/lms-pro/package.json:54`, `apps/lms-test/package.json:45`, `features/gamification/package.json:21`) | không |
| `design-tokens` | `1.0.0` (`apps/ops-fe/package.json:40`, `libs/ui`, `libs/hooks`, `libs/utils`, `features/{class-and-course,grading,role}`) | `1.0.0` (`apps/lms-pro/package.json:55`, `apps/lms-test/package.json:46`, `libs/{ui,hooks,utils}`) | không |
| `tenant-context` | `1.0.0` (`apps/ops-fe/package.json:41`, `libs/state/package.json:34`, `libs/utils/package.json:26`) | không | không |
| `upbase-common-package` | `^1.0.6` (`libs/ui/package.json:52`) | `^1.0.5` (`apps/lms-pro/package.json:58`, `libs/core`, `libs/ui`, `features/{attendance,schedule}`, root `package.json:124`) | không |
| `explanation-package` | không | `^1.0.11` (`apps/lms-pro/package.json:56`, `apps/lms-test/package.json:47`, `features/courses`, root `package.json:122`) | không |
| `quiz-result-package` | không | `^1.0.3` (`apps/lms-pro/package.json:57`, `apps/lms-test/package.json:48`, `features/courses`, root `package.json:123`) | không |
| `upbase-notification` | không | `^1.0.6` (`apps/lms-pro/package.json:59`, `libs/ui/package.json:54`, root `package.json:125`) | không |
| `test-result-package` | `^1.0.2` (`apps/ops-fe/package.json:42` và 13 `features/*/package.json`) | không | không |
| `student-dashboard-package` | `^1.0.1` (`features/class-and-course/package.json:43`) | không | không |
| `upbase-ui` | không (chỉ gián tiếp qua `upbase-common-package`) | không | không |

`lms-be`: `git grep -l "upbase-tech" origin/staging` không trả file nào (không tham chiếu).

Lệch phiên bản đáng ghi nhận (so với `package.json` ở `origin/main` của repo này):
- `explanation-package` ở main là `1.1.0` (commit `448d575`), `lms-fe` khai `^1.0.11` (caret vẫn khớp `1.1.0`, nhưng consumer chưa nâng mức tối thiểu).
- `quiz-result-package` ở main `1.0.4`, `lms-fe` khai `^1.0.3`; `test-result-package` ở main `1.0.2`, `ops-fe` khai `^1.0.2`.
- `upbase-common-package` ở main `1.0.6`; `lms-fe` khai `^1.0.5`, `ops-fe` khai `^1.0.6`.
- `auth-package`, `design-tokens`, `tenant-context` được consumer ghim chính xác (`1.0.1`, `1.0.0`, `1.0.0`, không có `^`), khác các package component dùng `^`.

## Rủi ro lan truyền

- Đổi hợp đồng `auth-package`, `design-tokens`, `tenant-context` ảnh hưởng cả `ops-fe` và `lms-fe` (với `tenant-context` chỉ `ops-fe`). README của `tenant-context` coi `TenantConfig` là "contract mà mọi portal pin vào" (`packages/tenant-context/README.md:115-117`).
- `test-result-package` và `student-dashboard-package` chỉ `ops-fe` dùng; `explanation-package`, `quiz-result-package`, `upbase-notification` chỉ `lms-fe` dùng.
- Cài đặt cần token đọc GitHub Packages: comment ở dòng 1 của `.npmrc` trong `ops-fe` (`origin/staging:.npmrc:1`) nói cần `NODE_AUTH_TOKEN` scope `read:packages`.
