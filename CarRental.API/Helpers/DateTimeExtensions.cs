using System;

namespace CarRental.API.Helpers;

public static class DateTimeExtensions
{
    private static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
        catch
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            }
            catch
            {
                return TimeZoneInfo.CreateCustomTimeZone("ICT", TimeSpan.FromHours(7), "Indochina Time", "ICT");
            }
        }
    }

    public static DateTime ToUtc(this DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        };
    }

    public static DateTime? ToUtc(this DateTime? dt)
    {
        return dt.HasValue ? dt.Value.ToUtc() : null;
    }

    public static DateTime ToVietnamTime(this DateTime dt)
    {
        var utc = dt.ToUtc();
        return TimeZoneInfo.ConvertTimeFromUtc(utc, VietnamTimeZone);
    }

    public static DateTime? ToVietnamTime(this DateTime? dt)
    {
        return dt.HasValue ? dt.Value.ToVietnamTime() : null;
    }
}
