using System;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CarRental.API.Data;

public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeConverter() : base(
        v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
    {
    }
}

public class NullableUtcDateTimeConverter : ValueConverter<DateTime?, DateTime?>
{
    public NullableUtcDateTimeConverter() : base(
        v => !v.HasValue ? null : (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)),
        v => !v.HasValue ? null : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc))
    {
    }
}
