using System.Text.Json;
using System.Text.Json.Nodes;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameBattlePreviewFactoryTests
{
    private readonly GameBattlePreviewFactory _factory = new(new GameplayActionResolver());

    [Fact]
    public void Build_LeGatilhoAutomaticoDaVersaoFixadaDoSistema()
    {
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "DEPENDENCIA", Nome = "Dependência", Tipo = "Magico",
            CodigoRecursoGatilho = "MANA", OperadorGatilho = "<=", ValorGatilho = 0,
            OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL", CodigoRecurso = "MANA",
            ValorEfeito = 30, MomentoEfeito = "ENQUANTO_ATIVA",
            RegraRemocao = "DESCANSO_NORMAL",
        });

        GameBattleAutomaticCondition automatic = Assert.Single(
            _factory.Build(Run("[]"), version).Input.AutomaticConditions);

        Assert.Equal("DEPENDENCIA", automatic.Rule.Code);
        Assert.Equal("MANA", automatic.Resource);
        Assert.Equal("<=", automatic.Comparison);
        Assert.Equal(0, automatic.Threshold);
        Assert.Equal(30, Assert.Single(automatic.Rule.Effects).Valor);
    }

    [Fact]
    public void Build_NaoAplicaDuasVezesLimiteQueJaVeioAjustadoDaRun()
    {
        GameRunDto original = Run("[]");
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = new GameRunCharacterSnapshotDto
            {
                IdSistemaVersao = original.IdSistemaVersao,
                Nome = "Herói",
                Status = Json("""{"status":{"vida":70,"vidaMaxima":70,"mana":0,"manaMaxima":10,"estamina":10}}"""),
                LimitesCondicoes = Json("""{"vida":{"base":100,"aplicado":70}}"""),
                Inventario = Json("[]"),
            },
        };
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "DEPENDENCIA", Nome = "Dependência", Tipo = "Magico",
            CodigoRecursoGatilho = "MANA", OperadorGatilho = "<=", ValorGatilho = 0,
            OperacaoEfeito = "REDUZIR_LIMITE_PERCENTUAL", CodigoRecurso = "VIDA",
            ValorEfeito = 30, MomentoEfeito = "ENQUANTO_ATIVA",
        });

        GameBattleInput input = _factory.Build(run, version).Input;
        GameBattleResult battle = new AutoBattleSimulator().Simulate(input, new SeededGameRunRandomSource(123));

        Assert.Equal(100, input.FirstActor.MaximumHitPoints);
        Assert.Equal(70, battle.Actors.Single(actor => actor.Id == input.FirstActor.Id).MaximumHitPoints);
    }

    [Fact]
    public void Build_PreservaVidaAcimaDaBaseQuandoBonusDeLimiteEstaAtivo()
    {
        GameRunDto original = Run("[]");
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = new GameRunCharacterSnapshotDto
            {
                IdSistemaVersao = original.IdSistemaVersao,
                Nome = "Herói",
                Status = Json("""{"status":{"vida":120,"vidaMaxima":130,"mana":10,"manaMaxima":10,"estamina":10}}"""),
                LimitesCondicoes = Json("""{"vida":{"base":100,"aplicado":130}}"""),
                CondicoesAtivas = Json("""{"REGENERACAO":true}"""),
                Inventario = Json("[]"),
            },
        };
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "REGENERACAO", Nome = "Regeneração", Tipo = "Fisico",
            OperacaoEfeito = "MODIFICAR_LIMITE_PERCENTUAL", CodigoRecurso = "VIDA",
            ValorEfeito = 30, MomentoEfeito = "ENQUANTO_ATIVA",
        });

        GameBattleInput input = _factory.Build(run, version).Input;
        GameBattleResult battle = new AutoBattleSimulator().Simulate(input, new SeededGameRunRandomSource(123));

        Assert.Equal(100, input.FirstActor.MaximumHitPoints);
        Assert.Equal(130, battle.Actors.Single(actor => actor.Id == input.FirstActor.Id).MaximumHitPoints);
    }

    [Fact]
    public void Build_UsaInventarioLegadoERegraNaturalDoAtaquePreciso()
    {
        GameRunDto run = Run("""
            {"itens":[{"id":"espada-1","nome":"Espada da run","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":18}}]}
            """);
        SistemaVersao version = Version();

        GameBattlePreviewSetup result = _factory.Build(run, version);

        Assert.Equal(1200, result.Input.FirstActor.Defenses.Shield);
        Assert.Equal("Espada da run", result.WeaponNames.Single());
        Assert.Equal("item:espada-1", result.Input.FirstActor.Actions[0].Id);
        Assert.Equal(18, result.Input.FirstActor.Actions[0].DamageByResultCode["ACERTO"]);
        Assert.True(result.Input.FirstActor.Actions[^1].ResultRanges
            .Single(range => range.Code == "ACERTO_PRECISO").RequiresNatural);
        Assert.Equal(1, result.Input.DefenseOrder.Count(kind => kind == GameBattleDefenseKind.Shield));
        Assert.Equal(0, result.Input.SecondActor.Mana);
        Assert.Equal(0, result.Input.SecondActor.Stamina);
        Assert.Equal("/uploads/heroi.png", result.Input.FirstActor.Image);
    }

    [Fact]
    public void Build_UsaCondicaoDoItemERegraDaVersaoPublicada()
    {
        GameRunDto run = Run("""
            [{"id":"espada-1","nome":"Lâmina","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":18,
                "condicoes":[{"codigo":"SANGRAMENTO","gatilho":"RESULTADO_NATURAL",
                  "resultadosNaturais":[18,20],"valor":4,"duracao":2,
                  "unidadeDuracao":"Turno"}]}}]
            """);
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "SANGRAMENTO", Nome = "Sangramento", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA", ValorEfeito = 3,
            MomentoEfeito = "INICIO_TURNO", RegraRemocao = "DURACAO;CURA",
        });

        GameBattleConditionApplication condition = Assert.Single(
            _factory.Build(run, version).Input.FirstActor.Actions[0].Conditions);
        Assert.Equal("SANGRAMENTO", condition.Rule.Code);
        Assert.Equal("RESULTADO_NATURAL", condition.Trigger);
        Assert.Equal([18, 20], condition.NaturalResults);
        Assert.Equal(4, condition.Value);
        Assert.Equal(2, condition.Duration);
        Assert.Equal("INICIO_TURNO", condition.Rule.Moment);
    }

    [Fact]
    public void Build_PreservaValoresIndividuaisDaOrigemParaTodosOsEfeitos()
    {
        GameRunDto run = Run("""
            [{"id":"item-1","nome":"Granada","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":1,
                "condicoes":[{"codigo":"CEGUEIRA","gatilho":"ACERTO","duracao":3,
                  "valoresEfeitos":{"0":-8,"1":15}}]}}]
            """);
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "CEGUEIRA", Nome = "Cegueira", Tipo = "Sensorial",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"MODIFICAR_ATRIBUTO","recurso":"PRECISAO","valor":-5,"momento":"ENQUANTO_ATIVA"},{"operacao":"SOMAR","recurso":"VIDA","valor":5,"momento":"FIM_TURNO"}]}""",
            RegraRemocao = "DURACAO",
        });

        GameBattleConditionApplication condition = Assert.Single(
            _factory.Build(run, version).Input.FirstActor.Actions[0].Conditions);

        Assert.Equal(-8, condition.EffectValues[0]);
        Assert.Equal(15, condition.EffectValues[1]);
        Assert.Equal(3, condition.Duration);
    }

    [Fact]
    public void Build_UsaFaixaNaturalConfiguradaNaCopiaDoItem()
    {
        GameRunDto run = Run("""
            [{"id":"espada-1","nome":"Lâmina","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":18,
                "condicoes":[{"codigo":"SANGRAMENTO","gatilho":"RESULTADO_NATURAL",
                  "resultadoNaturalMinimo":16,"valor":80,"duracao":4,
                  "unidadeDuracao":"Turno"}]}}]
            """);
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "SANGRAMENTO", Nome = "Sangramento", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA", ValorEfeito = 50,
            MomentoEfeito = "INICIO_TURNO", RegraRemocao = "DURACAO;CURA",
        });

        GameBattleConditionApplication condition = Assert.Single(
            _factory.Build(run, version).Input.FirstActor.Actions[0].Conditions);
        Assert.Equal(16, condition.NaturalMinimum);
        Assert.Null(condition.NaturalMaximum);
        Assert.Equal(80, condition.Value);
        Assert.Equal(4, condition.Duration);
    }

    [Fact]
    public void Build_ResolveEfeitosCompostosDaVersaoPublicada()
    {
        GameRunDto run = Run("""
            [{"id":"espada-1","nome":"Lâmina","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":18,
                "condicoes":[{"codigo":"CEGUEIRA","gatilho":"ACERTO","duracao":3}]}}]
            """);
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "CEGUEIRA", Nome = "Cegueira", Tipo = "Sensorial",
            ConfiguracaoPadraoJson = """{"efeitos":[{"operacao":"MODIFICAR_ROLAGEM","recurso":"PRECISAO","valor":-5,"momento":"ENQUANTO_ATIVA"},{"operacao":"DESVANTAGEM","recurso":"TESTE","valor":0,"momento":"ENQUANTO_ATIVA"}]}""",
            RegraRemocao = "DURACAO",
        });
        GameBattleConditionApplication condition = Assert.Single(
            _factory.Build(run, version).Input.FirstActor.Actions[0].Conditions);
        Assert.Equal(2, condition.Rule.Effects.Count);
        Assert.Equal(-5, condition.Rule.Effects[0].Valor);
        Assert.Equal("DESVANTAGEM", condition.Rule.Effects[1].Operacao);
    }

    [Fact]
    public void Build_LeIniciativaDoSistemaFixadoESomaAtributoDaFicha()
    {
        GameRunDto original = Run("[]");
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = new GameRunCharacterSnapshotDto
            {
                IdSistemaVersao = original.IdSistemaVersao,
                Nome = "Heroi",
                Status = Json("""
                    {"status":{"vida":30,"vidaMaxima":30,"mana":10,"estamina":10},
                     "atributos":{"principais":{"Agilidade":4}},
                     "defesas":{"escudo":0,"protecao":0,"armadura":0}}
                    """),
                Inventario = Json("[]"),
            },
        };
        SistemaVersao version = Version();
        version.Modulos.Add(new SistemaModulo
        {
            TipoModulo = SistemaModuloTipo.Combate,
            ConfiguracaoJson = """
                {"usaIniciativa":true,"formulaIniciativa":"1D6 + Agilidade + 2"}
                """,
        });

        GameBattleInput result = _factory.Build(run, version).Input;

        Assert.True(result.UseInitiative);
        Assert.Equal(new GameBattleInitiativeSpec("1D6 + Agilidade + 2", 1, 6, 6),
            result.FirstActor.Initiative);
        Assert.Equal(2, result.SecondActor.Initiative?.Modifier);
    }

    [Fact]
    public void Build_UsaAtributoEvoluidoMesmoQuandoFichaGuardaAcentoNoCodigo()
    {
        GameRunDto original = Run("[]");
        using JsonDocument mode = JsonDocument.Parse(original.ConfiguracaoModo.GetRawText());
        JsonNode config = JsonNode.Parse(mode.RootElement.GetRawText())!;
        config["previewFallbackAction"]!["attributeCode"] = "RESISTENCIA";
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = Json(config.ToJsonString()),
            EstadoAtual = new GameRunCharacterSnapshotDto
            {
                IdSistemaVersao = original.IdSistemaVersao,
                Nome = "Herói",
                Status = Json("""{"status":{"vida":30,"vidaMaxima":30,"mana":10,"estamina":10},"atributos":{"principais":{"resistência":3}}}"""),
                Inventario = Json("[]"),
            },
        };

        GameBattleInput result = _factory.Build(run, Version()).Input;

        Assert.Equal(3, result.FirstActor.Actions.Single(action => action.IsFallback).Roll.Modifier);
    }

    [Fact]
    public void Build_RecusaFormulaDeIniciativaQueNaoConsegueExecutarIntegralmente()
    {
        SistemaVersao version = Version();
        version.Modulos.Add(new SistemaModulo
        {
            TipoModulo = SistemaModuloTipo.Combate,
            ConfiguracaoJson = """
                {"usaIniciativa":true,"formulaIniciativa":"1D6 + 2D4"}
                """,
        });

        Assert.Throws<InvalidOperationException>(() => _factory.Build(Run("[]"), version));
    }

    [Fact]
    public void Build_IgnoraArmaComTabelaDeResultadosNaoCobertaPeloModo()
    {
        GameRunDto run = Run("""
            [{"id":"espada-custom","nome":"Espada custom","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":18,
                "teste":{"codigoTeste":"ATAQUE_CUSTOM","usaTotalParaFaixas":true}}}]
            """);
        SistemaVersao version = Version();
        version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_CUSTOM", NomeTeste = "Ataque custom", Dado = "D20",
            QuantidadeDados = 1, ResultadoMinimo = 1, ResultadoMaximo = 20,
            CodigoResultado = "SUCESSO_CUSTOM", NomeResultado = "Sucesso custom", Ordem = 1,
        });

        GameBattlePreviewSetup result = _factory.Build(run, version);

        Assert.Empty(result.WeaponNames);
        Assert.Single(result.Input.FirstActor.Actions);
        Assert.Equal("treino-basico", result.Input.FirstActor.Actions[0].Id);
    }

    [Fact]
    public void Build_RespeitaPrioridadeSalvaDasArmas()
    {
        GameRunDto run = Run("""
            [{"id":"espada-1","nome":"Primeira","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":18}},
             {"id":"espada-2","nome":"Segunda","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":20}}]
            """);
        run = new GameRunDto
        {
            IdSistemaVersao = run.IdSistemaVersao,
            ConfiguracaoModo = run.ConfiguracaoModo,
            EstadoAtual = run.EstadoAtual,
            OrdemArmas = ["espada-2", "espada-1"],
        };

        GameBattlePreviewSetup result = _factory.Build(run, Version());

        Assert.Equal(["item:espada-2", "item:espada-1", "treino-basico"],
            result.Input.FirstActor.Actions.Select(action => action.Id));
    }

    [Fact]
    public void Build_RespeitaNovaOrdemQuantidadeEDescansoDoLoadout()
    {
        GameRunDto original = Run("""
            [{"id":"one","nome":"Primeira","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":18,"ataquesPorTurno":2}},
             {"id":"two","nome":"Segunda","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":20}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas =
            [
                new() { Tipo = "ITEM", IdInstancia = "two" },
                new() { Tipo = "DESCANSO", IdInstancia = "descanso-simples" },
                new() { Tipo = "ITEM", IdInstancia = "one", QuantidadeAtaques = 2 },
            ],
        };
        SistemaVersao version = Version();
        version.Descansos = [new SistemaDescansoConfig
        {
            Tipo = "SIMPLES", Nome = "Descanso curto", RecuperacaoEstamina = 5,
            TipoRecuperacao = SistemaRecuperacaoTipo.ValorFixo,
        }];

        GameBattleActorSpec result = _factory.Build(run, version).Input.FirstActor;

        Assert.Equal(["item:two", "item:one", "treino-basico"], result.Actions.Select(action => action.Id));
        Assert.Equal(2, result.Actions[1].AttacksPerTurn);
        Assert.Equal(1, result.Rest?.AfterActionIndex);
        Assert.Equal(5, result.Rest?.Stamina);
    }

    [Fact]
    public void Build_PersonagemPodeEquiparMagiaOfensivaExecutavelComoAcao()
    {
        GameRunDto original = Run("[]");
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = new GameRunCharacterSnapshotDto
            {
                IdSistemaVersao = original.EstadoAtual.IdSistemaVersao,
                IdPersonagemJogadorOrigem = original.EstadoAtual.IdPersonagemJogadorOrigem,
                Nome = original.EstadoAtual.Nome,
                Status = original.EstadoAtual.Status,
                Inventario = Json("[]"),
                Magia = Json("""
                    [{"id":"fogo-1","nome":"Chama","tipo":"ataque","custo":"2","imagem":"/assets/chama.png",
                      "atributos":{"dano":15,"acerto":"1D20"}}]
                    """),
            },
            AcoesEquipadas = [new() { Tipo = "MAGIA", IdInstancia = "fogo-1" }],
        };

        GameBattleActorSpec actor = _factory.Build(run, Version()).Input.FirstActor;

        Assert.Equal("magia:fogo-1", actor.Actions[0].Id);
        Assert.Equal(15, actor.Actions[0].DamageByResultCode["ACERTO"]);
        Assert.False(actor.Actions[0].IsFallback);
        Assert.Equal("/assets/chama.png", actor.Actions[0].Image);
        Assert.Equal("MAGIA", actor.Actions[0].SourceType);
    }

    [Fact]
    public void Build_ConsumivelDeCuraEquipadoUsaQuantidadeDaCopiaESemDado()
    {
        GameRunDto original = Run("""
            [{"id":"seringa","idItemBase":19,"nome":"Seringa","tipo":"consumiveis","imagem":"/assets/seringa.png",
              "quantidade":2,"atributos":{"restaura":{"vida":25}}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "seringa" }],
        };

        GameBattleActionSpec action = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal("item:seringa", action.Id);
        Assert.Empty(action.Roll.Groups);
        Assert.Equal(2, action.Utility?.InitialQuantity);
        Assert.Equal(25, action.Utility?.RestoreLife);
        Assert.Equal("/assets/seringa.png", action.Image);
        Assert.Equal("ITEM", action.SourceType);
    }

    [Fact]
    public void Build_GranadaEquipadaUsaCondicaoDaVersaoFixadaEReacaoDeArea()
    {
        GameRunDto original = Run("""
            [{"id":"granada","nome":"Granada de luz","tipo":"consumiveis",
              "atributos":{"condicoes":[{"codigo":"CEGUEIRA","gatilho":"AO_USAR",
                "alvo":"TODOS_INIMIGOS","duracao":3,"testeResistencia":{
                  "dados":1,"faces":6,"atributo":"AGILIDADE","dificuldade":5}}]}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "granada" }],
        };
        SistemaVersao version = Version();
        version.Atributos.Add(new SistemaAtributoConfig
        {
            CodigoAtributo = "AGILIDADE", Nome = "Agilidade", Ativo = true,
        });
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "CEGUEIRA", Nome = "Cegueira", Tipo = "Sensorial",
            OperacaoEfeito = "MODIFICAR_ROLAGEM", CodigoRecurso = "TODOS", ValorEfeito = -5,
            MomentoEfeito = "ENQUANTO_ATIVA", DuracaoPadrao = 2,
        });

        GameBattleActionSpec action = _factory.Build(run, version).Input.FirstActor.Actions[0];
        GameBattleConditionApplication condition = Assert.Single(action.Conditions);

        Assert.NotNull(action.Utility);
        Assert.Empty(action.Roll.Groups);
        Assert.Equal("CEGUEIRA", condition.Rule.Code);
        Assert.Equal("TODOS_INIMIGOS", condition.Target);
        Assert.Equal(3, condition.Duration);
        Assert.Equal(6, condition.ResistanceTest?.Faces);
        Assert.Equal(5, condition.ResistanceTest?.Difficulty);
    }

    [Fact]
    public void Build_MagiaComTesteECondicaoSemDanoEntraNoLoadout()
    {
        GameRunDto original = Run("[]");
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = new GameRunCharacterSnapshotDto
            {
                IdSistemaVersao = original.EstadoAtual.IdSistemaVersao,
                IdPersonagemJogadorOrigem = original.EstadoAtual.IdPersonagemJogadorOrigem,
                Nome = original.EstadoAtual.Nome,
                Status = original.EstadoAtual.Status,
                Inventario = Json("[]"),
                Magia = Json("""
                    [{"id":"sangrar","nome":"Marca sangrenta","tipo":"ataque",
                      "atributos":{"acerto":"1D20","condicoes":[{"codigo":"SANGRAMENTO",
                        "gatilho":"ACERTO","duracao":2,"unidadeDuracao":"Turno"}]}}]
                    """),
            },
            AcoesEquipadas = [new() { Tipo = "MAGIA", IdInstancia = "sangrar" }],
        };
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "SANGRAMENTO", Nome = "Sangramento", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA", ValorEfeito = 3,
            MomentoEfeito = "INICIO_TURNO", RegraRemocao = "DURACAO",
        });

        GameBattleActionSpec action = _factory.Build(run, version).Input.FirstActor.Actions[0];

        Assert.Equal("magia:sangrar", action.Id);
        Assert.Equal(0, action.DamageByResultCode["ACERTO"]);
        Assert.Equal("SANGRAMENTO", Assert.Single(action.Conditions).Rule.Code);
    }

    [Fact]
    public void Build_MagiaDeRemocaoSemDanoUsaSomenteRegraPublicada()
    {
        GameRunDto original = Run("[]");
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = new GameRunCharacterSnapshotDto
            {
                IdSistemaVersao = original.EstadoAtual.IdSistemaVersao,
                IdPersonagemJogadorOrigem = original.EstadoAtual.IdPersonagemJogadorOrigem,
                Nome = original.EstadoAtual.Nome,
                Status = original.EstadoAtual.Status,
                Inventario = Json("[]"),
                Magia = Json("""
                    [{"id":"purificar","nome":"Purificar","tipo":"suporte",
                      "atributos":{"teste":{"codigoTeste":"ATAQUE_COMUM"},
                        "removeCondicoes":["VENENO","MARCA"]}}]
                    """),
            },
            AcoesEquipadas = [new() { Tipo = "MAGIA", IdInstancia = "purificar" }],
        };
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "VENENO", Nome = "Veneno", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA",
            MomentoEfeito = "INICIO_TURNO", RegraRemocao = "MAGIA",
        });
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "MARCA", Nome = "Marca", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA",
            MomentoEfeito = "INICIO_TURNO", RegraRemocao = "MANUAL",
        });

        GameBattleActionSpec action = _factory.Build(run, version).Input.FirstActor.Actions[0];

        Assert.Equal("magia:purificar", action.Id);
        Assert.Equal(["VENENO"], action.RemovesConditions);
        Assert.Equal(0, action.DamageByResultCode["ACERTO"]);
    }

    [Fact]
    public void Build_ItemOutroComTesteECondicaoDispensaDano()
    {
        GameRunDto original = Run("""
            [{"id":"artefato","nome":"Artefato","tipo":"outro",
              "atributos":{"teste":{"codigoTeste":"ATAQUE_COMUM"},
                "condicoes":[{"codigo":"MARCA","gatilho":"ACERTO","duracao":2,
                  "unidadeDuracao":"Turno"}]}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "artefato" }],
        };
        SistemaVersao version = Version();
        version.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "MARCA", Nome = "Marca", Tipo = "Fisico",
            OperacaoEfeito = "SUBTRAIR", CodigoRecurso = "VIDA",
            MomentoEfeito = "AO_APLICAR", RegraRemocao = "DURACAO",
        });

        GameBattleActionSpec action = _factory.Build(run, version).Input.FirstActor.Actions[0];

        Assert.Equal("item:artefato", action.Id);
        Assert.Equal(0, action.DamageByResultCode["ACERTO"]);
        Assert.Equal("MARCA", Assert.Single(action.Conditions).Rule.Code);
    }

    [Fact]
    public void Build_MantemCincoAcoesNaOrdemComDescansoBonus()
    {
        GameRunDto original = Run("""
            [{"id":"one","nome":"Primeira","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
             {"id":"two","nome":"Segunda","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
             {"id":"three","nome":"Terceira","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
             {"id":"four","nome":"Quarta","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}},
             {"id":"five","nome":"Quinta","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas =
            [
                new() { Tipo = "ITEM", IdInstancia = "five" },
                new() { Tipo = "ITEM", IdInstancia = "four" },
                new() { Tipo = "DESCANSO", IdInstancia = "descanso-simples" },
                new() { Tipo = "ITEM", IdInstancia = "three" },
                new() { Tipo = "ITEM", IdInstancia = "two" },
                new() { Tipo = "ITEM", IdInstancia = "one" },
            ],
        };
        SistemaVersao version = Version();
        version.Descansos = [new SistemaDescansoConfig
        {
            Tipo = "SIMPLES", Nome = "Descanso curto", RecuperacaoEstamina = 5,
            TipoRecuperacao = SistemaRecuperacaoTipo.ValorFixo,
        }];

        GameBattleActorSpec result = _factory.Build(run, version).Input.FirstActor;

        Assert.Equal(["item:five", "item:four", "item:three", "item:two", "item:one", "treino-basico"],
            result.Actions.Select(action => action.Id));
        Assert.Equal(2, result.Rest?.AfterActionIndex);
    }

    [Fact]
    public void Build_PrimeiroCombateComecaComCarregadorCheioMesmoSeFichaTinhaZero()
    {
        GameRunDto original = Run("""
            [{"id":"gun","nome":"Pistola","tipo":"arma",
              "atributos":{"tipoArma":"pistola_revolver","danoBase":18,"cadencia":2,
                "controlaMunicao":true,"municaoAtual":0,"municaoReserva":6,
                "capacidadeMunicao":6,"custoMunicaoTiro":1,"custoMunicaoRajada":2}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "gun", Alcance = "CURTA" }],
        };

        GameBattleActionSpec result = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal("item:gun", result.Id);
        Assert.Equal(6, result.Magazine?.Loaded);
        Assert.Equal(6, result.Magazine?.Reserve);
    }

    [Fact]
    public void Build_AquilaSemMunicaoNaFichaMantemPrioridadeSobreEspada()
    {
        GameRunDto original = Run("""
            [{"id":"aquila","nome":"Aquila","tipo":"arma",
              "atributos":{"tipoArma":"pistola_revolver","danoBase":18,
                "controlaMunicao":true,"municaoAtual":0,"capacidadeMunicao":10,"custoMunicaoTiro":1}},
             {"id":"espada","nome":"Espada","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":20}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas =
            [
                new() { Tipo = "ITEM", IdInstancia = "aquila", Alcance = "CURTA", QuantidadeAtaques = 10 },
                new() { Tipo = "ITEM", IdInstancia = "espada", QuantidadeAtaques = 4 },
            ],
        };

        GameBattleInput battle = _factory.Build(run, Version()).Input;

        Assert.Equal(["item:aquila", "item:espada", "treino-basico"],
            battle.FirstActor.Actions.Select(action => action.Id));
        Assert.Equal(10, battle.FirstActor.Actions[0].Magazine?.Loaded);
        GameBattleResult result = new AutoBattleSimulator().Simulate(battle,
            new SeededGameRunRandomSource(123));
        Assert.Equal("item:aquila", ((ActionSelectedPayload)result.Events.First(evt =>
            evt.Type == GameBattleEventTypes.ActionSelected && evt.ActorId == "player").Payload).ActionId);
    }

    [Theory]
    [InlineData("CURTA", 100)]
    [InlineData("MEDIA", 200)]
    [InlineData("LONGA", 100)]
    public void Build_AquilaLegadaComD20EDanoPorAlcanceNaoExigeRegravarOCustoDeMunicao(string range, int damage)
    {
        GameRunDto original = Run("""
            [{"id":"aquila","nome":"Aquila","tipo":"arma","atributos":{
              "tipoArma":"pistola_revolver","acerto":"D20","cadencia":1,
              "danoPorAlcance":{"curta":100,"media":200,"longa":100},
              "municao":{"capacidade":10,"atual":0},"capacidadeMunicao":10,
              "gastoEstaminaPorAtaque":5}}]
            """);
        var selection = new GameRunActionSelectionDto { Tipo = "ITEM", IdInstancia = "aquila", Alcance = range };
        GameRunDto run = new() { IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo, EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [selection] };
        string before = run.EstadoAtual.Inventario!.Value.GetRawText();

        Assert.True(_factory.CanExecuteSelectedAction(run, Version(), selection));
        GameBattleActionSpec action = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal("item:aquila", action.Id);
        Assert.Equal(damage, action.DamageByResultCode["ACERTO"]);
        Assert.Equal(new GameplayDiceGroupSpec(1, 20), Assert.Single(action.Roll.Groups));
        Assert.Equal(10, action.Magazine?.Loaded);
        Assert.Equal(1, action.Magazine?.AmmoPerUse);
        Assert.Equal("item:aquila", _factory.Build(original, Version()).Input.FirstActor.Actions[0].Id);
        GameBattleResult battle = new AutoBattleSimulator().Simulate(
            _factory.Build(run, Version()).Input, new SeededGameRunRandomSource(123));
        Assert.Contains(battle.Events, evt => evt.ActorId == "player" &&
            evt.Payload is ResourceChangedPayload { Resource: "loadedAmmo", Before: 10, After: 9 });
        Assert.Equal(before, run.EstadoAtual.Inventario.Value.GetRawText());
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(2, true)]
    public void ValidarAcaoPreservaCustoDeMunicaoExplicitoEExplicaAFalha(int shotCost, bool executable)
    {
        JsonNode inventory = JsonNode.Parse("""
            [{"id":"aquila","nome":"Aquila","tipo":"arma","atributos":{
              "tipoArma":"pistola_revolver","acerto":"D20","danoPorAlcance":{"curta":100},
              "capacidadeMunicao":10,"custoMunicaoTiro":0}}]
            """)!;
        inventory[0]!["atributos"]!["custoMunicaoTiro"] = shotCost;
        GameRunDto run = Run(inventory.ToJsonString());
        var selection = new GameRunActionSelectionDto { Tipo = "ITEM", IdInstancia = "aquila", Alcance = "CURTA" };
        var reasons = new List<string>();

        Assert.Equal(executable, _factory.CanExecuteSelectedAction(run, Version(), selection, reasons));
        if (executable)
        {
            var selectedRun = new GameRunDto { IdSistemaVersao = run.IdSistemaVersao,
                ConfiguracaoModo = run.ConfiguracaoModo, EstadoAtual = run.EstadoAtual, AcoesEquipadas = [selection] };
            Assert.Equal(shotCost, _factory.Build(selectedRun, Version()).Input.FirstActor.Actions[0].Magazine?.AmmoPerUse);
        }
        else Assert.Contains(reasons, reason => reason.Contains("consumo de munição", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(shotCost, run.EstadoAtual.Inventario!.Value[0].GetProperty("atributos").GetProperty("custoMunicaoTiro").GetInt32());
    }

    [Fact]
    public void Build_ArmaDeFogoComPenteConsomeMunicaoMesmoSemSwitchLegado()
    {
        GameRunDto original = Run("""
            [{"id":"gun","nome":"Pistola","tipo":"arma",
              "atributos":{"tipoArma":"pistola_revolver","danoBase":18,
                "capacidadeMunicao":6,"municaoAtual":6,"custoMunicaoTiro":1}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "gun", Alcance = "CURTA" }],
        };

        GameBattleActionSpec action = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal("item:gun", action.Id);
        Assert.Equal(6, action.Magazine?.Loaded);
        Assert.Equal(1, action.Magazine?.AmmoPerUse);
        Assert.True(action.Magazine?.UnlimitedReserve);
        GameBattleResult battle = new AutoBattleSimulator().Simulate(
            _factory.Build(run, Version()).Input, new SeededGameRunRandomSource(123));
        Assert.Contains(battle.Events, battleEvent =>
            battleEvent.Type == GameBattleEventTypes.ResourceChanged &&
            battleEvent.ActorId == "player" &&
            battleEvent.Payload is ResourceChangedPayload ammo &&
            ammo.Resource == "loadedAmmo" && ammo.Before == 6 && ammo.After == 5);
    }

    [Fact]
    public void Build_UsaModoDeDisparoDaArmaMesmoComPreferenciaLegadaDiferente()
    {
        GameRunDto original = Run("""
            [{"id":"gun","nome":"Rajadeira","tipo":"arma",
              "atributos":{"tipoArma":"rifle_assalto","danoBase":20,"cadencia":3,
                "teste":{"codigoTeste":"ATAQUE_COMUM","modosDisparo":["RAJADA"]},
                "controlaMunicao":true,"municaoAtual":60,"municaoReserva":0,
                "capacidadeMunicao":60,"custoMunicaoTiro":1,"custoMunicaoRajada":10}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "gun", Alcance = "CURTA",
                ModoDisparo = "TIRO", QuantidadeAtaques = 3 }],
        };

        GameBattleActionSpec result = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal("item:gun", result.Id);
        Assert.Equal(10, result.Magazine?.AmmoPerUse);
        Assert.Equal(3, result.AttacksPerTurn);
    }

    [Fact]
    public void Build_CadenciaDeDezBalasPermiteTresRajadasComUmaRolagem()
    {
        GameRunDto original = Run("""
            [{"id":"rifle","nome":"Rifle","tipo":"arma",
              "atributos":{"tipoArma":"rifle_assalto","danoBase":20,"cadencia":10,
                "controlaMunicao":true,"municaoAtual":60,"capacidadeMunicao":60,
                "custoMunicaoTiro":1,"custoMunicaoRajada":0}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "rifle", Alcance = "CURTA", QuantidadeAtaques = 3 }],
        };

        GameBattleActionSpec action = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal(3, action.AttacksPerTurn);
        Assert.Equal(10, action.Magazine?.AmmoPerUse);
        Assert.Equal(60, action.Magazine?.Capacity);
        Assert.Equal(20, action.DamageByResultCode["ACERTO"]);
        Assert.Single(action.Roll.Groups);
    }

    [Fact]
    public void Build_EspadaPermiteTresGolpesEmUmaRolagem()
    {
        GameRunDto original = Run("""
            [{"id":"espada","nome":"Espada","tipo":"arma",
              "atributos":{"tipoArma":"espada","danoBase":200,"gastoEstaminaPorAtaque":10,"cadencia":1}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "espada", QuantidadeAtaques = 3 }],
        };

        GameBattleActionSpec action = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal(3, action.AttacksPerTurn);
        Assert.Equal(10, action.StaminaCost);
        Assert.Equal(200, action.DamageByResultCode["ACERTO"]);
    }

    [Fact]
    public void Build_RespeitaLimitePublicadoDoTipoDeArma()
    {
        GameRunDto original = Run("""
            [{"id":"pistola","nome":"Pistola","tipo":"arma",
              "atributos":{"tipoArma":"pistola_revolver","danoBase":80,"cadencia":5,
                "controlaMunicao":true,"municaoAtual":5,"capacidadeMunicao":5,"custoMunicaoTiro":1}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "pistola", Alcance = "CURTA", QuantidadeAtaques = 3 }],
        };
        SistemaVersao version = Version();
        version.Modulos.Add(new SistemaModulo
        {
            TipoModulo = SistemaModuloTipo.Combate,
            ConfiguracaoJson = """
                {"limitesAcoesPorArma":[{"tipoArma":"pistola_revolver","maximoTiros":2,"maximoRajadas":0,"maximoGolpes":0}]}
                """,
        });

        InvalidOperationException error = Assert.Throws<InvalidOperationException>(() => _factory.Build(run, version));
        Assert.StartsWith("Sistema:", error.Message);
    }

    [Fact]
    public void Build_InformaQuandoLimitePertenceAoItem()
    {
        GameRunDto original = Run("""
            [{"id":"pistola","nome":"Pistola","tipo":"arma",
              "atributos":{"tipoArma":"pistola_revolver","danoBase":80,"cadencia":5,
                "controlaMunicao":true,"municaoAtual":5,"capacidadeMunicao":5,
                "custoMunicaoTiro":1,"limiteTirosPorTurno":2}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "pistola", Alcance = "CURTA", QuantidadeAtaques = 3 }],
        };

        InvalidOperationException error = Assert.Throws<InvalidOperationException>(() => _factory.Build(run, Version()));
        Assert.StartsWith("Item:", error.Message);
    }

    [Fact]
    public void Build_CadenciaPadraoNaoLimitaTirosQuandoPentePermite()
    {
        GameRunDto original = Run("""
            [{"id":"pistola","nome":"Pistola","tipo":"arma",
              "atributos":{"tipoArma":"pistola_revolver","danoBase":80,"cadencia":1,
                "controlaMunicao":true,"municaoAtual":10,"capacidadeMunicao":10,"custoMunicaoTiro":1}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "pistola", Alcance = "CURTA", QuantidadeAtaques = 10 }],
        };

        GameBattleActionSpec action = _factory.Build(run, Version()).Input.FirstActor.Actions[0];

        Assert.Equal(10, action.AttacksPerTurn);
        Assert.Equal(1, action.Magazine?.AmmoPerUse);
        Assert.Single(action.Roll.Groups);
    }

    [Fact]
    public void Build_AplicaLimiteGeralDeArmaDeFogoQuandoArquetipoNaoTemRegra()
    {
        GameRunDto original = Run("""
            [{"id":"rifle","nome":"Rifle","tipo":"arma",
              "atributos":{"tipoArma":"rifle_assalto","danoBase":20,"cadencia":10,
                "controlaMunicao":true,"municaoAtual":60,"capacidadeMunicao":60,
                "custoMunicaoTiro":1,"custoMunicaoRajada":0}}]
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
            AcoesEquipadas = [new() { Tipo = "ITEM", IdInstancia = "rifle", Alcance = "CURTA", QuantidadeAtaques = 4 }],
        };
        SistemaVersao version = Version();
        version.Modulos.Add(new SistemaModulo
        {
            TipoModulo = SistemaModuloTipo.Combate,
            ConfiguracaoJson = """
                {"limitesAcoesPorArma":[{"tipoArma":"arma_de_fogo","maximoTiros":0,"maximoRajadas":4,"maximoGolpes":0}]}
                """,
        });

        Assert.Equal(4, _factory.Build(run, version).Input.FirstActor.Actions[0].AttacksPerTurn);
        run.AcoesEquipadas[0].QuantidadeAtaques = 5;
        InvalidOperationException error = Assert.Throws<InvalidOperationException>(() => _factory.Build(run, version));
        Assert.StartsWith("Sistema:", error.Message);
    }

    [Fact]
    public void Build_UsaRecursosECustosDoInimigoConfiguradosNoModo()
    {
        GameRunDto original = Run("[]");
        JsonObject configuration = JsonNode.Parse(original.ConfiguracaoModo.GetRawText())!.AsObject();
        JsonObject enemy = configuration["previewEnemy"]!.AsObject();
        enemy["maxMana"] = 9;
        enemy["maxEstamina"] = 6;
        enemy["custoManaAtaque"] = 3;
        enemy["custoEstaminaAtaque"] = 2;
        enemy["image"] = "/uploads/sentinela.png";
        var run = new GameRunDto
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = Json(configuration.ToJsonString()),
            EstadoAtual = original.EstadoAtual,
        };

        GameBattleActorSpec result = _factory.Build(run, Version()).Input.SecondActor;

        Assert.Equal(9, result.Mana);
        Assert.Equal(9, result.MaximumMana);
        Assert.Equal(6, result.Stamina);
        Assert.Equal(6, result.MaximumStamina);
        Assert.Equal(3, result.Actions.Single().ManaCost);
        Assert.Equal(2, result.Actions.Single().StaminaCost);
        Assert.Equal("/uploads/sentinela.png", result.Image);
        Assert.Equal("/uploads/sentinela.png", result.Actions.Single().Image);
    }

    [Fact]
    public void Build_RespeitaQuantidadeDoEncontroEscolhidoParaCacada()
    {
        GameRunDto original = Run("[]");
        JsonObject configuration = JsonNode.Parse(original.ConfiguracaoModo.GetRawText())!.AsObject();
        configuration["encounters"] = JsonNode.Parse("""
            {"LOBO":{"mapName":"Alcateia","enemy":{"name":"Lobo","maxVida":12,
              "defesa":0,"quantity":3},"damageByResult":{"FALHA_CRITICA":0,"ERRO":0,
              "ACERTO":5,"ACERTO_PRECISO":8,"CRITICO":10}}}
            """);
        GameRunDto run = new()
        {
            IdSistemaVersao = original.IdSistemaVersao,
            ConfiguracaoModo = Json(configuration.ToJsonString()),
            EstadoAtual = original.EstadoAtual,
        };

        GameBattleInput battle = _factory.Build(run, Version(), "LOBO").Input;

        Assert.Equal("Lobo 1", battle.SecondActor.Name);
        Assert.Equal(["Lobo 2", "Lobo 3"], battle.AdditionalEnemies.Select(enemy => enemy.Name));
    }

    [Fact]
    public async Task TreinosDaMesmaRunRecebemAleatoriedadeNovaSemAlterarARun()
    {
        GameRunDto original = Run("[]");
        var run = new GameRunDto
        {
            IdGameRun = 12,
            IdSistemaVersao = original.IdSistemaVersao,
            IdGameModeVersion = 3,
            Status = "Ativa",
            Seed = 12345,
            ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual,
        };
        var runs = new Mock<IGameRunService>();
        runs.Setup(service => service.GetByIdAsync(12, 4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        var systems = new Mock<ISistemaRpgRepository>();
        systems.Setup(repository => repository.GetVersionAsync(7, true, false))
            .ReturnsAsync(Version());
        var samples = new List<int>();
        var simulator = new Mock<IAutoBattleSimulator>();
        simulator.Setup(service => service.Simulate(
                It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()))
            .Returns((GameBattleInput _, IDiceRandomSource random) =>
            {
                samples.Add(random.NextInclusive(1_000_000_000));
                return new GameBattleResult(null, GameBattleEndReason.RoundLimit, 0, [], []);
            });
        var service = new GameBattlePreviewService(runs.Object, systems.Object, _factory, simulator.Object);

        for (int attempt = 0; attempt < 4; attempt++)
        {
            GameRunOperationResult<GameBattlePreviewDto> preview =
                await service.PreviewAsync(12, 4, CancellationToken.None);
            Assert.True(preview.Sucesso);
            Assert.Equal("/uploads/heroi.png", preview.Dados!.Personagem.Imagem);
        }

        Assert.Equal(4, samples.Count);
        Assert.True(samples.Distinct().Count() > 1,
            "Novas simulações de treino não devem reutilizar a seed da run.");
        Assert.Equal(12345, run.Seed);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task TreinoListaVitoriasDoPersonagemSemDuplicarEValidaSelecaoNoServidor(bool historical)
    {
        var original = Run("[]");
        var run = new GameRunDto { IdGameRun = 99, IdPersonagemJogadorOrigem = 12,
            IdSistemaVersao = 7, Status = "Ativa", ConfiguracaoModo = original.ConfiguracaoModo,
            EstadoAtual = original.EstadoAtual };
        var version = Version(); version.IdSistemaRpg = 8;
        var enemy = new GameBattleEncounterConfig { Enemy = new() { NpcId = 33, Name = "Maga de fogo", MaxVida = 200,
            MaxMana = 60, MaxEstamina = 20, Quantity = 3, Image = "/maga.png" }, DamageByResult = new()
            { ["FALHA_CRITICA"] = 0, ["ERRO"] = 0, ["ACERTO"] = 10, ["ACERTO_PRECISO"] = 15, ["CRITICO"] = 20 } };
        var state = new GameCharacterMilestones();
        state.Learn(8, "JOGO", "MAGA", enemy);
        string key = Assert.Single(state.DefeatedEnemies).Key;
        state.Learn(9, "OUTRO_SISTEMA", "MAGA", enemy);
        var repository = new Mock<IGameRunRepository>();
        repository.Setup(item => item.GetOwnedCharacterAsync(4, 12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PersonagemJogador { IdpersonagemJogador = 12 });
        repository.Setup(item => item.GetCharacterMemoryAsync(4, 12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(historical ? null : new GameCharacterMemory { IdPersonagemJogador = 12, EstadoJson = state.Serialize() });
        var oldConfig = JsonNode.Parse(original.ConfiguracaoModo.GetRawText())!;
        oldConfig["encounters"] = new JsonObject { ["MAGA"] = JsonSerializer.SerializeToNode(enemy, new JsonSerializerOptions(JsonSerializerDefaults.Web)) };
        var victory = new GameRunBattle { NoId = "maga-1", VencedorId = "player", Run = new GameRun {
            GameModeVersion = new() { Codigo = "JOGO", ConfiguracaoJson = oldConfig.ToJsonString() },
            MapaJson = """{"nodes":[],"historicalNodes":[{"id":"maga-1","payload":{"encounterCode":"MAGA"}}]}""" } };
        repository.Setup(item => item.GetCharacterVictoriesAsync(4, 12, 8, It.IsAny<CancellationToken>()))
            .ReturnsAsync([victory, victory]);
        var runs = new Mock<IGameRunService>();
        runs.Setup(item => item.GetByIdAsync(99, 4, It.IsAny<CancellationToken>())).ReturnsAsync(run);
        var systems = new Mock<ISistemaRpgRepository>();
        systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(version);
        GameBattleInput? received = null;
        var simulator = new Mock<IAutoBattleSimulator>();
        simulator.Setup(item => item.Simulate(It.IsAny<GameBattleInput>(), It.IsAny<IDiceRandomSource>()))
            .Returns((GameBattleInput input, IDiceRandomSource _) => {
                received = input; return new GameBattleResult(null, GameBattleEndReason.RoundLimit, 0, [], []);
            });
        var service = new GameBattlePreviewService(runs.Object, systems.Object, _factory, simulator.Object, repository.Object);
        string before = run.EstadoAtual.Status.GetRawText() + run.EstadoAtual.Inventario?.GetRawText() + run.ConfiguracaoModo.GetRawText();
        var choices = await service.GetOpponentsAsync(99, 4, default);
        Assert.True(choices.Sucesso);
        Assert.Equal(2, choices.Dados!.Count);
        Assert.Equal("default", choices.Dados[0].Key);
        Assert.Equal("Maga de fogo", choices.Dados[1].Nome);
        Assert.Equal(200, choices.Dados[1].Vida);
        Assert.Equal("OPONENTE_NAO_DESBLOQUEADO", (await service.PreviewAsync(99, 4, "forjado", default)).Codigo);
        Assert.Null(received);
        var battle = await service.PreviewAsync(99, 4, key, default);
        Assert.True(battle.Sucesso, battle.Mensagem);
        Assert.Equal("Maga de fogo", received!.SecondActor.Name);
        Assert.Empty(received.AdditionalEnemies);
        Assert.Equal(before, run.EstadoAtual.Status.GetRawText() + run.EstadoAtual.Inventario?.GetRawText() + run.ConfiguracaoModo.GetRawText());
        repository.Verify(item => item.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(item => item.AddCharacterMemoryAsync(It.IsAny<GameCharacterMemory>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await service.GetOpponentsAsync(99, 55, default)).Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await service.PreviewAsync(99, 55, key, default)).Codigo);
    }

    private static GameRunDto Run(string inventory) => new()
    {
        IdSistemaVersao = 7,
        ConfiguracaoModo = Json("""
            {"schemaVersion":1,"previewUseTotalForRanges":true,
             "previewEnemy":{"name":"Sentinela","maxVida":30,"defesa":0},
             "previewFallbackAction":{"name":"Ataque de treino","baseDamage":5},
             "previewDamageByResult":{"FALHA_CRITICA":0,"ERRO":0,"ACERTO":5,"ACERTO_PRECISO":8,"CRITICO":10},
             "previewPlayerDamageByResult":{
                "FALHA_CRITICA":{"multiplier":0,"bonus":0},
                "ERRO":{"multiplier":0,"bonus":0},
                "ACERTO":{"multiplier":1,"bonus":0},
                "ACERTO_PRECISO":{"multiplier":1,"bonus":2},
                "CRITICO":{"multiplier":2,"bonus":0}}}
            """),
        EstadoAtual = new GameRunCharacterSnapshotDto
        {
            IdSistemaVersao = 7,
            IdPersonagemJogadorOrigem = 12,
            Nome = "Herói",
            Imagem = "/uploads/heroi.png",
            Status = Json("""
                {"status":{"vida":30,"vidaMaxima":30,"mana":10,"estamina":10},
                 "defesas":{"escudo":1200,"protecao":0,"armadura":0}}
                """),
            Inventario = Json(inventory),
        },
    };

    private static SistemaVersao Version()
    {
        var version = new SistemaVersao
        {
            IdSistemaVersao = 7,
            NumeroVersao = "1.0",
            SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Odisseia" },
        };
        version.ResultadosDado = new List<SistemaResultadoDado>
        {
            Row("FALHA_CRITICA", 1, 1, 1),
            Row("ERRO", 2, 10, 2),
            Row("ACERTO", 11, 17, 3),
            Row("ACERTO_PRECISO", 18, 19, 4),
            Row("CRITICO", 20, 20, 5),
        };
        version.TiposDefesa = new List<SistemaTipoDefesa>
        {
            new() { Codigo = "ESCUDO", Nome = "Escudo", OrdemAplicacao = 1, TipoComportamento = "BloqueiaUmDano" },
        };
        return version;
    }

    private static SistemaResultadoDado Row(string code, int min, int max, int order) => new()
    {
        CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20", QuantidadeDados = 1,
        ResultadoMinimo = min, ResultadoMaximo = max, CodigoResultado = code,
        NomeResultado = code, Ordem = order,
    };

    private static JsonElement Json(string value)
    {
        using JsonDocument document = JsonDocument.Parse(value);
        return document.RootElement.Clone();
    }
}
