using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Settlement
{
    public class ConfirmTrafficFineRefundDto
    {
        /// <summary>
        /// Số tiền khấu trừ phạt nguội nếu phát hiện vi phạm (mặc định 0 nếu xe không vi phạm)
        /// </summary>
        public decimal ActualDeduction { get; set; } = 0;

        /// <summary>
        /// Ghi chú chi tiết kết quả tra cứu CSGT hoặc lỗi vi phạm
        /// </summary>
        public string? ViolationNotes { get; set; }

        /// <summary>
        /// Đường dẫn ảnh chụp màn hình tra cứu phạt nguội hoặc biên bản nộp phạt
        /// </summary>
        public string? ViolationProofUrl { get; set; }

        /// <summary>
        /// Mã giao dịch ngân hàng chuyển tiền hoàn cọc Đợt 2 cho khách
        /// </summary>
        [Required]
        public string TransactionCode { get; set; } = string.Empty;

        public string? RefundBankName { get; set; }

        public string? RefundAccountNumber { get; set; }

        public string? RefundAccountName { get; set; }

        public string? StaffNotes { get; set; }
    }
}
