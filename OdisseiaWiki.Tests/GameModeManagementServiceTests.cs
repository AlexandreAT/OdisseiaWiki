using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameModeManagementServiceTests
{
    [Theory]
    [InlineData("{}", true)]
    [InlineData("{\"repairProtectionAtBase\":false}", false)]
    public async Task EditorPreservaEscolhaDeReparoEPadraoDeModosAntigos(string config, bool expected)
    {
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(repo => repo.GetCurrentSystemVersionIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(7);
        management.Setup(repo => repo.GetDraftAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameModeVersion { IdSistemaVersao = 7, ConfiguracaoJson = config });
        management.Setup(repo => repo.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object,
            new Mock<ISistemaRpgRepository>().Object, new GameplayActionResolver());

        var editor = await service.GetAsync(null, CancellationToken.None);

        Assert.True(editor.Sucesso, editor.Mensagem);
        Assert.Equal(expected, editor.Dados!.RepairProtectionAtBase);
    }

    [Fact]
    public async Task CatalogosDoJogoIgnoramConteudosOcultos()
    {
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(repo => repo.GetSystemVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new GameModeSystemVersionDto(7, "1.2", "Publicado", true)]);
        management.Setup(repo => repo.GetLootItemsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new Item { Iditem = "visivel", Nome = "Visível", Visivel = true },
                new Item { Iditem = "oculto", Nome = "Oculto", Visivel = false },
            ]);
        management.Setup(repo => repo.GetNpcCandidatesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new Personagen { Idpersonagem = 1, Nome = "Visível", Visivel = true,
                    StatusJson = """{"status":{"vida":10}}""" },
                new Personagen { Idpersonagem = 2, Nome = "Oculto", Visivel = false,
                    StatusJson = """{"status":{"vida":10}}""" },
            ]);
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object,
            new Mock<ISistemaRpgRepository>().Object, new GameplayActionResolver());

        Assert.Equal("visivel", Assert.Single(await service.GetLootOptionsAsync(CancellationToken.None)).Id);
        Assert.Equal(1, Assert.Single(await service.GetNpcOptionsAsync(7, CancellationToken.None)).Id);
    }

    [Fact]
    public async Task ClonarJogoMantemOrigemERemapeiaRegrasDaVersaoNova()
    {
        const string sourceJson = """
            {"map":{"schemaVersion":4},"areas":[{"code":"FASE_1","name":"Floresta",
              "baseName":"Base","baseRestType":"SIMPLES","options":[{"type":"COMBATE","encounterCode":"A"}]}],
             "encounters":{"A":{"mapName":"Lobo","enemy":{"name":"Lobo","maxVida":10},
               "damageByResult":{"ANTIGO":7,"ACERTO":15}}},
             "previewPlayerDamageByResult":{"ANTIGO":{"multiplier":1,"bonus":0},
               "ACERTO":{"multiplier":2,"bonus":1}},
             "previewDamageByResult":{"ANTIGO":5,"ACERTO":10},
             "previewFallbackAction":{"name":"Ataque","baseDamage":5}}
            """;
        var source = new GameModeVersion { IdSistemaVersao = 11, ConfiguracaoJson = sourceJson,
            Status = GameModeVersionStatus.Publicado, SchemaVersion = 1 };
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(repo => repo.GetSystemVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new GameModeSystemVersionDto(12, "1.2", "Publicado", true),
                new GameModeSystemVersionDto(11, "1.1", "Arquivado", false)]);
        management.Setup(repo => repo.GetLatestModeAsync(11, It.IsAny<CancellationToken>()))
            .ReturnsAsync(source);
        management.Setup(repo => repo.GetAttackOutcomeCodesAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO", "NOVO"]);
        GameModeVersion? created = null;
        management.Setup(repo => repo.AddAsync(It.IsAny<GameModeVersion>(), It.IsAny<CancellationToken>()))
            .Callback<GameModeVersion, CancellationToken>((mode, _) => created = mode)
            .Returns(Task.CompletedTask);
        Mock<ISistemaRpgRepository> systems = new();
        systems.Setup(repo => repo.GetVersionAsync(12, true, false))
            .ReturnsAsync(new SistemaVersao { Descansos = [new()
            {
                Tipo = "NORMAL", TipoRecuperacao = SistemaRecuperacaoTipo.ValorFixo,
            }] });
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object, systems.Object, new GameplayActionResolver());

        var result = await service.CloneDraftAsync(11, 12, CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(11, source.IdSistemaVersao);
        Assert.Equal(sourceJson, source.ConfiguracaoJson);
        Assert.Equal(12, created!.IdSistemaVersao);
        Assert.Equal(GameModeVersionStatus.Rascunho, created.Status);
        GameModeEditorDto migrated = result.Dados!;
        Assert.Equal("Floresta", Assert.Single(migrated.Areas).Name);
        Assert.Equal("NORMAL", migrated.Areas[0].BaseRestType);
        Assert.Equal(2, migrated.PlayerDamageByResult["ACERTO"].Multiplier);
        Assert.Contains("NOVO", migrated.PlayerDamageByResult.Keys);
        Assert.DoesNotContain("ANTIGO", migrated.PlayerDamageByResult.Keys);
        Assert.Contains("NOVO", migrated.Encounters["A"].DamageByResult!.Keys);
        Assert.DoesNotContain("ANTIGO", migrated.Encounters["A"].DamageByResult!.Keys);
    }

    [Fact]
    public async Task SalvarRascunhoRejeitaNpcOcultoMesmoComIdEnviadoDiretamente()
    {
        var draft = new GameModeVersion { IdGameModeVersion = 8, IdSistemaVersao = 7,
            Status = GameModeVersionStatus.Rascunho, ConfiguracaoJson = "{}" };
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(repo => repo.GetDraftByIdAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(draft);
        management.Setup(repo => repo.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO"]);
        management.Setup(repo => repo.GetNpcAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Personagen { Idpersonagem = 42, Visivel = false });
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object,
            new Mock<ISistemaRpgRepository>().Object, new GameplayActionResolver());
        var update = new GameModeEditorUpdateDto
        {
            Areas = [new GameModeAreaDto { Code = "FASE_1", Name = "Floresta", BaseName = "Base",
                Options = [new GameModeAreaOptionDto { Type = "COMBATE", EncounterCode = "A" }] }],
            Encounters = new Dictionary<string, GameBattleEncounterConfig>
            {
                ["A"] = new GameBattleEncounterConfig { MapName = "Lobo",
                    Enemy = new GameBattlePreviewEnemy { NpcId = 42, Name = "Lobo", MaxVida = 10,
                        Actions = [new GameRunActionSelectionDto { Tipo = "ITEM", IdInstancia = "blade" }] },
                    DamageByResult = new Dictionary<string, int> { ["ACERTO"] = 10 } },
            },
            FallbackAction = new GameBattleFallbackAction { Name = "Ataque", BaseDamage = 5 },
            PlayerDamageByResult = new Dictionary<string, GameBattleDamageModifier>
                { ["ACERTO"] = new() { Multiplier = 1, Bonus = 0 } },
        };

        var result = await service.SaveDraftAsync(8, update, CancellationToken.None);

        Assert.False(result.Sucesso);
        Assert.Equal("NPC_INVISIVEL", result.Codigo);
        management.Verify(repo => repo.SaveAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
    [Theory]
    [InlineData(true, true)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    public async Task PublicarLootExigeDadoDoSistemaECongelaItem(bool hasDie, bool itemVisible)
    {
        var encounter = new GameBattleEncounterConfig
        {
            MapName = "Encontro", LootCount = 1,
            Loot = [new() { ItemId = "pocao", Weight = 2 }],
            Enemy = new GameBattlePreviewEnemy { Name = "Inimigo", MaxVida = 20,
                Attributes = new Dictionary<string, int>(), Actions = [] },
            DamageByResult = new Dictionary<string, int> { ["ACERTO"] = 5 },
        };
        var draft = new GameModeVersion
        {
            IdGameModeVersion = 41, IdSistemaVersao = 7,
            NumeroVersao = "0.5.0", Status = GameModeVersionStatus.Rascunho,
            ConfiguracaoJson = JsonSerializer.Serialize(new
            {
                map = new { schemaVersion = 5 },
                areas = new[] { new GameModeAreaDto
                {
                    Code = "F1", Name = "Arena", BaseName = "Base", FinalOption = "ROTA:1",
                    Options = [
                        new GameModeAreaOptionDto { Type = "COMBATE", EncounterCode = "NORMAL" },
                        new GameModeAreaOptionDto { Type = "COMBATE", EncounterCode = "NORMAL" },
                    ],
                } },
                encounters = new Dictionary<string, GameBattleEncounterConfig> { ["NORMAL"] = encounter },
                previewFallbackAction = new GameBattleFallbackAction { Name = "Ataque", BaseDamage = 5 },
                previewPlayerDamageByResult = new Dictionary<string, GameBattleDamageModifier>
                {
                    ["ACERTO"] = new() { Multiplier = 1, Bonus = 0 },
                },
            }, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
        };
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(item => item.GetDraftByIdAsync(41, It.IsAny<CancellationToken>())).ReturnsAsync(draft);
        management.Setup(item => item.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO"]);
        management.Setup(item => item.GetLootItemsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Item { Iditem = "pocao", Nome = "Poção", Tipo = ItemTipo.Consumiveis,
                Visivel = itemVisible,
                Valor = 120,
                AtributosJson = """{"restaura":{"vida":10}}""" }]);
        Mock<ISistemaRpgRepository> systems = new();
        systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(new SistemaVersao
        {
            IdSistemaVersao = 7,
            Modulos = [new() { TipoModulo = SistemaModuloTipo.Progressao, Habilitado = true,
                ConfiguracaoJson = hasDie ? """{"dadoLootFaces":6}""" : "{}" }],
        });
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object, systems.Object, new GameplayActionResolver());

        var result = await service.PublishAsync(41, CancellationToken.None);

        if (!hasDie)
        {
            Assert.False(result.Sucesso);
            Assert.Contains("dado de loot", result.Mensagem, StringComparison.OrdinalIgnoreCase);
        }
        else if (!itemVisible)
        {
            Assert.False(result.Sucesso);
            Assert.Contains("disponível", result.Mensagem, StringComparison.OrdinalIgnoreCase);
        }
        else
        {
            Assert.True(result.Sucesso, result.Mensagem);
            var reward = result.Dados!.Encounters["NORMAL"].Loot[0].Snapshot;
            Assert.Equal("Poção", reward?["nome"]?.ToString());
            Assert.Equal("120", reward?["valor"]?.ToString());
            Assert.Equal("10", reward?["atributos"]?["restaura"]?["vida"]?.ToString());
        }
    }

    [Fact]
    public async Task OpcoesDeDescansoVemDaVersaoDoSistema()
    {
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(item => item.GetSystemVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new GameModeSystemVersionDto(7, "1.0", "Publicado", true)]);
        Mock<ISistemaRpgRepository> systems = new();
        systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(new SistemaVersao
        {
            Descansos =
            [
                new() { Tipo = "NORMAL", Nome = "Descanso normal", Ordem = 2,
                    RecuperacaoMana = 100, TipoRecuperacao = SistemaRecuperacaoTipo.Percentual,
                    ExigeGuarda = true },
                new() { Tipo = "SIMPLES", Nome = "Descanso curto", Ordem = 1,
                    RecuperacaoMana = 10, TipoRecuperacao = SistemaRecuperacaoTipo.ValorFixo },
            ],
        });
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object, systems.Object, new GameplayActionResolver());

        IReadOnlyList<GameModeRestOptionDto> options = await service.GetRestOptionsAsync(7, CancellationToken.None);

        Assert.Equal(["SIMPLES", "NORMAL"], options.Select(option => option.Type));
        Assert.True(options[1].RequiresGuard);
        Assert.True(options[1].Percentage);
    }

    [Fact]
    public async Task BuscaNpcDescreveAcoesDaFichaPelaVersaoDoSistemaSelecionada()
    {
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(item => item.GetSystemVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new GameModeSystemVersionDto(7, "1.0", "Publicado", true)]);
        management.Setup(item => item.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO"]);
        management.Setup(item => item.GetNpcCandidatesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Personagen
            {
                Idpersonagem = 42, Nome = "Guardiã", Idraca = 1,
                StatusJson = """
                    {"status":{"vida":20,"vidaMaxima":30,"manaMaxima":6,"estaminaMaxima":12},
                     "atributos":{"principais":{"forca":2}},"defesas":{"armadura":3}}
                    """,
                InventarioJson = """[{"id":"blade","nome":"Espada","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}}]""",
            }]);
        Mock<ISistemaRpgRepository> systems = new();
        systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(new SistemaVersao
        {
            IdSistemaVersao = 7,
            SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Odisseia" },
            ResultadosDado = new List<SistemaResultadoDado>
            {
                new() { CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum",
                    Dado = "D20", QuantidadeDados = 1, CodigoResultado = "ACERTO",
                    NomeResultado = "Acerto", ResultadoMinimo = 1, ResultadoMaximo = 20 },
            },
        });
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object, systems.Object, new GameplayActionResolver());

        IReadOnlyList<GameModeNpcOptionDto> result = await service.GetNpcOptionsAsync(7, CancellationToken.None);

        GameModeNpcOptionDto npc = Assert.Single(result);
        Assert.Equal(30, npc.Vida);
        Assert.Equal(6, npc.Mana);
        Assert.Equal(3, npc.Defesa);
        GameModeNpcActionOptionDto action = Assert.Single(npc.Actions);
        Assert.True(action.Executable);
        Assert.Equal(18, action.Damage);
    }

    [Theory]
    [InlineData("D20", true)]
    [InlineData("1D20", true)]
    [InlineData("1D6", false)]
    public async Task BuscaNpcValidaAcertoLegadoDeSkillEMagiaPelaRegraPublicada(
        string skillDie, bool skillExecutable)
    {
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(item => item.GetSystemVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new GameModeSystemVersionDto(7, "1.0", "Publicado", true)]);
        management.Setup(item => item.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO"]);
        management.Setup(item => item.GetNpcCandidatesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Personagen
            {
                Idpersonagem = 42, Nome = "Maga", Idraca = 1,
                StatusJson = """{"status":{"vida":20}}""",
                Skills = JsonSerializer.Serialize(new[] { new
                {
                    id = "skill-1", nome = "Golpe arcano", tipo = "ataque",
                    atributos = new { acerto = skillDie, dano = 7 },
                } }),
                Magia = """[{"id":"magia-1","nome":"Chama","tipo":"ataque","atributos":{"acerto":"1D20","dano":9}}]""",
            }]);
        Mock<ISistemaRpgRepository> systems = new();
        systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(new SistemaVersao
        {
            IdSistemaVersao = 7,
            SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Odisseia" },
            ResultadosDado = new List<SistemaResultadoDado>
            {
                new() { CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum",
                    Dado = "D20", QuantidadeDados = 1, CodigoResultado = "ACERTO",
                    NomeResultado = "Acerto", ResultadoMinimo = 1, ResultadoMaximo = 20 },
            },
        });
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object, systems.Object, new GameplayActionResolver());

        GameModeNpcOptionDto npc = Assert.Single(await service.GetNpcOptionsAsync(7, CancellationToken.None));

        GameModeNpcActionOptionDto skill = Assert.Single(npc.Actions, action => action.Tipo == "SKILL");
        Assert.Equal(skillExecutable, skill.Executable);
        if (skillExecutable) Assert.Equal(7, skill.Damage);
        else Assert.Contains("1D6", skill.UnavailableReason);
        Assert.Contains(npc.Actions, action => action.Tipo == "MAGIA" && action.Executable && action.Damage == 9);
    }

    [Fact]
    public async Task NovaVersaoDoSistemaPermiteRascunhoSemPublicarRegrasAntigas()
    {
        string template = """
            {"map":{"schemaVersion":3,"branchEncounterCodes":["A","B"]},
             "previewFallbackAction":{"name":"Ataque","baseDamage":5},
             "previewPlayerDamageByResult":{"ACERTO":{"multiplier":1,"bonus":0}},
             "previewDamageByResult":{"ACERTO":10},
             "encounters":{
               "A":{"mapName":"A","enemy":{"name":"A","maxVida":10},"damageByResult":{"ACERTO":10}},
               "B":{"mapName":"B","enemy":{"name":"B","maxVida":10},"damageByResult":{"ACERTO":10}}
             }}
            """;
        Mock<IGameModeManagementRepository> management = new();
        Mock<IGameRunRepository> runs = new();
        management.Setup(item => item.GetCurrentSystemVersionIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(8);
        management.Setup(item => item.GetDraftTemplateJsonAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(template);
        management.Setup(item => item.GetAttackOutcomeCodesAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO", "GOLPE_ARCANO"]);
        GameModeVersion? saved = null;
        management.Setup(item => item.AddAsync(It.IsAny<GameModeVersion>(), It.IsAny<CancellationToken>()))
            .Callback<GameModeVersion, CancellationToken>((mode, _) => saved = mode)
            .Returns(Task.CompletedTask);
        var service = new GameModeManagementService(management.Object, runs.Object,
            new Mock<ISistemaRpgRepository>().Object, new GameplayActionResolver());

        var result = await service.CreateDraftAsync(null, CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(GameModeVersionStatus.Rascunho, saved!.Status);
        Assert.Equal(8, saved.IdSistemaVersao);
        Assert.Equal(0, result.Dados!.PlayerDamageByResult["GOLPE_ARCANO"].Multiplier);
        Assert.Equal(0, result.Dados.Encounters["A"].DamageByResult!["GOLPE_ARCANO"]);
        Assert.Equal(2, result.Dados.Areas.Count);
        Assert.All(result.Dados.Areas[^1].Options, option => Assert.Equal("BOSS", option.Type));
    }

    [Fact]
    public async Task PublicarPermiteEliteEChefeNaMesmaAreaComChefeComoFim()
    {
        GameBattleEncounterConfig encounter = new()
        {
            MapName = "Encontro",
            Enemy = new GameBattlePreviewEnemy
            {
                Name = "Inimigo", MaxVida = 30,
                Attributes = new Dictionary<string, int>(),
                Actions = [],
            },
            DamageByResult = new Dictionary<string, int> { ["ACERTO"] = 5 },
        };
        GameModeVersion draft = new()
        {
            IdGameModeVersion = 40, IdSistemaVersao = 7,
            NumeroVersao = "0.4.5", Status = GameModeVersionStatus.Rascunho,
            ConfiguracaoJson = JsonSerializer.Serialize(new
            {
                map = new { schemaVersion = 4 },
                areas = new[] { new GameModeAreaDto
                {
                    Code = "F1", Name = "Arena", BaseName = "Base", NodeCount = 21, FinalOption = "ROTA:1",
                    Options =
                    [
                        new() { Type = "ELITE", EncounterCode = "ELITE" },
                        new() { Type = "BOSS", EncounterCode = "CHEFE" },
                    ],
                } },
                encounters = new Dictionary<string, GameBattleEncounterConfig>
                {
                    ["ELITE"] = encounter, ["CHEFE"] = encounter,
                },
                previewFallbackAction = new GameBattleFallbackAction { Name = "Ataque", BaseDamage = 5 },
                previewPlayerDamageByResult = new Dictionary<string, GameBattleDamageModifier>
                {
                    ["ACERTO"] = new() { Multiplier = 1, Bonus = 0 },
                },
            }, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
        };
        Mock<IGameModeManagementRepository> management = new();
        management.Setup(item => item.GetDraftByIdAsync(40, It.IsAny<CancellationToken>()))
            .ReturnsAsync(draft);
        management.Setup(item => item.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO"]);
        Mock<ISistemaRpgRepository> systems = new();
        systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(new SistemaVersao
        {
            IdSistemaVersao = 7,
        });
        var service = new GameModeManagementService(management.Object,
            new Mock<IGameRunRepository>().Object, systems.Object, new GameplayActionResolver());

        var result = await service.PublishAsync(40, CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(GameModeVersionStatus.Publicado, draft.Status);
        Assert.Equal(5, result.Dados!.MapSchemaVersion);
        Assert.Equal("ROTA:1", Assert.Single(result.Dados.Areas).FinalOption);
        Assert.Equal(21, result.Dados.Areas[0].NodeCount);
    }

    [Fact]
    public async Task PublicarCongelaAtributosReaisDoNpcSelecionado()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var areas = new[]
        {
            new GameModeAreaDto
            {
                Code = "FINAL", Name = "Arena", BaseName = "Base",
                Options =
                [
                    new() { Type = "COMBATE", EncounterCode = "A" },
                    new() { Type = "COMBATE", EncounterCode = "B" },
                    new() { Type = "ELITE", EncounterCode = "A" },
                ],
            },
        };
        var encounters = new Dictionary<string, GameBattleEncounterConfig>
        {
            ["A"] = Encounter("Primeiro"), ["B"] = Encounter("Segundo"),
        };
        GameModeVersion draft = new()
        {
            IdGameModeVersion = 30, IdSistemaVersao = 7,
            NumeroVersao = "0.4.0", Status = GameModeVersionStatus.Rascunho,
            ConfiguracaoJson = JsonSerializer.Serialize(new
            {
                areas, encounters,
                previewFallbackAction = new GameBattleFallbackAction
                {
                    Name = "Ataque", BaseDamage = 5, AttributeCode = "forca",
                },
                previewPlayerDamageByResult = new Dictionary<string, GameBattleDamageModifier>
                {
                    ["ACERTO"] = new() { Multiplier = 1, Bonus = 0 },
                },
            }, options),
        };
        Personagen npc = new()
        {
            Idpersonagem = 42, Nome = "Guardião", Idraca = 1,
            InventarioJson = """[{"id":"blade","nome":"Espada","tipo":"arma","atributos":{"tipoArma":"espada","danoBase":18}}]""",
            StatusJson = """
                {"status":{"vida":30,"vidaMaxima":50,"manaMaxima":10,"estaminaMaxima":20},
                 "atributos":{"principais":{"forca":4},"secundarios":{"coragem":2}},
                 "defesas":{"armadura":3}}
                """,
        };
        Mock<IGameModeManagementRepository> management = new();
        Mock<IGameRunRepository> runs = new();
        management.Setup(item => item.GetCurrentSystemVersionIdAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(7);
        management.Setup(item => item.GetAttackOutcomeCodesAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["ACERTO"]);
        management.Setup(item => item.GetDraftByIdAsync(30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(draft);
        management.Setup(item => item.GetNpcAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(npc);
        Mock<ISistemaRpgRepository> systems = new();
        systems.Setup(item => item.GetVersionAsync(7, true, false)).ReturnsAsync(new SistemaVersao
        {
            IdSistemaVersao = 7,
            SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Odisseia" },
            ResultadosDado = new List<SistemaResultadoDado>
            {
                new() { CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum",
                    Dado = "D20", QuantidadeDados = 1, CodigoResultado = "ACERTO",
                    NomeResultado = "Acerto", ResultadoMinimo = 1, ResultadoMaximo = 20 },
            },
        });
        var service = new GameModeManagementService(management.Object, runs.Object,
            systems.Object, new GameplayActionResolver());

        var result = await service.PublishAsync(30, CancellationToken.None);

        Assert.True(result.Sucesso, result.Mensagem);
        Assert.Equal(GameModeVersionStatus.Publicado, draft.Status);
        GameBattlePreviewEnemy enemy = result.Dados!.Encounters["A"].Enemy!;
        Assert.Equal(50, enemy.MaxVida);
        Assert.Equal(4, enemy.Attributes["forca"]);
        Assert.Equal(2, enemy.Attributes["coragem"]);
        Assert.Equal(3, enemy.Defesa);
        Assert.Contains("blade", enemy.InventarioJson);
        Assert.Equal("blade", Assert.Single(enemy.Actions).IdInstancia);
        Assert.Equal("Guardião", enemy.Name);
        management.Verify(item => item.SaveAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static GameBattleEncounterConfig Encounter(string name) => new()
    {
        MapName = name,
        Enemy = new GameBattlePreviewEnemy
        {
            NpcId = 42, Name = "Guardião", MaxVida = 1,
            AttackAttributeCode = "forca",
            Actions = [new GameRunActionSelectionDto { Tipo = "ITEM", IdInstancia = "blade" }],
        },
        DamageByResult = new Dictionary<string, int> { ["ACERTO"] = 5 },
    };
}
