---
inclusion: always
---

# Database efficiency

Áp dụng các quy tắc dưới đây khi nhiệm vụ cần truy cập database qua MCP hoặc công cụ SQL. Không truy cập database chỉ vì steering này được nạp.

- Chỉ dùng database và schema liên quan đến nhiệm vụ.
- Tái sử dụng metadata đã có trong phiên; chỉ truy vấn lại khi cần xác minh thay đổi.
- Chỉ lấy cấu trúc các bảng liên quan, không kiểm kê toàn bộ database theo mặc định.
- Query dữ liệu chỉ lấy cột cần thiết; mặc định tối đa 20 dòng mẫu. Dùng aggregate khi cần tổng hợp. Giới hạn dòng mẫu không áp dụng cho tập dữ liệu cần tính aggregate hoặc kiểm tra tính đầy đủ.
- Không chạy health check, top queries hoặc phân tích index nếu nhiệm vụ không yêu cầu.
- Không lặp lại tool call đã thành công trừ khi có lý do mới.
- Khi đủ bằng chứng trả lời thì dừng và tóm tắt ngắn. Không bỏ qua bước xác minh cần thiết chỉ để giảm số tool call.

Đây là hướng dẫn hành vi cho agent, không phải giới hạn kỹ thuật của MCP hoặc bảo đảm mức credits sử dụng.
