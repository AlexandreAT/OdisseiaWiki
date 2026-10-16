using OdisseiaWiki.GameRuns.Battle;

namespace OdisseiaWiki.Dtos;

public sealed record GameModeLootOptionDto(string Id, string Name, string Type, string? Image);

public sealed class GameModeAreaDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public bool IsSecret { get; set; }
    public bool IsSecretFinal { get; set; }
    public bool UseBase { get; set; } = true;
    public string BaseName { get; set; } = "Base";
    public string? BaseImage { get; set; }
    public string? BaseRestType { get; set; }
    public int NodeCount { get; set; } = 18;
    public string FinalOption { get; set; } = "BASE";
    public List<GameModeAreaOptionDto> Options { get; set; } = [];
}

public sealed class GameModeAreaOptionDto
{
    public string Type { get; set; } = "COMBATE";
    public string? EncounterCode { get; set; }
    public List<string> EncounterCodes { get; set; } = [];
    public string? SecretAreaCode { get; set; }
    public int Weight { get; set; } = 1;
    public bool Unique { get; set; }
    public string? Label { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
}

public sealed class GameModeEditorDto
{
    public int IdSistemaVersao { get; init; }
    public int IdGameModeVersion { get; init; }
    public int MapSchemaVersion { get; init; }
    public string NumeroVersao { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public List<GameModeAreaDto> Areas { get; init; } = [];
    public Dictionary<string, GameBattleEncounterConfig> Encounters { get; init; } = [];
    public GameBattleFallbackAction FallbackAction { get; init; } = new();
    public Dictionary<string, GameBattleDamageModifier> PlayerDamageByResult { get; init; } = [];
    public int SaleDiscountPercent { get; init; }
    public bool RepairProtectionAtBase { get; init; } = true;
    public IReadOnlyList<string> AttackOutcomeCodes { get; init; } = [];
}

public sealed class GameModeEditorUpdateDto
{
    public List<GameModeAreaDto> Areas { get; set; } = [];
    public Dictionary<string, GameBattleEncounterConfig> Encounters { get; set; } = [];
    public GameBattleFallbackAction FallbackAction { get; set; } = new();
    public Dictionary<string, GameBattleDamageModifier> PlayerDamageByResult { get; set; } = [];
    public int SaleDiscountPercent { get; set; }
    public bool RepairProtectionAtBase { get; set; } = true;
}

public sealed record GameModeNpcOptionDto(int Id, string Name, string? VariantId, string? Image)
{
    public int Vida { get; init; }
    public int Mana { get; init; }
    public int Estamina { get; init; }
    public int Defesa { get; init; }
    public IReadOnlyList<GameModeNpcActionOptionDto> Actions { get; init; } = [];
}

public sealed record GameModeNpcActionOptionDto(string Tipo, string IdInstancia, string Name, string? Image)
{
    public string? DeclaredRoll { get; init; }
    public string? UnavailableReason { get; init; }
    public bool Executable { get; init; }
    public int? Damage { get; init; }
    public int ManaCost { get; init; }
    public int StaminaCost { get; init; }
    public int CooldownTurns { get; init; }
    public int AmmoPerUse { get; init; }
}

public sealed record GameModeSystemVersionDto(int Id, string Number, string Status, bool Current);

public sealed record GameModeRestOptionDto(
    string Type, string Name, decimal Life, decimal Mana, decimal Stamina,
    bool Percentage, bool RequiresGuard, bool Executable);
