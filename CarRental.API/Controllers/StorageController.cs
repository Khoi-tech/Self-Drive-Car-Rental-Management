using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StorageController : ControllerBase
    {
        private readonly IStorageService _storageService;
        private readonly IWebHostEnvironment _environment;

        public StorageController(IStorageService storageService, IWebHostEnvironment environment)
        {
            _storageService = storageService;
            _environment = environment;
        }

        public class UploadBase64Dto
        {
            public string Base64Data { get; set; } = null!;
            public string Bucket { get; set; } = "sensitive-docs";
            public string? Folder { get; set; }
            public string? Filename { get; set; }
        }

        /// <summary>
        /// Upload file ảnh (xe, giấy tờ) trực tiếp dạng Multipart/Form-Data lên Supabase Storage
        /// </summary>
        [HttpPost("upload")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadFile(
            IFormFile file,
            [FromQuery] string bucket = "vehicle-images",
            [FromQuery] string? folder = null)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { Message = "Vui lòng chọn file để upload." });
            }

            try
            {
                var objectPath = await _storageService.UploadFileAsync(file, bucket, folder);
                var publicUrl = bucket == "vehicle-images"
                    ? _storageService.GetPublicUrl(objectPath, bucket)
                    : await _storageService.GetSignedUrlAsync(objectPath, bucket, 15);

                return Ok(new
                {
                    Path = objectPath,
                    Url = publicUrl,
                    Bucket = bucket
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi khi upload file.", Details = ex.Message });
            }
        }

        /// <summary>
        /// Upload chữ ký số hoặc ảnh nén dạng chuỗi Base64
        /// </summary>
        [HttpPost("upload-base64")]
        [Authorize]
        public async Task<IActionResult> UploadBase64([FromBody] UploadBase64Dto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Base64Data))
            {
                return BadRequest(new { Message = "Dữ liệu Base64 không được để trống." });
            }

            try
            {
                var objectPath = await _storageService.UploadBase64Async(
                    dto.Base64Data,
                    dto.Bucket,
                    dto.Folder,
                    dto.Filename);

                var url = dto.Bucket == "vehicle-images"
                    ? _storageService.GetPublicUrl(objectPath, dto.Bucket)
                    : await _storageService.GetSignedUrlAsync(objectPath, dto.Bucket, 15);

                return Ok(new
                {
                    Path = objectPath,
                    Url = url,
                    Bucket = dto.Bucket
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi khi lưu trữ ảnh Base64.", Details = ex.Message });
            }
        }

        /// <summary>
        /// Tạo Signed URL có thời hạn (5 - 15 phút) để tải / xem tài liệu nhạy cảm (sensitive-docs)
        /// </summary>
        [HttpGet("signed-url")]
        [Authorize]
        public async Task<IActionResult> GetSignedUrl(
            [FromQuery] string path,
            [FromQuery] string bucket = "sensitive-docs",
            [FromQuery] int expiresIn = 15)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return BadRequest(new { Message = "Tham số path là bắt buộc." });
            }

            var signedUrl = await _storageService.GetSignedUrlAsync(path, bucket, expiresIn);
            return Ok(new
            {
                Path = path,
                SignedUrl = signedUrl,
                ExpiresInMinutes = expiresIn
            });
        }

        /// <summary>
        /// Fallback phục vụ file cục bộ khi dev offline
        /// </summary>
        [HttpGet("file/{bucket}/{*path}")]
        [AllowAnonymous]
        public IActionResult GetLocalFile(string bucket, string path)
        {
            var webRoot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var filePath = Path.Combine(webRoot, "uploads", bucket, path.Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { Message = "Không tìm thấy file lưu trữ." });
            }

            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            var contentType = ext switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };

            return PhysicalFile(filePath, contentType);
        }
    }
}
