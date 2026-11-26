# Area: Learner profile và khối My Managers (LMS-F002 US17)

> Nguồn: `origin/staging` @ `baf430fa7`; mọi dòng đã đọc lại bằng `git show origin/staging:<path>`. Conventions của repo: `.claude/CLAUDE.md`, `.claude/rules/`. Lưu ý: working tree của lms-fe ở nhánh `main` KHÔNG có `MyManagers` (`git grep MyManagers origin/main` không ra kết quả); khối này chỉ có trên `origin/staging` (commit `339989f25`, PR #95, 2026-11-16).

## Vị trí trong ứng dụng

| Việc | Nơi | Dòng |
|---|---|---|
| Route | `/overview` = `PageLink.MYPROFILE`, cài bằng route động `app/[page]` | `apps/lms-pro/src/constants/routers.ts:25`, `:37` |
| Slug hợp lệ | `overview`, `devices`, `login_history`, `change_password`; slug khác gọi `notFound()` | `apps/lms-pro/src/app/[page]/layout.tsx:6`, `22-24`; `libs/core/constants/User.ts:60-61` |
| Quyền | chỉ STUDENT: `withAuthorization([UserType.STUDENT])(ProfilePage)` | `[page]/page.tsx:527` |
| Import | `MyManagers` từ `@lms/feature-user`, `MyProfileAPI` từ `src/api/profile` | `page.tsx:21`, `51` |
| Mount desktop | tab `my-profile`, dưới `MyProfile`, tiêu đề `My Managers` hardcode trong page | `page.tsx:179-197` (`194`) |
| Mount mobile | mục Collapse `my-managers` (nhãn `My Managers`), trong tab `my-profile` của `mobileOverviewItems`, mở qua `FullScreenMobile` | `page.tsx:272-282` (`277`), `329-348`, `459-501` |
| Tab | `My profile`, `Security`, `Badges` (khi `showBadges`); `Setting` bị comment | `page.tsx:227-254` |
| Tab ban đầu | `?tab=badges` thì `badges`, ngược lại `my-profile` | `page.tsx:90-92` |

## Dữ liệu và luồng

1. `MyManagers` nhận `fetchManagers` qua props; page truyền `MyProfileAPI.getMyManagers` (`page.tsx:194`, `277`). Lý do: `features/user` không khai `@lms/api` (`my-managers.service.ts:7-8`, `features/user/package.json`).
2. `MyProfileAPI.getMyManagers` = `fetcher('/users/me/managers')`, kiểu trả `Promise<any>` (`libs/api/api/profile/index.ts:15-18`). Không có `silent`, nên lỗi API đi qua toast của interceptor (`libs/api/client.ts:214-219`).
3. `useQuery(['my-managers'], () => getMyManagers(fetchManagers), { refetchOnWindowFocus:false })` (`MyManagers.tsx:56-60`). `staleTime` lấy mặc định toàn app 3.000.000 ms (`apps/lms-pro/src/app/providers.tsx:109-116`). Key không có id người dùng.
4. `getMyManagers` (service) ánh xạ `IMyManagerDto` thành `IMyManager` (`my-managers.service.ts:35-46`):

| DTO | Model | Quy tắc |
|---|---|---|
| `user_id` | `id` | |
| `full_name` | `fullName` | `full_name || email || ''` (`:41`) |
| `email` | `email` | `?? ''` |
| `avatar` (`Record<string,string>` or null) | `avatarUrl` | `avatar.ORIGIN`, nếu không có thì giá trị truthy đầu tiên, nếu không thì null (`:32-33`) |
| `type` (`PRIMARY`, `GROUP`, `INHERITED`) | `isPrimary` | `type === 'PRIMARY'` (`:44`); `GROUP` và `INHERITED` không được phân biệt |

5. Component sắp xếp: `[...data].sort((a,b) => Number(b.isPrimary) - Number(a.isPrimary))` (`MyManagers.tsx:63-65`); các người còn lại giữ thứ tự BE.

## Giao diện (`MyManagers.tsx`)

| Trạng thái | Nội dung hiện | Dòng |
|---|---|---|
| Đang tải | `Loading...` | `:69-70` |
| Lỗi | `Could not load your managers. Please try again later.` | `:71-74` |
| Rỗng | dòng đậm `No manager information yet`, dòng nhỏ `Please contact your operations team if you need to know who manages your learning.` | `:75-85` |
| Có dữ liệu | `<ul>` các `ManagerRow` (`key = m.id`) | `:86-92` |
| `ManagerRow` | ảnh tròn 40x40 (`avatarUrl || BlankAvatarImage`, `next/image`), họ tên (cắt ba chấm), nhãn `Primary manager` khi `isPrimary`, email là link `mailto:` | `:18-46` |

Hiện không có: số điện thoại, tên nhóm, loại quản lý `GROUP/INHERITED`, nút sửa. Component chỉ đọc, không có handler ghi nào. `next/image` chạy được với URL ảnh bất kỳ nhờ `images.remotePatterns` `https://**` (`apps/lms-pro/next.config.js`, khối `images`); `next.config.js` của lms-pro chỉ đọc 60 dòng đầu, nên đây là phần đã thấy. Ảnh dùng `alt={manager.fullName}`.

## Phụ thuộc của trang hồ sơ

- `withAuthorization` (`libs/HOC/src/withAuthorization.tsx`), `RouteGuard` (`features/auth/src/components/RouteGuard.tsx`): `architecture.md` mục auth.
- `@lms/core`: `ANIMATION`, `DEFAULT_PAGE_NUMBER`, `DEFAULT_PAGE_SIZE`, `IDeviceItem`, `NOTIFICATION_STATUS` (`page.tsx:10-16`), `MYPROFILE_TREE`, `SECURITY_TREE`.
- `@lms/contexts`: `UserType`, `userReducer`, `getLoginHistory`, `getLogoutUser`, `useCourseContext` (`page.tsx:3-9`).
- `@lms/hooks`: `useTailwindBreakpoint`, `useGamificationVisibility` (`page.tsx:30`). `useGamificationVisibility` chỉ đọc cache react-query `["gamification","me"]` và `["gamification","rules"]`, không fetch (`libs/hooks/useGamificationVisibility.ts:68-88`); cache do `useGamificationBootstrap` nạp (`GamificationRealtime.tsx:61`), chỉ chạy cho STUDENT (`useGamificationData.ts:31-37`). Tab Badges mất khi `badges` false và `activeTab` quay về `my-profile` (`page.tsx:158-163`).
- `localStorage`: trang dùng `getLocalStorageItem('pinnedStatus')` và `removeLocalStorageItem('pinnedId')` khi đăng xuất (`page.tsx:130-134`; helper ở `libs/utils/common.ts:351-361`, trả `""` khi thiếu key). `libs/core/constants/localStorageKeys.ts` chỉ có `REDIRECT_AFTER_LOGIN`. Đăng xuất qua Keycloak xoá cả `localStorage` (`keycloak.ts:60-63`).
- Dữ liệu hồ sơ khác (tên, avatar, điện thoại trong Redux `user.detail`, `user_contacts`) do `MyProfile`/`ProfileHeader` hiển thị, tách khỏi `MyManagers` (`features/user/src/components/profile/MyProfile.tsx`, đọc `#L1-L130`; `ProfileHeader.tsx` chỉ grep).

## So khớp với PRD `261005-group` US17

Nguồn: `uplnd_po_workflow/intents/261005-group/inception/prd/prd.md` dòng 1449-1500.

| Yêu cầu PRD | Code | Kết quả |
|---|---|---|
| Nhiều quản lý, không phải một (bảng UI) | `managers.map` ra nhiều `ManagerRow` (`MyManagers.tsx:87-91`) | Khớp |
| `BR-17.1` chỉ xem | không có nút/handler ghi trong `MyManagers.tsx`, `my-managers.service.ts` | Khớp |
| `BR-17.2` ảnh, tên, email, không điện thoại | `ManagerRow` chỉ hiện 3 thứ này (`:20-44`); DTO không có field phone (`service:21-28`) | Khớp ở FE. Việc BE có trả phone hay không FE không dùng, nên không kiểm ở đây |
| `BR-17.3` chính đứng đầu, có nhãn | sort `:63-65`, nhãn `Primary manager` (`:32-36`) | Khớp. Nhãn bằng tiếng Anh |
| `BR-17.4` không thấy nhóm | không render tên nhóm; DTO không có tên nhóm; `GROUP` và `INHERITED` gộp chung | Khớp ở FE |
| `AC17.4` dòng rỗng đúng nguyên văn *Chưa có thông tin quản lý. Liên hệ bộ phận vận hành nếu cần.* | Code hiện hai dòng tiếng Anh: `No manager information yet` và `Please contact your operations team if you need to know who manages your learning.` (`:78-84`) | **Không khớp nguyên văn** (khác ngôn ngữ, và tách thành hai dòng) |
| Tên khối *Quản lý của tôi* | `My Managers` (`page.tsx:192`, `274`) | Khác ngôn ngữ; cả trang hồ sơ dùng tiếng Anh (`page.tsx:231`, `392`) |

Ghi chú thêm:
- Comment trong code nhắc `BR-17.5` (BE lọc chính học viên) và `AC17.6` (dùng được ở 375 px) (`AC17.6` ở `MyManagers.tsx:6`, `BR-17.5` ở `my-managers.service.ts:6`); bản `prd.md` hiện đọc được chỉ có `BR-17.1` đến `BR-17.4` và `AC17.1` đến `AC17.4` (comment ghi PRD v0.12, `grep "AC17.6|BR-17.5"` trên `prd.md` không ra kết quả). Không kiểm được hai mục đó với PRD trong repo này.
- Khả năng dùng ở 375 px chỉ thấy qua class (`min-w-0`, `truncate`, `shrink-0`; `MyManagers.tsx:27-29`, `40`); chưa chạy trình duyệt nên không xác nhận bằng quan sát.
- Đổi chữ trạng thái rỗng sang nguyên văn PRD cần sửa `MyManagers.tsx:75-85`; không có cơ chế i18n để đổi bằng cấu hình.
