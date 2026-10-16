using System.Text.Json.Serialization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Services;

namespace OdisseiaWiki.GameRuns.Battle;

/// <summary>
/// Executable battle input assembled from a pinned, published System version and run snapshots.
/// Actor snapshots keep player-first order; the published initiative rule decides turn order.
/// </summary>
public sealed record GameBattleInput(
    GameBattleActorSpec FirstActor,
    GameBattleActorSpec SecondActor,
    IReadOnlyList<GameBattleDefenseKind> DefenseOrder,
    int MaxRounds = 20, // Retained for older callers; not a gameplay limit.
    int MaxEvents = 10000,
    int MaxRoundsWithoutDamage = 5)
{
    public IReadOnlyList<GameBattleActorSpec> AdditionalEnemies { get; init; } = [];
    public bool UseInitiative { get; init; }
    public bool OpeningOpportunityAttack { get; init; }
    public IReadOnlyDictionary<string, string> PreferredTargets { get; init; } = new Dictionary<string, string>();
}

public sealed record GameBattleActorSpec(
    string Id,
    string Name,
    int HitPoints,
    int MaximumHitPoints,
    int Mana,
    int MaximumMana,
    int Stamina,
    int MaximumStamina,
    GameBattleDefenses Defenses,
    IReadOnlyList<GameBattleActionSpec> Actions,
    string? Image = null)
{
    public GameBattleRestSpec? Rest { get; init; }
    public GameBattleInitiativeSpec? Initiative { get; init; }
}

public sealed record GameBattleInitiativeSpec(string Formula, int Quantity, int Faces, int Modifier);

public sealed record GameBattleRestSpec(
    int AfterActionIndex, decimal Life, decimal Mana, decimal Stamina, bool Percentage);

/// <summary>
/// Shield spends its full value on the first positive hit, with overflow; protection is a depleting pool;
/// armor absorbs its value on each hit. Combined defenses require explicit order.
/// Armor break and damage types are outside this first executable contract.
/// </summary>
public sealed record GameBattleDefenses(int Shield = 0, int Protection = 0, int Armor = 0)
{
    // Replays anteriores persistiram o escudo como uma carga booleana.
    // Aceitar o campo antigo mantém esses combates consultáveis sem publicá-lo nos novos logs.
    [JsonPropertyName("shieldCharges")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? LegacyShieldCharges
    {
        get => null;
        init { if (value is > 0 && Shield == 0) Shield = value.Value; }
    }
}

public enum GameBattleDefenseKind
{
    Shield,
    Protection,
    Armor,
}

/// <summary>
/// Result ranges and damage values must originate in executable published rules.
/// The simulator never interprets descriptive item, skill or spell text.
/// </summary>
public sealed record GameBattleActionSpec(
    string Id,
    string Name,
    GameplayRollPlan Roll,
    IReadOnlyList<GameplayResolvedResultRange> ResultRanges,
    bool UseTotalForRanges,
    IReadOnlyDictionary<string, int> DamageByResultCode,
    int ManaCost = 0,
    int StaminaCost = 0,
    int CooldownTurns = 0,
    GameBattleMagazineSpec? Magazine = null)
{
    public bool IsFallback { get; init; }
    public int AttacksPerTurn { get; init; } = 1;
    public int AdditionalAttackStaminaCost { get; init; }
    public int UsesUntilRest { get; init; }
    public int? InitialUsesRemaining { get; init; }
}

public sealed record GameBattleMagazineSpec(
    int Capacity,
    int Loaded,
    int Reserve,
    int AmmoPerUse = 1,
    bool ReloadWhenEmpty = true)
{
    // No minijogo, a ausência de reserva configurada permite recargas durante
    // o encontro; uma reserva explícita continua sendo finita.
    public bool UnlimitedReserve { get; init; }
}

public interface IAutoBattleSimulator
{
    GameBattleResult Simulate(GameBattleInput input, OdisseiaWiki.Services.Interfaces.IDiceRandomSource random);
}

/// <summary>A reproducible random stream for a server-selected, persisted battle seed.</summary>
public sealed class SeededGameRunRandomSource : OdisseiaWiki.Services.Interfaces.IDiceRandomSource
{
    private readonly Random _random;

    public SeededGameRunRandomSource(int seed)
    {
        _random = new Random(seed);
    }

