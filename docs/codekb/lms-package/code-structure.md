# Code Structure — lms-package

> Overview. Cấu trúc lấy từ `git ls-tree -r origin/main` (704 file, `origin/main` @ `448d575`); nội dung chỉ đọc ở các file nêu `file:line`.

## Gốc repo

| File | Vai trò | Bằng chứng |
|---|---|---|
| `package.json` | Root private `upbase-lms-package`, `packageManager: pnpm@10.24.0`, script `turbo run build/dev/lint/test`, `pnpm.overrides` cho 10 dependency (postcss, prosemirror-view, markdown-it...) | `package.json:2,5-11,15-27` |
| `pnpm-workspace.yaml` | Workspace: `configs/*`, `packages/*` | `pnpm-workspace.yaml:1-3` |
| `turbo.json` | `build` phụ thuộc `^build`, output `dist/**`; `test` phụ thuộc `^build` | `turbo.json:3-16` |
| `tsconfig.base.json` | TS strict, ES2020, `moduleResolution: Bundler`, `jsx: react-jsx`, `noEmit` | `tsconfig.base.json:3-16` |
| `.npmrc` | Map scope `@upbase-tech` -> `https://npm.pkg.github.com/` (không chứa token) | `.npmrc:2`, `.gitignore:38-39` |
| `.github/workflows/publish.yml` | Publish khi push `main` / `workflow_dispatch` | `.github/workflows/publish.yml:3-7` |
| `.github/CODEOWNERS` | `@UpBase-Tech/lms`; riêng CODEOWNERS thuộc `@UpBase-Tech/sre` | `.github/CODEOWNERS:1-2` |
| `pnpm-lock.yaml` | Lockfile (bỏ qua, không đọc) | `ls-tree` |

`docs/` không tồn tại ở `origin/main` (`git ls-tree` không có đường dẫn `docs/`), dù `packages/common-package/PUBLISH.md:8` và `packages/design-tokens/README.md:4` trỏ tới `docs/PUBLISHING.md`, `docs/saas-detailed-design.md`.

## Package (số file theo `ls-tree`, gồm cả `dev/`, cấu hình)

| Thư mục | Số file | Entry (`source`) | Cấu trúc `src/` (từ `ls-tree`) |
|---|---|---|---|
| `packages/auth-package` | 11 | `src/index.ts` | `core/{auth-manager,environment,types}.ts`, `react/{auth-context.tsx,index.ts}` |
| `packages/design-tokens` | 14 | `src/index.ts` | `core/{antd,color,css,defaults,scale,store,types}.ts`, `tailwind/index.ts` |
| `packages/tenant-context` | 19 | `src/index.ts` | `core/{cache,from-me,parse-host,tenant-claim,tenant-manager,types}.ts`, `core/resolvers/{http,static}.ts`, `react/`, `server/`, `tenants/upbase.ts` |
| `packages/common-package` | 340 | `src/index.tsx` | `components/{UpbaseCalendar,UpbaseCalendarV2,UpbaseEditor,UpbaseEditorV2}`, `hooks/` (7 hook), `icons/`, `iconsV2/`, `styles/*.scss`, `types/`, `utils/`, `constants/`, `local-editor.tsx` |
| `packages/explanation-package` | 144 | `src/index.tsx` | `components/` (quiz-component, quiz-component-v2, questionType, essay-render, comment-*, list-question...), `contexts/`, `hooks/`, `styles/`, `utils/` |
| `packages/notification-package` | 38 | `src/index.tsx` | `components/notification/`, `common/base/`, `types/`, `styles/` |
| `packages/quiz-result-package` | 38 | `src/index.tsx` | `components/{ScoreDetails,ScoreDetailsV2,ListScoreCollapse,pagination,base,common}`, `type/`, `ultis/` |
| `packages/test-result-package` | 49 | `src/index.tsx` | `components/{TestResultPage,ScoreDetail,acca,cfa,cma,table,recommendation,modal,button}`, `types/`, `utils/` |
| `packages/student-dashboard-package` | 35 | `src/index.tsx` | `components/{CourseDashBoard,ExamDashBoard,charts/*,base}`, `types/DashBoard.ts`, `hook/` |
| `packages/ui` | 3 | `src/index.tsx` | một file |
| `configs/tailwind-config` | 3 | `index.js` | preset Tailwind |

Mỗi package component (trừ `ui`) đều có `dev/` (Vite demo, cổng cố định 5199 `common`, 5201 `notification`, 5202 `explanation`, 5203 `quiz-result`, 5204 `test-result`, 5205 `student-dashboard`: các script `dev` trong `packages/*/package.json`), `scripts/postbuild-css-stub.cjs`, `vite.lib.config.ts`.

## Mẫu mã lặp lại

- Entry component: `export const X = (props) => ...` hoặc `export default` ở `src/index.tsx` (ví dụ `packages/quiz-result-package/src/index.tsx:25`, `packages/student-dashboard-package/src/index.tsx:63`). Mỗi package một cách export khác nhau (named vs default), xem `api-documentation.md`.
- Phiên bản V2 song song bản cũ trong cùng package: `UpbaseCalendar`/`UpbaseCalendarV2`, `UpbaseEditor`/`UpbaseEditorV2` (`packages/common-package/src/index.tsx:4-7`), `ExplanationPackage`/`ExplanationPackageV2` (`packages/explanation-package/src/index.tsx:46,69`), `ScoreDetails`/`ScoreDetailsV2` (`packages/quiz-result-package/src/index.tsx:4,6`). Hai phiên bản copy gần như nguyên thư mục (`UpbaseEditor` và `UpbaseEditorV2` cùng có `simpleTipTap/tiptap-icons/*`, theo `ls-tree`).
- Path alias trong Vite: `@components`, `@contexts`, `@services`, `@styles`, `@utils`, `src` (`packages/common-package/vite.lib.config.ts:16-23`); `explanation-package` thêm `contexts`, `hooks`, `utils`, `constant` (`packages/explanation-package/vite.lib.config.ts:15-24`).

## Phân loại file (theo thư mục, từ `ls-tree`, chưa mở từng file)

| Loại | Vị trí |
|---|---|
| Configuration | `vite.lib.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig*.json`, `.eslintrc`, `.prettierrc` |
| Static/Asset | `*.scss`, `*.module.css`, `public/assets/images/*` (explanation), `src/assets/images/*` (student-dashboard), `animation.json` (test-result) |
| Test | 5 file `src/index.test.tsx` (xem `code-quality-assessment.md`) |
| Utility/Helper | `utils/`, `hooks/`, `constants/` |
| Controller/Service/Repository/Migration/Middleware | không có (repo thư viện, không có tầng server) |

## Bỏ qua (Left out)

- `packages/common-package/dist-local/editor.mjs`: bundle build được commit (`ls-tree`), không đọc, không liệt kê nội dung.
- `pnpm-lock.yaml`.
