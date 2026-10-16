using System.Text.Json;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunProgressionTests
{
    [Fact]
    public void XpExcedenteSobeVariosNiveisEPreservaEscolhasPendentesNaCopia()
    {
        const string original = """{"status":{"nivel":1,"xp":17,"pontos":2,"status":{"vida":9}}}""";
        GameRunProgressionResult result = GameRunProgression.Apply(original, Version(true));
        using JsonDocument json = JsonDocument.Parse(result.SnapshotJson);
        JsonElement status = json.RootElement.GetProperty("status");

        Assert.Equal(new[] { 2, 3 }, result.LevelsReached);
        Assert.Equal(new GameRunGrantedPoints(1, 2), result.PointsGranted);
        Assert.Equal(3, status.GetProperty("nivel").GetInt32());
        Assert.Equal(2, status.GetProperty("xp").GetInt32());
        Assert.Equal(3, status.GetProperty("pontos").GetInt32());
        Assert.Equal(2, status.GetProperty("pontosAtributo").GetInt32());
        Assert.Equal(9, status.GetProperty("status").GetProperty("vida").GetInt32());
        JsonElement pending = status.GetProperty("evolucoesPendentes");
        Assert.Equal(2, pending.GetArrayLength());
        Assert.True(pending[0].GetProperty("novaSkill").GetBoolean());
        Assert.Equal("MARCO_3", pending[1].GetProperty("marcos")[0].GetProperty("codigo").GetString());
        Assert.Contains("\"nivel\":1", original);
    }

    [Fact]
    public void SemXpExcedenteDescartaSobraEParaAposUmNivel()
    {
        const string original = """{"status":{"nivel":1,"xp":20}}""";
        GameRunProgressionResult result = GameRunProgression.Apply(original, Version(false));
        using JsonDocument json = JsonDocument.Parse(result.SnapshotJson);
        Assert.Equal(new[] { 2 }, result.LevelsReached);
        Assert.Equal(0, json.RootElement.GetProperty("status").GetProperty("xp").GetInt32());
    }

    [Fact]
    public void NaoInventaEvolucaoSemModuloOuLimiarPublicado()
    {
        const string original = """{"status":{"nivel":1,"xp":100}}""";
        SistemaVersao withoutModule = Version(true);
        withoutModule.Modulos.Clear();
        Assert.Equal(original, GameRunProgression.Apply(original, withoutModule).SnapshotJson);

        SistemaVersao withoutThreshold = Version(true);
        withoutThreshold.Niveis.First().XpParaProximoNivel = 0;
        Assert.Empty(GameRunProgression.Apply(original, withoutThreshold).LevelsReached);

        SistemaVersao withoutExplicitRules = Version(true);
        withoutExplicitRules.Modulos.First().ConfiguracaoJson = "{}";
        Assert.Empty(GameRunProgression.Apply(original, withoutExplicitRules).LevelsReached);
    }

    private static SistemaVersao Version(bool overflow) => new()
    {
        Modulos = new List<SistemaModulo>
        {
            new() { TipoModulo = SistemaModuloTipo.Progressao, Habilitado = true,
                ConfiguracaoJson = $$"""{"nivelMaximo":3,"permiteXpExcedente":{{overflow.ToString().ToLowerInvariant()}}}""" },
        },
        Niveis = new List<SistemaNivel>
        {
            new() { Nivel = 1, XpParaProximoNivel = 10 },
            new() { Nivel = 2, XpParaProximoNivel = 5, PontosNivel = 1, PermiteNovaSkill = true },
            new() { Nivel = 3, XpParaProximoNivel = 0, PontosAtributo = 2 },
        },
        MarcosNivel = new List<SistemaMarcoNivel>
        {
            new() { Nivel = 3, Codigo = "MARCO_3", Nome = "Marco", TipoRecompensa = "Escolha" },
        },
    };
}
