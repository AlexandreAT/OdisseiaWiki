using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Map;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameModeRouteValidationTests
{
    [Theory]
    [InlineData("COMBATE")]
    [InlineData("ELITE")]
    [InlineData("BOSS")]
    public void RotaComEncontroAusenteInformaAreaNumeroECampo(string type)
    {
        var area = new GameModeAreaDto { Name = "Área final", Options = [new() { Type = type, EncounterCode = "REMOVIDO" }] };
        string? error = GameModeRouteValidation.Validate(area, ["LOBO"], [area]);
        Assert.Contains("Área final, rota 1", error);
        Assert.Contains("Encontro da rota", error);
    }

    [Theory]
    [InlineData("EVENTO")]
    [InlineData("DESCANSO")]
    [InlineData("ATALHO")]
    public void RotasSemCombateNaoExigemEncontroNemBoss(string type)
    {
        var area = new GameModeAreaDto { Name = "Área final", FinalOption = "ROTA:0", Options = [new() { Type = type, Label = "Fim livre" }] };
        Assert.Null(GameModeRouteValidation.Validate(area, [], [area]));
    }

    [Fact]
    public void CacadaComUmaOpcaoValidaTambemEExecutavel()
    {
        var area = new GameModeAreaDto { Name = "Final", Options = [new() { Type = "CACADA", Label = "Caçada", EncounterCodes = ["LOBO"] }] };
        Assert.Null(GameModeRouteValidation.Validate(area, ["LOBO"], [area]));
        area.Options[0].EncounterCodes = [];
        Assert.Contains("Encontros possíveis", GameModeRouteValidation.Validate(area, ["LOBO"], [area]));
    }

    [Fact]
    public void MercadorIncompletoInformaCatalogoEmVezDeEncontro()
    {
        var area = new GameModeAreaDto { Name = "Área final", Options = [new() { Type = "VENDEDOR", Label = "Loja" }] };
        Assert.Contains("catálogo do mercador", GameModeRouteValidation.Validate(area, [], [area]));
        area.Options[0].Offers = [new() { ItemId = "pocao", Stock = 0 }];
        Assert.Contains("oferta 1: o estoque", GameModeRouteValidation.Validate(area, [], [area]));
        area.Options[0].Offers[0].Stock = 1;
        Assert.Null(GameModeRouteValidation.Validate(area, [], [area]));
        area.Options[0].Weight = 101;
        Assert.Contains("peso no sorteio", GameModeRouteValidation.Validate(area, [], [area]));
    }
}
