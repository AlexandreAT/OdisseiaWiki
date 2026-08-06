using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class MesaPadraoServiceTests
{
    [Theory]
    [InlineData("Odisseia")]
    [InlineData("Mesa Padrão — Odisseia")]
    [InlineData("Mesa Padrao - Odisseia")]
    public void NomeRepresentaMesaPadrao_ReconheceNomesAtuaisELegados(string nome)
    {
        Assert.True(SystemMesaConstants.NomeRepresentaMesaPadrao(nome));
    }

    [Theory]
    [InlineData("Mesa Odisseia do Alexandre")]
    [InlineData("Odisseia II")]
    [InlineData("Mesa Padrão")]
    [InlineData("")]
    public void NomeRepresentaMesaPadrao_NaoConfundeOutrasMesas(string nome)
    {
        Assert.False(SystemMesaConstants.NomeRepresentaMesaPadrao(nome));
    }

    [Fact]
    public async Task ObterMesaPadraoAsync_DelegaGarantiaDoRegistroComPublicacaoAtual()
    {
        Mock<IMesaRepository> repository = new();
        Mock<IAssetService> assets = new();
        Mock<ISistemaRpgService> sistemas = new();
        Mock<ISistemaRpgResolver> resolver = new();
        Mesa esperada = new()
        {
            Idmesa = 2,
            Nome = SystemMesaConstants.NomeMesaPadrao,
            CodigoSistema = SystemMesaConstants.CodigoMesaPadrao,
            PadraoSistema = true,
            IdSistemaVersao = 5,
        };
        resolver.Setup(item => item.ResolverAsync(null)).ReturnsAsync(new SistemaResolvidoDto
        {
            IdSistemaVersao = 5,
            NumeroVersao = "1.3",
            UsaFallbackLegado = false,
        });
        repository.Setup(item => item.EnsureSystemDefaultAsync(
                SystemMesaConstants.CodigoMesaPadrao,
                SystemMesaConstants.NomeMesaPadrao,
                5))
            .ReturnsAsync(esperada);
        MesaService service = new(
            repository.Object,
            assets.Object,
            sistemas.Object,
            resolver.Object);

        Mesa resultado = await service.ObterMesaPadraoAsync();

        Assert.Same(esperada, resultado);
        repository.Verify(item => item.EnsureSystemDefaultAsync(
            SystemMesaConstants.CodigoMesaPadrao,
            SystemMesaConstants.NomeMesaPadrao,
            5), Times.Once);
    }


    [Fact]
    public async Task UpdateAsync_BloqueiaMesaPadraoPeloCodigoMesmoComFlagLegadaIncorreta()
    {
        Mock<IMesaRepository> repository = new();
        repository.Setup(item => item.GetByIdAsync(2)).ReturnsAsync(new Mesa
        {
            Idmesa = 2,
            Nome = "Odisseia",
            CodigoSistema = SystemMesaConstants.CodigoMesaPadrao,
            PadraoSistema = false,
        });
        MesaService service = NovoService(repository);

        ResultMesa resultado = await service.UpdateAsync(2, new MesaDto { Nome = "Outro nome" });

        Assert.False(resultado.Sucesso);
        repository.Verify(item => item.UpdateAsync(It.IsAny<Mesa>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_BloqueiaMesaPadraoPeloCodigoMesmoComFlagLegadaIncorreta()
    {
        Mock<IMesaRepository> repository = new();
        repository.Setup(item => item.GetByIdAsync(2)).ReturnsAsync(new Mesa
        {
            Idmesa = 2,
            Nome = "Odisseia",
            CodigoSistema = SystemMesaConstants.CodigoMesaPadrao,
            PadraoSistema = false,
        });
        MesaService service = NovoService(repository);

        bool resultado = await service.DeleteAsync(2);

        Assert.False(resultado);
        repository.Verify(item => item.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    private static MesaService NovoService(Mock<IMesaRepository> repository) => new(
        repository.Object,
        new Mock<IAssetService>().Object,
        new Mock<ISistemaRpgService>().Object,
        new Mock<ISistemaRpgResolver>().Object);
}
