using System.Text.Json.Serialization;

namespace OdisseiaWiki.Dtos;

public sealed class WikiGraphDto
{
    [JsonPropertyName("nodes")]
    public IReadOnlyList<WikiGraphNodeDto> Nodes { get; init; } = Array.Empty<WikiGraphNodeDto>();

    [JsonPropertyName("edges")]
    public IReadOnlyList<WikiGraphEdgeDto> Edges { get; init; } = Array.Empty<WikiGraphEdgeDto>();

    [JsonPropertyName("centralNodeId")]
    public string? CentralNodeId { get; init; }

    [JsonPropertyName("stats")]
    public WikiGraphStatsDto Stats { get; init; } = new();
}

public sealed class WikiGraphNodeDto
{
    [JsonPropertyName("graphId")]
    public required string GraphId { get; init; }

    [JsonPropertyName("hidden")]
    public required bool Hidden { get; init; }

    [JsonPropertyName("entityType")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? EntityType { get; init; }

    [JsonPropertyName("title")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Title { get; init; }

    [JsonPropertyName("image")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Image { get; init; }

    [JsonPropertyName("route")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Route { get; init; }
}

public sealed class WikiGraphEdgeDto
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("source")]
    public required string Source { get; init; }

    [JsonPropertyName("target")]
    public required string Target { get; init; }
}

public sealed class WikiGraphStatsDto
{
    [JsonPropertyName("totalNodes")]
    public int TotalNodes { get; init; }

    [JsonPropertyName("totalEdges")]
    public int TotalEdges { get; init; }
}
