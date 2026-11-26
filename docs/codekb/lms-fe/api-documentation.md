# API Documentation — lms-fe (API client layer)

> lms-fe không phơi API; tài liệu này mô tả lớp client gọi `lms-be` và các endpoint nó gọi. Nguồn: `origin/staging` @ `baf430fa7`. Đọc sâu: `libs/api/client.ts`, `libs/api/api/profile/index.ts`, `libs/api/index.ts`, `features/user/.../MyManagers/my-managers.service.ts`. Các file API khác chỉ đếm số lệnh `fetcher(` (shallow). Quy ước: `.claude/inventory/05-api.md`, `.claude/rules/03-architecture-patterns.md`.

## Client layer

| Thành phần | Vị trí | Hành vi |
|---|---|---|
| `createHttpClient` / `configureHttpClient` | `libs/api/client.ts:91-267` | axios instance, `timeout 30000`, `validateStatus` 2xx+304, header `Content-Type: application/json` (`:94-107`) |
| `fetcher(url, cfg)` | `client.ts:109-114`, export `:278-279` | `request(url,cfg)` rồi trả `res.data`; ném lỗi nguyên bản |
| `fetchFormData` | `client.ts:231-251`, `:281-282` | multipart, `timeout:0`, từ chối FormData rỗng |
| `getRequest()` | `client.ts:293` | trả AxiosInstance đang active |
| Cờ `silent` | `client.ts:10-15`, `:215` | request không toast lỗi |
| Bơm auth | `apps/lms-pro/src/services/request.ts:9-27` | `getAuthHeader` chờ `auth.waitUntilReady()`, trả `Bearer <token>`; `refreshAuth` = `getAuthManager().refreshToken()` |
| `apiURL` | `libs/api/constants.ts:1` | `process.env.NEXT_PUBLIC_BASE_API_URL!` |

Lỗi: toast theo `error.response.data.error.code` tra trong `en.exceptions.json`; mã trong `toastExceptions` (kể cả `404|630001`) và 401 chung không toast; mã `403*` đưa về `/` (`client.ts:42-55`, `80-89`, `204-229`). Phong bì lỗi BE mà FE đọc là `{ error: { code } }` (`client.ts:150`, `207`).

Cách app dùng: `apps/lms-pro/src/api/<domain>/index.ts` hoặc re-export từ `@lms/api` (ví dụ `apps/lms-pro/src/api/profile/index.ts:1` = `export { AuthAPI, MyProfileAPI as default } from '@lms/api'`). `libs/api/index.ts:21-27` re-export các default export dưới tên riêng.

## Endpoints: học viên xem quản lý (đọc sâu)

| Method | Path | Hàm FE | Ghi chú |
|---|---|---|---|
| GET | `/users/me/managers` | `MyProfileAPI.getMyManagers` (`libs/api/api/profile/index.ts:16-18`) | Trả `any`; không truyền `silent`, nên lỗi sẽ toast qua interceptor. Gọi bởi `MyManagers` qua `useQuery(['my-managers'])` (`MyManagers.tsx:56-60`) |

Dạng dữ liệu FE giả định cho `data` (`my-managers.service.ts:20-30`):

| Field | Kiểu | Dùng |
|---|---|---|
| `user_id` | string | `id` (key của `<li>`) |
| `full_name` | string or null | `fullName`; null thì dùng `email` (`:41`) |
| `email` | string or null | `email`; null thì `''` |
| `avatar` | `Record<string,string>` or null | lấy `ORIGIN`, không có thì giá trị đầu tiên khác rỗng (`pickAvatar`, `:32-33`) |
| `type` | `'PRIMARY'` or `'GROUP'` or `'INHERITED'` | chỉ để suy ra `isPrimary = type==='PRIMARY'` (`:44`); không hiện `GROUP`/`INHERITED` |

`FetchMyManagers = () => Promise<{ data?: IMyManagerDto[] | null }>` (`:30`): `fetcher` trả body, nên `body.data` là mảng. Không có field điện thoại hay tên nhóm trong DTO; DTO là giả định phía FE, xác nhận contract thật ở `lms-be` (comment `my-managers.service.ts:3-5` nói BE UPLND-485 trả đúng những gì US17 cho phép).

## Endpoints khác trong `MyProfileAPI` / `AuthAPI` (`libs/api/api/profile/index.ts`)

`GET /users/profile` (`:12`), `GET /users/subject-of-hubspot?...` (`:21`), `GET /users/examination-subjects?...` (`:36`), `PUT /users/programs` (`:49`). `AuthAPI`: `GET me`, `POST auth/forgot-password`, `auth/forgot-password/verify-otp`, `auth/reset-password`, `POST changepassword`, `GET users/course-certificate/count`, `PUT users`, `POST users/contacts/:id/make-this-default`, `GET users/devices`, `DELETE users/devices/:id`, `GET users/activities`, `GET certificate?...`, `POST users/change-password/send-otp`, `POST users/change-password`, `GET notifications/pinned` (`:59-174`).

## Endpoints khác (shallow, chỉ số lệnh `fetcher(` đếm bằng `git grep -c`)

| File | Số `fetcher(` | Ví dụ path đã thấy |
|---|---|---|
| `libs/api/api/courses/index.ts` | 51 | (không đọc) |
| `libs/api/api/test-api/index.ts` | 18 | (không đọc) |
| `libs/api/api/class/index.ts` | 13 | `/classes/:id/exam-info`, `class-resource`, `/classes/student/learning-schedule` |
| `libs/api/api/activity/index.ts` | 8 | `course-discussions`, `quiz/:id/questions` |
| `libs/api/api/notification/index.ts` | 5 | `/notifications`, `/notifications/count-unread`, `/notifications/mark-read` |
| `libs/api/api/user/index.ts` | 7 | `auth/logout`, `/user-attendances/teacher/...` |
| `libs/api/api/upload/index.ts` | 2 | `resource/pre-upload/url`, `resource/pre-upload/metadata` |
| `apps/lms-pro/src/api/*` | calendar 2, course-activation 4, dashboard 6, event-test 2, my-request 11, progress 6, request 2, schedules 3, storyline 3, teacher 11 | `report/:id/overall`, `/request-schedules/...`, `class-teaching-progress`, `/calendar-student` |
| `features/gamification/src/api/GamificationAPI.ts` | 10 | `/gamification/{settings,me,rules,me/badges,leaderboard,leaderboard/me,campaigns,campaigns/:id/leaderboard}`; `/me` và `/rules` gọi với `silent:true` (`GamificationAPI.ts:62`, `67`) |
| `libs/api/redux/User/user.ts`, `libs/api/redux/Course/...` | (không đếm) | URL gom ở `libs/api/redux/User/url.ts` (`/me`, `/users`, `/users/devices`, `/users/activities`...) |

Lưu ý nhất quán: path khi có `/` đầu, khi không có; vài chỗ ghép `${apiURL}/...` (`libs/api/api/class/index.ts:29`). Phần này không thống nhất nên khi thêm API mới hãy theo dạng của file lân cận.

## Realtime

Gamification dùng socket.io (`features/gamification/package.json` khai `socket.io-client`; hook `useGamificationSocket.ts`, chưa đọc nội dung). Rules nói không có context socket/realtime; context thì đúng, hook riêng của feature thì có.
