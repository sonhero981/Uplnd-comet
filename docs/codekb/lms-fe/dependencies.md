# Dependencies — lms-fe

> Nguồn: `origin/staging` @ `baf430fa7`, đọc từ `package.json` từng package (không đọc lockfile). Bảng package `@upbase-tech/*` và quy tắc sửa: `.claude/rules/04-imports-and-dependencies.md`.

## Đồ thị phụ thuộc nội bộ (`workspace:*`)

```mermaid
flowchart LR
  core[@lms/core]
  utils[@lms/utils] --> core
  ctx[@lms/contexts] --> core
  ctx --> utils
  api[@lms/api] --> ctx
  api --> core
  api --> utils
  hooks[@lms/hooks] --> ctx
  hooks --> core
  hooks --> utils
  hoc[@lms/hoc] --> ctx
  ui[@lms/ui] --> ctx
  ui --> core
  ui --> hooks
  ui --> utils
  ui --> assets[@lms/assets]
  fauth[@lms/feature-auth] --> ctx
  fauth --> hooks
  fauth --> ui
  fuser[@lms/feature-user] --> ctx
  fuser --> hooks
  fuser --> ui
  fuser --> fauth
  fgam[@lms/feature-gamification] --> api
  fgam --> hoc
  fgam --> hooks
  fgam --> ui
  pro[lms-pro] --> fuser
  pro --> fauth
  pro --> fgam
  pro --> api
```

Text fallback (từ `libs/*/package.json`, `features/*/package.json`): `@lms/core` là gốc (không phụ thuộc `@lms/*` khác); `@lms/utils` -> core; `@lms/contexts` -> core, utils; `@lms/api` -> contexts, core, utils; `@lms/hooks` -> contexts, core, utils; `@lms/hoc` -> contexts; `@lms/ui` -> assets, contexts, core, hooks, utils; `@lms/feature-user` -> assets, contexts, core, feature-auth, hooks, ui, utils; `@lms/feature-gamification` -> api, assets, contexts, core, hoc, hooks, ui, utils. `lms-pro` khai tất cả 12 `@lms/feature-*` (`apps/lms-pro/package.json`).

Điểm lệch so với khai báo:
- `libs/HOC/src/withAuthorization.tsx:4` import `../../ui` (đường dẫn tương đối) không qua `@lms/ui`; `@lms/hoc` không khai `@lms/ui`.
- `features/user` không khai `@lms/api` (đúng ý đồ, `my-managers.service.ts:7-8`), nên API được truyền qua props.
- `@lms/contexts` import `@lms/core` (`libs/state/redux/types/User/urser.ts:1-9`) và `@lms/core/package.json` không khai `@lms/*` nào, nên ở mức khai báo package không có vòng; chưa kiểm vòng ở mức import file.
- `libs/api/redux` import `@lms/contexts` để lấy `globalReducer` (`libs/api/redux/store.ts:1`).

## Phụ thuộc ngoài đáng chú ý

| Nhóm | Package | Dùng cho |
|---|---|---|
| Nội bộ công ty (GitHub Packages) | `@upbase-tech/auth-package 1.0.1`, `design-tokens 1.0.0`, `upbase-common-package ^1.0.5`, `upbase-notification ^1.0.6`, `quiz-result-package ^1.0.3`, `explanation-package ^1.0.11` | auth/Keycloak, token thiết kế, editor, thông báo, kết quả quiz, giải thích |
| Auth | `keycloak-js` | bên dưới `auth-package` |
| Dịch vụ ngoài | Firebase (push), Sentry, Vercel Speed Insights, Google Tag Manager / GA (`react-gtm-module`, `react-ga4`), HubSpot widget (DOM id trong `providers.tsx:236-240`), Zoom SDK, Cloudflare Stream (`@cloudflare/stream-react`) | thông báo đẩy, giám sát, phân tích, chat, họp, video |
| Backend | `lms-be` qua `NEXT_PUBLIC_BASE_API_URL` | toàn bộ dữ liệu |

Registry `@upbase-tech` là `npm.pkg.github.com`; cần token ở `~/.npmrc` (`pnpm setup:auth`) hoặc secret `gh_token` khi build Docker (`.npmrc`, `.github/workflows/deploy-staging.yml`, `.claude/rules/04...`). `.npmrc` dùng `node-linker=hoisted` và hoist `react`, `react-dom`.

Biến môi trường `NEXT_PUBLIC_*` được nhúng lúc build: `BASE_API_URL`, `KEYCLOAK_URL|REALM|CLIENT_ID`, `COOKIE_DOMAIN`, `WEB_LMS_URL`, `VIDEO_URL`, `DOMAIN_TEST`, `GTM_ID`, `GOOGLE_ANALYTICS_ID` (thấy ở `providers.tsx`, `keycloak.ts`, `client.ts`, `layout.tsx`). `.env` do CI ghi từ secret (`deploy-staging.yml`, bước "Create .env").

## Nợ phụ thuộc đã thấy

- `next-i18next` khai nhưng không được import.
- `eslint-config-next ^12.3.7` trong `apps/lms-pro` trong khi Next là 14 (`apps/lms-pro/package.json` devDependencies).
- Hai bản `@sentry/nextjs` khác minor giữa lms-pro và lms-test; `react-router-dom` có trong `libs/HOC/package.json` và `apps/lms-test/package.json` trong dự án dùng App Router.
