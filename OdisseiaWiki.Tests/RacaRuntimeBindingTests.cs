using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class RacaRuntimeBindingTests
{
    [Fact]
    public async Task UpdateAsync_UsaVinculoPropostoParaDefinirFonteMecanicaVersionada()
    {
        Mock<IRacaRepository> racas = new();
        Mock<IMesaEntidadeConfigService> overrides = new();
        Mock<IAssetService> assets = new();
        Mock<ISistemaRpgResolver> resolver = new();
        Mock<ISistemaEntidadeVinculoService> vinculos = new();
        Raca persistida = NovaRaca(vida: 100);

        racas.Setup(item => item.GetByIdAsync(7)).ReturnsAsync(persistida);
        racas.Setup(item => item.UpdateAsync(It.IsAny<Raca>()))
            .ReturnsAsync((Raca item) => item);
        vinculos.Setup(item => item.ValidarAsync(
                2,
                20,
                false,
                It.Is<SistemaEntidadeVinculoExistente>(atual =>
                    atual.IdSistemaRpg == 1 &&
                    atual.IdSistemaVersao == null &&
                    atual.AcompanharPublicacaoAtual)))
            .ReturnsAsync(new SistemaEntidadeVinculoResultado(true, 2, 20, false));
        resolver.Setup(item => item.ResolverContextoAsync(
                It.IsAny<SistemaRuntimeConsultaDto>(),
                It.Is<SistemaEntidadeGlobalVinculoSnapshot>(proposto =>
                    proposto.IdSistemaRpg == 2 &&
                    proposto.IdSistemaVersao == 20 &&
                    !proposto.AcompanharPublicacaoAtual)))
            .ReturnsAsync(ContextoComConfiguracaoVersionada());

        RacaService service = new(
            racas.Object,
            overrides.Object,
            assets.Object,
            resolver.Object,
            vinculos.Object);
        ResultRaca resultado = await service.UpdateAsync(7, new RacaDto
        {
            Nome = "Humano",
            StatusJson = Status(vida: 900),
            IdSistemaRpg = 2,
            IdSistemaVersao = 20,
            AcompanharPublicacaoAtual = false,
            Visivel = true,
        });

        Assert.True(resultado.Sucesso);
        Assert.Equal(100, LerVida(persistida.StatusJson));
        Assert.Equal(2, persistida.IdSistemaRpg);
        Assert.Equal(20, persistida.IdSistemaVersao);
        Assert.False(persistida.AcompanharPublicacaoAtual);
        resolver.Verify(item => item.ResolverContextoAsync(It.IsAny<SistemaRuntimeConsultaDto>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_MantemStatusJsonComoFallbackQuandoVersaoNaoConfiguraRaca()
    {
        Mock<IRacaRepository> racas = new();
        Mock<IMesaEntidadeConfigService> overrides = new();
        Mock<IAssetService> assets = new();
        Mock<ISistemaRpgResolver> resolver = new();
        Mock<ISistemaEntidadeVinculoService> vinculos = new();
        Raca persistida = NovaRaca(vida: 100);

        racas.Setup(item => item.GetByIdAsync(7)).ReturnsAsync(persistida);
        racas.Setup(item => item.UpdateAsync(It.IsAny<Raca>()))
            .ReturnsAsync((Raca item) => item);
        resolver.Setup(item => item.ResolverContextoAsync(
                It.IsAny<SistemaRuntimeConsultaDto>(),
                It.IsAny<SistemaEntidadeGlobalVinculoSnapshot>()))
            .ReturnsAsync(new SistemaRuntimeContextoDto
            {
                ConfiguracaoRacial = new SistemaRacaConfigDto { IdRaca = 7, VidaBase = 100 },
                Fallbacks = new List<SistemaRuntimeFallbackDto>
                {
                    new()
                    {
                        Caminho = "configuracaoRacial",
                        Motivo = "Configuração ausente na versão.",
                    },
                },
            });

        RacaService service = new(
            racas.Object,
            overrides.Object,
            assets.Object,
            resolver.Object,
            vinculos.Object);
        ResultRaca resultado = await service.UpdateAsync(7, new RacaDto
        {
            Nome = "Humano",
            StatusJson = Status(vida: 900),
            Visivel = true,
        });

        Assert.True(resultado.Sucesso);
        Assert.Equal(900, LerVida(persistida.StatusJson));
    }

    [Fact]
    public async Task UpdateAsync_SistemaPadraoMantemEntidadeWikiComoFonteMesmoComLinhaVersionada()
    {
        Mock<IRacaRepository> racas = new();
        Mock<IMesaEntidadeConfigService> overrides = new();
        Mock<IAssetService> assets = new();
        Mock<ISistemaRpgResolver> resolver = new();
        Mock<ISistemaEntidadeVinculoService> vinculos = new();
        Raca persistida = NovaRaca(vida: 100);

        racas.Setup(item => item.GetByIdAsync(7)).ReturnsAsync(persistida);
        racas.Setup(item => item.UpdateAsync(It.IsAny<Raca>()))
            .ReturnsAsync((Raca item) => item);
        resolver.Setup(item => item.ResolverContextoAsync(
                It.IsAny<SistemaRuntimeConsultaDto>(),
                It.IsAny<SistemaEntidadeGlobalVinculoSnapshot>()))
            .ReturnsAsync(new SistemaRuntimeContextoDto
            {
                CodigoSistema = "ODISSEIA",
                ConfiguracaoRacial = new SistemaRacaConfigDto { IdRaca = 7, VidaBase = 100 },
            });

        RacaService service = new(
            racas.Object,
            overrides.Object,
            assets.Object,
            resolver.Object,
            vinculos.Object);
        ResultRaca resultado = await service.UpdateAsync(7, new RacaDto
        {
            Nome = "Humano",
            StatusJson = Status(vida: 900),
            Visivel = true,
        });

        Assert.True(resultado.Sucesso);
        Assert.Equal(900, LerVida(persistida.StatusJson));
    }

    private static Raca NovaRaca(int vida) => new()
    {
        Idraca = 7,
        Nome = "Humano",
        StatusJson = JsonSerializer.Serialize(Status(vida)),
        Tags = "[]",
        IdSistemaRpg = 1,
        AcompanharPublicacaoAtual = true,
        Visivel = true,
    };

    private static RacaStatusDto Status(int vida) => new()
    {
        status = new StatusBaseDto
        {
            vida = vida,
            vidaMaxima = vida,
            estamina = 50,
            estaminaMaxima = 50,
            mana = 30,
            manaMaxima = 30,
            capacidadeCarga = 20,
        },
    };

    private static SistemaRuntimeContextoDto ContextoComConfiguracaoVersionada() => new()
    {
        IdSistemaRpg = 2,
        IdSistemaVersao = 20,
        CodigoSistema = "CUSTOM",
        ConfiguracaoRacial = new SistemaRacaConfigDto
        {
            IdRaca = 7,
            VidaBase = 500,
            EstaminaBase = 60,
            ManaBase = 40,
            CapacidadeCargaBase = 30,
        },
    };

    private static int LerVida(string? json)
    {
        using JsonDocument document = JsonDocument.Parse(json!);
        return document.RootElement.GetProperty("status").GetProperty("vida").GetInt32();
    }
}
