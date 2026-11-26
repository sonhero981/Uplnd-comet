# Business Overview — lms-fe

> Nguồn: `origin/staging` @ `baf430fa7`. Độ sâu: Minimal, trừ lát cắt hồ sơ học viên (My Profile / My Managers). Quy ước nội bộ của repo xem `.claude/CLAUDE.md` (không chép lại ở đây).

## Mục đích

`lms-fe` là front-end của UpBase LMS: monorepo pnpm + Turborepo, 3 app Next.js 14 dùng chung các package `@lms/*` (`package.json:1-60`, `pnpm-workspace.yaml:1-8`, `.claude/CLAUDE.md:3`).

| App | Vai trò (từ code) | Bằng chứng |
|---|---|---|
| `lms-pro` | Cổng chính cho học viên (STUDENT) và giáo viên (TEACHER): khoá học, lịch, chứng chỉ, hồ sơ, gamification, route `/teachers/*` | `apps/lms-pro/src/constants/routers.ts:1-51`, `apps/lms-pro/package.json` |
| `lms-test` | App làm bài thi (route `app/test`) | `.claude/rules/07-testing-patterns.md` (mô tả), cây `apps/lms-test/src/app/test` |
| `lms-zoom` | Họp Zoom nhúng (`app/meeting`), có `middleware.ts` | `apps/lms-zoom/src/middleware.ts:1-31`, `apps/lms-zoom/package.json` (`@zoom/meetingsdk`) |

Chỉ `lms-pro` và `lms-test` nằm trong ma trận deploy của CI (`.github/workflows/deploy-staging.yml:24-34`); `lms-zoom` không có trong ma trận.

## Chức năng nghiệp vụ theo feature package

`features/*` (12 package, tên `@lms/feature-*`): `attendance`, `auth`, `certificate`, `class`, `courses`, `dashboard`, `examination`, `gamification`, `notifications`, `schedule`, `test`, `user`. Chỉ đọc cấp thư mục, trừ `user` và `auth` và `gamification` (xem dưới). Lưu ý `features/gamification` có trên staging nhưng chưa có trong danh sách feature của `.claude/rules/01-code-placement.md`.

## Lát cắt sâu: hồ sơ học viên và khối My Managers

Trang hồ sơ học viên là route `/overview` (`PageLink.MYPROFILE`, `apps/lms-pro/src/constants/routers.ts:25`), cài đặt bằng route động `app/[page]` (`apps/lms-pro/src/app/[page]/page.tsx`). Trang chỉ dành cho STUDENT: `withAuthorization([UserType.STUDENT])(ProfilePage)` (`page.tsx:527`).

Các tab trên desktop (`page.tsx:227-254`): **My profile**, **Security**, và **Badges** (chỉ khi gamification bật huy hiệu, `useGamificationVisibility().badges`, `page.tsx:86-87`, `244-253`). Tab Setting đang bị comment (`page.tsx:234-237`).

Khối **My Managers** (LMS-F002 US17, mã UPLND-495 / BE UPLND-485) hiện nằm trong tab My profile ngay dưới `MyProfile` (`page.tsx:189-195`) và trong mục Collapse `my-managers` của bản mobile (`page.tsx:272-282`). Chi tiết hành vi, dữ liệu, trạng thái rỗng: `architecture.md` mục "Learner profile deep slice" và `areas/learner-profile.md`.

Quy tắc nghiệp vụ US17 mà code tự ghi lại trong comment (`MyManagers.tsx:3-6`, `my-managers.service.ts:3-8`): chỉ xem (BR-17.1), hiện ảnh/tên/email (BR-17.2), quản lý chính đứng đầu có nhãn (BR-17.3), không hiện nhóm (BR-17.4), không hiện chính học viên (BR-17.5, do BE lọc). Việc so khớp với PRD nằm ở `areas/learner-profile.md`.

## Ngôn ngữ giao diện

Không có i18n thật: `next-i18next` được khai báo trong `apps/lms-pro/package.json` nhưng grep `i18next|useTranslation` trên `apps libs features` (loại trừ JSON) không có kết quả. Chuỗi UI hardcode; `<html lang="vi">` (`apps/lms-pro/src/app/layout.tsx:113`), nhưng chuỗi ở trang hồ sơ và khối My Managers là tiếng Anh (`page.tsx:231`, `MyManagers.tsx:70-83`). Thông báo lỗi API lấy từ `libs/core/constants/exception-errors/en.exceptions.json` (`libs/core/constants/exception-errors/index.ts:1`).