    public int NextInclusive(int maximum)
    {
        if (maximum is < 1 or >= int.MaxValue)
            throw new ArgumentOutOfRangeException(nameof(maximum));

        return _random.Next(1, maximum + 1);
    }
}

public enum GameBattleEndReason
{
    ActorDefeated,
    RoundLimit,
    EventLimit,
    NoDamage,
}

public sealed record GameBattleActionState(string ActionId, int? MagazineCapacity, int? Loaded, int? Reserve, int CooldownRemaining)
{
    public int? RemainingUses { get; init; }
}

public sealed record GameBattleActorState(
    string Id,
    string Name,
    int HitPoints,
    int MaximumHitPoints,
    int Mana,
    int MaximumMana,
    int Stamina,
    int MaximumStamina,
    GameBattleDefenses Defenses,
    IReadOnlyList<GameBattleActionState> Actions);

public sealed record GameBattleResult(
    string? WinnerActorId,
    GameBattleEndReason EndReason,
    int RoundsCompleted,
    IReadOnlyList<GameBattleActorState> Actors,
    IReadOnlyList<GameBattleEvent> Events);

public sealed record GameBattleEvent(
    int Sequence,
    int SchemaVersion,
    int Round,
    string Type,
    string? ActorId,
    string? TargetId,
    GameBattleEventPayload Payload);

public static class GameBattleEventTypes
{
    public const string BattleStarted = "BATTLE_STARTED";
    public const string InitiativeRolled = "INITIATIVE_ROLLED";
    public const string TurnStarted = "TURN_STARTED";
    public const string ActionSelected = "ACTION_SELECTED";
    public const string ActionUnavailable = "ACTION_UNAVAILABLE";
    public const string ReloadPerformed = "RELOAD_PERFORMED";
    public const string RestPerformed = "REST_PERFORMED";
    public const string DiceRolled = "DICE_ROLLED";
    public const string DamageCalculated = "DAMAGE_CALCULATED";
    public const string DefenseApplied = "DEFENSE_APPLIED";
    public const string ResourceChanged = "RESOURCE_CHANGED";
    public const string CooldownStarted = "COOLDOWN_STARTED";
    public const string CooldownAdvanced = "COOLDOWN_ADVANCED";
    public const string TurnPassed = "TURN_PASSED";
    public const string ActorDefeated = "ACTOR_DEFEATED";
    public const string BattleEnded = "BATTLE_ENDED";
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(BattleStartedPayload), GameBattleEventTypes.BattleStarted)]
[JsonDerivedType(typeof(InitiativeRolledPayload), GameBattleEventTypes.InitiativeRolled)]
[JsonDerivedType(typeof(TurnStartedPayload), GameBattleEventTypes.TurnStarted)]
[JsonDerivedType(typeof(ActionSelectedPayload), GameBattleEventTypes.ActionSelected)]
[JsonDerivedType(typeof(ActionUnavailablePayload), GameBattleEventTypes.ActionUnavailable)]
[JsonDerivedType(typeof(ReloadPerformedPayload), GameBattleEventTypes.ReloadPerformed)]
[JsonDerivedType(typeof(RestPerformedPayload), GameBattleEventTypes.RestPerformed)]
[JsonDerivedType(typeof(DiceRolledPayload), GameBattleEventTypes.DiceRolled)]
[JsonDerivedType(typeof(DamageCalculatedPayload), GameBattleEventTypes.DamageCalculated)]
[JsonDerivedType(typeof(DefenseAppliedPayload), GameBattleEventTypes.DefenseApplied)]
[JsonDerivedType(typeof(ResourceChangedPayload), GameBattleEventTypes.ResourceChanged)]
[JsonDerivedType(typeof(CooldownStartedPayload), GameBattleEventTypes.CooldownStarted)]
[JsonDerivedType(typeof(CooldownAdvancedPayload), GameBattleEventTypes.CooldownAdvanced)]
[JsonDerivedType(typeof(TurnPassedPayload), GameBattleEventTypes.TurnPassed)]
[JsonDerivedType(typeof(ActorDefeatedPayload), GameBattleEventTypes.ActorDefeated)]
[JsonDerivedType(typeof(BattleEndedPayload), GameBattleEventTypes.BattleEnded)]
public abstract record GameBattleEventPayload;

public sealed record BattleStartedPayload(IReadOnlyList<string> ActorOrder) : GameBattleEventPayload;
public sealed record InitiativeRolledPayload(string Formula, IReadOnlyList<int> Dice, int Modifier, int Total) : GameBattleEventPayload;
public sealed record TurnStartedPayload(int ActorTurn) : GameBattleEventPayload;
public sealed record ActionSelectedPayload(string ActionId, string ActionName, bool Reload) : GameBattleEventPayload
{
    public bool Reaction { get; init; }
    public int Quantity { get; init; } = 1;
}
public sealed record ActionUnavailablePayload(string ActionId, string Reason) : GameBattleEventPayload;
public sealed record ReloadPerformedPayload(string ActionId, int LoadedBefore, int LoadedAfter, int ReserveAfter) : GameBattleEventPayload;
public sealed record RestPerformedPayload(string ActionId) : GameBattleEventPayload;
public sealed record DiceRolledPayload(string ActionId, GameplayRollMode Mode, GameplayRollResultDto Roll, string ResultCode) : GameBattleEventPayload
{
    public string? ResultName { get; init; }
    public bool? Critical { get; init; }
    public bool? CriticalFailure { get; init; }
}
public sealed record DamageCalculatedPayload(string ActionId, string ResultCode, int Damage) : GameBattleEventPayload;
public sealed record DefenseAppliedPayload(GameBattleDefenseKind Defense, int Absorbed, int RemainingDamage, int DefenseAfter) : GameBattleEventPayload;
public sealed record ResourceChangedPayload(string Resource, int Before, int After, string? ActionId) : GameBattleEventPayload;
public sealed record CooldownStartedPayload(string ActionId, int CooldownTurns, int AvailableOnActorTurn) : GameBattleEventPayload;
public sealed record CooldownAdvancedPayload(string ActionId, int RemainingActorTurns) : GameBattleEventPayload;
public sealed record TurnPassedPayload(string Reason) : GameBattleEventPayload;
public sealed record ActorDefeatedPayload(string ActorId) : GameBattleEventPayload;
public sealed record BattleEndedPayload(string? WinnerActorId, GameBattleEndReason Reason) : GameBattleEventPayload;
