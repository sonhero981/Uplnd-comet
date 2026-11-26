# Technology Stack — lms-fe

> Nguồn: `origin/staging` @ `baf430fa7`. Chỉ ghi version khai trong `package.json` (không phải version đã resolve trong `pnpm-lock.yaml`, file này không đọc). Cách dùng/quy ước: `.claude/rules/04-imports-and-dependencies.md`, `05-ui-and-styling.md`.

| Lớp | Công nghệ | Version khai báo | Bằng chứng |
|---|---|---|---|
| Runtime | Node | `22.x` (engines); Docker `node:22.23.4-alpine3.24` | `package.json` engines; `Dockerfile:5` |
| Package manager | pnpm | `pnpm@10.22.0` | `package.json` `packageManager` |
| Monorepo | Turborepo | `^2.10.2` | `package.json` devDependencies, `turbo.json` |
| Ngôn ngữ | TypeScript | `^5.9.3` (catalog) | `pnpm-workspace.yaml` catalog |
| Framework | Next.js (App Router) | `^14.2.35` (lms-pro, lms-test), `^14.2.9` (lms-zoom), `14.2.35` (`@lms/ui`) | `apps/*/package.json`, `libs/ui/package.json` |
| UI runtime | React | `18.2.0` (root), `^18.2.0` (app) | `package.json`, `apps/lms-pro/package.json` |
| UI kit | Ant Design | `^5.25.0`; lms-zoom `^5.29.3` | `apps/lms-zoom/package.json` |
| Styling | Tailwind `3.4.17` (catalog), styled-components `^6.1.19`, SCSS (`sass ^1.53.0`), `clsx ^2.1.1` | | `pnpm-workspace.yaml`, `package.json`, `apps/lms-pro/package.json` |
| Server state | react-query | `3.39.3` (API v3: `useQuery(key, fn, opts)`) | `package.json` |
| Client state | Redux Toolkit `^1.9.7`, react-redux `^8.1.3`, next-redux-wrapper `^8.1.0` | | `libs/state/package.json`, `libs/api/package.json` |
| HTTP | axios | `^1.6.2` | `libs/api/package.json` |
| Form | react-hook-form `7.48.2`, zod `^3.22.4`, `@hookform/resolvers ^3.10.0` | | `package.json`, `libs/ui/package.json` |
| Auth | `keycloak-js ^25.0.1` (lms-pro/test), `^26.2.0` (lms-zoom); `@upbase-tech/auth-package 1.0.1` | | `apps/*/package.json` |
| Realtime | `socket.io-client ^4.7.5` | | `features/gamification/package.json` |
| Push | `firebase ^10.7.1` (lms-zoom `^12.0.0`) | | `libs/utils/package.json` |
| Biểu đồ | `echarts ^5.6.0` | | `libs/ui/package.json` |
| Animation | framer-motion `^12.23.12`, lottie-react `^2.4.1`, aos `^2.3.4` | | `apps/lms-pro/package.json` |
| Ngày giờ | dayjs `^1.11.12`, date-fns `^3.0.6` | | `apps/lms-pro/package.json` |
| Toast | react-hot-toast `^2.4.1` | | `libs/api/package.json` |
| Giám sát | `@sentry/nextjs ^10.35.0` (lms-test `^10.46.0`), `@vercel/speed-insights ^2.0.0` | | `apps/*/package.json` |
| Họp video | `@zoom/meetingsdk 6.1.0` | | `apps/lms-zoom/package.json` |
| Token thiết kế | `@upbase-tech/design-tokens 1.0.0` | | `apps/lms-pro/package.json`, `providers.tsx:56` |
| i18n | `next-i18next ^13.2.2` khai báo nhưng không thấy dùng trong code | | grep `i18next` trên `apps libs features`: 0 kết quả |
| Lint/format | ESLint `^8.57.1`, Prettier `^3.5.3`, commitlint `^20.3.1`, husky `^9.1.7`, lint-staged `^16.1.5` | | `pnpm-workspace.yaml` catalog, `package.json` |
| Build/deploy | Docker (`Dockerfile`, `local.Dockerfile`, `docker-compose*.yml`), GitHub Actions deploy | | `.github/workflows/deploy-staging.yml` |

## Cấu hình Next đáng nhớ (lms-pro)

`output: 'standalone'` hoặc `'export'` khi `NEXT_EXPORT=true`; `images.remotePatterns: [{ protocol:'https', hostname:'**' }]` (cho phép ảnh từ mọi host https, ví dụ avatar URL đã ký); `compiler.removeConsole` ở production; bọc Sentry và bundle analyzer (`apps/lms-pro/next.config.js:1-60`). Config khác giữa 3 app, đọc `next.config.js` của app trước khi sửa (`.claude/rules/03-architecture-patterns.md`).

## Lệch version giữa app

`antd` 5.25 vs 5.29, `keycloak-js` 25 vs 26, `firebase` 10 vs 12, `lodash ^4.17.21` vs `^4.18.1` (lms-zoom) (`apps/*/package.json`); comment trong `pnpm-workspace.yaml` ghi rõ cố ý không đồng bộ các package runtime lệch major.
