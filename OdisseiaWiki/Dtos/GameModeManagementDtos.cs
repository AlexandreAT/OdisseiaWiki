using OdisseiaWiki.GameRuns.Battle;

namespace OdisseiaWiki.Dtos;

public sealed record GameModeLootOptionDto(string Id, string Name, string Type, string? Image, decimal? Value = null);

public sealed class GameModeVendorOfferDto
{
    public string ItemId { get; set; } = string.Empty;
    public int Price { get; set; }
    public int Stock { get; set; } = 1;
    public int Weight { get; set; } = 1;
    public int MinLevel { get; set; } = 1;
    public System.Text.Json.Nodes.JsonObject? Snapshot { get; set; }
}

public sealed class GameModeEngineerUpgradeDto
{
    public int Damage { get; set; }
    public int Price { get; set; }
    public int MaxUpgrades { get; set; }
}

public sealed class GameModePowerOptionDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "SKILL";
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Image { get; set; }
    public int MinLevel { get; set; } = 1;
    public string? Requirements { get; set; }
}

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
    public string? NpcCode { get; set; }
    public string? NpcType { get; set; }
    public bool NpcLocked { get; set; }
    public string Type { get; set; } = "COMBATE";
    public string? EncounterCode { get; set; }
    public List<string> EncounterCodes { get; set; } = [];
    public string? SecretAreaCode { get; set; }
    public int Weight { get; set; } = 1;
    public bool Unique { get; set; }
    public string? Label { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public int GameMinutes { get; set; }
    public List<GameModeVendorOfferDto> Offers { get; set; } = [];
    public int OfferCount { get; set; } = 3;
    public GameModeEngineerUpgradeDto? Upgrade { get; set; }
}

public sealed class GameModeEditorDto
{
    public string CodigoJogo { get; init; } = "ROGUELIKE_MVP";
    public int? IdMesa { get; init; }
    public string NomeJogo { get; init; } = "Odisseia";
    public string? DescricaoJogo { get; init; }
    public string? BannerJogo { get; init; }
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
    public int StartingCurrency { get; init; }
    public bool RepairProtectionAtBase { get; init; } = true;
    public int ProtectedDepositSlots { get; init; }
    public int ProtectedDepositCost { get; init; }
    public List<GameModePowerOptionDto> PowerCatalog { get; init; } = [];
    public IReadOnlyList<string> AttackOutcomeCodes { get; init; } = [];
}

public sealed record GameAdventureDto(string Codigo, int? IdMesa, int IdSistemaVersao,
    string Nome, string? Descricao, string? Banner, string Status, string NumeroVersao);

public sealed class GameAdventureCreateDto
{
    public int? IdMesa { get; set; }
    public int? IdSistemaVersao { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? Banner { get; set; }
}

public sealed class GameModeEditorUpdateDto
{
    public List<GameModeAreaDto> Areas { get; set; } = [];
    public Dictionary<string, GameBattleEncounterConfig> Encounters { get; set; } = [];
    public GameBattleFallbackAction FallbackAction { get; set; } = new();
    public Dictionary<string, GameBattleDamageModifier> PlayerDamageByResult { get; set; } = [];
    public int SaleDiscountPercent { get; set; }
    public int StartingCurrency { get; set; }
    public bool RepairProtectionAtBase { get; set; } = true;
    // Omitted by an older editor: preserve the draft's existing settings.
    public int? ProtectedDepositSlots { get; set; }
    public int? ProtectedDepositCost { get; set; }
    // Null preserves a catalog when an older client saves the rest of a draft.
    public List<GameModePowerOptionDto>? PowerCatalog { get; set; }
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
