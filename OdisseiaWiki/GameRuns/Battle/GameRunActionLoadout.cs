using System.Text.Json;
using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.GameRuns.Battle;

public static class GameRunActionLoadout
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static IReadOnlyList<GameRunActionSelectionDto>? Read(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;
        if (!root.TryGetProperty("schemaVersion", out JsonElement schema) ||
            schema.ValueKind != JsonValueKind.Number || schema.GetInt32() != 2)
            return null;
        if (!root.TryGetProperty("actions", out JsonElement actions) || actions.ValueKind != JsonValueKind.Array)
            throw new JsonException("O loadout da run está incompleto.");
        return actions.Deserialize<GameRunActionSelectionDto[]>(Options) ?? [];
    }

    public static string Serialize(IReadOnlyList<GameRunActionSelectionDto> actions) =>
        JsonSerializer.Serialize(new { schemaVersion = 2, actions }, Options);
}
