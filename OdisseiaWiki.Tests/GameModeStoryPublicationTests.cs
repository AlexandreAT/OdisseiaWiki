using System.Text.Json;
using System.Text.Json.Nodes;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameModeStoryPublicationTests
{
    [Theory]
    [InlineData(null)] [InlineData(12)] [InlineData(34)]
    public async Task EventoEMissaoCongelamRecompensaDoCatalogoAutorizadoIgnorandoSnapshotEnviado(int? mesaId)
    {
        var draft = new GameModeVersion { IdGameModeVersion = 81, IdSistemaVersao = 7, IdMesa = mesaId,
            Status = GameModeVersionStatus.Rascunho, ConfiguracaoJson = "{}" };
        var item = new Item { Iditem = mesaId.HasValue ? $"local-{mesaId}" : "oficial", Nome = $"Item {mesaId ?? 0}",
            Tipo = ItemTipo.Consumiveis, Visivel = true, Valor = 100, AtributosJson = "{\"restaura\":{\"vida\":25}}" };
        var management = new Mock<IGameModeManagementRepository>();
        management.Setup(repo => repo.GetDraftByIdAsync(81, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => draft.Status == GameModeVersionStatus.Rascunho ? draft : null);
        management.Setup(repo => repo.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(["ACERTO"]);
        management.Setup(repo => repo.GetLootItemsAsync(It.IsAny<CancellationToken>())).ReturnsAsync([item]);
        management.Setup(repo => repo.GetLootItemsAsync(mesaId, 7, It.IsAny<CancellationToken>())).ReturnsAsync([item]);
        var version = new SistemaVersao { IdSistemaVersao = 7, IdSistemaRpg = 99, SistemaRpg = new() { Codigo = "CUSTOM" },
            ResultadosDado = [new() { CodigoTeste = "ATAQUE_COMUM", Dado = "D20", QuantidadeDados = 1,
                CodigoResultado = "ACERTO", ResultadoMinimo = 1, ResultadoMaximo = 20 }] };
        var systems = new Mock<ISistemaRpgRepository>();
        systems.Setup(repo => repo.GetVersionAsync(7, true, false)).ReturnsAsync(version);
        var service = new GameModeManagementService(management.Object, new Mock<IGameRunRepository>().Object,
            systems.Object, new GameplayActionResolver());
        GameStoryOutcomeDto Reward() => new() { Items = [new() { ItemId = item.Iditem, Quantity = 2,
            Snapshot = new() { ["nome"] = "Forjado", ["valor"] = 999999, ["tipo"] = "arma" } }] };
        var update = new GameModeEditorUpdateDto { Areas = [
            new() { Code = "MAIN", Name = "Principal", UseBase = false, NodeCount = 3, FinalOption = "ROTA:0", Options = [
                new() { Type = "SURPRESA", Label = "Sinal", SurpriseOptions = [new() { Type = "EVENTO", Label = "Laboratório", Choices = [
                    new() { Code = "abrir", Label = "Abrir", Outcome = Reward() }] }] },
                new() { Type = "MISSAO", Label = "Resgate", Mission = new() { AreaCode = "LAB", Reward = Reward() } }] },
            new() { Code = "LAB", Name = "Laboratório", IsSecret = true, UseBase = false, NodeCount = 3, FinalOption = "ROTA:0",
                Options = [new() { Type = "EVENTO", Label = "Saída" }] } ],
            Encounters = new() { ["A"] = new() { MapName = "Lobo", Enemy = new() { Name = "Lobo", MaxVida = 10 }, DamageByResult = new() { ["ACERTO"] = 5 } } },
            FallbackAction = new() { Name = "Reserva", BaseDamage = 1 }, PlayerDamageByResult = new() { ["ACERTO"] = new() { Multiplier = 1 } } };
        var saved = await service.SaveDraftAsync(81, update, default, mesaId);
        Assert.True(saved.Sucesso, saved.Mensagem);
        var published = await service.PublishAsync(81, default, mesaId);
        Assert.True(published.Sucesso, published.Mensagem);
        var rewards = published.Dados!.Areas[0].Options[0].SurpriseOptions[0].Choices[0].Outcome.Items
            .Concat(published.Dados.Areas[0].Options[1].Mission!.Reward.Items).ToArray();
        Assert.All(rewards, reward => { Assert.Equal(item.Nome, reward.Snapshot!["nome"]!.ToString());
            Assert.Equal(100, reward.Snapshot["valor"]!.GetValue<int>()); Assert.Equal("consumiveis", reward.Snapshot["tipo"]!.ToString()); });
        if (mesaId.HasValue) management.Verify(repo => repo.GetLootItemsAsync(mesaId, 7, It.IsAny<CancellationToken>()), Times.Exactly(2));
        else management.Verify(repo => repo.GetLootItemsAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        string frozen = draft.ConfiguracaoJson;
        item.Nome = "Alterado depois"; item.Valor = 999;
        Assert.Equal(frozen, draft.ConfiguracaoJson); Assert.Equal(GameModeVersionStatus.Publicado, draft.Status);
        Assert.DoesNotContain("Forjado", frozen);
        Assert.False((await service.SaveDraftAsync(81, update, default, mesaId)).Sucesso);
    }

    [Fact]
    public void ReferenciasDeMissaoESurpresaNaoPermitemCiclosNemDestinoFinalSecreto()
    {
        var main = new GameModeAreaDto { Code = "MAIN", Name = "Principal", UseBase = false, Options = [new() {
            Type = "MISSAO", Label = "Resgate", Mission = new() { AreaCode = "FINAL" } }] };
        var final = new GameModeAreaDto { Code = "FINAL", Name = "Final", IsSecret = true, IsSecretFinal = true };
        Assert.Contains("sem final secreto", OdisseiaWiki.GameRuns.Map.GameModeRouteValidation.Validate(main, [], [main, final]));
    }
}
