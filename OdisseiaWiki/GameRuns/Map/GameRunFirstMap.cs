using System.Text.Json;
using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.GameRuns.Map;

/// <summary>
/// First playable map slice. Its topology has no combat rules of its own; the
/// encounter uses the published mode configuration pinned to the run.
/// </summary>
public static class GameRunFirstMap
{
    public const string EncounterId = "treino-1";

    public static GameRunMapDto Create() => new()
    {
        SchemaVersion = 1,
        Nodes =
        [
            new() { Id = "inicio", Name = "Início", Fase = 1, Layer = 0, Position = 0, Type = "INICIO",
                State = "CONCLUIDO", Connections = [EncounterId], Revealed = true },
            new() { Id = EncounterId, Name = "Sentinela de treino", Fase = 1, Layer = 1, Position = 0, Type = "COMBATE",
                State = "DISPONIVEL", Connections = [], Revealed = true },
        ],
    };

    public static GameRunMapDto Read(string? json, JsonSerializerOptions options) =>
        string.IsNullOrWhiteSpace(json)
            ? Create()
            : JsonSerializer.Deserialize<GameRunMapDto>(json, options)
                ?? throw new JsonException("O mapa da run está vazio.");
}
