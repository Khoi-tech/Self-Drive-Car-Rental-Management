using System;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CarRental.API.Common.JsonConverters
{
    public class FlexibleIntConverter : JsonConverter<int>
    {
        private readonly int _defaultValue;

        public FlexibleIntConverter() : this(0) { }

        public FlexibleIntConverter(int defaultValue)
        {
            _defaultValue = defaultValue;
        }

        public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt32(out var intVal))
                    return intVal;
                if (reader.TryGetDouble(out var doubleVal))
                    return (int)Math.Round(doubleVal);
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var str = reader.GetString();
                if (string.IsNullOrWhiteSpace(str)) return _defaultValue;
                var digits = new string(str.Where(c => char.IsDigit(c) || c == '-').ToArray());
                if (int.TryParse(digits, out var val))
                    return val;
                return _defaultValue;
            }

            if (reader.TokenType == JsonTokenType.Null)
            {
                return _defaultValue;
            }

            return _defaultValue;
        }

        public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)
        {
            writer.WriteNumberValue(value);
        }
    }

    public class FlexibleFuelLevelConverter : FlexibleIntConverter
    {
        public FlexibleFuelLevelConverter() : base(100) { }
    }
}
