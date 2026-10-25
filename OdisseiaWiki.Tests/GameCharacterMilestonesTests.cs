using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameCharacterMilestonesTests
{
    private static GameBattleEncounterConfig Enemy(int? id = 12, string? variant = null) => new()
    {
        Enemy = new() { NpcId = id, VariantId = variant, Name = "Maga", MaxVida = 200,
            MaxMana = 100, Quantity = 4, InventarioJson = "[]" },
        DamageByResult = new() { ["ACERTO"] = 50 }, XpReward = 500, CurrencyReward = 100, LootCount = 2,
        Loot = [new() { ItemId = "a", Weight = 1 }]
    };

    [Fact]
    public void VitoriasNaoDuplicamNpcMasPreservamVariantesESistemasSeparados()
    {
        var state = new GameCharacterMilestones();
        var enemy = Enemy();
        state.Learn(1, "JOGO_A", "MAGA", enemy);
        state.Learn(1, "JOGO_A", "MAGA", enemy);
        state.Learn(1, "JOGO_B", "MAGA_OUTRA_ROTA", enemy);
        Assert.Single(state.DefeatedEnemies);
        state.Learn(1, "JOGO_A", "MAGA", Enemy(12, "gelo"));
        state.Learn(2, "JOGO_A", "MAGA", enemy);
        Assert.Equal(3, state.DefeatedEnemies.Count);
        Assert.Equal(4, enemy.Enemy!.Quantity);
        Assert.Equal(500, enemy.XpReward);
        var saved = state.DefeatedEnemies[0].Encounter;
        Assert.Equal(1, saved.Enemy!.Quantity);
        Assert.Equal(0, saved.XpReward);
        Assert.Equal(0, saved.CurrencyReward);
        Assert.Empty(saved.Loot);
        Assert.Equal(0, saved.LootCount);
    }

    [Fact]
    public void NpcsGenericosUsamIdentidadeDaAventuraERotaSemDependerDoNome()
    {
        var state = new GameCharacterMilestones();
        state.Learn(1, "A", "MAGA", Enemy(null));
        state.Learn(1, "B", "MAGA", Enemy(null));
        var changed = Enemy(null); changed.Enemy!.Name = "Nome alterado";
        state.Learn(1, "A", "MAGA", changed);
        Assert.Equal(2, state.DefeatedEnemies.Count);
        Assert.Contains(state.DefeatedEnemies, item => item.Encounter.Enemy!.Name == "Nome alterado");
    }

    [Fact]
    public void EstruturaVersionadaPreservaReservasDeNpcEItensProtegidosSemConcederNada()
    {
        var state = GameCharacterMilestones.Read(null);
        Assert.Equal(1, state.SchemaVersion);
        Assert.Empty(state.RescuedNpcs); Assert.Empty(state.ProtectedItems);
        state.RescuedNpcs.Add(new("JOGO", 1, "MEDICO"));
        state.ProtectedItems.Add(new("JOGO", 1, "item", new() { ["valor"] = 40 }));
        var copy = GameCharacterMilestones.Read(state.Serialize());
        Assert.Single(copy.RescuedNpcs); Assert.Single(copy.ProtectedItems);
        Assert.Empty(copy.DefeatedEnemies);
    }

    [Fact]
    public void MemoriaTemChaveDoPersonagemERelacaoCascadeSemApagarHistoricoDaRun()
    {
        using var context = new OdisseiaContext(new DbContextOptionsBuilder<OdisseiaContext>()
            .UseMySql("Server=localhost;Database=model_only;User=unused;Password=unused",
                new MySqlServerVersion(new Version(8, 0, 36))).Options);
        var entity = context.Model.FindEntityType(typeof(GameCharacterMemory))!;
        Assert.Equal("gamecharactermemories", entity.GetTableName());
        Assert.Equal("IdPersonagemJogador", Assert.Single(entity.FindPrimaryKey()!.Properties).Name);
        var relation = Assert.Single(entity.GetForeignKeys());
        Assert.Equal(typeof(PersonagemJogador), relation.PrincipalEntityType.ClrType);
        Assert.Equal(DeleteBehavior.Cascade, relation.DeleteBehavior);
        Assert.DoesNotContain(context.Model.FindEntityType(typeof(GameRun))!.GetForeignKeys(),
            fk => fk.PrincipalEntityType.ClrType == typeof(PersonagemJogador));
    }
}
