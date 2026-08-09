namespace OdisseiaWiki.Repositories;

public sealed class WikiGraphSnapshot
{
    public IReadOnlyList<WikiGraphCityRecord> Cities { get; init; } = Array.Empty<WikiGraphCityRecord>();

    public IReadOnlyList<WikiGraphPageRecord> Pages { get; init; } = Array.Empty<WikiGraphPageRecord>();

    public IReadOnlyList<WikiGraphCharacterRecord> Characters { get; init; } = Array.Empty<WikiGraphCharacterRecord>();

    public IReadOnlyList<WikiGraphRaceRecord> Races { get; init; } = Array.Empty<WikiGraphRaceRecord>();

    public IReadOnlyList<WikiGraphPageRelationRecord> PageRelations { get; init; } = Array.Empty<WikiGraphPageRelationRecord>();
}

public sealed record WikiGraphCityRecord(int Id, string? Name, string? Image, bool Visible);

public sealed record WikiGraphPageRecord(int Id, string? Title, string? Slug, string? Image, bool Visible);

public sealed record WikiGraphCharacterRecord(
    int Id,
    string? Name,
    string? Image,
    bool Visible,
    int RaceId,
    int? CityId,
    string? LinkedCharactersJson);

public sealed record WikiGraphRaceRecord(int Id, string? Name, string? Image, bool Visible);

public sealed record WikiGraphPageRelationRecord(int PageId, string Content);
