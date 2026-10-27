using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.GameRuns.Battle;

/// <summary>MySQL JSON reorders object properties; payload discriminators need not be the first key.</summary>
public sealed class GameBattleEventJsonConverter : JsonConverter<GameBattleEvent>
{
    private static readonly IReadOnlyDictionary<string, Type> PayloadTypes = typeof(GameBattleEventPayload)
        .GetCustomAttributes<JsonDerivedTypeAttribute>().ToDictionary(
            attribute => (string)attribute.TypeDiscriminator!, attribute => attribute.DerivedType, StringComparer.Ordinal);
    private sealed record Envelope(int Sequence, int SchemaVersion, int Round, string Type,
        string? ActorId, string? TargetId, JsonElement Payload);

    public override GameBattleEvent Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var frame = JsonSerializer.Deserialize<Envelope>(ref reader, options) ?? throw new JsonException("Evento de combate vazio.");
        if (frame.Payload.ValueKind != JsonValueKind.Object) throw new JsonException("Conteúdo de evento inválido.");
        string? kind = frame.Type;
        if (frame.Payload.TryGetProperty("kind", out var discriminator))
        {
            if (discriminator.ValueKind != JsonValueKind.String) throw new JsonException("Identificação de evento inválida.");
            kind = discriminator.GetString();
        }
        if (kind is null || !PayloadTypes.TryGetValue(kind, out var payloadType)) throw new JsonException("Tipo de evento de combate desconhecido.");
        var payload = frame.Payload.Deserialize(payloadType, options) as GameBattleEventPayload
            ?? throw new JsonException("Conteúdo de evento vazio.");
        return new(frame.Sequence, frame.SchemaVersion, frame.Round, frame.Type, frame.ActorId, frame.TargetId, payload);
    }

    public override void Write(Utf8JsonWriter writer, GameBattleEvent value, JsonSerializerOptions options) =>
        JsonSerializer.Serialize(writer, new { value.Sequence, value.SchemaVersion, value.Round, value.Type,
            value.ActorId, value.TargetId, value.Payload }, options);
}
