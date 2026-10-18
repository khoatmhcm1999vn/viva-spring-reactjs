# Dữ liệu test `POST /api/v1/registration`

Dán từng body vào Swagger (`Try it out`), bấm `Execute`. API này không cần JWT.
Kết quả bên dưới đã chạy thật trên stack demo local (profile `dev`).

## Ràng buộc (theo `RegistrationRequest` và các validator)

| Trường | Ràng buộc |
|---|---|
| `email` | bắt buộc, đúng định dạng email, chưa có trong DB |
| `username` | bắt buộc, ít nhất 3 ký tự, chỉ gồm `a-z A-Z 0-9 . _ -`, chưa có trong DB |
| `fullName` | bắt buộc, 1 đến 50 ký tự |
| `password` | 8 đến 30 ký tự, có ít nhất 1 số, 1 chữ thường, 1 chữ hoa, 1 ký tự đặc biệt (vd `@ ! #`) |
| `matchingPassword` | bắt buộc, phải giống `password` |

Thành công trả `200` với body rỗng. Profile `dev` bỏ qua xác thực email nên đăng nhập
được ngay bằng `POST /api/v1/login`. Ở profile `prod` tài khoản ở trạng thái chờ kích hoạt.

Email và username chỉ dùng được **một lần**: chạy lại ca hợp lệ thì đổi số ở cuối
(vd `tester01` thành `tester02`), nếu không sẽ nhận lỗi trùng.

## Ca hợp lệ (mong đợi `200`)

**H1. Ký tự đặc biệt `@`**
```json
{
  "email": "qa.tester01@vivacon.test",
  "username": "qa_tester01",
  "fullName": "QA Tester 01",
  "password": "Test@1234",
  "matchingPassword": "Test@1234"
}
```

**H2. Ký tự đặc biệt `!`, username có dấu chấm và gạch ngang**
```json
{
  "email": "qa.tester02@vivacon.test",
  "username": "qa.tester-02",
  "fullName": "Nguyễn Văn Test",
  "password": "Vivacon!2026",
  "matchingPassword": "Vivacon!2026"
}
```

**H3. Biên dưới: username 3 ký tự, mật khẩu đúng 8 ký tự**
```json
{
  "email": "qa.tester03@vivacon.test",
  "username": "qa3",
  "fullName": "Q",
  "password": "Abc#1234",
  "matchingPassword": "Abc#1234"
}
```

Sau đó thử đăng nhập: `POST /api/v1/login` với `{"username":"qa_tester01","password":"Test@1234"}`.

## Ca không hợp lệ (mong đợi `400`)

| # | Ca | Body | `message` trả về |
|---|---|---|---|
| L1 | Mật khẩu không có ký tự đặc biệt | `{"email":"x1@vivacon.test","username":"x1_user","fullName":"X","password":"Test12345","matchingPassword":"Test12345"}` | `password: Invalid Password` |
| L2 | Mật khẩu thiếu chữ hoa | `{"email":"x2@vivacon.test","username":"x2_user","fullName":"X","password":"test@1234","matchingPassword":"test@1234"}` | `password: Invalid Password` |
| L3 | Mật khẩu 7 ký tự | `{"email":"x3@vivacon.test","username":"x3_user","fullName":"X","password":"Te@1234","matchingPassword":"Te@1234"}` | `password: Invalid Password` |
| L4 | Mật khẩu 31 ký tự | `{"email":"x4@vivacon.test","username":"x4_user","fullName":"X","password":"Te@1aaaaaaaaaaaaaaaaaaaaaaaaaaa","matchingPassword":"Te@1aaaaaaaaaaaaaaaaaaaaaaaaaaa"}` | `password: Invalid Password` |
| L5 | Nhập lại mật khẩu sai | `{"email":"x5@vivacon.test","username":"x5_user","fullName":"X","password":"Test@1234","matchingPassword":"Test@12345"}` | `registrationRequest: The matching password is not correct !` |
| L6 | Email sai định dạng | `{"email":"khongphaiemail","username":"x6_user","fullName":"X","password":"Test@1234","matchingPassword":"Test@1234"}` | `email: must be a well-formed email address` |
| L7 | Email đã tồn tại (chạy sau H1) | `{"email":"qa.tester01@vivacon.test","username":"x7_user","fullName":"X","password":"Test@1234","matchingPassword":"Test@1234"}` | `email: Email is already existed` |
| L8 | Username đã tồn tại | `{"email":"x8@vivacon.test","username":"admin","fullName":"X","password":"Test@1234","matchingPassword":"Test@1234"}` | `username: Username adminalready exists!` |
| L9 | Username 2 ký tự | `{"email":"x9@vivacon.test","username":"ab","fullName":"X","password":"Test@1234","matchingPassword":"Test@1234"}` | `username: Username abis not match the pattern!, username: size must be between 3 and ...` |
| L10 | Username có dấu cách | `{"email":"x10@vivacon.test","username":"qa user","fullName":"X","password":"Test@1234","matchingPassword":"Test@1234"}` | `username: Username qa useris not match the pattern!` |
| L11 | fullName 51 ký tự | `{"email":"x11@vivacon.test","username":"x11_user","fullName":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","password":"Test@1234","matchingPassword":"Test@1234"}` | `fullName: size must be between 1 and 50` |
| L12 | Thiếu email | `{"username":"x12_user","fullName":"X","password":"Test@1234","matchingPassword":"Test@1234"}` | `email: must not be empty` |

Thông báo lỗi username thiếu dấu cách (`adminalready`, `abis`) là lỗi chính tả có sẵn
trong message của backend, không phải do dữ liệu.

## Dọn tài khoản test (DB local)

```powershell
docker exec vivacon-db psql -U postgres -d vivacon -c "DELETE FROM setting WHERE account_id IN (SELECT id FROM account WHERE email LIKE '%@vivacon.test'); DELETE FROM account WHERE email LIKE '%@vivacon.test';"
```
