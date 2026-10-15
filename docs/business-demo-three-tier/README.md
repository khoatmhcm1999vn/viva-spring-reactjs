# Vivacon — Business Demo: Kiến trúc 3 tầng

## Mục đích
Tài liệu chuẩn bị cho phần demo kiến trúc 3 tầng từ góc nhìn Business Analyst. Luồng nghiệp vụ xuyên suốt là **tạo bài đăng**.

## Bản trình chiếu
Bản PowerPoint được phát hành dưới dạng tệp đính kèm trong cuộc trò chuyện. Nội dung tại đây giúp người xem hiểu bối cảnh và liên kết với source code.

## Tóm tắt nội dung
1. Tổng quan ứng dụng Vivacon.
2. Use case tạo bài đăng.
3. Tổng quan Presentation, Business Logic và Data Access.
4. Mapping từng tầng vào React, Spring Boot và PostgreSQL/JPA.
5. Luồng end-to-end khi người dùng bấm Đăng bài.
6. Các điểm kiểm thử dành cho Business/UAT.
7. Kịch bản demo 5 phút.

## Mapping vào repository
- **Presentation:** React frontend — `frontend/src/api/postService.js`, `frontend/src/components/pages/PostsListPage/index.js`.
- **Business Logic:** Spring Boot — `src/main/java/com/vivacon/controller/PostController.java`, `src/main/java/com/vivacon/service/impl/PostServiceImpl.java`.
- **Data Access:** Spring Data JPA/PostgreSQL — `src/main/java/com/vivacon/repository/PostRepository.java`, cùng repository lưu attachments.

## Luồng tạo bài ở mức tổng quan
1. Người dùng nhập caption, chọn attachment và quyền riêng tư trên UI.
2. React gửi yêu cầu tạo bài lên API.
3. `PostController` tiếp nhận request và kích hoạt validation.
4. `PostServiceImpl` tạo bài đăng, lưu attachment và phát sự kiện tạo bài.
5. Repository/JPA ghi dữ liệu vào PostgreSQL.
6. Kết quả được trả về frontend để hiển thị.

## Góc nhìn Business/UAT
- Caption không được để trống.
- Phải có ít nhất một attachment theo request validation hiện có.
- Bài đăng và attachment được liên kết đúng.
- Quyền riêng tư được lưu cùng bài đăng.
- Người dùng nhận phản hồi phù hợp khi thành công hoặc đầu vào không hợp lệ.

## Lưu ý
Đây là cách ánh xạ khái niệm kiến trúc 3 tầng lên cấu trúc hiện tại; không có nghĩa backend chỉ chứa đúng ba package. Backend tổ chức theo các technical layer như controller, service, repository, DAO, entity, DTO và các thành phần hỗ trợ khác.
