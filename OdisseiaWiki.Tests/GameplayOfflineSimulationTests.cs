using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayOfflineSimulationTests
{
    [Fact]
    public async Task SimulateAsync_OfflineGenerico_RolaSemPersistir()
    {
        var fixture = new Fixture();
        fixture.Dice.Setup(dice => dice.Roll(1, 6)).Returns(new[] { 4 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("TESTE_GENERICO"));

        Assert.True(result.Sucesso);
        Assert.NotNull(result.Dados);
        Assert.True(result.Dados.Simulacao);
        Assert.Equal("SUCESSO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal(4, result.Dados.Rolagem.Total);
        Assert.Equal(GameplayRollMode.Normal, result.Dados.Rolagem.Modo);
        Assert.Equal(4, result.Dados.Rolagem.Dificuldade?.Alvo);
        Assert.Equal("ROLAGEM_GENERICA", result.Dados.Rolagem.OrigemAcao?.Tipo);
        Assert.Contains(result.Dados.Rolagem.Avisos, notice => notice.Fallback);
        fixture.Repository.Verify(repo => repo.GetSystemVersionAsync(42, It.IsAny<CancellationToken>()), Times.Once);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_OfflineAtributo_UsaValorDaFichaSemPersistir()
    {
        var fixture = new Fixture();
        fixture.Dice.Setup(dice => dice.Roll(1, 6)).Returns(new[] { 5 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("ATRIBUTO_PRINCIPAL", "forca"));

        Assert.True(result.Sucesso);
        Assert.Equal(2, result.Dados!.Rolagem.Modificador);
        Assert.Equal(7, result.Dados.Rolagem.Total);
        Assert.Equal("SUCESSO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal(7, result.Dados.Rolagem.Dificuldade?.Alvo);
        Assert.Equal("ATRIBUTO", result.Dados.Rolagem.OrigemAcao?.Tipo);
        Assert.Equal(7, result.Dados.Rolagem.OrigemAcao?.IdPersonagemJogador);
        Assert.Equal("2", result.Dados.Rolagem.OrigemAcao?.Valores["valor"]);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_OfflineXp_CalculaSemConcederOuPersistir()
    {
        var fixture = new Fixture();
        fixture.Version.FontesExperiencia.Add(new SistemaFonteExperiencia
        {
            Codigo = "BOSS",
            Nome = "Boss",
            TipoTeste = "D4",
            Formula = "1D4",
            ValorMinimo = 1,
            ValorMaximo = 4,
            UsaVantagem = false,
        });
        fixture.Dice.Setup(dice => dice.Roll(1, 4)).Returns(new[] { 3 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("XP_BOSS"));

        Assert.True(result.Sucesso);
        Assert.Equal(3, result.Dados!.Rolagem.ValorAssociado);
        Assert.Equal("XP_CALCULADO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal("FONTE_XP", result.Dados.Rolagem.OrigemAcao?.Tipo);
        Assert.Equal("BOSS", result.Dados.Rolagem.OrigemAcao?.Codigo);
        Assert.Contains(result.Dados.Rolagem.EfeitosPropostos, effect =>
            effect.Codigo == "APLICAR_XP" && effect.Valor == 3 && effect.Alvo == "AUTOR");
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_XpLegadoComVantagem_RolaSomenteOsDoisDadosDescritos()
    {
        var fixture = new Fixture();
        fixture.Version.FontesExperiencia.Add(new SistemaFonteExperiencia
        {
            Codigo = "MINI_BOSS",
            Nome = "Combate com mini boss",
            TipoTeste = "D4 por paridade",
            Formula = "2D4, manter o melhor; ímpar = 1 XP, par = 2 XP",
            ValorMinimo = 1,
            ValorMaximo = 2,
            UsaVantagem = true,
        });
        fixture.Dice.Setup(dice => dice.Roll(2, 4)).Returns(new[] { 1, 3 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("XP_MINIBOSS"));

        Assert.True(result.Sucesso);
        GameplayDiceGroupResultDto group = Assert.Single(result.Dados!.Rolagem.Grupos);
        Assert.Equal(new[] { 1, 3 }, group.Valores);
        Assert.Equal(new[] { 1 }, group.IndicesMantidos);
        Assert.Equal(new[] { 0 }, group.IndicesDescartados);
        Assert.Equal(3, result.Dados.Rolagem.ValorNatural);
        fixture.Dice.Verify(dice => dice.Roll(2, 4), Times.Once);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task GetActionCatalogAsync_UsesPublishedAttributesAndXpSources()
    {
        var fixture = new Fixture();
        fixture.Version.Atributos.Add(new SistemaAtributoConfig
        {
            CodigoAtributo = "PRESENCA",
            Nome = "Presença",
            Grupo = SistemaAtributoGrupo.Secundario,
            FormulaTeste = "1D10 + atributo >= 12",
            Ativo = true,
        });
        fixture.Version.FontesExperiencia.Add(new SistemaFonteExperiencia
        {
            Codigo = "DESCOBERTA",
            Nome = "Descoberta",
            Formula = "1D4",
            ValorMinimo = 1,
            ValorMaximo = 4,
        });

        GameplayOperationResult<GameplayActionCatalogDto> result = await fixture.Service.GetActionCatalogAsync(
            fixture.Character.IdpersonagemJogador,
            fixture.Character.Idusuario);

        Assert.True(result.Sucesso);
        Assert.Equal(fixture.Version.IdSistemaVersao, result.Dados!.IdSistemaVersao);
        Assert.Contains(result.Dados.Acoes, action =>
            action.Tipo == "ATRIBUTO" && action.CodigoAtributo == "PRESENCA" && action.Executavel);
        Assert.Contains(result.Dados.Acoes, action =>
            action.Codigo == "XP_DESCOBERTA" && action.Executavel);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_SistemaPersonalizado_UsaFormulaPublicadaDoAtributo()
    {
        var fixture = new Fixture();
        fixture.Version.SistemaRpg.Codigo = "SISTEMA_CUSTOM";
        fixture.Version.Atributos.Add(new SistemaAtributoConfig
        {
            CodigoAtributo = "FORCA",
            Nome = "Força",
            Grupo = SistemaAtributoGrupo.Principal,
            ValorMinimo = 0,
            ValorMaximoNatural = 10,
            ValorMaximoAbsoluto = 20,
            FormulaTeste = "1D10 + atributo >= 12",
            Ativo = true,
        });
        fixture.Dice.Setup(dice => dice.Roll(1, 10)).Returns(new[] { 10 });

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("ATRIBUTO_PRINCIPAL", "forca"));

        Assert.True(result.Sucesso);
        Assert.Equal(12, result.Dados!.Rolagem.Total);
        Assert.Equal("SUCESSO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal(12, result.Dados.Rolagem.Dificuldade?.Alvo);
        Assert.DoesNotContain(result.Dados.Rolagem.Avisos, notice => notice.Fallback);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_Arma_ResolveFichaAcessoriosERegraDoSistema()
    {
        var fixture = new Fixture();
        fixture.Character.StatusJson = """{"atributos":{"principais":{"forca":2},"secundarios":{"precisao":2}}}""";
        fixture.Character.InventarioJson = """
            [{
              "id":"arma-1",
              "idItemBase":"arma-base",
              "nome":"Rifle de teste",
              "tipo":"arma",
              "atributos":{
                "tipoArma":"rifle_assalto",
                "modoModificadores":"distancia",
                "cadencia":3,
                "danoPorAlcance":{"longa":12},
                "gastoEstaminaPorAtaque":4,
                "modificadores":{"longa":-1},
                "acessorios":[{
                  "idItemBase":"mira-1",
                  "nome":"Mira longa",
                  "atributos":{"compatibilidade":"distancia","modificadores":{"longa":3,"dano":100}}
                }],
                "teste":{"codigoTeste":"ATAQUE_COMUM","codigoAtributo":"PRECISAO","grupoAtributo":"Secundario","usaTotalParaFaixas":true}
              }
            }]
            """;
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM",
            NomeTeste = "Ataque comum",
            Dado = "D20",
            QuantidadeDados = 1,
            ResultadoMinimo = 1,
            ResultadoMaximo = 10,
            CodigoResultado = "FALHA",
            NomeResultado = "Falha",
            Ordem = 1,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM",
            NomeTeste = "Ataque comum",
            Dado = "D20",
            QuantidadeDados = 1,
            ResultadoMinimo = 11,
            ResultadoMaximo = 30,
            CodigoResultado = "ACERTO",
            NomeResultado = "Acerto",
            Ordem = 2,
        });
        fixture.Dice.Setup(dice => dice.Roll(1, 20)).Returns(new[] { 10 });
        GameplayRollRequestDto request = Request("ACAO_FICHA");
        request.ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "ITEM", IdInstancia = "arma-1" };
        request.ParametrosAcao = new GameplayActionParametersDto
        {
            Operacao = "ATACAR",
            Alcance = "LONGA",
            ModoDisparo = "RAJADA",
            Quantidade = 2,
        };

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, request);

        Assert.True(result.Sucesso);
        Assert.Equal(28, result.Dados!.Rolagem.Total);
        Assert.Equal("ACOES_MULTIPLAS_RESOLVIDAS", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal("2 de 2 acertos", result.Dados.Rolagem.NomeResultado);
        Assert.Equal(2, result.Dados.Rolagem.RolagensIndividuais.Count);
        Assert.All(result.Dados.Rolagem.RolagensIndividuais, roll => Assert.Equal("ACERTO", roll.CodigoResultado));
        Assert.Equal("arma-1", result.Dados.Rolagem.OrigemAcao?.IdInstancia);
        Assert.Equal("LONGA", result.Dados.Rolagem.OrigemAcao?.Valores["alcance"]);
        Assert.Equal("112", result.Dados.Rolagem.OrigemAcao?.Valores["danoPorAcertoProposto"]);
        Assert.Equal("mira-1:Mira longa", result.Dados.Rolagem.OrigemAcao?.Valores["acessoriosAplicados"]);
        Assert.Contains(result.Dados.Rolagem.Modificadores, modifier => modifier.Origem == "ARMA" && modifier.Valor == -1);
        Assert.Contains(result.Dados.Rolagem.Modificadores, modifier => modifier.Origem == "ACESSORIO" && modifier.Valor == 3);
        Assert.Contains(result.Dados.Rolagem.EfeitosPropostos, effect =>
            effect.Codigo == "APLICAR_DANO" && effect.Valor == 224 && effect.ExigeAlvo);
        Assert.Contains(result.Dados.Rolagem.EfeitosPropostos, effect =>
            effect.Codigo == "APLICAR_CUSTO_ESTAMINA" && effect.Valor == 8);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_Skill_ComTestePublicado_ResolvePelaFicha()
    {
        var fixture = new Fixture();
        fixture.Character.Skills = """
            [{
              "id":"skill-1",
              "nome":"Golpe preciso",
              "atributos":{
                "teste":{"codigoTeste":"PODER","codigoAtributo":"FORCA","grupoAtributo":"Principal","usaTotalParaFaixas":true}
              }
            }]
            """;
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "PODER",
            NomeTeste = "Poder",
            Dado = "D6",
            QuantidadeDados = 1,
            ResultadoMinimo = 1,
            ResultadoMaximo = 3,
            CodigoResultado = "FALHA",
            NomeResultado = "Falha",
            Ordem = 1,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "PODER",
            NomeTeste = "Poder",
            Dado = "D6",
            QuantidadeDados = 1,
            ResultadoMinimo = 4,
            ResultadoMaximo = 8,
            CodigoResultado = "SUCESSO",
            NomeResultado = "Sucesso",
            Ordem = 2,
        });
        fixture.Dice.Setup(dice => dice.Roll(1, 6)).Returns(new[] { 3 });
        GameplayRollRequestDto request = Request("ACAO_FICHA");
        request.ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "SKILL", IdInstancia = "skill-1" };

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, request);

        Assert.True(result.Sucesso);
        Assert.Equal(5, result.Dados!.Rolagem.Total);
        Assert.Equal("SUCESSO", result.Dados.Rolagem.CodigoResultado);
        Assert.Equal("SKILL", result.Dados.Rolagem.OrigemAcao?.Tipo);
        Assert.Equal("skill-1", result.Dados.Rolagem.OrigemAcao?.IdInstancia);
        Assert.Equal("PODER", result.Dados.Rolagem.OrigemAcao?.Codigo);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_ResultadoNatural_TemPrioridadeSobreTotalModificado()
    {
        var fixture = new Fixture();
        fixture.Character.StatusJson = """{"atributos":{"principais":{"forca":-6}}}""";
        fixture.Character.Skills = """
            [{
              "id":"skill-critica",
              "nome":"Golpe arriscado",
              "atributos":{
                "teste":{"codigoTeste":"ATAQUE_COMUM","codigoAtributo":"FORCA","grupoAtributo":"Principal","usaTotalParaFaixas":true}
              }
            }]
            """;
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 1, ResultadoMaximo = 1, ExigeNatural = true,
            CodigoResultado = "FALHA_CRITICA", NomeResultado = "Falha crítica", Ordem = 1,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 2, ResultadoMaximo = 10,
            CodigoResultado = "ERRO", NomeResultado = "Erro", Ordem = 2,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 11, ResultadoMaximo = 17,
            CodigoResultado = "ACERTO", NomeResultado = "Acerto", Ordem = 3,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 18, ResultadoMaximo = 19,
            CodigoResultado = "ACERTO_PRECISO", NomeResultado = "Acerto preciso", Ordem = 4,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque comum", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 20, ResultadoMaximo = 20, ExigeNatural = true,
            CodigoResultado = "CRITICO", NomeResultado = "Crítico", Ordem = 5,
        });
        fixture.Dice.Setup(dice => dice.Roll(1, 20)).Returns(new[] { 20 });
        GameplayRollRequestDto request = Request("ACAO_FICHA");
        request.ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "SKILL", IdInstancia = "skill-critica" };

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, request);

        Assert.True(result.Sucesso);
        Assert.Equal(14, result.Dados!.Rolagem.Total);
        Assert.Equal("CRITICO", result.Dados.Rolagem.CodigoResultado);
        Assert.True(result.Dados.Rolagem.CriticoNatural);
        Assert.False(result.Dados.Rolagem.FalhaCriticaNatural);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_MagiaSemTeste_NaoInventaRolagem()
    {
        var fixture = new Fixture();
        fixture.Character.Magia = """[{"id":"magia-1","nome":"Luz narrativa","atributos":{"efeito":"Ilumina"}}]""";
        GameplayRollRequestDto request = Request("ACAO_FICHA");
        request.ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "MAGIA", IdInstancia = "magia-1" };

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, request);

        Assert.False(result.Sucesso);
        Assert.Equal("PODER_SEM_TESTE", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_AtaquePreciso_ExigeNaturalEMantemAcertoComTotalModificado()
    {
        var fixture = new Fixture();
        fixture.Character.StatusJson = """{"atributos":{"principais":{"forca":5}}}""";
        fixture.Character.Skills = """
            [{
              "id":"skill-precisa",
              "nome":"Ataque",
              "atributos":{"teste":{"codigoTeste":"ATAQUE_COMUM","codigoAtributo":"FORCA","grupoAtributo":"Principal","usaTotalParaFaixas":true}}
            }]
            """;
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 2, ResultadoMaximo = 10, CodigoResultado = "ERRO", NomeResultado = "Erro", Ordem = 1,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 11, ResultadoMaximo = 17, CodigoResultado = "ACERTO", NomeResultado = "Acerto", Ordem = 2,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 18, ResultadoMaximo = 19, CodigoResultado = "ATAQUE_PRECISO", NomeResultado = "Ataque preciso", Ordem = 3,
        });
        fixture.Version.ResultadosDado.Add(new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM", NomeTeste = "Ataque", Dado = "D20", QuantidadeDados = 1,
            ResultadoMinimo = 20, ResultadoMaximo = 20, CodigoResultado = "CRITICO", NomeResultado = "Crítico", Ordem = 4,
        });
        fixture.Dice.Setup(dice => dice.Roll(1, 20)).Returns(new[] { 13 });
        GameplayRollRequestDto request = Request("ACAO_FICHA");
        request.ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "SKILL", IdInstancia = "skill-precisa" };

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(7, 12, request);

        Assert.True(result.Sucesso);
        Assert.Equal(18, result.Dados!.Rolagem.Total);
        Assert.Equal("ACERTO", result.Dados.Rolagem.CodigoResultado);
        Assert.False(result.Dados.Rolagem.CriticoNatural);
        Assert.DoesNotContain(result.Dados.Rolagem.Avisos, notice => notice.Codigo == "TABELA_RESULTADO_INCOMPLETA");
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_ItemComumSemOptIn_NaoAplicaTeste()
    {
        var fixture = new Fixture();
        fixture.Character.InventarioJson = """[{"id":"item-1","nome":"Corda","tipo":"outro","atributos":{}}]""";
        GameplayRollRequestDto request = Request("ACAO_FICHA");
        request.ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "ITEM", IdInstancia = "item-1" };

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, request);

        Assert.False(result.Sucesso);
        Assert.Equal("ITEM_NAO_APLICA_TESTE", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_ArmaComTesteDesativado_RespeitaConfiguracaoDoMestre()
    {
        var fixture = new Fixture();
        fixture.Character.InventarioJson = """[{"id":"arma-1","nome":"Arma cerimonial","tipo":"arma","atributos":{"aplicaTeste":false,"tipoArma":"espada"}}]""";
        GameplayRollRequestDto request = Request("ACAO_FICHA");
        request.ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "ITEM", IdInstancia = "arma-1" };

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, request);

        Assert.False(result.Sucesso);
        Assert.Equal("ITEM_NAO_APLICA_TESTE", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task FavoriteRollsAsync_SalvaEReabreConfiguracaoDoPersonagem()
    {
        var fixture = new Fixture();
        GameplayFavoriteRollUpsertDto request = new()
        {
            TipoOrigem = "ATRIBUTO",
            IdOrigem = "PRINCIPAL:FORCA",
            Nome = "Força",
            Configuracao = new GameplayFavoriteRollConfigurationDto
            {
                CodigoAcao = "ATRIBUTO_PRINCIPAL",
                CodigoAtributo = "forca",
                Grupos = [new GameplayDiceGroupRequestDto { Quantidade = 1, Faces = 6 }],
                Modo = GameplayRollMode.Vantagem,
                Visibilidade = GameplayEventVisibility.PublicaMesa,
            },
        };

        GameplayOperationResult<GameplayFavoriteRollDto> saved = await fixture.Service.UpsertFavoriteRollAsync(
            7, 12, request);
        GameplayOperationResult<IReadOnlyCollection<GameplayFavoriteRollDto>> reopened =
            await fixture.Service.GetFavoriteRollsAsync(7, 12);

        Assert.True(saved.Sucesso);
        Assert.True(reopened.Sucesso);
        GameplayFavoriteRollDto favorite = Assert.Single(reopened.Dados!);
        Assert.Equal(saved.Dados!.IdFavorito, favorite.IdFavorito);
        Assert.Equal("FORCA", favorite.Configuracao.CodigoAtributo);
        Assert.Equal(GameplayRollMode.Vantagem, favorite.Configuracao.Modo);
        Assert.Contains("PRINCIPAL:FORCA", fixture.Character.RolagensFavoritasJson);
        fixture.Repository.Verify(repo => repo.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteFavoriteRollAsync_RemoveSomenteAPreferencia()
    {
        var fixture = new Fixture();
        GameplayOperationResult<GameplayFavoriteRollDto> saved = await fixture.Service.UpsertFavoriteRollAsync(
            7,
            12,
            new GameplayFavoriteRollUpsertDto
            {
                TipoOrigem = "ITEM",
                IdOrigem = "arma-1",
                Nome = "Aquila",
                Configuracao = new GameplayFavoriteRollConfigurationDto
                {
                    CodigoAcao = "ACAO_FICHA",
                    Grupos = [],
                    ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "ITEM", IdInstancia = "arma-1" },
                },
            });

        GameplayOperationResult<bool> removed = await fixture.Service.DeleteFavoriteRollAsync(
            7, saved.Dados!.IdFavorito, 12);

        Assert.True(removed.Sucesso);
        Assert.Null(fixture.Character.RolagensFavoritasJson);
        fixture.Repository.Verify(repo => repo.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        fixture.Repository.Verify(repo => repo.AddEvent(It.IsAny<MesaEvento>()), Times.Never);
        fixture.Repository.Verify(repo => repo.AddRoll(It.IsAny<MesaRolagem>()), Times.Never);
    }

    [Fact]
    public async Task SimulateAsync_OutroUsuario_NaoRola()
    {
        var fixture = new Fixture();

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 13, Request("TESTE_GENERICO"));

        Assert.False(result.Sucesso);
        Assert.Equal(GameplayOperationError.Proibido, result.Erro);
        Assert.Equal("PERSONAGEM_SEM_CONTROLE", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.Repository.Verify(repo => repo.GetMesaAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_SessaoAtiva_ExigeRolagemOficial()
    {
        var fixture = new Fixture();
        fixture.Mesa.IdMesaSessaoAtiva = 55;

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("TESTE_GENERICO"));

        Assert.False(result.Sucesso);
        Assert.Equal("SESSAO_ATIVA", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    [Fact]
    public async Task SimulateAsync_OutroSistema_NaoInventarRegraDeAtributo()
    {
        var fixture = new Fixture();
        fixture.Version.SistemaRpg.Codigo = "OUTRO_SISTEMA";

        GameplayOperationResult<GameplaySimulationResponseDto> result = await fixture.Service.SimulateAsync(
            7, 12, Request("ATRIBUTO_PRINCIPAL", "forca"));

        Assert.False(result.Sucesso);
        Assert.Equal("REGRA_NAO_ESTRUTURADA", result.Codigo);
        fixture.Dice.VerifyNoOtherCalls();
        fixture.AssertReadOnly();
    }

    private static GameplayRollRequestDto Request(string action, string? attribute = null) => new()
    {
        ChaveIdempotencia = Guid.NewGuid(),
        CodigoAcao = action,
        IdPersonagemJogador = 7,
        CodigoAtributo = attribute,
    };

    private sealed class Fixture
    {
        public Mock<IGameplayEngineRepository> Repository { get; } = new();
        public Mock<IDiceRoller> Dice { get; } = new();
        public PersonagemJogador Character { get; } = new()
        {
            IdpersonagemJogador = 7,
            Idmesa = 3,
            Idusuario = 12,
            StatusJson = """{"atributos":{"principais":{"forca":2}}}""",
        };
        public Mesa Mesa { get; } = new()
        {
            Idmesa = 3,
            Nome = "Mesa de teste",
            IdSistemaVersao = 42,
        };
        public SistemaVersao Version { get; } = new()
        {
            IdSistemaVersao = 42,
            NumeroVersao = "1.0",
            SistemaRpg = new SistemaRpg { Codigo = "ODISSEIA", Nome = "Odisseia" },
        };
        public GameplayEngineService Service { get; }

        public Fixture()
        {
            Repository.Setup(repo => repo.GetCharacterAsync(7, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Character);
            Repository.Setup(repo => repo.GetCharacterForUpdateAsync(7, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Character);
            Repository.Setup(repo => repo.CanAccessTableAsync(3, 12, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
            Repository.Setup(repo => repo.GetMesaAsync(3, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Mesa);
            Repository.Setup(repo => repo.GetSystemVersionAsync(42, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Version);

            Service = new GameplayEngineService(
                Repository.Object,
                new GameplayRollEvaluator(Dice.Object),
                new GameplayActionResolver(),
                Mock.Of<IGameplayCursorCodec>(),
                Mock.Of<IGameplayCommandRateLimiter>(),
                Mock.Of<IMesaRealtimeNotifier>());
        }

        public void AssertReadOnly()
        {
            Repository.Verify(repo => repo.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
            Repository.Verify(repo => repo.AddSession(It.IsAny<MesaSessao>()), Times.Never);
            Repository.Verify(repo => repo.AddCommand(It.IsAny<MesaComando>()), Times.Never);
            Repository.Verify(repo => repo.AddEvent(It.IsAny<MesaEvento>()), Times.Never);
            Repository.Verify(repo => repo.AddRoll(It.IsAny<MesaRolagem>()), Times.Never);
        }
    }
}
