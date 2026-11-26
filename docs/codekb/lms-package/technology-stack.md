# Technology Stack — lms-package

> Phiên bản lấy từ khai báo (range) trong `package.json` ở `origin/main` @ `448d575`; version thực cài nằm trong `pnpm-lock.yaml` (không đọc).

## Ngôn ngữ và công cụ

| Mục | Giá trị | Bằng chứng |
|---|---|---|
| Ngôn ngữ | TypeScript `^5.9.3` (một số package còn `^5.8.3`), TSX; SCSS; CSS | `packages/common-package/package.json:60`, `packages/explanation-package/package.json:53` |
| Package manager | `pnpm@10.24.0` | `package.json:5` |
| Orchestrator | Turbo `^2.5.0` | `package.json:13`, `turbo.json:3-16` |
| Bundler | Vite `^6.4.3` + `@vitejs/plugin-react ^4.7.0`, lib mode `es`+`cjs` | `packages/common-package/package.json:53,61`, `vite.lib.config.ts:25-31` |
| Sinh `.d.ts` | `tsc -p tsconfig.build.json` (chỉ `auth-package`, `design-tokens`, `tenant-context`) | `packages/auth-package/package.json:37-39` |
| Nhét CSS vào JS | `vite-plugin-css-injected-by-js ^3.5.2` | `packages/common-package/package.json:62` |
| TS config gốc | strict, ES2020, `moduleResolution: Bundler`, `jsx: react-jsx` | `tsconfig.base.json:3-16` |
| CSS | Tailwind `3.4.17` (common, notification, quiz-result, student-dashboard, test-result) hoặc `^3.3.5` (explanation); Sass `^1.x` | `packages/common-package/package.json:100,59`, `packages/explanation-package/package.json:60` |
| Registry | GitHub Packages `npm.pkg.github.com`, scope `@upbase-tech` | `.npmrc:2` |
| CI | GitHub Actions `publish.yml` -> reusable workflow ngoài repo | `.github/workflows/publish.yml:3-18` |
| Node | Không khai ở root; nhiều package ghi `engines.node ">=10"` | `packages/common-package/package.json:23-25` |

## Thư viện chính theo package

| Package | Thư viện (range) | Bằng chứng |
|---|---|---|
| `upbase-common-package` | `@tiptap/*` `^2.12.0`, `antd ^5.29.3`, `dayjs ^1.11.7`, `@floating-ui/react ^0.27.8`, `@tippyjs/react ^4.2.6`, `clsx ^2.1.1`, `prosemirror-state ^1.4.4`, `tailwindcss 3.4.17` | `packages/common-package/package.json:67-101` |
| `explanation-package` | `styled-components 5.3.11`, `react-shadow ^20.4.0`, `@xyflow/react ^12.8.2`, `@fortune-sheet/react ^0.19.1`, `@cyntler/react-doc-viewer 1.17.1`, `@cloudflare/stream-react ^1.9.1`, `react-markdown ^6.0.3`, `react-hook-form ^7.55.0`, `lodash`, `antd` | `packages/explanation-package/package.json:65-79` |
| `student-dashboard-package` | `echarts ^6.0.0`, `recharts ^3.5.1`, `antd`, `dayjs`, `lodash` | `packages/student-dashboard-package/package.json:59-65` |
| `test-result-package` | `@lottiefiles/react-lottie-player ^3.5.4`, `dompurify ^3.4.18`, `react-intersection-observer ^9.15.0`, `clsx`, `lodash` | `packages/test-result-package/package.json:61-67` |
| `upbase-notification` | `antd`, `clsx`, `dayjs ^1.11.12` | `packages/notification-package/package.json:59-63` |
| `quiz-result-package` | `lodash ^4.17.21` (+ `antd` ở devDependencies, peer `^5.0.0`) | `packages/quiz-result-package/package.json:62-64,37` |
| `auth-package` | `keycloak-js` peer `^25 || ^26` (dev `^26.2.0`) | `packages/auth-package/package.json:44-47,57` |
| `design-tokens`, `tenant-context` | không có runtime dependency | `packages/design-tokens/package.json:44-48`, `packages/tenant-context/package.json:31-55` |

## React

Peer range không đồng nhất: `^16.8 || ^17 || ^18` ở `common`, `explanation`, `notification`, `quiz-result`, `test-result`, `ui`; `^18 || ^19` ở `student-dashboard`; `^17 || ^18 || ^19` (optional) ở `auth-package`, `tenant-context` (`packages/*/package.json`, mục `peerDependencies`). Dev/test dùng React `^18.3.0`; `@types/react` `18`.

## `pnpm.overrides` ở root

`postcss ^8.5.23`, `nanoid@3 ^3.3.18`, `browserslist ^4.28.7`, `source-map-js ^1.2.2`, `prosemirror-view ^1.42.3`, `markdown-it ^14.3.3`, `fast-uri ^3.1.9`, `baseline-browser-mapping ^2.11.0`, `postcss-selector-parser@6 ^6.1.5`, `postcss-selector-parser@7 ^7.1.6` (`package.json:15-27`; commit `448d575` sửa `package.json` gốc, +14 dòng).

## Test/lint

Xem `code-quality-assessment.md`.
