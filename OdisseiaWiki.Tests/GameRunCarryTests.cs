using System.Text.Json;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Dtos;
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

    [Fact]
    public void CondicaoComMultiplosEfeitosReduzLimitesDiferentesERecuperaNoDescanso()
    {
        SistemaVersao version = System(0);
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "EXAUSTAO", Nome = "Exaustão", Tipo = "Fisico", Ordem = 1,
            CodigoRecursoGatilho = "MANA", OperadorGatilho = "<=", ValorGatilho = 0,
            RegraRemocao = "DESCANSO_NORMAL",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"REDUZIR_LIMITE_PERCENTUAL","recurso":"MANA","valor":20,"momento":"ENQUANTO_ATIVA"},{"operacao":"REDUZIR_LIMITE_PERCENTUAL","recurso":"ESTAMINA","valor":30,"momento":"ENQUANTO_ATIVA"}]}""",
        });
        string snapshot = Snapshot.Replace("\"estaminaMaxima\":100", "\"estaminaMaxima\":100,\"mana\":0,\"manaMaxima\":100");
        string active = GameRunCarry.Reconcile(snapshot, version);
        using (JsonDocument parsed = JsonDocument.Parse(active))
        {
            JsonElement status = parsed.RootElement.GetProperty("status").GetProperty("status");
            Assert.Equal(80, status.GetProperty("manaMaxima").GetInt32());
            Assert.Equal(70, status.GetProperty("estaminaMaxima").GetInt32());
        }
        string recovered = GameRunCarry.RecoverConditionsAtRest(active, version, "NORMAL");
        using JsonDocument restored = JsonDocument.Parse(recovered);
        JsonElement values = restored.RootElement.GetProperty("status").GetProperty("status");
        Assert.Equal(100, values.GetProperty("manaMaxima").GetInt32());
        Assert.Equal(100, values.GetProperty("estaminaMaxima").GetInt32());
    }

    [Fact]
    public void CondicaoPositivaPodeAumentarLimiteSemAlterarBaseDaFicha()
    {
        SistemaVersao version = System(0);
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "VIGOR", Nome = "Vigor", Tipo = "Magico", Ordem = 1,
            CodigoRecursoGatilho = "MANA", OperadorGatilho = "<=", ValorGatilho = 0,
            RegraRemocao = "DESCANSO_NORMAL",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"MODIFICAR_LIMITE_PERCENTUAL","recurso":"VIDA","valor":30,"momento":"ENQUANTO_ATIVA"}]}""",
        });
        string snapshot = """{"status":{"status":{"vida":100,"vidaMaxima":100,"mana":0,"manaMaxima":100,"estamina":100,"estaminaMaxima":100}}}""";

        string active = GameRunCarry.Reconcile(snapshot, version);
        Assert.Equal(130, JsonDocument.Parse(active).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("vidaMaxima").GetInt32());
        string recovered = GameRunCarry.RecoverConditionsAtRest(active, version, "NORMAL");
        Assert.Equal(100, JsonDocument.Parse(recovered).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("vidaMaxima").GetInt32());
    }

    [Theory]
    [InlineData("ITEM", "inventario")]
    [InlineData("PROTESE", "implantes")]
    [InlineData("MAGIA", "magia")]
    [InlineData("SKILL", "skills")]
    public void CondicaoNaCopiaPodeMudarGatilhoValorEDuracaoSemAlterarOutrasOrigens(string type, string property)
    {
        SistemaVersao version = System(0);
        version.Condicoes.Add(new SistemaCondicao { Codigo = "SANGRAMENTO", Nome = "Sangramento",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA", ValorEfeito = 50,
            MomentoEfeito = "INICIO_TURNO" });
        string snapshot = "{\"" + property + "\":[{\"id\":\"copy\",\"atributos\":{\"condicoes\":[{" +
            "\"codigo\":\"SANGRAMENTO\",\"gatilho\":\"ACERTO\",\"valor\":50,\"duracao\":2}]}}]}";
        var request = new GameRunConditionOriginRequestDto { Tipo = type, IdInstancia = "copy",
            Indice = 0, Codigo = "SANGRAMENTO", Gatilho = "RESULTADO_NATURAL",
            Valor = 80, Duracao = 4, UnidadeDuracao = "Turno",
            ResultadoNaturalMinimo = 16, ResultadoNaturalMaximo = 20 };
        string changed = GameRunCarry.UpdateConditionOrigin(snapshot, request, version);
        using JsonDocument original = JsonDocument.Parse(snapshot);
        using JsonDocument result = JsonDocument.Parse(changed);
        JsonElement origin = result.RootElement.GetProperty(property)[0].GetProperty("atributos")
            .GetProperty("condicoes")[0];
        Assert.Equal("ACERTO", original.RootElement.GetProperty(property)[0].GetProperty("atributos")
            .GetProperty("condicoes")[0].GetProperty("gatilho").GetString());
        Assert.Equal("RESULTADO_NATURAL", origin.GetProperty("gatilho").GetString());
        Assert.Equal(80, origin.GetProperty("valor").GetInt32());
        Assert.Equal(4, origin.GetProperty("duracao").GetInt32());
        Assert.Equal(16, origin.GetProperty("resultadoNaturalMinimo").GetInt32());
    }

    [Fact]
    public void CopiaPodeConfigurarReacaoEmAreaComAtributoPublicado()
    {
        SistemaVersao version = System(0);
        version.Atributos.Add(new SistemaAtributoConfig
        { CodigoAtributo = "AGILIDADE", Nome = "Agilidade", Ativo = true });
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "CEGUEIRA", Nome = "Cegueira", Tipo = "Sensorial",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"DESVANTAGEM","recurso":"TESTE","valor":0,"momento":"ENQUANTO_ATIVA"}]}""",
        });
        const string snapshot = """
            {"inventario":[{"id":"granada","atributos":{"condicoes":[{"codigo":"CEGUEIRA"}]}}]}
            """;
        var request = new GameRunConditionOriginRequestDto
        {
            Tipo = "ITEM", IdInstancia = "granada", Codigo = "CEGUEIRA", Gatilho = "AO_USAR",
            Alvo = "TODOS_INIMIGOS", TesteResistencia = new GameplayResistanceTestDto
            { Dados = 1, Faces = 6, Atributo = "AGILIDADE", Dificuldade = 5 },
        };

        string changed = GameRunCarry.UpdateConditionOrigin(snapshot, request, version);
        JsonElement origin = JsonDocument.Parse(changed).RootElement.GetProperty("inventario")[0]
            .GetProperty("atributos").GetProperty("condicoes")[0];
        Assert.Equal("TODOS_INIMIGOS", origin.GetProperty("alvo").GetString());
        Assert.Equal(6, origin.GetProperty("testeResistencia").GetProperty("faces").GetInt32());
        request.TesteResistencia.Atributo = "ATRIBUTO_INEXISTENTE";
        Assert.Throws<InvalidOperationException>(() => GameRunCarry.UpdateConditionOrigin(snapshot, request, version));
    }

    [Fact]
    public void CopiaPermiteEditarValoresDeCadaEfeitoSemMudarOriginal()
    {
        SistemaVersao version = System(0);
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "CEGUEIRA", Nome = "Cegueira", Tipo = "Sensorial",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"MODIFICAR_ATRIBUTO","recurso":"PRECISAO","valor":-5,"momento":"ENQUANTO_ATIVA"},{"operacao":"SOMAR","recurso":"VIDA","valor":10,"momento":"FIM_TURNO"}]}""",
        });
        const string original = """{"inventario":[{"id":"copy","atributos":{"condicoes":[{"codigo":"CEGUEIRA","gatilho":"ACERTO"}]}}]}""";
        var request = new GameRunConditionOriginRequestDto
        {
            Tipo = "ITEM", IdInstancia = "copy", Indice = 0, Codigo = "CEGUEIRA",
            Gatilho = "ACERTO", Alvo = "ALVO", ValoresEfeitos = new() { [0] = -8, [1] = 20 },
        };

        string changed = GameRunCarry.UpdateConditionOrigin(original, request, version);
        using JsonDocument parsed = JsonDocument.Parse(changed);
        JsonElement values = parsed.RootElement.GetProperty("inventario")[0].GetProperty("atributos")
            .GetProperty("condicoes")[0].GetProperty("valoresEfeitos");
        Assert.Equal(-8, values.GetProperty("0").GetInt32());
        Assert.Equal(20, values.GetProperty("1").GetInt32());
        Assert.DoesNotContain("valoresEfeitos", original);
    }

    [Fact]
    public void IntensidadePadraoPublicadaSubstituiValorDoEfeito()
    {
        SistemaVersao version = System(50);
        version.Condicoes.Single().ValorPadrao = 20;
        string result = GameRunCarry.Reconcile(Snapshot, version);
        Assert.Equal(80, JsonDocument.Parse(result).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("estaminaMaxima").GetInt32());
    }

    [Fact]
    public void FadigaPermaneceAteDescansoConfiguradoECompoeComSobrecarga()
    {
        SistemaVersao version = System();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "FADIGA", Nome = "Fadiga", Tipo = "Fisico", Ordem = 1,
            CodigoRecursoGatilho = "ESTAMINA", OperadorGatilho = "<=", ValorGatilho = 0,
            CodigoRecurso = "ESTAMINA", OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL",
            ValorEfeito = 25, RegraRemocao = "DESCANSO_NORMAL",
        });
        string empty = Snapshot.Replace("\"estamina\":100", "\"estamina\":0");
        string active = GameRunCarry.Reconcile(empty, version);
        Assert.Equal(37, JsonDocument.Parse(active).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("estaminaMaxima").GetInt32());

        string shortRest = GameRunCarry.Reconcile(
            GameRunCarry.RecoverConditionsAtRest(active, version, "SIMPLES"), version);
        Assert.Equal(37, JsonDocument.Parse(shortRest).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("estaminaMaxima").GetInt32());

        string normalRest = GameRunCarry.RecoverConditionsAtRest(active, version, "NORMAL");
        // The rest restores stamina before the remaining overload is reconciled.
        string recovered = normalRest.Replace("\"estamina\":0", "\"estamina\":100");
        string after = GameRunCarry.Reconcile(recovered, version);
        Assert.Equal(50, JsonDocument.Parse(after).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("estaminaMaxima").GetInt32());
        Assert.False(JsonDocument.Parse(after).RootElement.GetProperty("condicoesAtivas")
            .TryGetProperty("FADIGA", out _));
    }

    [Fact]
    public void ZerarEstaminaDuranteBatalhaRegistraFadigaMesmoComDescansoCurtoPosterior()
    {
        SistemaVersao version = System(0);
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "FADIGA", Nome = "Fadiga", Tipo = "Fisico",
            CodigoRecursoGatilho = "ESTAMINA", OperadorGatilho = "<=", ValorGatilho = 0,
            CodigoRecurso = "ESTAMINA", OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL",
            ValorEfeito = 25, RegraRemocao = "DESCANSO_NORMAL",
        });
        string ended = Snapshot.Replace("\"estamina\":100", "\"estamina\":50");
        GameBattleEvent[] events = [
            new(1, 1, 1, GameBattleEventTypes.ResourceChanged, "player", null,
                new ResourceChangedPayload("stamina", 25, 0, "espada")),
            new(2, 1, 2, GameBattleEventTypes.ResourceChanged, "player", null,
                new ResourceChangedPayload("stamina", 0, 50, "descanso")),
        ];
        string result = GameRunCarry.Reconcile(
            GameRunCarry.PreserveBattleTriggers(ended, version, events), version);
        Assert.Equal(75, JsonDocument.Parse(result).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("estaminaMaxima").GetInt32());
    }

    [Fact]
    public void CondicaoAplicadaPorItemPersisteLimiteERemoveComCuraConfigurada()
    {
        SistemaVersao version = System();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "QUEIMADURA", Nome = "Queimadura", Tipo = "Fisico",
            OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL", CodigoRecurso = "ESTAMINA",
            ValorEfeito = 20, RegraRemocao = "CURA;DESCANSO_NORMAL",
        });
        string withCondition = Snapshot.Replace("\"status\":{\"status\"", "\"status\":{\"condicoesJogo\":[{\"rule\":{\"code\":\"QUEIMADURA\"},\"value\":20}],\"status\"");
        string active = GameRunCarry.Reconcile(withCondition, version);
        Assert.Equal(40, JsonDocument.Parse(active).RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("estaminaMaxima").GetInt32());

        string cured = GameRunCarry.RecoverConditionsAtCure(active, version);
        using JsonDocument after = JsonDocument.Parse(cured);
        Assert.Equal(50, after.RootElement.GetProperty("status")
            .GetProperty("status").GetProperty("estaminaMaxima").GetInt32());
        Assert.Empty(after.RootElement.GetProperty("status").GetProperty("condicoesJogo").EnumerateArray());
    }

    [Fact]
    public void HorasDeCondicaoAvancamSomenteComTempoDeJogoConfigurado()
    {
        SistemaVersao version = System();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "QUEIMADURA", Nome = "Queimadura", Tipo = "Fisico",
            OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL", CodigoRecurso = "ESTAMINA",
            ValorEfeito = 20,
        });
        string snapshot = Snapshot.Replace("\"status\":{\"status\"", "\"status\":{\"condicoesJogo\":[{\"rule\":{\"code\":\"QUEIMADURA\"},\"value\":20,\"remainingHours\":2}],\"status\"");
        string active = GameRunCarry.Reconcile(snapshot, version);
        string partial = GameRunCarry.AdvanceGameTime(active, 90, version);
        using JsonDocument halfway = JsonDocument.Parse(partial);
        Assert.Equal(40, halfway.RootElement.GetProperty("status").GetProperty("status")
            .GetProperty("estaminaMaxima").GetInt32());
        Assert.Equal(30, halfway.RootElement.GetProperty("status").GetProperty("condicoesJogo")[0]
            .GetProperty("remainingMinutes").GetInt32());

        string expired = GameRunCarry.AdvanceGameTime(partial, 30, version);
        using JsonDocument completed = JsonDocument.Parse(expired);
        Assert.Equal(50, completed.RootElement.GetProperty("status").GetProperty("status")
            .GetProperty("estaminaMaxima").GetInt32());
        Assert.Empty(completed.RootElement.GetProperty("status").GetProperty("condicoesJogo").EnumerateArray());
        Assert.Equal(120, completed.RootElement.GetProperty("tempoJogoMinutos").GetInt32());
    }

    [Fact]
    public void CadaUnidadeDeConsumivelAplicaCondicaoQuandoElaPodeAcumular()
    {
        SistemaVersao version = System(0);
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "VENENO", Nome = "Veneno", Tipo = "Fisico", Empilhavel = true,
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA", ValorEfeito = 3,
            MomentoEfeito = "AO_APLICAR", RegraRemocao = "CURA",
        });
        const string before = """
            {"status":{"status":{"vida":20,"vidaMaxima":20,"estamina":10,"estaminaMaxima":10}},
             "inventario":[{"id":"pocao","tipo":"consumiveis","nome":"Poção","quantidade":2,
               "atributos":{"condicoes":[{"codigo":"VENENO","gatilho":"AO_USAR",
                 "duracao":2,"unidadeDuracao":"Turno"}]}}]}
            """;
        const string after = """
            {"status":{"status":{"vida":20,"vidaMaxima":20,"estamina":10,"estaminaMaxima":10}},
             "inventario":[]}
            """;

        string applied = GameRunCarry.ApplyConsumedItemConditions(before, after, "pocao", version, 2);
        using JsonDocument result = JsonDocument.Parse(applied);

        Assert.Equal(14, result.RootElement.GetProperty("status").GetProperty("status")
            .GetProperty("vida").GetInt32());
        Assert.Equal(2, result.RootElement.GetProperty("status").GetProperty("condicoesJogo")
            .GetArrayLength());
    }

    [Fact]
    public void TrajeAtivaCondicaoAoEquiparERetirarEncerraGatilhoConfigurado()
    {
        SistemaVersao version = System(0);
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "PESO_MAGICO", Nome = "Peso mágico", Tipo = "Fisico",
            OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL", CodigoRecurso = "ESTAMINA",
            ValorEfeito = 20, MomentoEfeito = "ENQUANTO_ATIVA",
            RegraRemocao = "GATILHO_CESSOU",
        });
        const string before = """
            {"status":{"status":{"estamina":100,"estaminaMaxima":100}},
             "inventario":[{"id":"traje","tipo":"traje","nome":"Traje","atributos":{
               "protecaoBase":10,"condicoes":[{"codigo":"PESO_MAGICO",
                 "gatilho":"AO_EQUIPAR","duracao":2,"unidadeDuracao":"Hora"}]}}]}
            """;
        string equipped = GameRunDefensiveEquipment.SetEquipped(before, "traje", true);
        string active = GameRunCarry.ApplyConsumedItemConditions(before, equipped,
            "traje", version, trigger: "AO_EQUIPAR");
        using JsonDocument wearing = JsonDocument.Parse(active);
        Assert.Equal(80, wearing.RootElement.GetProperty("status").GetProperty("status")
            .GetProperty("estaminaMaxima").GetInt32());
        Assert.Equal("traje", wearing.RootElement.GetProperty("status").GetProperty("condicoesJogo")[0]
            .GetProperty("sourceItemId").GetString());

        string unequipped = GameRunDefensiveEquipment.SetEquipped(active, "traje", false);
        string restored = GameRunCarry.RemoveUnequippedItemConditions(unequipped, "traje", version);
        using JsonDocument removed = JsonDocument.Parse(restored);
        Assert.Empty(removed.RootElement.GetProperty("status").GetProperty("condicoesJogo").EnumerateArray());
        Assert.Equal(100, removed.RootElement.GetProperty("status").GetProperty("status")
            .GetProperty("estaminaMaxima").GetInt32());
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
