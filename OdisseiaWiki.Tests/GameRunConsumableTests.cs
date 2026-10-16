using System.Text.Json;
using OdisseiaWiki.GameRuns.Inventory;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunConsumableTests
{
    [Fact]
    public void Outro_ComRecuperacao_ConsomeUnidadesEAplicaEfeitos()
    {
        const string snapshot = """
            {"status":{"status":{"vida":10,"vidaMaxima":100,"mana":2,"manaMaxima":50,
              "estamina":3,"estaminaMaxima":40}},"inventario":[{"id":"outro-1","nome":"Elixir",
              "tipo":"outro","quantidade":2,"atributos":{"recuperacaoVida":20,
              "recuperacaoMana":4,"recuperacaoEstamina":5}}]}
            """;
        GameRunConsumableEffect result = GameRunConsumable.Use(snapshot, "outro-1", 2);
        Assert.Equal(40, result.LifeRestored);
        Assert.Equal(8, result.ManaRestored);
        Assert.Equal(10, result.StaminaRestored);
        Assert.Equal(0, result.RemainingQuantity);
        using JsonDocument state = JsonDocument.Parse(result.SnapshotJson);
        Assert.Empty(state.RootElement.GetProperty("inventario").EnumerateArray());
    }

    private const string Snapshot = """
        {"status":{"status":{"vida":10,"vidaMaxima":30,"mana":5,"manaMaxima":10,
          "estamina":8,"estaminaMaxima":10}},
         "inventario":[{"id":"kit-1","nome":"Kit de cura","tipo":"consumiveis","quantidade":2,
           "atributos":{"restaura":{"vida":25,"mana":4,"estamina":3}}}]}
        """;

    [Fact]
    public void AplicaCuraAteOMaximoEConsomeUmaUnidade()
    {
        GameRunConsumableEffect effect = GameRunConsumable.Use(Snapshot, "kit-1");
        using JsonDocument document = JsonDocument.Parse(effect.SnapshotJson);
        JsonElement resources = document.RootElement.GetProperty("status").GetProperty("status");
        JsonElement item = document.RootElement.GetProperty("inventario")[0];

        Assert.Equal(20, effect.LifeRestored);
        Assert.Equal(4, effect.ManaRestored);
        Assert.Equal(2, effect.StaminaRestored);
        Assert.Equal(1, effect.RemainingQuantity);
        Assert.Equal(30, resources.GetProperty("vida").GetInt32());
        Assert.Equal(9, resources.GetProperty("mana").GetInt32());
        Assert.Equal(10, resources.GetProperty("estamina").GetInt32());
        Assert.Equal(1, item.GetProperty("quantidade").GetInt32());
        Assert.Contains("\"vida\":10", Snapshot);
    }

    [Fact]
    public void RemoveUltimaUnidadeERecusaUsoSemEfeito()
    {
        GameRunConsumableEffect first = GameRunConsumable.Use(Snapshot, "kit-1");
        GameRunConsumableEffect second = GameRunConsumable.Use(first.SnapshotJson, "kit-1");
        using JsonDocument document = JsonDocument.Parse(second.SnapshotJson);

        Assert.Equal(0, second.RemainingQuantity);
        Assert.Equal(1, second.ManaRestored);
        Assert.Empty(document.RootElement.GetProperty("inventario").EnumerateArray());
        Assert.Equal("ITEM_INDISPONIVEL", Assert.Throws<GameRunConsumableException>(
            () => GameRunConsumable.Use(second.SnapshotJson, "kit-1")).Code);

        string full = Snapshot.Replace("\"vida\":10", "\"vida\":30")
            .Replace("\"mana\":5", "\"mana\":10")
            .Replace("\"estamina\":8", "\"estamina\":10");
        Assert.Equal("RECURSOS_CHEIOS", Assert.Throws<GameRunConsumableException>(
            () => GameRunConsumable.Use(full, "kit-1")).Code);
    }

    [Fact]
    public void RejeitaItemQueNaoSejaConsumivelOuCuraNegativa()
    {
        Assert.Equal("ITEM_INVALIDO", Assert.Throws<GameRunConsumableException>(() =>
            GameRunConsumable.Use(Snapshot.Replace("consumiveis", "arma"), "kit-1")).Code);
        Assert.Equal("ITEM_INVALIDO", Assert.Throws<GameRunConsumableException>(() =>
            GameRunConsumable.Use(Snapshot.Replace("\"vida\":25", "\"vida\":-25"), "kit-1")).Code);
    }

    [Fact]
    public void UsaQuantidadeEscolhidaEmUmaOperacaoSemPassarDoMaximo()
    {
        GameRunConsumableEffect effect = GameRunConsumable.Use(Snapshot, "kit-1", 2);
        using JsonDocument document = JsonDocument.Parse(effect.SnapshotJson);
        JsonElement resources = document.RootElement.GetProperty("status").GetProperty("status");

        Assert.Equal(0, effect.RemainingQuantity);
        Assert.Equal(20, effect.LifeRestored);
        Assert.Equal(5, effect.ManaRestored);
        Assert.Equal(2, effect.StaminaRestored);
        Assert.Empty(document.RootElement.GetProperty("inventario").EnumerateArray());
        Assert.Equal(10, resources.GetProperty("mana").GetInt32());
        Assert.Equal("ITEM_INDISPONIVEL", Assert.Throws<GameRunConsumableException>(
            () => GameRunConsumable.Use(Snapshot, "kit-1", 3)).Code);
    }

    [Fact]
    public void UsaTodaAPilhaMesmoQuandoInventarioOriginalFoiSerializadoComoTexto()
    {
        using JsonDocument inventory = JsonDocument.Parse("""
            [{"id":"kit-1","nome":"Kit","tipo":"consumiveis","quantidade":1,
              "atributos":{"restaura":{"vida":5}}},
             {"id":"kit-2","nome":"Kit","tipo":"consumiveis","quantidade":1,
              "atributos":{"restaura":{"vida":5}}}]
            """);
        string snapshot = JsonSerializer.Serialize(new
        {
            status = new { status = new { vida = 10, vidaMaxima = 30, mana = 0, manaMaxima = 0,
                estamina = 0, estaminaMaxima = 0 } },
            inventario = inventory.RootElement.GetRawText()
        });
        GameRunConsumableEffect effect = GameRunConsumable.Use(snapshot, "kit-1", 2);
        using JsonDocument result = JsonDocument.Parse(effect.SnapshotJson);
        Assert.Equal(10, effect.LifeRestored);
        Assert.Equal(0, effect.RemainingQuantity);
        Assert.Equal(20, result.RootElement.GetProperty("status").GetProperty("status").GetProperty("vida").GetInt32());
        Assert.Empty(result.RootElement.GetProperty("inventario").EnumerateArray());
    }

    [Fact]
    public void MetadadosVisuaisDiferentesNaoSeparamConsumiveisComMesmoEfeito()
    {
        string snapshot = """
            {"status":{"status":{"vida":10,"vidaMaxima":30,"mana":0,"manaMaxima":0,
              "estamina":0,"estaminaMaxima":0}},
             "inventario":[
               {"id":"kit-1","nome":"Kit","tipo":"consumiveis","quantidade":1,
                "atributos":{"restaura":{"vida":5},"__vistaExplodida":{"gridPosition":1}}},
               {"id":"kit-2","nome":"Kit","tipo":"consumiveis","quantidade":1,
                "atributos":{"restaura":{"vida":5},"__vistaExplodida":{"gridPosition":3}}}]}
            """;
        GameRunConsumableEffect effect = GameRunConsumable.Use(snapshot, "kit-1", 2);
        using JsonDocument document = JsonDocument.Parse(effect.SnapshotJson);
        Assert.Equal(10, effect.LifeRestored);
        Assert.Equal(0, effect.RemainingQuantity);
        Assert.Empty(document.RootElement.GetProperty("inventario").EnumerateArray());
    }

    [Fact]
    public void EmpilhaCopiasDoMesmoConsumivelSemMisturarOutrosEfeitos()
    {
        string snapshot = Snapshot.Replace("\"quantidade\":2", "\"idItemBase\":\"base-1\",\"quantidade\":1")
            .Replace("}]}", "},{\"id\":\"kit-2\",\"idItemBase\":\"base-1\",\"nome\":\"Kit de cura\",\"tipo\":\"consumiveis\",\"quantidade\":1,\"atributos\":{\"restaura\":{\"vida\":25,\"mana\":4,\"estamina\":3}}}]}");
        GameRunConsumableEffect effect = GameRunConsumable.Use(snapshot, "kit-1", 2);

        Assert.Equal(0, effect.RemainingQuantity);
        using JsonDocument document = JsonDocument.Parse(effect.SnapshotJson);
        Assert.Empty(document.RootElement.GetProperty("inventario").EnumerateArray());
    }
}
