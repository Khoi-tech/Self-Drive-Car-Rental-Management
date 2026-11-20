using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using CarRental.API.Data;
using CarRental.API.DTOs.Settings;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class SystemSettingsService : ISystemSettingsService
    {
        private readonly AppDbContext _context;
        private readonly HybridCache _cache;
        private const string CacheKey = "velora_system_settings_all";
        private const string CacheTag = "system_settings";

        public SystemSettingsService(AppDbContext context, HybridCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<List<SystemSettingDto>> GetAllSettingsAsync()
        {
            return await _cache.GetOrCreateAsync(
                CacheKey,
                async cancel =>
                {
                    var items = await _context.SystemSettings
                        .AsNoTracking()
                        .OrderBy(s => s.Key)
                        .ToListAsync(cancel);

                    return items.Select(s => new SystemSettingDto
                    {
                        Key = s.Key,
                        Value = s.Value,
                        DataType = s.DataType,
                        Description = s.Description,
                        UpdatedAt = s.UpdatedAt
                    }).ToList();
                },
                tags: new[] { CacheTag }
            );
        }

        public async Task<T> GetSettingValueAsync<T>(string key, T defaultValue)
        {
            var settings = await GetAllSettingsAsync();
            var item = settings.FirstOrDefault(s => string.Equals(s.Key, key, StringComparison.OrdinalIgnoreCase));
            if (item == null || string.IsNullOrWhiteSpace(item.Value))
            {
                return defaultValue;
            }

            try
            {
                var targetType = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);

                if (targetType == typeof(decimal))
                {
                    if (decimal.TryParse(item.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var decVal))
                    {
                        return (T)(object)decVal;
                    }
                }
                else if (targetType == typeof(int))
                {
                    if (int.TryParse(item.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var intVal))
                    {
                        return (T)(object)intVal;
                    }
                }
                else if (targetType == typeof(bool))
                {
                    if (bool.TryParse(item.Value, out var boolVal))
                    {
                        return (T)(object)boolVal;
                    }
                }
                else if (targetType == typeof(string))
                {
                    return (T)(object)item.Value;
                }

                return (T)Convert.ChangeType(item.Value, targetType, CultureInfo.InvariantCulture);
            }
            catch
            {
                return defaultValue;
            }
        }

        public async Task<SystemSettingDto> UpdateSettingAsync(string key, string value)
        {
            var entity = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (entity == null)
            {
                entity = new SystemSetting
                {
                    Key = key,
                    Value = value,
                    DataType = "STRING",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SystemSettings.Add(entity);
            }
            else
            {
                entity.Value = value;
                entity.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await _cache.RemoveByTagAsync(CacheTag);

            return new SystemSettingDto
            {
                Key = entity.Key,
                Value = entity.Value,
                DataType = entity.DataType,
                Description = entity.Description,
                UpdatedAt = entity.UpdatedAt
            };
        }

        public async Task<List<SystemSettingDto>> UpdateBatchAsync(Dictionary<string, string> settings)
        {
            var keys = settings.Keys.ToList();
            var entities = await _context.SystemSettings
                .Where(s => keys.Contains(s.Key))
                .ToListAsync();

            var now = DateTime.UtcNow;
            foreach (var kvp in settings)
            {
                var entity = entities.FirstOrDefault(s => s.Key == kvp.Key);
                if (entity != null)
                {
                    entity.Value = kvp.Value;
                    entity.UpdatedAt = now;
                }
                else
                {
                    var newEntity = new SystemSetting
                    {
                        Key = kvp.Key,
                        Value = kvp.Value,
                        DataType = "STRING",
                        UpdatedAt = now
                    };
                    _context.SystemSettings.Add(newEntity);
                    entities.Add(newEntity);
                }
            }

            await _context.SaveChangesAsync();
            await _cache.RemoveByTagAsync(CacheTag);

            return entities.Select(s => new SystemSettingDto
            {
                Key = s.Key,
                Value = s.Value,
                DataType = s.DataType,
                Description = s.Description,
                UpdatedAt = s.UpdatedAt
            }).ToList();
        }
    }
}
