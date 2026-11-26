# Technology Stack — ops-fe

> `origin/staging` @ `40f66b247`. Quy ước của repo: `ops-fe:.claude/rules/03-architecture-patterns.md`, `04-imports-and-dependencies.md`, `05-ui-and-styling.md` (không chép lại).

## Nền

| Thứ | Giá trị | Bằng chứng |
|---|---|---|
| Quản lý gói | pnpm 9.0.0, workspaces `apps/*`, `libs/*`, `features/*`; không nx/turbo | `ops-fe:package.json:3-8,59-61`, `ops-fe:pnpm-workspace.yaml:1-4` |
| Node | `>=22` (engines); CI dùng Node 22 | `ops-fe:package.json:59-61`, `ops-fe:.github/workflows/deploy-staging.yml:38-41` |
| Bundler | Vite `^6.2.5`, `@vitejs/plugin-react`, `vite-plugin-svgr`; build ra `build/`, minify esbuild, target es2015 | `ops-fe:apps/ops-fe/package.json:97`, `ops-fe:apps/ops-fe/vite.config.ts:14,54-71` |
| Ngôn ngữ | TypeScript `^5.8.3`, `strict: true` | `ops-fe:apps/ops-fe/package.json:95`, `ops-fe:apps/ops-fe/tsconfig.json:14` |
| UI | React `18.2.0`, antd `^5.24.3`, Metronic (`@ops/_metronic`), bootstrap `^5.3.3`, styled-components `^6`, SCSS | `ops-fe:apps/ops-fe/package.json:43,45,55,63,...` |
| Router | `react-router-dom ^6.30.6` | `ops-fe:apps/ops-fe/package.json:61` |
| Data | `react-query 3.39.3` (không phải `@tanstack`) + Context; không Redux | `ops-fe:apps/ops-fe/package.json:60` |
| Form | `react-hook-form ^7.55.0`, `zod ^3.24.2`, `@hookform/resolvers ^5` | `ops-fe:apps/ops-fe/package.json:58,68,9` |
| HTTP | `axios ^1.21.1` (instance chung ở `libs/service`) | `ops-fe:libs/service/src/request.ts:53-55` |
| Toast | `react-hot-toast ^2.6.0` | `ops-fe:apps/ops-fe/package.json:59` |
| Auth | `@upbase-tech/auth-package 1.0.1` (+ `keycloak-js ^26.2.0`) | `ops-fe:apps/ops-fe/package.json:39,50` |
| Tenant/theme | `@upbase-tech/tenant-context 1.0.0`, `@upbase-tech/design-tokens 1.0.0` | `ops-fe:apps/ops-fe/package.json:40-41`, `ops-fe:apps/ops-fe/src/index.tsx:9-18` |
| Khác | `dayjs`, `lodash`, `exceljs`, `video.js`/`video-react`, `react-virtualized`, `@fortune-sheet/react`, `mathjs`, `dompurify`, `uuid` | `ops-fe:apps/ops-fe/package.json` |
| Sơ đồ cây (chỉ Group) | `@xyflow/react ^12.6.4`, khai ở `features/group/package.json`, không nâng lên root | `ops-fe:features/group/package.json:23` |
| i18n | **Không có thư viện i18n**; chuỗi hardcode (tiếng Việt hoặc Anh) + `libs/service/src/en.exceptions.json` cho thông báo lỗi API | `ops-fe:.claude/CLAUDE.md:3`, `ops-fe:libs/service/src/request.ts:9,194-200` |

## Alias module

`@ops/core|ui|hooks|utils|state|styles|assets|hoc|service` và `@ops/feature-class-and-course`, `@ops/feature-group` được alias thẳng tới `src` trong Vite (`ops-fe:apps/ops-fe/vite.config.ts:17-33`). Các `@ops/feature-*` còn lại resolve qua workspace + `"main": "src/index.ts"` (ví dụ `ops-fe:features/group/package.json:4`). Lưu ý: `tsconfig.base.json` chỉ khai path cho `feature-class-and-course` (`ops-fe:tsconfig.base.json:8-20`).

## Môi trường runtime

Biến `VITE_*` được đẩy vào `process.env` qua `define` (`ops-fe:apps/ops-fe/vite.config.ts:11-13`): `VITE_API_PUBLIC` (base URL, proxy `/api` khi dev), `VITE_KEYCLOAK_URL|REALM|CLIENT_ID` (`ops-fe:apps/ops-fe/src/services/auth.ts:16-21`), `VITE_PORT`.

## Build, lint, kiểm tra

| Lệnh | Việc | Bằng chứng |
|---|---|---|
| `pnpm dev:ops-fe` / `build:ops-fe` | chạy/build app | `ops-fe:package.json:16-17` |
| `pnpm lint:design-system` | ESLint luật design system cho `features libs` | `ops-fe:package.json:20` |
| `pnpm typecheck:ops-fe` | `tsc -p tsconfig.checker.json --noEmit` | `ops-fe:package.json:22`, `ops-fe:apps/ops-fe/package.json:111` |
| `pnpm gen <config>` | sinh bản white-label | `ops-fe:package.json:15` |
| `pnpm pkg:link/check` | link package `@upbase-tech/*` local | `ops-fe:package.json:11-14` |

`features/group` có tsconfig typecheck hẹp riêng `apps/ops-fe/tsconfig.group-check.json` vì typecheck toàn repo chậm và từng thoát 1 không lỗi chẩn đoán (`ops-fe:apps/ops-fe/tsconfig.group-check.json:1-15`).

CI/CD: GitHub Actions `deploy-staging.yml` (nhánh `staging`) và `deploy-production.yml`; bước build chỉ `pnpm --filter ops-fe exec vite build`, **không chạy lint/typecheck/test** (`ops-fe:.github/workflows/deploy-staging.yml:51-68`). Đánh giá chi tiết: `code-quality-assessment.md`.
