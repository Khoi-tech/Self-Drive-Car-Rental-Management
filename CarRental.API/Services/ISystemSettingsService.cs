using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Settings;

namespace CarRental.API.Services
{
    public interface ISystemSettingsService
    {
        Task<List<SystemSettingDto>> GetAllSettingsAsync();
        Task<T> GetSettingValueAsync<T>(string key, T defaultValue);
        Task<SystemSettingDto> UpdateSettingAsync(string key, string value);
        Task<List<SystemSettingDto>> UpdateBatchAsync(Dictionary<string, string> settings);
        Task<List<MembershipTierConfigItem>> GetMembershipTiersAsync();
        Task<List<MembershipTierConfigItem>> UpdateMembershipTiersAsync(List<MembershipTierConfigItem> tiers);
    }
}
