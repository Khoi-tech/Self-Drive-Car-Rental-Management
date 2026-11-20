# VELORA Refactor Context

## Thông tin dự án & Môi trường
- **Dự án:** VELORA — Nền tảng Cho Thuê Xe Tự Lái Cao Cấp
- **Công nghệ:**
  - Backend: CarRental.API (.NET 10, EF Core 10, PostgreSQL trên Supabase)
  - Frontend: CarRental.Web (React 19, Vite, Tailwind CSS)
  - Mobile: CarRental.Mobile (Flutter / Dart)
- **Nhánh Git làm việc hiện tại:** `refactor/velora-clean-workflow`

---

## Quy tắc bắt buộc trước khi sửa bất kỳ dòng code nào:

1. **Tuân thủ tài liệu đặc tả nghiệp vụ:**
   - Đọc kỹ `docs/VELORA_SPEC.md` để tuân thủ tuyệt đối quy trình 10 bước khép kín, 3 bẫy nghiệp vụ thực tế, bảng State Machine và ma trận phân quyền 3 role (`STAFF`, `MANAGER`, `ADMIN`).

2. **Theo dõi tiến độ theo từng Pha:**
   - Đọc kỹ `docs/REFACTOR_PLAN.md` và `docs/PROGRESS.md` (nếu có) trước khi bắt đầu nhiệm vụ để biết pha nào đã hoàn thành, tránh làm trùng lặp hoặc vô tình phá vỡ những phần code đã hoàn thành trước đó.

3. **Bảo toàn phạm vi & Dữ liệu:**
   - Không tự ý refactor CSS/giao diện ngoài phạm vi yêu cầu.
   - Không tự ý đổi tên file hoặc cấu trúc thư mục không liên quan.
   - Tuyệt đối không xóa dữ liệu hiện có trên cơ sở dữ liệu Supabase.

4. **Kiểm thử & Biên dịch bắt buộc:**
   - Luôn chạy `dotnet build` (đối với Backend) hoặc `npm run build` (đối với Frontend) để xác nhận 0 lỗi (0 errors, 0 warnings) trước khi báo hoàn thành bất kỳ tác vụ nào.
