using System.Text.Json;
using System.Text.Json.Nodes;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
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
                    [{"id":"fogo-1","nome":"Chama","tipo":"ataque","custo":"2",
                      "atributos":{"dano":15,"acerto":"1D20"}}]
                    """),
            },
            AcoesEquipadas = [new() { Tipo = "MAGIA", IdInstancia = "fogo-1" }],
        };

        GameBattleActorSpec actor = _factory.Build(run, Version()).Input.FirstActor;

        Assert.Equal("magia:fogo-1", actor.Actions[0].Id);
        Assert.Equal(15, actor.Actions[0].DamageByResultCode["ACERTO"]);
        Assert.False(actor.Actions[0].IsFallback);
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
