using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayStoredTestSpecTests
{
    public static IEnumerable<object[]> StoredModes()
    {
        foreach (string type in new[] { "ITEM", "PROTESE", "MAGIA", "SKILL" })
            foreach (var mode in new (string Json, GameplayRollMode Expected)[] {
                ("\"Normal\"", GameplayRollMode.Normal), ("\"Vantagem\"", GameplayRollMode.Vantagem),
                ("\"Desvantagem\"", GameplayRollMode.Desvantagem), ("\"normal\"", GameplayRollMode.Normal),
                ("0", GameplayRollMode.Normal), ("1", GameplayRollMode.Vantagem),
                ("2", GameplayRollMode.Desvantagem), ("null", GameplayRollMode.Desvantagem) })
                yield return [type, mode.Json, mode.Expected];
    }

    [Theory]
    [MemberData(nameof(StoredModes))]
    public void TesteDaFichaLeModoTextualDoFormularioENumericoLegado(string type, string modeJson, GameplayRollMode expected)
    {
        var (character, request, version) = Action(type, modeJson);
        string? before = character.Magia ?? character.Skills ?? character.Implantes ?? character.InventarioJson;
        var result = new GameplayActionResolver().Resolve(request, character, version);
        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(expected, result.Dados!.Mode);
        Assert.Equal(4, result.Dados.Modifier);
        Assert.Equal(new GameplayDiceGroupSpec(1, 20), Assert.Single(result.Dados.Groups));
        Assert.Equal(before, character.Magia ?? character.Skills ?? character.Implantes ?? character.InventarioJson);
    }

    [Theory]
    [InlineData("ITEM")]
    [InlineData("PROTESE")]
    [InlineData("MAGIA")]
    [InlineData("SKILL")]
    public void TesteMalformadoNaoDesapareceNemUsaFallbackLegado(string type)
    {
        var (character, request, version) = Action(type, "\"Modo inexistente\"");
        var result = new GameplayActionResolver().Resolve(request, character, version);
        Assert.False(result.Sucesso);
        Assert.Equal("TESTE_INVALIDO", result.Codigo);
        Assert.Contains("modo fixo", result.Mensagem);
    }

    private static (PersonagemJogador, GameplayRollRequestDto, SistemaVersao) Action(string type, string modeJson)
    {
        var power = JsonNode.Parse("""
            {"id":"acao-1","nome":"Rajada de Fogo","tipo":"ataque","atributos":{"dano":50,
            "teste":{"codigoTeste":"ATAQUE_COMUM","codigoAtributo":"SABEDORIA","grupoAtributo":"Principal","usaTotalParaFaixas":true}}}
            """)!;
        if (type == "ITEM")
        {
            power["tipo"] = "arma";
            power["atributos"]!["tipoArma"] = "espada";
            power["atributos"]!["danoBase"] = 50;
        }
        if (type == "PROTESE") power["tipo"] = "implante";
        power["atributos"]!["teste"]!["modo"] = JsonNode.Parse(modeJson);
        string source = new JsonArray(power).ToJsonString();
        var character = new PersonagemJogador { IdpersonagemJogador = 1, Nome = "Tester",
            StatusJson = """{"atributos":{"principais":{"sabedoria":4}}}""" };
        switch (type)
        {
            case "ITEM": character.InventarioJson = source; break;
            case "PROTESE": character.Implantes = source; break;
            case "MAGIA": character.Magia = source; break;
            case "SKILL": character.Skills = source; break;
        }
        var request = new GameplayRollRequestDto { CodigoAcao = "ACAO_FICHA", Modo = GameplayRollMode.Desvantagem,
            ReferenciaAcao = new() { Tipo = type, IdInstancia = "acao-1" }, ParametrosAcao = new() { Operacao = "ATACAR" } };
        var version = new SistemaVersao { IdSistemaVersao = 7, SistemaRpg = new() { Codigo = "ODISSEIA" },
            ResultadosDado = [new() { CodigoTeste = "ATAQUE_COMUM", Dado = "D20", QuantidadeDados = 1,
                CodigoResultado = "ACERTO", ResultadoMinimo = 1, ResultadoMaximo = 20 }] };
        return (character, request, version);
    }
}
