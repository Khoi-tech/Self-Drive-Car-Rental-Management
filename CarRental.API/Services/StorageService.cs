using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CarRental.API.Services
{
    public class StorageService : IStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<StorageService> _logger;

        private readonly string _supabaseUrl;
        private readonly string? _supabaseKey;
        private readonly string _publicBucket;
        private readonly string _privateBucket;

        public StorageService(
            HttpClient httpClient,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<StorageService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;

            _supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL")
                        ?? _configuration["Supabase:Url"]
                        ?? "https://uhgvqpexkkbwejdqpjit.supabase.co";

            _supabaseKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
                        ?? Environment.GetEnvironmentVariable("SUPABASE_KEY")
                        ?? _configuration["Supabase:Key"];

            _publicBucket = _configuration["Supabase:PublicBucket"] ?? "vehicle-images";
            _privateBucket = _configuration["Supabase:PrivateBucket"] ?? "sensitive-docs";
        }

        public async Task<string> UploadFileAsync(IFormFile file, string bucket = "vehicle-images", string? folder = null)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File upload không được để trống.", nameof(file));
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension)) extension = ".png";

            var filename = $"{Guid.NewGuid():N}{extension}";
            var objectPath = string.IsNullOrWhiteSpace(folder) ? filename : $"{folder.Trim('/')}/{filename}";

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            return await SaveObjectAsync(fileBytes, bucket, objectPath, file.ContentType ?? "image/png");
        }

        public async Task<string> UploadBase64Async(string base64Data, string bucket = "sensitive-docs", string? folder = null, string? filename = null)
        {
            if (string.IsNullOrWhiteSpace(base64Data))
            {
                throw new ArgumentException("Chuỗi Base64 không được để trống.", nameof(base64Data));
            }

            string contentType = "image/png";
            string extension = ".png";
            string rawBase64 = base64Data;

            // Xử lý tiền tố "data:image/png;base64,"
            var match = Regex.Match(base64Data, @"^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.*)$", RegexOptions.Singleline);
            if (match.Success)
            {
                contentType = match.Groups[1].Value;
                rawBase64 = match.Groups[2].Value;

                extension = contentType switch
                {
                    "image/jpeg" or "image/jpg" => ".jpg",
                    "image/webp" => ".webp",
                    "image/svg+xml" => ".svg",
                    _ => ".png"
                };
            }

            byte[] bytes = Convert.FromBase64String(rawBase64.Trim());

            string finalFilename = !string.IsNullOrWhiteSpace(filename)
                ? (filename.EndsWith(extension) ? filename : $"{filename}{extension}")
                : $"{Guid.NewGuid():N}{extension}";

            var objectPath = string.IsNullOrWhiteSpace(folder) ? finalFilename : $"{folder.Trim('/')}/{finalFilename}";

            return await SaveObjectAsync(bytes, bucket, objectPath, contentType);
        }

        public string GetPublicUrl(string path, string bucket = "vehicle-images")
        {
            if (string.IsNullOrWhiteSpace(path)) return string.Empty;
            if (path.StartsWith("http://") || path.StartsWith("https://") || path.StartsWith("data:image/"))
            {
                return path;
            }

            var cleanUrl = _supabaseUrl.TrimEnd('/');
            return $"{cleanUrl}/storage/v1/object/public/{bucket}/{path.TrimStart('/')}";
        }

        public async Task<string> GetSignedUrlAsync(string path, string bucket = "sensitive-docs", int expiresInMinutes = 15)
        {
            if (string.IsNullOrWhiteSpace(path)) return string.Empty;

            // Đảm bảo an toàn nếu path đã là URL tuyệt đối hoặc base64
            if (path.StartsWith("http://") || path.StartsWith("https://") || path.StartsWith("data:image/"))
            {
                return path;
            }

            int expiresInSeconds = Math.Clamp(expiresInMinutes, 1, 1440) * 60;

            // Nếu có Supabase Key -> Tạo Signed URL từ Supabase Storage REST API
            if (!string.IsNullOrWhiteSpace(_supabaseKey))
            {
                try
                {
                    var endpoint = $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/sign/{bucket}/{path.TrimStart('/')}";
                    var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                    request.Headers.Add("apikey", _supabaseKey);
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);

                    var payload = JsonSerializer.Serialize(new { expiresIn = expiresInSeconds });
                    request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(content);
                        if (doc.RootElement.TryGetProperty("signedURL", out var signedUrlProp))
                        {
                            var relSigned = signedUrlProp.GetString();
                            if (!string.IsNullOrEmpty(relSigned))
                            {
                                return relSigned.StartsWith("http") ? relSigned : $"{_supabaseUrl.TrimEnd('/')}/storage/v1{relSigned}";
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Supabase Storage sign URL trả về mã lỗi: {Code}", response.StatusCode);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi sinh Signed URL từ Supabase Storage: {Message}", ex.Message);
                }
            }

            // Fallback chế độ dev cục bộ
            return $"/api/storage/file/{bucket}/{path.TrimStart('/')}?expires={DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds).ToUnixTimeSeconds()}";
        }

        public async Task<string> ResolveDocUrlAsync(string? storedPathOrUrl, string bucket = "sensitive-docs", int expiresInMinutes = 15)
        {
            if (string.IsNullOrWhiteSpace(storedPathOrUrl)) return string.Empty;

            // Tương thích ngược: Nếu dữ liệu trong DB vẫn là Base64 cũ hoặc URL sẵn có -> Giữ nguyên
            if (storedPathOrUrl.StartsWith("data:image/") ||
                storedPathOrUrl.StartsWith("http://") ||
                storedPathOrUrl.StartsWith("https://"))
            {
                return storedPathOrUrl;
            }

            // Nếu là Storage Object Path -> Tự động sinh Signed URL bảo mật có thời hạn
            return await GetSignedUrlAsync(storedPathOrUrl, bucket, expiresInMinutes);
        }

        private async Task<string> SaveObjectAsync(byte[] bytes, string bucket, string objectPath, string contentType)
        {
            // Nếu có Supabase Key -> Upload trực tiếp lên Supabase Storage qua REST API
            if (!string.IsNullOrWhiteSpace(_supabaseKey))
            {
                try
                {
                    var endpoint = $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucket}/{objectPath}";
                    var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                    request.Headers.Add("apikey", _supabaseKey);
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
                    request.Headers.Add("x-upsert", "true");

                    var byteContent = new ByteArrayContent(bytes);
                    byteContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
                    request.Content = byteContent;

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Upload thành công lên Supabase Storage [{Bucket}]: {Path}", bucket, objectPath);
                        return objectPath;
                    }

                    var err = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Supabase Storage upload không thành công (Status: {Code}): {Err}. Chuyển sang lưu trữ dự phòng.", response.StatusCode, err);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi gọi Supabase Storage REST API: {Message}. Kích hoạt chế độ lưu trữ dự phòng.", ex.Message);
                }
            }

            // Dự phòng lưu trữ cục bộ (Local Storage Fallback) khi dev offline
            try
            {
                var webRoot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var targetDir = Path.Combine(webRoot, "uploads", bucket, Path.GetDirectoryName(objectPath) ?? "");
                Directory.CreateDirectory(targetDir);

                var fullPath = Path.Combine(webRoot, "uploads", bucket, objectPath);
                await File.WriteAllBytesAsync(fullPath, bytes);
                _logger.LogInformation("Đã lưu trữ file vào thư mục dự phòng cục bộ: {Path}", fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi ghi file vào bộ nhớ dự phòng: {Message}", ex.Message);
            }

            return objectPath;
        }
    }
}
