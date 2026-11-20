using System;
using System.Collections.Generic;

namespace CarRental.API.DTOs.Common
{
    /// <summary>
    /// DTO chuẩn đại diện cho kết quả phân trang của API
    /// </summary>
    /// <typeparam name="T">Kiểu dữ liệu của phần tử trong danh sách</typeparam>
    public class PagedResultDto<T>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public int TotalCount { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
        public IEnumerable<T> Items { get; set; } = new List<T>();

        public PagedResultDto() { }

        public PagedResultDto(IEnumerable<T> items, int totalCount, int page, int pageSize)
        {
            Items = items;
            TotalCount = totalCount;
            Page = page;
            PageSize = pageSize;
        }
    }
}
