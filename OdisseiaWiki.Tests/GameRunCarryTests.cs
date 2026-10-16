using System.Text.Json;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunCarryTests
{
    private const string Snapshot = """
        {"status":{"status":{"capacidadeCarga":10,"estamina":100,"estaminaMaxima":100}},
         "inventario":[{"id":"espada","peso":6,"quantidade":1},{"id":"armadura","peso":3,"quantidade":2}]}
        """;

    [Fact]
    public void TodosOsItensContamMesmoSemEstarEquipados()
    {
        string heavy = GameRunCarry.Reconcile(Snapshot, System());
        using JsonDocument document = JsonDocument.Parse(heavy);
        Assert.Equal(12, document.RootElement.GetProperty("carga").GetProperty("pesoAtual").GetDecimal());
        Assert.Equal(50, document.RootElement.GetProperty("status").GetProperty("status").GetProperty("estaminaMaxima").GetInt32());

        string dropped = GameRunCarry.Reconcile(GameRunCarry.Drop(heavy, "armadura"), System());
        using JsonDocument after = JsonDocument.Parse(dropped);
        Assert.Equal(6, after.RootElement.GetProperty("carga").GetProperty("pesoAtual").GetDecimal());
        Assert.Equal(100, after.RootElement.GetProperty("status").GetProperty("status").GetProperty("estaminaMaxima").GetInt32());
        Assert.False(after.RootElement.GetProperty("carga").GetProperty("sobrecarregado").GetBoolean());
    }

    [Fact]
    public void RegraPublicadaDefineReducaoNaoValorFixo()
    {
        string result = GameRunCarry.Reconcile(Snapshot, System(30));
        using JsonDocument document = JsonDocument.Parse(result);
        Assert.Equal(70, document.RootElement.GetProperty("status").GetProperty("status").GetProperty("estaminaMaxima").GetInt32());
        Assert.Equal(30, document.RootElement.GetProperty("carga").GetProperty("penalidadePercentual").GetInt32());
    }

    private static SistemaVersao System(decimal reduction = 50) => new()
    {
        Condicoes = new List<SistemaCondicao> { new()
        {
            Codigo = "PESADO", Nome = "Pesado", Tipo = "Físico",
            CodigoRecursoGatilho = "EXCESSO_CARGA", CodigoRecurso = "ESTAMINA",
            OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL", ValorEfeito = reduction,
        } },
    };
}
