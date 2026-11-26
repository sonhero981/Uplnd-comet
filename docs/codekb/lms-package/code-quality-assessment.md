# Code Quality Assessment — lms-package

> Overview (Depth Minimal), `origin/main` @ `448d575`. Số đếm lấy bằng `git grep` trên `origin/main -- packages` (bỏ `dist-local`); đây là số quan sát được, không phải đánh giá chất lượng từng file.

## Test

| Mục | Quan sát | Bằng chứng |
|---|---|---|
| File test | Chỉ 5 file `src/index.test.tsx` (`common`, `explanation`, `notification`, `quiz-result`, `test-result`) | `git ls-tree` lọc `test|spec` |
| Nội dung | Là test mẫu `expect(X).toBeTruthy()`; 3 trong 5 file (`common`, `explanation`, `test-result`) import `ExampleComponent` mà không package nào xuất (`git grep ExampleComponent` chỉ thấy trong test); `quiz-result` import `QuizResultComponent` (có thật) | `packages/common-package/src/index.test.tsx:1-7`, `packages/explanation-package/src/index.test.tsx:1-7`, `packages/test-result-package/src/index.test.tsx:1-7`, `packages/quiz-result-package/src/index.test.tsx:1,3`, `src/index.tsx:25` |
| Notification | Test import `{ UpbaseNotificationComponent }` có tên, entry chỉ có `export default` | `packages/notification-package/src/index.test.tsx:1`, `src/index.tsx:38,184` |
| Chạy test | `common-package`: `test:unit` dùng `react-scripts test`, nhưng `react-scripts` không có trong `devDependencies` | `packages/common-package/package.json:40,48-63` |
| Turbo `test` | `test` ở `auth-package`, `design-tokens`, `tenant-context` chỉ là `pnpm build`; `explanation`, `notification`, `quiz-result`, `test-result`, `student-dashboard` không có script `test` | `packages/auth-package/package.json:42`, `packages/explanation-package/package.json:34-40` |
| Coverage config | Không thấy; `.gitignore` chỉ bỏ qua `coverage/` | `.gitignore:35-36` |

Kết luận: không có test thực chất nào ở `origin/main`. Đã chạy được test hay chưa thì chưa xác minh (không chạy lệnh).

## Lint / format

- ESLint cấu hình theo từng package: `.eslintrc` + `src/.eslintrc` (`common`, `explanation`, `notification`, `quiz-result`, `test-result`), `eslint.config.js` (`student-dashboard`); `auth-package`, `design-tokens`, `tenant-context` có script `lint` `eslint src --ext ...` nhưng không có file cấu hình ESLint riêng trong `ls-tree` (`packages/auth-package/package.json:41`). Không có cấu hình ESLint/Prettier ở gốc repo.
- `common-package/.eslintrc` dùng `standard`, `standard-react`, `plugin:prettier/recommended`, `prettier/standard` (preset cũ, `packages/common-package/.eslintrc:3-7`).
- `88` file trong `packages/` chứa `eslint-disable`; `0` lần `@ts-ignore/@ts-nocheck/@ts-expect-error`; `373` chỗ dùng `: any` / `<any>` / `as any`; `4` file có `TODO|FIXME|HACK`.
- Không thấy `husky`, `lefthook`, `commitlint`, `changeset` (`ls-tree` lọc từ khoá này).

## CI/CD

- Một workflow `.github/workflows/publish.yml`: kích hoạt khi push `main` hoặc `workflow_dispatch` (`:3-7`), gọi reusable workflow `UpBase-Tech/gha-workflows/.github/workflows/publish-packages.yml@add-npm-packages-workflows` (`:18`). Tham chiếu theo tên nhánh (`add-npm-packages-workflows`), không ghim tag/SHA. Nội dung workflow đó nằm ngoài repo, chưa đọc: không biết nó có chạy build/lint/test trước khi publish hay không.
- Không có workflow chạy build/lint/test trên pull request (chỉ có một file trong `.github/workflows/`).
- `.travis.yml` còn trong `common`, `explanation`, `notification`, `quiz-result` (`ls-tree`); ở 3 file đầu nội dung là `node_js: 12, 10` (đã đọc). Không có `.travis.yml` nào được gọi từ workflow nên coi là tàn dư của template create-react-library (`packages/common-package/package.json:4` mô tả "Made with create-react-library").

## Tài liệu

| Package | README |
|---|---|
| `auth-package`, `design-tokens`, `tenant-context`, `tailwind-config` | Có README chi tiết (tiếng Việt, có API, lý do thiết kế) |
| `common`, `explanation`, `notification`, `quiz-result`, `test-result`, `student-dashboard` | Có README, nội dung không đọc |
| Gốc repo | `README.md:1` chỉ là `# lms-package` |
| Hướng dẫn publish | `packages/common-package/PUBLISH.md:3` ghi "không còn dùng", trỏ tới `docs/PUBLISHING.md` (không có trong `origin/main`) và mô tả publish khi merge vào `staging`/`product` (`:13`), khác với `publish.yml:3-7` (push `main`) |

## Technical Debt

| Dấu hiệu | Vị trí |
|---|---|
| `tenant-context`: `src/react/` và `src/server/` có mã nhưng không build/export; README ghi version `0.1.0` (`README.md:110`) trong khi `package.json` là `1.0.0` (`:3`) | `packages/tenant-context/` |
| `upbase-ui` khai `"types": "dist/index.d.ts"` nhưng script build chỉ chạy `vite build`, không sinh `.d.ts`; mô tả "test transitive dependency" mà vẫn bị `common-package` phụ thuộc và re-export | `packages/ui/package.json:4,12,27` |
| Nhóm component không có `types` trong `exports` | `packages/common-package/package.json:14-22` |
| Bundle build commit vào git: `packages/common-package/dist-local/editor.mjs` (`.gitignore:7` chỉ bỏ `dist/`, không bỏ `dist-local/`) | `ls-tree`, `.gitignore:7` |
| `engines.node ">=10"` và peer React `^16.8` không khớp với toolchain hiện tại (Vite 6, TS 5.9, `@types/node ^22`) | `packages/common-package/package.json:23-25,44-47,53-61` |
| Hai phiên bản V1/V2 song song, copy nguyên thư mục | `packages/common-package/src/components/{UpbaseEditor,UpbaseEditorV2}` |
| `Props` khai báo nhưng không dùng (`handleDownload`, `topic`) ở `ExplanationPackage` | `packages/explanation-package/src/index.tsx:28-44,46-51` |
| Reusable workflow publish ghim theo nhánh | `.github/workflows/publish.yml:18` |
| `explanation-package` có `resolutions` (cú pháp Yarn) trong `package.json` pnpm | `packages/explanation-package/package.json:81-83` |

## Điểm tốt đã thấy

`tsconfig.base.json` strict; README của 3 package nền tảng giải thích lý do thiết kế và ranh giới trách nhiệm; `auth-package`/`tenant-context`/`design-tokens` giữ API tối thiểu có chủ đích (`packages/design-tokens/README.md:28-30`); build của lõi tách `types` bằng `tsc`.
