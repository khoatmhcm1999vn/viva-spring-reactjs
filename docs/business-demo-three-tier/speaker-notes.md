# Vivacon – Business Demo: Kiến trúc 3 tầng

Nguồn tham chiếu: https://github.com/khoatmhcm1999vn/viva-spring-reactjs

## Mục tiêu
Giải thích cách một luồng nghiệp vụ của Vivacon đi qua Presentation, Business Logic và Data Access. Góc nhìn dành cho Business Analyst: mục tiêu nghiệp vụ, đầu vào/đầu ra, trách nhiệm từng tầng và các điểm có thể kiểm thử.

## Lời thoại theo slide

### Slide 1 – Mở đầu
Hôm nay em xin giới thiệu Vivacon ở góc nhìn nghiệp vụ và cách kiến trúc 3 tầng hỗ trợ các chức năng. Phần trình bày tập trung vào luồng người dùng tạo một bài đăng, thay vì đi sâu vào code.

### Slide 2 – Tổng quan sản phẩm
Vivacon là ứng dụng mạng xã hội kiểu Instagram. Nhóm chức năng chính gồm tài khoản, đăng bài hình ảnh, theo dõi, tương tác qua like/comment, nhắn tin thời gian thực, thông báo và quản trị. Các vai trò nghiệp vụ trong sản phẩm là USER, ADMIN và SUPER_ADMIN.

### Slide 3 – Luồng nghiệp vụ
Để dễ hình dung, ta lấy use case tạo bài đăng. Người dùng nhập caption, chọn ảnh và quyền riêng tư. Hệ thống cần kiểm tra dữ liệu bắt buộc, lưu bài đăng và tệp đính kèm, rồi trả kết quả để hiển thị. Đây là luồng em dùng xuyên suốt để chỉ ra trách nhiệm từng tầng.

### Slide 4 – Kiến trúc ba tầng
Từ góc nhìn business, ba tầng không phải ba bước nghiệp vụ độc lập mà là ba trách nhiệm kỹ thuật phối hợp. Presentation là nơi người dùng tương tác; Business Logic xử lý quy tắc nghiệp vụ; Data Access lưu và truy xuất dữ liệu. Request đi xuống, kết quả trả ngược lên.

### Slide 5 – Presentation Layer
Tầng trình bày được xây bằng React. Người dùng thao tác tại màn hình newsfeed hoặc chức năng tạo bài. Frontend gom caption, ảnh đính kèm và lựa chọn quyền riêng tư; gọi API tạo bài qua postService. Mục tiêu là cho người dùng trải nghiệm rõ ràng, không trực tiếp truy cập cơ sở dữ liệu.

### Slide 6 – Business Logic
Tầng Business Logic nằm ở Spring Boot. PostController nhận POST /api/v1/post và kiểm tra request hợp lệ; PostServiceImpl phối hợp tạo bản ghi Post, lưu Attachment và phát sự kiện PostCreatingEvent. Điểm Business cần nhớ: tầng này hiện thực hóa quy tắc và điều phối nghiệp vụ, không phải chỉ là nơi nhận API.

### Slide 7 – Data Access
Tầng dữ liệu được triển khai bằng PostgreSQL và Spring Data JPA. PostRepository chịu trách nhiệm thao tác với dữ liệu Post; AttachmentRepository lưu các tệp đính kèm được liên kết với bài. Tầng dữ liệu trả kết quả cho service; nó không quyết định giao diện hiển thị như thế nào.

### Slide 8 – Luồng end-to-end
Khi người dùng bấm Đăng bài, React gửi request; Controller nhận và validate; Service tạo và lưu bài cùng attachment, phát sự kiện; Repository/JPA ghi dữ liệu xuống PostgreSQL. Sau khi xử lý thành công, phản hồi đi ngược về UI để hiển thị bài đăng. Nếu thiếu caption hoặc attachment thì request vi phạm ràng buộc được khai báo và cần được xử lý như lỗi đầu vào.

### Slide 9 – Business validation / UAT
Business có thể kiểm tra luồng theo các điểm: dữ liệu đầu vào có đúng không, bài đăng có được tạo không, quyền riêng tư được giữ đúng không, ảnh có gắn với bài đăng không, và người dùng thấy kết quả hay thông báo lỗi phù hợp không. Các tiêu chí này dễ dùng để xây acceptance criteria/UAT mà không cần đọc sâu code.

### Slide 10 – Demo trực tiếp
Nên demo theo trình tự: mở ứng dụng và đăng nhập; vào newsfeed; tạo một bài có caption và ảnh; chọn quyền riêng tư; submit; kiểm tra bài mới xuất hiện; sau đó mở Network/API hoặc Swagger nếu thầy muốn thấy request-response. Ở phần API chỉ cần giải thích input và output, không cần trình bày chi tiết Java.

### Slide 11 – Kết luận
Tóm lại, React trình bày và gửi yêu cầu; Spring Boot điều phối quy tắc nghiệp vụ; PostgreSQL lưu trữ. Ba tầng tách biệt giúp dễ thay đổi giao diện, kiểm thử quy tắc và quản lý dữ liệu. Lưu ý: đây là mapping khái niệm 3 tầng lên code hiện có; repository tổ chức theo technical layer và có thêm DAO cho các truy vấn thống kê phức tạp.

### Slide 12 – Q&A
Kết thúc phần trình bày và mời thầy đặt câu hỏi. Nội dung slide được tổng hợp từ tài liệu và source code trong repository, với luồng tạo bài đăng làm ví dụ minh họa.

## Kịch bản demo gợi ý – 5 phút
1. 1 phút: Giới thiệu Vivacon và nhóm chức năng chính.
2. 2 phút: Đăng nhập → newsfeed → tạo bài có caption + ảnh.
3. 1 phút: Xác nhận bài mới xuất hiện và xem quyền riêng tư.
4. 1 phút: Giải thích PostController → PostServiceImpl → PostRepository.

## Câu hỏi Business nên chuẩn bị
- Nếu caption trống thì hệ thống nên làm gì?
- Nếu người dùng không đính kèm ảnh thì có cho đăng bài không?
- Quyền riêng tư ảnh hưởng thế nào đến người có thể nhìn thấy bài?
- Làm sao xác nhận bài đã được lưu chứ không chỉ hiển thị tạm trên UI?
- Nếu API trả lỗi, người dùng nhận được thông báo gì?

## File/đường dẫn code tham chiếu
- `.kiro/steering/product.md` – mô tả tính năng và vai trò.
- `.kiro/steering/structure.md` – cấu trúc frontend/backend.
- `.kiro/steering/tech.md` – stack và lệnh chạy.
- `frontend/src/api/postService.js` – API call từ React.
- `frontend/src/components/pages/PostsListPage/index.js` – màn hình newsfeed.
- `src/main/java/com/vivacon/controller/PostController.java` – REST endpoint tạo bài.
- `src/main/java/com/vivacon/dto/request/PostRequest.java` – ràng buộc caption/attachments.
- `src/main/java/com/vivacon/service/impl/PostServiceImpl.java` – xử lý tạo bài.
- `src/main/java/com/vivacon/repository/PostRepository.java` – truy cập dữ liệu bài đăng.

## Lưu ý
Trình bày đây là cách ánh xạ khái niệm 3-tier architecture lên code hiện tại, không khẳng định repository có đúng ba package tách biệt. Backend được tổ chức theo technical layer (controller, service, repository, DAO, entity, DTO...) và DAO cũng xuất hiện cho các truy vấn thống kê phức tạp.
