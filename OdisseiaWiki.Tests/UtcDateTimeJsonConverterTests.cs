using System.Text.Json;
using OdisseiaWiki.Serialization;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class UtcDateTimeJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = CreateOptions();

    [Fact]
    public void Serialize_UnspecifiedDatabaseValue_WritesUtcSuffix()
    {
        DateTime databaseValue = new(2026, 9, 22, 18, 30, 0, DateTimeKind.Unspecified);

        string json = JsonSerializer.Serialize(databaseValue, Options);

        Assert.Equal("\"2026-09-22T18:30:00Z\"", json);
    }

    [Fact]
    public void Deserialize_ValueWithoutOffset_AssumesUtc()
    {
        DateTime value = JsonSerializer.Deserialize<DateTime>("\"2026-09-22T18:30:00\"", Options);

        Assert.Equal(DateTimeKind.Utc, value.Kind);
        Assert.Equal(new DateTime(2026, 9, 22, 18, 30, 0, DateTimeKind.Utc), value);
    }

    [Fact]
    public void Deserialize_ValueWithOffset_NormalizesToUtc()
    {
        DateTime value = JsonSerializer.Deserialize<DateTime>("\"2026-09-22T15:30:00-03:00\"", Options);

        Assert.Equal(DateTimeKind.Utc, value.Kind);
        Assert.Equal(new DateTime(2026, 9, 22, 18, 30, 0, DateTimeKind.Utc), value);
    }

    private static JsonSerializerOptions CreateOptions()
    {
        JsonSerializerOptions options = new();
        options.Converters.Add(new UtcDateTimeJsonConverter());
        return options;
    }
}
