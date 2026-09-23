using System.Text.Json;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Serialization;

/// <summary>
/// Mantém o contrato HTTP em UTC mesmo quando o banco devolve DateTimeKind.Unspecified.
/// O sufixo Z permite que cada cliente converta o instante para seu próprio fuso horário.
/// </summary>
public sealed class UtcDateTimeJsonConverter : JsonConverter<DateTime>
{
    public override DateTime Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        DateTime value = reader.GetDateTime();
        return ToUtc(value);
    }

    public override void Write(
        Utf8JsonWriter writer,
        DateTime value,
        JsonSerializerOptions options)
    {
        writer.WriteStringValue(ToUtc(value));
    }

    private static DateTime ToUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
    };
}
