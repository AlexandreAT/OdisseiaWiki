using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameBattleMediaTests
{
    private static GameBattlePreviewDto Preview(params GameBattleEvent[] events) => new(1, 10, 7, 1, [], "Treino",
        new("player", "Herói", 100, 100, 10, 10, 10, 10, new()),
        new("enemy", "Maga", 100, 100, 10, 10, 10, 10, new(), "/maga.png"),
        new("player", GameBattleEndReason.ActorDefeated, 1, [], events));
    private static GameBattleEvent Action(string id, string actor = "player", string? image = null) =>
        new(1, 1, 1, GameBattleEventTypes.ActionSelected, actor, null,
            new ActionSelectedPayload(id, "Nome salvo", false) { Image = image, Quantity = 2 });
    private static GameRun Run(string config = "{}") => new() { GameModeVersion = new() { ConfiguracaoJson = config },
        MapaJson = """{"nodes":[],"historicalNodes":[{"id":"luta","payload":{"encounterCode":"MAGA"}}]}""" };

    [Theory]
    [InlineData("item:arma", "ARMA", "/arma.png")]
    [InlineData("item:cura", "ITEM", "/cura.png")]
    [InlineData("protese:braco", "PROTESE", "assets_dynamic/kakurui.png")]
    [InlineData("magia:fogo", "MAGIA", "/fogo.png")]
    [InlineData("skill:raio", "SKILL", "/raio.png")]
    public void HistoricoRestauraTodasAsOrigensPeloSnapshotAnteriorSemUsarEstadoAtual(string id, string kind, string image)
    {
        var battle = new GameRunBattle { NoId = "luta", EstadoAntesJson = """
            {"inventario":[{"id":"arma","tipo":"arma","imagem":"/arma.png"},{"id":"cura","imagem":"/cura.png"}],
             "implantes":{"implantes":[{"id":"braco","imagem":"assets_dynamic/kakurui.png"}]},
             "magia":"[{\"id\":\"fogo\",\"imagem\":\"/fogo.png\"}]",
             "skills":{"skills":[{"id":"raio","imagem":"/raio.png"}]}}
            """ };
        var run = Run(); run.EstadoAtualJson = """{"inventario":[],"implantes":[],"magia":[],"skills":[]}""";
        var preview = Preview(Action(id));
        string before = JsonSerializer.Serialize(preview);
        var result = GameBattleMedia.Restore(preview, battle, run, null);
        var selected = Assert.IsType<ActionSelectedPayload>(result.Resultado.Events[0].Payload);
        Assert.Equal(image, selected.Image); Assert.Equal(kind, selected.SourceType);
        Assert.Equal(2, selected.Quantity); Assert.Equal("Nome salvo", selected.ActionName);
        Assert.Equal(before, JsonSerializer.Serialize(preview));
        Assert.Equal(preview.Resultado.WinnerActorId, result.Resultado.WinnerActorId);
    }

    [Theory]
    [InlineData("{\"imagem\":\" /copia.png \",\"itemBase\":{\"imagem\":\"/base.png\"}}", "/copia.png")]
    [InlineData("{\"imagem\":\" \",\"url\":\"/url.png\"}", "/url.png")]
    [InlineData("{\"itemBase\":{\"imagem\":\"/base.png\"}}", "/base.png")]
    [InlineData("{\"baseItem\":{\"Imagem\":\"/base.png\"}}", "/base.png")]
    [InlineData("{\"image\":\"https://example.com/image.png\"}", "https://example.com/image.png")]
    [InlineData("{\"imagem\":42}", null)]
    public void LeituraCentralRespeitaImagemDaCopiaEAliasesLegados(string json, string? expected)
    {
        using var document = JsonDocument.Parse(json);
        Assert.Equal(expected, GameBattleMedia.ReadImage(document.RootElement));
    }

    [Fact]
    public void ImagemJaGravadaNaoESobrescritaENpcNaoUsaItemDoJogadorComMesmoId()
    {
        var battle = new GameRunBattle { NoId = "luta", EstadoAntesJson = """{"inventario":[{"id":"igual","imagem":"/heroi.png"}]}""" };
        var run = Run("""{"encounters":{"MAGA":{"enemy":{"inventarioJson":"[{\"id\":\"igual\",\"tipo\":\"arma\",\"imagem\":\"/npc.png\"}]"}}}}""");
        var result = GameBattleMedia.Restore(Preview(Action("item:igual", image: "/original.png"),
            Action("item:igual", "enemy"), Action("enemy-attack", "enemy")), battle, run, null);
        var actions = result.Resultado.Events.Select(item => Assert.IsType<ActionSelectedPayload>(item.Payload)).ToArray();
        Assert.Equal("/original.png", actions[0].Image);
        Assert.Equal("/npc.png", actions[1].Image); Assert.Equal("ARMA", actions[1].SourceType);
        Assert.Equal("/maga.png", actions[2].Image); Assert.Equal("ATAQUE", actions[2].SourceType);
    }

    [Fact]
    public void CondicoesUsamVersaoFixadaEImagemDaAplicacaoSemTrocarEntreAtores()
    {
        var version = new SistemaVersao { Condicoes = [new() { Codigo = "REGEN", ConfiguracaoPadraoJson = """{"imagem":"assets_dynamic/regen.png"}""" }] };
        var preview = Preview(new(1, 1, 1, GameBattleEventTypes.ConditionApplied, "player", "enemy",
                new ConditionAppliedPayload("REGEN", "Regeneração", 100, 4, null) { Image = "/aplicada.png" }),
            new(2, 1, 1, GameBattleEventTypes.ConditionEffect, "enemy", "enemy", new ConditionEffectPayload("REGEN", "Regeneração", "SOMAR", "VIDA", 100, "INICIO_TURNO")),
            new(3, 1, 1, GameBattleEventTypes.ConditionExpired, "player", null, new ConditionExpiredPayload("REGEN", "Regeneração", "DURACAO")),
            new(4, 1, 1, GameBattleEventTypes.ResistanceRolled, "player", "enemy", new ResistanceRolledPayload("REGEN", [1], "AGILIDADE", 0, 1, 5, false)));
        var events = GameBattleMedia.Restore(preview, new() { EstadoAntesJson = "{}" }, Run(), version).Resultado.Events;
        Assert.Equal("/aplicada.png", Assert.IsType<ConditionAppliedPayload>(events[0].Payload).Image);
        Assert.Equal("/aplicada.png", Assert.IsType<ConditionEffectPayload>(events[1].Payload).Image);
        Assert.Equal("/assets_dynamic/regen.png", Assert.IsType<ConditionExpiredPayload>(events[2].Payload).Image);
        Assert.Equal("/assets_dynamic/regen.png", Assert.IsType<ResistanceRolledPayload>(events[3].Payload).Image);
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid")]
    [InlineData("{}")]
    public void DadosVisuaisLegadosAusentesOuInvalidosNaoEscondemOCombate(string snapshot)
    {
        var preview = Preview(Action("protese:ausente"));
        var restored = GameBattleMedia.Restore(preview, new() { EstadoAntesJson = snapshot }, Run(), null);
        Assert.Null(Assert.IsType<ActionSelectedPayload>(restored.Resultado.Events[0].Payload).Image);
        Assert.Equal(preview.Resultado.Events[0], restored.Resultado.Events[0]);
    }

    [Fact]
    public void CondicaoJaAtivaRecebeImagemFixadaSemMudarDuracaoOuIntensidade()
    {
        var preview = Preview();
        var rule = new GameBattleConditionRule("REGEN", "Regeneração", "SOMAR", "VIDA", 100, "INICIO_TURNO", false, true, "DURACAO");
        preview = preview with { Personagem = preview.Personagem with { Condicoes = [new(rule, 80, 3)] } };
        var version = new SistemaVersao { Condicoes = [new() { Codigo = "REGEN", ConfiguracaoPadraoJson = """{"imagem":"/regen.png"}""" }] };
        var active = Assert.Single(GameBattleMedia.Restore(preview, new(), Run(), version).Personagem.Condicoes);
        Assert.Equal("/regen.png", active.Rule.Image); Assert.Equal(80, active.Value); Assert.Equal(3, active.RemainingTurns);
        Assert.Null(preview.Personagem.Condicoes[0].Rule.Image);
    }
}
