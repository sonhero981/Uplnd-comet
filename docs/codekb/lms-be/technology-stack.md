# Technology Stack — lms-be

> `origin/staging` @ `a2f4821`. Nguồn: `package.json`, `nx.json`, `docker-compose.yml`, `.github/workflows/*`, `.eslintrc.json`. Phiên bản lấy từ `package.json` (khai báo, không phải phiên bản đã cài trong `yarn.lock`).

| Hạng mục | Công nghệ | Ghi chú / nguồn |
|---|---|---|
| Ngôn ngữ | TypeScript `~5.1.3` | `package.json` devDependencies |
| Monorepo | Nx `16.5.1` (`@nx/*` 16.10.0), yarn (`yarn.lock`, `.yarnrc`) | `nx.json`, `jest.config.ts` dùng `getJestProjects()` |
| Framework | NestJS `^10.0.2` (common/core/microservices/platform-express/swagger/schedule/terminus/bull/websockets/jwt) | `package.json` |
| ORM / DB | TypeORM `0.3.20`, `pg ^8.11.1`, PostgreSQL 16 (`docker-compose.yml` `postgres:16`) | RLS theo tenant, xem [architecture.md](architecture.md) |
| Message bus | Kafka qua `kafkajs ^2.2.4` + `@nestjs/microservices`; broker dev/staging `redpandadata/redpanda:v26.2.1` | `docker-compose.yml` |
| Cache / queue | Redis 7.0.11 (`ioredis`, `cache-manager-redis-yet`, `bull ^4.10.4`) | `docker-compose.yml`, `package.json` |
| Auth | Keycloak (JWT, gateway Envoy, `deploy/envoy`), `casbin` + `nest-authz` + `typeorm-adapter` cho phân quyền | `libs/services/src/lib/keycloak`, `libs/services/src/lib/casbin` |
| Ngữ cảnh request | `nestjs-cls ^4.4.1` | tenant/connection theo request |
| Log | `nestjs-pino`, `pino` | `apps/*/src/main.ts` dùng `PinoAppLogger` |
| Tích hợp | `@larksuiteoapi/node-sdk` (Lark HR), `@aws-sdk/client-s3`, `@elastic/elasticsearch`, `firebase-admin`, `@sendgrid/mail`, `nodemailer`, `mjml`, `handlebars`, `socket.io` (+ redis adapter), `@ffmpeg-installer/ffmpeg` | `package.json` |
| File / dữ liệu | `exceljs`, `xlsx`, `csv-parse`, `sharp`, `pdf-to-img` | import/export |
| Validation | `class-validator ^0.14`, `class-transformer`, `joi` | `ValidationPipe` toàn cục ở `apps/ops/src/main.ts:29-46` (lỗi 422) |
| Test | Jest `^29.4.1`, `ts-jest`, `@nx/jest`; chỉ 13 file `*.spec.ts` toàn repo, không có spec nào cho group | xem [code-quality-assessment.md](code-quality-assessment.md) |
| Lint / format | ESLint `~8.15.0` + `@nx/enforce-module-boundaries`, `eslint-plugin-jsdoc` (bắt buộc JSDoc cho function/method), Prettier `^2.6.2`, Husky + lint-staged + commitlint | `.eslintrc.json`, `.husky/pre-commit` (`npx lint-staged`), `.husky/commit-msg` (commitlint) |
| Build/deploy | Webpack per app (`apps/*/webpack.config.js`), Docker (`docker.app.Dockerfile`, `docker.runtime-base.Dockerfile`), một image cho cả 7 service, GitHub Actions `deploy-staging.yml`, `deploy-production.yml` | `.github/workflows/deploy-staging.yml` |
| Quan sát | `deploy/observability` (Alloy/Loki theo comment trong `main.ts`) | `apps/ops/src/main.ts:79-82` |

## Alias module (tsconfig paths)

Các lib import bằng `@sapp/*`: `@sapp/constants`, `@sapp/database`, `@sapp/exceptions`, `@sapp/interface`, `@sapp/modules`, `@sapp/services`, `@sapp/utils`, `@sapp/validation`, `@sapp/swagger` (xuất hiện trong import ở `apps/ops/src/main.ts:4-9`; ánh xạ chi tiết ở `tsconfig.base.json`, chưa đọc từng dòng).

## Scripts đáng biết (`package.json`)

`typeorm:run-migrations` / `typeorm:revert-migrations` (data source `libs/database/typeorm.config.ts`), `typeorm:create-migration`, `lint`, `test` (`nx test`), `serve:all` (chạy đồng thời ops, lms, event-processor, video, background-job, notification). Repo không có script `build` ở root (đã nêu trong `CLAUDE.md` của repo cha). Workflow deploy staging chỉ build image và `docker compose up` theo lô (`deploy-staging.yml:136`), grep không thấy bước lint/test/migration.
