using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaRpgRuntimeTests
{
    [Theory]
    [InlineData(SistemaVersaoStatus.Publicado)]
    [InlineData(SistemaVersaoStatus.Arquivado)]
    public async Task ResolverContextoAsync_MesaMantemVersaoHistoricaNaoRascunho(
        SistemaVersaoStatus status)
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(42, status);
        repository.Setup(item => item.GetMesaAsync(7, false))
            .ReturnsAsync(new Mesa { Idmesa = 7, IdSistemaVersao = 42 });
        repository.Setup(item => item.GetVersionAsync(42, true, false)).ReturnsAsync(versao);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto { IdMesa = 7 });

        Assert.Equal(SistemaRuntimeOrigem.Mesa, resultado.Origem);
        Assert.Equal(42, resultado.IdSistemaVersao);
        Assert.Equal(status, resultado.StatusVersao);
        Assert.False(resultado.AcompanhaPublicacaoAtual);
        Assert.False(resultado.UsaFallbackLegado);
    }

    [Fact]
    public async Task ResolverContextoAsync_MesaPadraoAcompanhaPublicacaoAtual()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao arquivada = NovaVersao(10, SistemaVersaoStatus.Arquivado);
        SistemaVersao publicada = NovaVersao(20, SistemaVersaoStatus.Publicado);
        repository.Setup(item => item.GetMesaAsync(7, false))
            .ReturnsAsync(new Mesa
            {
                Idmesa = 7,
                Nome = "Odisseia",
                CodigoSistema = "ODISSEIA_PADRAO",
                PadraoSistema = true,
                IdSistemaVersao = arquivada.IdSistemaVersao,
            });
        repository.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(item => item.GetVersionAsync(20, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto { IdMesa = 7 });

        Assert.Equal(SistemaRuntimeOrigem.Mesa, resultado.Origem);
        Assert.Equal(20, resultado.IdSistemaVersao);
        Assert.True(resultado.AcompanhaPublicacaoAtual);
        Assert.Null(resultado.IdVersaoFixada);
        Assert.False(resultado.UsaFallbackLegado);
    }

    [Fact]
    public async Task ResolverContextoAsync_PersonagemJogadorNaoConsideraRascunhoComoAtualizacao()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(13, SistemaVersaoStatus.Publicado);
        publicada.NumeroVersao = "1.3";
        Mesa mesa = new()
        {
            Idmesa = 7,
            Nome = "Odisseia",
            CodigoSistema = "ODISSEIA_PADRAO",
            PadraoSistema = true,
            IdSistemaVersao = publicada.IdSistemaVersao,
        };
        repository.Setup(item => item.GetPlayerCharacterAsync(9, false))
            .ReturnsAsync(new PersonagemJogador
            {
                IdpersonagemJogador = 9,
                Idmesa = 7,
                IdSistemaVersao = publicada.IdSistemaVersao,
                Mesa = mesa,
            });
        repository.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(item => item.GetVersionAsync(13, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto { IdPersonagemJogador = 9 });

        Assert.Equal("1.3", resultado.NumeroVersao);
        Assert.False(resultado.AtualizacaoDisponivel);
        Assert.Equal(SistemaRuntimeOrigem.VersaoFixadaPersonagemJogador, resultado.Origem);
    }

    [Fact]
    public async Task ResolverContextoAsync_PersonagemJogadorPermaneceFixadoAteAtualizacaoManual()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao fixada = NovaVersao(13, SistemaVersaoStatus.Arquivado);
        fixada.NumeroVersao = "1.3";
        SistemaVersao publicada = NovaVersao(14, SistemaVersaoStatus.Publicado);
        publicada.NumeroVersao = "1.4";
        Mesa mesa = new()
        {
            Idmesa = 7,
            Nome = "Odisseia",
            CodigoSistema = "ODISSEIA_PADRAO",
            PadraoSistema = true,
            IdSistemaVersao = publicada.IdSistemaVersao,
        };
        repository.Setup(item => item.GetPlayerCharacterAsync(9, false))
            .ReturnsAsync(new PersonagemJogador
            {
                IdpersonagemJogador = 9,
                Idmesa = 7,
                IdSistemaVersao = fixada.IdSistemaVersao,
                Mesa = mesa,
            });
        repository.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(item => item.GetVersionAsync(13, true, false)).ReturnsAsync(fixada);
        repository.Setup(item => item.GetVersionAsync(14, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto { IdPersonagemJogador = 9 });

        Assert.Equal("1.3", resultado.NumeroVersao);
        Assert.True(resultado.AtualizacaoDisponivel);
        Assert.Equal(14, resultado.IdVersaoDisponivel);
        Assert.Equal("1.4", resultado.NumeroVersaoDisponivel);
    }

    [Fact]
    public async Task ResolverContextoAsync_NpcPodeAcompanharPublicacaoAtual()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(20, SistemaVersaoStatus.Publicado, idSistema: 2);
        SistemaRpg sistema = publicada.SistemaRpg;
        SistemaEntidadeGlobalVinculoSnapshot vinculo = new()
        {
            TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
            IdEntidade = "9",
            IdSistemaRpg = 2,
            AcompanharPublicacaoAtual = true,
        };
        repository.Setup(item => item.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Npc, "9"))
            .ReturnsAsync(vinculo);
        repository.Setup(item => item.GetByIdAsync(2, false)).ReturnsAsync(sistema);
        repository.Setup(item => item.GetVersionAsync(20, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                IdEntidade = "9",
            });

        Assert.Equal(SistemaRuntimeOrigem.PublicacaoAtualEntidade, resultado.Origem);
        Assert.True(resultado.AcompanhaPublicacaoAtual);
        Assert.Null(resultado.IdVersaoFixada);
        Assert.Equal(20, resultado.IdSistemaVersao);
    }

    [Fact]
    public async Task ResolverContextoAsync_NpcPodeManterVersaoArquivadaFixada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao arquivada = NovaVersao(15, SistemaVersaoStatus.Arquivado, idSistema: 2);
        SistemaEntidadeGlobalVinculoSnapshot vinculo = new()
        {
            TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
            IdEntidade = "9",
            IdSistemaRpg = 2,
            IdSistemaVersao = 15,
            AcompanharPublicacaoAtual = false,
        };
        repository.Setup(item => item.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Npc, "9"))
            .ReturnsAsync(vinculo);
        repository.Setup(item => item.GetVersionAsync(15, true, false)).ReturnsAsync(arquivada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                IdEntidade = "9",
            });

        Assert.Equal(SistemaRuntimeOrigem.VersaoFixadaEntidade, resultado.Origem);
        Assert.Equal(15, resultado.IdVersaoFixada);
        Assert.Equal(SistemaVersaoStatus.Arquivado, resultado.StatusVersao);
    }

    [Fact]
    public async Task ResolverContextoAsync_ItemPodeAcompanharPublicacaoAtual()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(20, SistemaVersaoStatus.Publicado, idSistema: 2);
        repository.Setup(item => item.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Item, "item-9"))
            .ReturnsAsync(new SistemaEntidadeGlobalVinculoSnapshot
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Item,
                IdEntidade = "item-9",
                IdSistemaRpg = 2,
                AcompanharPublicacaoAtual = true,
            });
        repository.Setup(item => item.GetByIdAsync(2, false)).ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(item => item.GetVersionAsync(20, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Item,
                IdEntidade = "item-9",
            });

        Assert.Equal(SistemaRuntimeOrigem.PublicacaoAtualEntidade, resultado.Origem);
        Assert.True(resultado.AcompanhaPublicacaoAtual);
        Assert.Equal(20, resultado.IdSistemaVersao);
    }

    [Fact]
    public async Task ResolverContextoAsync_ItemPodeUsarVersaoPublicadaFixada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(18, SistemaVersaoStatus.Publicado, idSistema: 2);
        repository.Setup(item => item.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Item, "item-9"))
            .ReturnsAsync(new SistemaEntidadeGlobalVinculoSnapshot
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Item,
                IdEntidade = "item-9",
                IdSistemaRpg = 2,
                IdSistemaVersao = 18,
                AcompanharPublicacaoAtual = false,
            });
        repository.Setup(item => item.GetVersionAsync(18, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Item,
                IdEntidade = "item-9",
            });

        Assert.Equal(SistemaRuntimeOrigem.VersaoFixadaEntidade, resultado.Origem);
        Assert.False(resultado.AcompanhaPublicacaoAtual);
        Assert.Equal(18, resultado.IdVersaoFixada);
    }

    [Fact]
    public async Task ResolverContextoAsync_EntidadeSemVinculoUsaPublicacaoDoSistemaPadrao()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(31, SistemaVersaoStatus.Publicado);
        repository.Setup(item => item.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Npc, "4"))
            .ReturnsAsync(new SistemaEntidadeGlobalVinculoSnapshot
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                IdEntidade = "4",
                AcompanharPublicacaoAtual = true,
            });
        repository.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(item => item.GetVersionAsync(31, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                IdEntidade = "4",
            });

        Assert.Equal(SistemaRuntimeOrigem.SistemaPadrao, resultado.Origem);
        Assert.Equal(31, resultado.IdSistemaVersao);
        Assert.True(resultado.AcompanhaPublicacaoAtual);
    }

    [Fact]
    public async Task ResolverContextoAsync_RejeitaRascunhoFixadoECaiNoPadraoComWarning()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao rascunho = NovaVersao(11, SistemaVersaoStatus.Rascunho, idSistema: 2);
        SistemaVersao publicada = NovaVersao(32, SistemaVersaoStatus.Publicado);
        repository.Setup(item => item.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Npc, "4"))
            .ReturnsAsync(new SistemaEntidadeGlobalVinculoSnapshot
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                IdEntidade = "4",
                IdSistemaRpg = 2,
                IdSistemaVersao = 11,
                AcompanharPublicacaoAtual = false,
            });
        repository.Setup(item => item.GetVersionAsync(11, true, false)).ReturnsAsync(rascunho);
        repository.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(item => item.GetVersionAsync(32, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                IdEntidade = "4",
            });

        Assert.Equal(SistemaRuntimeOrigem.SistemaPadrao, resultado.Origem);
        Assert.Contains(resultado.Warnings, warning =>
            warning.Codigo == SistemaRuntimeWarningCodigo.VersaoRascunhoIgnorada);
    }

    [Fact]
    public async Task ResolverContextoAsync_AplicaConfiguracaoRacialEDeltaDaMesa()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(42, SistemaVersaoStatus.Publicado);
        versao.SistemaRpg.Codigo = "CUSTOM";
        versao.Racas.Add(new SistemaRacaConfig
        {
            IdRaca = 3,
            CodigoRaca = "ORC",
            NomeExibicao = "Orc",
            VidaBase = 1_000,
            EstaminaBase = 50,
            ManaBase = 20,
            CapacidadeCargaBase = 10,
        });
        repository.Setup(item => item.GetMesaAsync(7, false))
            .ReturnsAsync(new Mesa { Idmesa = 7, IdSistemaVersao = 42 });
        repository.Setup(item => item.GetVersionAsync(42, true, false)).ReturnsAsync(versao);
        repository.Setup(item => item.GetMesaEntityConfigAsync(7, MesaEntidadeTipo.Raca, "3"))
            .ReturnsAsync(new MesaEntidadeConfig
            {
                Idmesa = 7,
                TipoEntidade = MesaEntidadeTipo.Raca,
                Identidade = "3",
                ConfigJson = "{\"vidaBase\":1700,\"capacidadeCargaBase\":14}",
            });

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto { IdMesa = 7, IdRaca = 3 });

        Assert.NotNull(resultado.ConfiguracaoRacial);
        Assert.Equal(1_700, resultado.ConfiguracaoRacial.VidaBase);
        Assert.Equal(50, resultado.ConfiguracaoRacial.EstaminaBase);
        Assert.Equal(14, resultado.ConfiguracaoRacial.CapacidadeCargaBase);
        Assert.Contains(resultado.Proveniencias, item =>
            item.Caminho == "configuracaoRacial.vidaBase" &&
            item.Origem == SistemaValorProveniencia.OverrideMesa);
    }

    [Fact]
    public async Task ResolverContextoAsync_SistemaPadraoUsaRacaDaWikiComoFonteOficial()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(31, SistemaVersaoStatus.Publicado);
        repository.Setup(item => item.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Raca, "3"))
            .ReturnsAsync(new SistemaEntidadeGlobalVinculoSnapshot
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Raca,
                IdEntidade = "3",
                AcompanharPublicacaoAtual = true,
            });
        repository.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(item => item.GetVersionAsync(31, true, false)).ReturnsAsync(publicada);
        repository.Setup(item => item.GetRaceRuntimeAsync(3)).ReturnsAsync(new Raca
        {
            Idraca = 3,
            Nome = "Orc",
            StatusJson = "{\"status\":{\"vidaMaxima\":1000,\"estaminaMaxima\":50,\"manaMaxima\":20,\"capacidadeCarga\":10},\"atributoInicial\":\"FORCA\"}",
        });

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Raca,
                IdEntidade = "3",
                IdRaca = 3,
            });

        Assert.Equal(1_000, resultado.ConfiguracaoRacial?.VidaBase);
        Assert.False(resultado.UsaFallbackLegado);
        Assert.DoesNotContain(resultado.Fallbacks, fallback => fallback.Caminho == "configuracaoRacial");
        Assert.DoesNotContain(resultado.Warnings, warning =>
            warning.Codigo == SistemaRuntimeWarningCodigo.ConfiguracaoRacialAusente);
        Assert.Contains(resultado.Proveniencias, item =>
            item.Caminho == "configuracaoRacial.vidaBase" &&
            item.Origem == SistemaValorProveniencia.ValorExplicitoEntidade);
    }

    [Fact]
    public async Task ResolverContextoAsync_ItemHerdaReferenciaEPreservaExcecaoComWarning()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(31, SistemaVersaoStatus.Publicado);
        publicada.ItemEscopos = CatalogoArma();
        SistemaEntidadeGlobalVinculoSnapshot item = new()
        {
            TipoEntidade = SistemaEntidadeGlobalTipo.Item,
            IdEntidade = "item-1",
            AcompanharPublicacaoAtual = true,
            TipoItem = ItemTipo.Arma,
            EstadoJson = "{\"tipoArma\":\"PISTOLA\",\"danoCurto\":500}",
        };
        repository.Setup(repo => repo.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Item, "item-1"))
            .ReturnsAsync(item);
        repository.Setup(repo => repo.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(repo => repo.GetVersionAsync(31, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Item,
                IdEntidade = "item-1",
            });

        Assert.True(resultado.ReferenciaItem?.Completa);
        Assert.Equal("PISTOLA", resultado.ReferenciaItem?.CodigoArquetipo);
        SistemaRuntimeWarningDto warning = Assert.Single(
            resultado.Warnings,
            item => item.Codigo == SistemaRuntimeWarningCodigo.ValorForaReferencia);
        Assert.Equal(500, warning.ValorInformado);
        Assert.Equal(250, warning.ValorMaximoReferencia);
        Assert.Contains(resultado.Proveniencias, item =>
            item.Caminho.Contains("danoCurto", StringComparison.OrdinalIgnoreCase) &&
            item.Origem == SistemaValorProveniencia.ValorExplicitoEntidade);
    }

    [Fact]
    public async Task ResolverContextoAsync_NpcAcimaDosLimitesGeraWarningSemReescreverEstado()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(31, SistemaVersaoStatus.Publicado);
        publicada.Modulos.Add(new SistemaModulo
        {
            TipoModulo = SistemaModuloTipo.Progressao,
            ConfiguracaoJson = "{\"nivelMaximo\":20}",
        });
        publicada.SkillConfig = new SistemaSkillConfig { MaximoSkills = 2, MaximoMagias = 1 };
        SistemaEntidadeGlobalVinculoSnapshot npc = new()
        {
            TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
            IdEntidade = "8",
            AcompanharPublicacaoAtual = true,
            EstadoJson = "{\"nivel\":25}",
            SkillsJson = "[{},{},{}]",
            MagiasJson = "[{},{}]",
        };
        repository.Setup(repo => repo.GetGlobalEntityBindingAsync(SistemaEntidadeGlobalTipo.Npc, "8"))
            .ReturnsAsync(npc);
        repository.Setup(repo => repo.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync(publicada.SistemaRpg);
        repository.Setup(repo => repo.GetVersionAsync(31, true, false)).ReturnsAsync(publicada);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto
            {
                TipoEntidade = SistemaEntidadeGlobalTipo.Npc,
                IdEntidade = "8",
            });

        Assert.Equal(3, resultado.Warnings.Count(item =>
            item.Codigo == SistemaRuntimeWarningCodigo.ValorForaReferencia));
        Assert.Contains(resultado.Warnings, item => item.Caminho == "entidade.statusJson.nivel" &&
            item.ValorInformado == 25 && item.ValorMaximoReferencia == 20);
        Assert.Contains(resultado.Proveniencias, item =>
            item.Caminho == "entidade.statusJson.nivel" &&
            item.Origem == SistemaValorProveniencia.ValorExplicitoEntidade);
    }

    [Fact]
    public async Task ResolverContextoAsync_SemSistemaDisponivelRetornaFallbackDiagnosticavel()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetByCodeAsync("ODISSEIA", false))
            .ReturnsAsync((SistemaRpg?)null);

        SistemaRuntimeContextoDto resultado = await NovoResolver(repository).ResolverContextoAsync(
            new SistemaRuntimeConsultaDto());

        Assert.Equal(SistemaRuntimeOrigem.FallbackLegado, resultado.Origem);
        Assert.True(resultado.UsaFallbackLegado);
        Assert.Contains(resultado.Warnings, warning =>
            warning.Codigo == SistemaRuntimeWarningCodigo.FallbackLegadoUtilizado);
    }

    private static SistemaRpgResolver NovoResolver(Mock<ISistemaRpgRepository> repository) =>
        new(repository.Object);

    private static SistemaVersao NovaVersao(
        int idVersao,
        SistemaVersaoStatus status,
        int idSistema = 1)
    {
        SistemaRpg sistema = new()
        {
            IdSistemaRpg = idSistema,
            Codigo = idSistema == 1 ? "ODISSEIA" : $"SISTEMA_{idSistema}",
            Nome = $"Sistema {idSistema}",
            Ativo = true,
            IdVersaoPublicada = status == SistemaVersaoStatus.Publicado ? idVersao : null,
        };
        SistemaVersao versao = new()
        {
            IdSistemaVersao = idVersao,
            IdSistemaRpg = idSistema,
            NumeroVersao = "1.0",
            Status = status,
            SistemaRpg = sistema,
        };
        if (status == SistemaVersaoStatus.Publicado)
            sistema.VersaoPublicada = versao;
        sistema.Versoes.Add(versao);
        return versao;
    }

    private static List<SistemaItemEscopo> CatalogoArma()
    {
        SistemaItemEscopo tipo = new()
        {
            IdSistemaItemEscopo = 1,
            Nivel = SistemaItemEscopoNivel.Tipo,
            Codigo = "ARMA",
            CodigoCaminho = "ARMA",
            Nome = "Arma",
            Ativo = true,
            Campos = new List<SistemaItemCampo>
            {
                new()
                {
                    Codigo = "DANO_CURTO",
                    Nome = "Dano curto",
                    Tipo = SistemaItemCampoTipo.Inteiro,
                },
            },
        };
        SistemaItemEscopo categoria = new()
        {
            IdSistemaItemEscopo = 2,
            IdEscopoPai = 1,
            Nivel = SistemaItemEscopoNivel.Categoria,
            Codigo = "ARMA_FOGO",
            CodigoCaminho = "ARMA/ARMA_FOGO",
            Nome = "Arma de fogo",
            Ativo = true,
        };
        SistemaItemEscopo arquetipo = new()
        {
            IdSistemaItemEscopo = 3,
            IdEscopoPai = 2,
            Nivel = SistemaItemEscopoNivel.Arquetipo,
            Codigo = "PISTOLA",
            CodigoCaminho = "ARMA/ARMA_FOGO/PISTOLA",
            Nome = "Pistola",
            Ativo = true,
            Faixas = new List<SistemaItemFaixa>
            {
                new()
                {
                    CodigoCampo = "DANO_CURTO",
                    Nome = "Dano curto conhecido",
                    ValorMinimo = 0,
                    ValorMaximo = 250,
                    ValorReferencia = 250,
                },
            },
        };
        return new List<SistemaItemEscopo> { tipo, categoria, arquetipo };
    }
}
