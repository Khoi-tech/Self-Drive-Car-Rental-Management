using System;

namespace CarRental.API.DTOs.Settings
{
    public class SystemSettingDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string DataType { get; set; } = "STRING";
        public string? Description { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdateSystemSettingDto
    {
        public string Value { get; set; } = string.Empty;
    }

    public class UpdateSystemSettingsBatchDto
    {
        public Dictionary<string, string> Settings { get; set; } = new Dictionary<string, string>();
    }
}
