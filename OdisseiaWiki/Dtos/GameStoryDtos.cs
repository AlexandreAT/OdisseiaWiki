using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;

namespace OdisseiaWiki.Dtos;

public sealed class GameStoryCostDto
{
    public int Currency { get; set; }
    public int Life { get; set; }
    public int Mana { get; set; }
    public int Stamina { get; set; }
}

public sealed class GameStoryItemDto
{
    public string ItemId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public JsonObject? Snapshot { get; set; }
}

public sealed class GameStoryConditionDto
{
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public int? Duration { get; set; }
    public string? DurationUnit { get; set; }
    public int? Value { get; set; }
}

public sealed class GameStoryOutcomeDto
{
    public int Currency { get; set; }
    public int Xp { get; set; }
    public int Life { get; set; }
    public int Mana { get; set; }
    public int Stamina { get; set; }
    public bool Percentage { get; set; }
    public int GameMinutes { get; set; }
    public List<GameStoryItemDto> Items { get; set; } = [];
    public List<GameStoryConditionDto> Conditions { get; set; } = [];
}

public sealed class GameStoryChoiceDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ResultText { get; set; }
    public GameStoryCostDto Cost { get; set; } = new();
    public GameStoryOutcomeDto Outcome { get; set; } = new();
}

public sealed class GameStoryMissionDto
{
    public string AreaCode { get; set; } = string.Empty;
    public bool CanDecline { get; set; } = true;
    public GameStoryCostDto Cost { get; set; } = new();
    public GameStoryOutcomeDto Reward { get; set; } = new();
}

public sealed class GameStoryRequestDto : GameRunMutationRequestDto
{
    [Required, MaxLength(80)] public string ChoiceCode { get; set; } = string.Empty;
}

public sealed record GameStoryRecordDto(string NodeId, string Name, string Type, string Choice,
    string? ResultText, int Currency, int Xp, int Life, int Mana, int Stamina,
    IReadOnlyList<JsonObject> Items, IReadOnlyList<string> Conditions);
