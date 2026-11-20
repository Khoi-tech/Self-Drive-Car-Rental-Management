using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CarRental.API.DTOs.Payment
{
    /// <summary>
    /// DTO tiếp nhận dữ liệu Webhook từ các cổng thanh toán VietQR (SePay, Casso, PayOS, v.v.)
    /// </summary>
    public class VietQrWebhookDto
    {
        // SePay / Chung
        [JsonPropertyName("id")]
        public object? Id { get; set; }

        [JsonPropertyName("gateway")]
        public string? Gateway { get; set; }

        [JsonPropertyName("transactionDate")]
        public string? TransactionDate { get; set; }

        [JsonPropertyName("accountNumber")]
        public string? AccountNumber { get; set; }

        [JsonPropertyName("subAccount")]
        public string? SubAccount { get; set; }

        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("transferType")]
        public string? TransferType { get; set; } // "in" / "out"

        [JsonPropertyName("transferAmount")]
        public decimal? TransferAmount { get; set; }

        [JsonPropertyName("amount")]
        public decimal? Amount { get; set; }

        [JsonPropertyName("referenceCode")]
        public string? ReferenceCode { get; set; }

        [JsonPropertyName("reference")]
        public string? Reference { get; set; }

        [JsonPropertyName("accumulated")]
        public decimal? Accumulated { get; set; }

        // PayOS specifics
        [JsonPropertyName("orderCode")]
        public object? OrderCode { get; set; }

        [JsonPropertyName("signature")]
        public string? Signature { get; set; }

        [JsonPropertyName("data")]
        public JsonElement? Data { get; set; }

        // Custom direct trigger
        [JsonPropertyName("transactionCode")]
        public string? TransactionCode { get; set; }

        /// <summary>
        /// Lấy số tiền thực nhận từ các cấu trúc payload khác nhau
        /// </summary>
        public decimal GetActualAmount()
        {
            if (TransferAmount.HasValue && TransferAmount.Value > 0) return TransferAmount.Value;
            if (Amount.HasValue && Amount.Value > 0) return Amount.Value;

            if (Data.HasValue && Data.Value.ValueKind == JsonValueKind.Object)
            {
                if (Data.Value.TryGetProperty("amount", out var amountProp) && amountProp.TryGetDecimal(out var d))
                {
                    return d;
                }
            }

            return 0m;
        }

        /// <summary>
        /// Lấy nội dung chuyển khoản từ các cấu trúc payload khác nhau
        /// </summary>
        public string GetTransferContent()
        {
            if (!string.IsNullOrWhiteSpace(Content)) return Content;
            if (!string.IsNullOrWhiteSpace(Description)) return Description;

            if (Data.HasValue && Data.Value.ValueKind == JsonValueKind.Object)
            {
                if (Data.Value.TryGetProperty("description", out var descProp))
                {
                    var desc = descProp.GetString();
                    if (!string.IsNullOrWhiteSpace(desc)) return desc;
                }
            }

            return string.Empty;
        }

        /// <summary>
        /// Lấy mã tham chiếu hoặc mã giao dịch
        /// </summary>
        public string GetReferenceCode()
        {
            if (!string.IsNullOrWhiteSpace(TransactionCode)) return TransactionCode;
            if (!string.IsNullOrWhiteSpace(ReferenceCode)) return ReferenceCode;
            if (!string.IsNullOrWhiteSpace(Reference)) return Reference;
            if (!string.IsNullOrWhiteSpace(Code)) return Code;

            if (Data.HasValue && Data.Value.ValueKind == JsonValueKind.Object)
            {
                if (Data.Value.TryGetProperty("reference", out var refProp))
                {
                    var r = refProp.GetString();
                    if (!string.IsNullOrWhiteSpace(r)) return r;
                }
            }

            return string.Empty;
        }
    }
}
