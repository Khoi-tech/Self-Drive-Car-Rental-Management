# 🚗 Self-Drive Car Rental Management (Hệ Thống Quản Lý Thuê Xe Tự Lái)

> **Đồ án môn học:** Công nghệ phần mềm nâng cao (CNPM_NC) — Trường Đại học Ngoại ngữ - Tin học TP.HCM (HUFLIT)  
> **Tác giả:** [Minh Khôi (Khoi-tech)](https://github.com/Khoi-tech)

---

## 📌 Giới thiệu dự án

**Self-Drive Car Rental Management** là hệ thống quản lý và cho thuê xe ô tô tự lái toàn diện, xây dựng theo kiến trúc Client - Server hiện đại với Backend Web API và Frontend Single Page Application (SPA). Hệ thống hỗ trợ quản lý chi tiết từ thông số xe, bảng giá linh hoạt, điều kiện ràng buộc đến các chính sách bồi thường khi phát sinh sự cố.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

### 🔹 Backend (API)
- **Framework:** ASP.NET Core Web API (.NET 10)
- **ORM:** Entity Framework Core 10 (Code-First)
- **Database:** PostgreSQL (Hỗ trợ Supabase / Local PostgreSQL)
- **Tài liệu API:** Swagger UI / OpenAPI Spec

### 🔹 Frontend (Web)
- **Framework & Build Tool:** React 19, Vite
- **Styling:** Tailwind CSS v4
- **Icons & UI:** Lucide React
- **Routing & HTTP:** React Router DOM v7, Axios

---

## ✨ Tính năng chính

- [x] **Trang chủ (Landing Page):** Giới thiệu dịch vụ, video quảng bá, trải nghiệm xe trực quan.
- [x] **Quản lý danh sách xe (Vehicles):**
  - Thêm, sửa, xem chi tiết và cập nhật trạng thái xe (Sẵn sàng, Đang thuê, Bảo trì,...).
  - Quản lý thông số kỹ thuật: Hãng, dòng xe, biển số, năm sản xuất, hộp số, loại nhiên liệu, hình ảnh.
- [x] **Quản lý chính sách giá (Pricing Policies):**
  - Thiết lập giá thuê theo ngày, giờ, ngày lễ/cuối tuần.
  - Phụ phí quá giờ, quá km.
  - Công cụ tính toán và xem trước giá thuê (Pricing Preview).
- [x] **Điều kiện thuê xe (Rental Conditions):**
  - Quy định về độ tuổi, bằng lái, tiền cọc, giấy tờ tùy thân.
- [x] **Chính sách bồi thường (Compensation Policies):**
  - Quản lý mức phạt và đền bù cho các vi phạm/hư hỏng trong quá trình thuê xe.
- [x] **Bảng điều khiển quản trị (Dashboard):** Thống kê tổng quan tình trạng đội xe và hoạt động thuê.

---

## 📁 Cấu trúc thư mục

```text
Self-Drive-Car-Rental-Management/
├── CarRental.API/                   # Mã nguồn Backend (ASP.NET Core)
│   ├── Controllers/                 # RESTful API Endpoints
│   ├── Data/                        # DbContext & cấu hình Entity
│   ├── DTOs/                        # Data Transfer Objects
│   ├── Entities/                    # Database Models
│   ├── Migrations/                  # EF Core Migrations
│   ├── Services/                    # Business Logic Services
│   └── appsettings.json             # Cấu hình chuỗi kết nối Database
│
├── CarRental.Web/                   # Mã nguồn Frontend (React + Vite)
│   ├── src/
│   │   ├── components/              # Các UI Components tái sử dụng
│   │   ├── layouts/                 # AdminLayout & PublicLayout
│   │   ├── pages/                   # Các màn hình chính (Vehicles, Pricing, Dashboard,...)
│   │   ├── routes/                  # Cấu hình điều hướng (AppRoutes)
│   │   └── services/                # Axios API services
│   └── package.json
│
├── ERD_Demo.mdj                     # Sơ đồ quan hệ thực thể (StarUML)
├── Sprint_Planning-1.docx           # Kế hoạch Sprint
├── Sơ đồ Pert.docx                  # Sơ đồ tiến độ Pert
└── README.md                        # Tài liệu hướng dẫn dự án
```

---

## 🚀 Hướng dẫn cài đặt & khởi chạy dự án

### 📋 Yêu cầu môi trường
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (phiên bản 18+ hoặc mới hơn)
- PostgreSQL (hoặc tài khoản database trên Supabase)

---

### Bước 1: Clone kho lưu trữ về máy
```bash
git clone https://github.com/Khoi-tech/Self-Drive-Car-Rental-Management.git
cd Self-Drive-Car-Rental-Management
```

---

### Bước 2: Cấu hình và chạy Backend (CarRental.API)

1. **Di chuyển vào thư mục API:**
   ```bash
   cd CarRental.API
   ```

2. **Cấu hình Database:**
   Mở file `appsettings.json` và cập nhật chuỗi kết nối PostgreSQL của bạn:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=CarRentalDb;Username=postgres;Password=your_password"
   }
   ```

3. **Chạy Migration để tạo CSDL (nếu sử dụng DB mới):**
   ```bash
   dotnet ef database update
   ```

4. **Khởi động API Server:**
   ```bash
   dotnet run
   ```
   > 🌐 **Swagger UI** sẽ khả dụng tại: `http://localhost:5171/swagger` (hoặc cổng hiển thị trên console).

---

### Bước 3: Cài đặt và chạy Frontend (CarRental.Web)

Mở một cửa sổ **Terminal mới** (Terminal thứ 2):

1. **Di chuyển vào thư mục Web:**
   ```bash
   cd CarRental.Web
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Khởi động môi trường phát triển (Dev Server):**
   ```bash
   npm run dev
   ```
   > 🌐 **Giao diện Web** sẽ mở tại: `http://localhost:5173`

---

## 📝 Tài liệu & Phân tích thiết kế
Các tài liệu phân tích hệ thống phục vụ cho môn học nằm ngay tại thư mục gốc:
- `ERD_Demo.mdj`: Sơ đồ thiết kế Cơ sở Dữ liệu quan hệ mở bằng StarUML.
- `Sprint_Planning-1.docx`: Tài liệu lập kế hoạch các giai đoạn Sprint theo mô hình Agile/Scrum.
- `Sơ đồ Pert.docx`: Sơ đồ mạng công việc và thời gian triển khai dự án.

---

## 📄 Bản quyền & Đóng góp
Dự án được thực hiện phục vụ cho mục đích học tập và nghiên cứu môn học Công nghệ phần mềm nâng cao tại HUFLIT.
Mọi đóng góp hoặc thắc mắc vui lòng liên hệ qua GitHub: [@Khoi-tech](https://github.com/Khoi-tech).