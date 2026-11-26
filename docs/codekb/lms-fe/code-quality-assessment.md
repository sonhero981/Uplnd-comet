# Code Quality Assessment — lms-fe

> Nguồn: `origin/staging` @ `baf430fa7`. Số đếm bằng `git grep` trên `apps/*/src`, `libs`, `features` (loại `*.json`, `*.md`). Quy ước đầy đủ: `.claude/rules/` (đặc biệt `06-commands-and-workflow.md`, `07-testing-patterns.md`, `08-typecheck-policy.md`).

## Test coverage

Repo không có test runner và không thấy file test: `git ls-tree -r origin/staging` lọc `.test.`, `.spec.`, `jest.config`, `vitest`, `playwright`, `cypress`, `__tests__` không ra kết quả. `.claude/rules/07-testing-patterns.md` xác nhận "Repo chưa có test runner"; verify bằng test tay (Playwright MCP) + `check-types` + `lint`. `MyManagers` cũng không có test. Hệ quả cho change mới: muốn có test tự động phải dựng runner trước, nằm ngoài phạm vi một feature.

## Linting, format, hook

- ESLint `.eslintrc.json` trong từng lib/feature; script `lint` ở `libs/*`, `features/*`, apps (`next lint` ở lms-pro). Root `lint-staged` chỉ chạy `eslint --fix` cho một số đường dẫn (`package.json` mục `lint-staged`); `libs/HOC`, `libs/api`, `features/attendance`, `features/certificate`, `features/examination`, `apps/lms-test` không có trong danh sách đó.
- Prettier + `prettier-plugin-tailwindcss`, husky (`.husky/`), commitlint conventional (`commitlint.config.cjs`).
- TypeScript: script `check-types` (`tsc --noEmit`) ở cả 3 app; luật "chỉ chạy ở cuối task" ở `.claude/rules/08-typecheck-policy.md`.

## CI/CD

Chỉ có 2 workflow, đều là deploy: `.github/workflows/deploy-staging.yml` (push `staging` hoặc chạy tay) và `deploy-production.yml`. Không có job lint, type-check hay test trong CI (`git grep "lint\|check-types\|test" -- .github/workflows` chỉ khớp tên `lms-test`). Ma trận build gồm `lms-pro` và `lms-test`, không có `lms-zoom` (`deploy-staging.yml:24-34`). `git grep ignoreBuildErrors|ignoreDuringBuilds` trên `apps/*/next.config.js` không có kết quả, nên `next build` dùng kiểm tra type/lint mặc định của Next; type-check riêng chỉ có khi dev tự chạy `check-types`.

## Tài liệu

`README.md`, `MONOREPO_STRUCTURE.md`, `PACKAGE_RULES.md`, `docs/*.md` (gamification FE/BE), cộng bộ `.claude/` (rules, inventory, command `/dev-feature`). Comment trong code dày và gắn mã yêu cầu (`UPLND-495`, `BR-17.x`); phần lớn bằng tiếng Việt.

## Tín hiệu nợ kỹ thuật (đếm toàn repo, mức xấp xỉ)

| Tín hiệu | Số lượng | Ghi chú |
|---|---|---|
| `: any` | 730 lần trong 172 file | ví dụ `MyProfileAPI.getMyManagers(): Promise<any>` (`libs/api/api/profile/index.ts:16`); các hàm `MyProfileAPI` đã đọc đều khai trả `any` |
| `eslint-disable` | 37 trong 20 file | |
| `TODO/FIXME/HACK` | 10 trong 10 file | vd `TODO(Q19/OQ-19)` ở `features/gamification/src/constants/keys.ts:33` |
| `@ts-ignore/@ts-nocheck/@ts-expect-error` | 0 | |

Khác đã thấy trong file đọc sâu:
- `apps/lms-pro/src/app/[page]/page.tsx` dài 527 dòng, lẫn logic tab, animation, mobile full-screen, logout; nhiều khối bị comment (`page.tsx:234-237`, `283-289`, `292-313`). Có typo giữ nguyên (`'sercurity'`, `MyPasword`).
- Hai nhánh render cho cùng `MyManagers` (desktop `page.tsx:194`, mobile `page.tsx:277`) với bố cục bọc khác nhau: desktop có tiêu đề `My Managers` hardcode ngay trong `page.tsx:191-193`, mobile dùng nhãn Collapse (`page.tsx:274`).
- `withAuthorization` import `../../ui` tương đối (`withAuthorization.tsx:4`), debounce cứng 100 ms (`:14-19`).
- `RouteGuard` không có nhánh lỗi hiển thị: `getMe` thất bại thì vẫn spinner mãi (`RouteGuard.tsx:57-66`, `84-90`).
- `Slot` in `console.warn` và hiện `RedirectNotBuyPage` khi slot rỗng (`Slot.tsx:12-16`); tab Badges được gating bằng `showBadges` nên chỉ gặp nếu module gamification chưa đăng ký.
- Query key `['my-managers']` không gắn người dùng, kết hợp `staleTime` 50 phút mặc định (`providers.tsx:109-116`, `MyManagers.tsx:57`). Tìm `queryClient.clear|removeQueries` trong `apps libs features` không thấy kết quả, nên không có đoạn xoá cache khi đăng xuất mà chạy trong cùng phiên SPA; Keycloak logout được bọc bởi `onLogoutCleanup` chỉ xoá `localStorage` và cookie (`keycloak.ts:60-63`).
- `FeatureContext.myProfileApi` gõ kiểu thiếu `getMyManagers` (`FeatureContext.tsx:53-73`).

## Đánh giá nhanh (good/fair/poor)

| Tiêu chí | Mức | Lý do |
|---|---|---|
| Naming | good | tên rõ, nhất quán `UpBase*`, `XxxAPI` |
| Function size | fair | `ProfilePage` và `Providers` dài (`providers.tsx:138-391`) |
| Error handling | fair | interceptor tập trung tốt; UI lỗi tuỳ component, `RouteGuard` thiếu nhánh lỗi |
| Test presence | poor | không có test tự động |
| Duplication | fair | hai nhánh desktop/mobile ở trang hồ sơ; API path format không thống nhất (`api-documentation.md`) |
| Dead code | fair | nhiều khối comment, dependency không dùng (`next-i18next`) |
