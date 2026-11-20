using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace CarRental.API.Services
{
    public interface IStorageService
    {
        /// <summary>
        /// Upload file từ IFormFile lên Supabase Storage bucket (nén/chuẩn hóa nếu là ảnh)
        /// Trả về object path tương đối (ví dụ: "cars/uuid.webp" hoặc "signatures/uuid.png")
        /// </summary>
        Task<string> UploadFileAsync(IFormFile file, string bucket = "vehicle-images", string? folder = null);

        /// <summary>
        /// Upload ảnh từ chuỗi Base64 (data:image/... hoặc raw base64) lên Storage bucket
        /// Trả về object path tương đối
        /// </summary>
        Task<string> UploadBase64Async(string base64Data, string bucket = "sensitive-docs", string? folder = null, string? filename = null);

        /// <summary>
        /// Lấy URL công khai cho bucket public (vehicle-images)
        /// </summary>
        string GetPublicUrl(string path, string bucket = "vehicle-images");

        /// <summary>
        /// Tạo Signed URL có thời hạn (5 - 15 phút) cho bucket nhạy cảm (sensitive-docs)
        /// </summary>
        Task<string> GetSignedUrlAsync(string path, string bucket = "sensitive-docs", int expiresInMinutes = 15);

        /// <summary>
        /// Phân giải URL cho tài liệu: Nếu là chuỗi cũ "data:image/" hoặc URL tuyệt đối thì giữ nguyên (tương thích ngược),
        /// nếu là path trong private bucket thì tự động sinh Signed URL có thời hạn.
        /// </summary>
        Task<string> ResolveDocUrlAsync(string? storedPathOrUrl, string bucket = "sensitive-docs", int expiresInMinutes = 15);
    }
}
