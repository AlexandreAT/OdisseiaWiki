using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using OdisseiaWiki.GameRuns.Battle;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameBattleEventJsonTests
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    [Fact]
    public void TodosOsEventosRegistradosAceitamDiscriminadorForaDaPrimeiraPosicao()
    {
        foreach (var attribute in typeof(GameBattleEventPayload).GetCustomAttributes<JsonDerivedTypeAttribute>())
        {
            string kind = (string)attribute.TypeDiscriminator!;
            var json = new JsonObject { ["sequence"] = 7, ["schemaVersion"] = 1, ["round"] = 2,
                ["type"] = kind, ["actorId"] = "player", ["payload"] = new JsonObject {
                    ["name"] = "Nome", ["kind"] = kind } };
            var value = JsonSerializer.Deserialize<GameBattleEvent>(json.ToJsonString(), Options)!;
            Assert.Equal(attribute.DerivedType, value.Payload.GetType());
            Assert.Equal(7, value.Sequence); Assert.Equal(2, value.Round);
        }
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void ImagemQuantidadeETipoPermanecemNaSerializacaoIndependenteDaOrdem(bool keepKind)
    {
        var original = new GameBattleEvent(8, 1, 2, GameBattleEventTypes.ActionSelected, "enemy", null,
            new ActionSelectedPayload("protese:braco", "Kakurui", false) { Image = "/kakurui.png", SourceType = "PROTESE", Quantity = 2 });
        var json = JsonSerializer.SerializeToNode(original, Options)!.AsObject();
        var payload = json["payload"]!.AsObject();
        var kind = payload["kind"]!.DeepClone(); payload.Remove("kind");
        if (keepKind) payload["kind"] = kind;
        var restored = JsonSerializer.Deserialize<GameBattleEvent>(json.ToJsonString(), Options)!;
        Assert.Equal(original, restored);
        Assert.Equal(original, JsonSerializer.Deserialize<GameBattleEvent>(JsonSerializer.Serialize(restored, Options), Options));
    }

    [Fact]
    public void TipoDesconhecidoNaoEViradoSilenciosamenteEmOutraAcao()
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<GameBattleEvent>(
            """{"type":"ACTION_SELECTED","payload":{"actionId":"a","kind":"UNKNOWN"}}""", Options));
    }
}
