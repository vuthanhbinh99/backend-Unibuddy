# Quy tắc đặt tên UniBuddy

Tài liệu này mô tả quy ước đặt tên đang dùng trong dự án, ưu tiên theo code backend và schema PostgreSQL hiện tại.

## 1. Hàm

- Dùng `camelCase`.
- Tên hàm nên bắt đầu bằng động từ hoặc cụm động từ rõ nghĩa.
- Các hàm kiểm tra điều kiện nên bắt đầu bằng `is`, `has`, `can`, `should`.
- Các hàm thao tác dữ liệu nên ưu tiên các tiền tố quen thuộc như `create`, `build`, `find`, `get`, `list`, `update`, `delete`, `revoke`, `clear`, `validate`, `map`.
- Không dùng dấu tiếng Việt, khoảng trắng, hoặc ký tự đặc biệt.

### Ví dụ thực tế

- `createApp`
- `buildRoutes`
- `buildContainer`
- `findByEmail`
- `findById`
- `revokeActiveSessionsByUserId`
- `clearFcmToken`
- `validateRequest`
- `mapUser`
- `mapSession`

## 2. Class

- Dùng `PascalCase`.
- Tên class nên là danh từ hoặc cụm danh từ mô tả vai trò.
- Ưu tiên gắn theo lớp kiến trúc: `Controller`, `UseCase`, `Repository`, `Service`, `Handler`, `Middleware`, `Verifier`, `Manager`, `Pool`.

### Ví dụ thực tế

- `AuthController`
- `UserController`
- `LoginUseCase`
- `RefreshTokenUseCase`
- `PostgresUserRepository`
- `PostgresSessionRepository`
- `PostgresConnectionPool`
- `JwtTokenService`
- `GoogleTokenInfoVerifier`

## 3. Tên bảng và tên cột trong database

- Dùng chữ thường và `snake_case`.
- Không dùng dấu tiếng Việt.
- Tên bảng/cột phải phản ánh đúng ngữ nghĩa nghiệp vụ, ưu tiên theo schema hiện tại của UniBuddy.
- Các cột khóa chính, khóa ngoại, mã định danh thường dùng tiền tố `ma_`.
- Các cột thời gian dùng tiền tố `thoi_gian_`.
- Các cột trạng thái dùng `trang_thai`.
- Các cột tên gọi thường dùng `ten_`.
- Các cột mô tả/nội dung thường dùng `mo_ta`, `noi_dung`.
- Các cột số lượng, đếm, thứ tự thường dùng `so_`, `thu_`, `tiet_`.
- Các cột liên quan người dùng/actor dùng `nguoi_` hoặc `ma_nguoi_dung` khi là khóa.
- Các cột đường dẫn/tệp dùng `duong_dan_`, `ten_file`, `loai_file`.

### Ví dụ thực tế

- Bảng: `nguoi_dung`, `phien_dang_nhap`, `nhom_hoc_tap`, `tai_lieu`
- Cột: `ma_nguoi_dung`, `ma_phien`, `thoi_gian_tao`, `thoi_gian_cap_nhat`
- Cột: `trang_thai`, `ten_hoc_ky`, `mo_ta`, `noi_dung`
- Cột: `nguoi_tao`, `nguoi_bao_cao`, `nguoi_kiem_duyet`

### Quy ước cho enum và chỉ mục

- Tên kiểu enum dùng tiền tố `enum_`.
- Giá trị enum dùng `UPPER_SNAKE_CASE`.
- Tên index/unique/constraint nên dùng `idx_`, `uq_`, `fk_`, `pk_` + tên bảng/cột liên quan.

### Ví dụ thực tế

- `enum_trang_thai_nguoi_dung`
- `enum_trang_thai_deadline`
- `enum_vai_tro_nhom`
- `idx_phien_dang_nhap_user`
- `uq_phien_dang_nhap_fcm_token`

## 4. Hằng số

- Hằng số cục bộ trong hàm dùng `camelCase`.
- Các object hằng số phục vụ runtime hoặc cấu hình dùng `camelCase`, ví dụ `config`, `logger`.
- Các object hằng số đóng vai trò namespace hoặc nhóm mã dùng `PascalCase` nếu đó là API public rõ ràng, ví dụ `ErrorCodes`.
- Các giá trị cố định, mã trạng thái, mã lỗi, enum value, key môi trường dùng `UPPER_SNAKE_CASE`.
- Không đặt tên hằng số mơ hồ như `data`, `value`, `tmp` nếu có thể mô tả rõ hơn.

### Ví dụ thực tế

- `ErrorCodes`
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `ACCOUNT_LOCKED`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`

## 5. Quy ước ngắn gọn cần giữ nhất quán

- `camelCase` cho hàm, biến, helper.
- `PascalCase` cho class và type.
- `snake_case` cho tên bảng/cột trong SQL.
- `UPPER_SNAKE_CASE` cho mã trạng thái và hằng số kỹ thuật.
