using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Settlement
{
    public class ResolveDisputeDto
    {
        /// <summary>
        /// Hành động phân xử: ACCEPT_REFUND (Chấp nhận khiếu nại & hoàn tiền), REJECT (Bác bỏ khiếu nại), COMPROMISE (Thỏa thuận giảm trừ một phần)
        /// </summary>
        [Required]
        public string ResolutionAction { get; set; } = "ACCEPT_REFUND";

        /// <summary>
        /// Số tiền hoàn bổ sung cho khách nếu chấp nhận khiếu nại hoặc thỏa thuận
        /// </summary>
        public decimal AdjustedRefundAmount { get; set; } = 0;

        /// <summary>
        /// Lời giải thích / kết luận phân xử của Quản trị viên gửi đến khách hàng
        /// </summary>
        [Required]
        public string ResolutionNotes { get; set; } = string.Empty;

        /// <summary>
        /// Mã giao dịch ngân hàng chuyển tiền hoàn bổ sung (nếu có hoàn tiền)
        /// </summary>
        public string? TransactionCode { get; set; }
    }
}
