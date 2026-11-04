using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Repositories.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class SistemaRpgServiceTests
{
    [Fact]
    public async Task DanoAreaSalvaEReabrePercentuaisNoModuloDaVersaoSemMigration()
    {
        var repository = new Mock<ISistemaRpgRepository>();
        var version = NovaVersao(SistemaVersaoStatus.Rascunho);
        repository.Setup(row => row.GetVersionAsync(42, true, true)).ReturnsAsync(version);
        repository.Setup(row => row.GetVersionAsync(42, true, false)).ReturnsAsync(version);
        var service = NovoService(repository);
        var dto = AreaConfig();
        var saved = await service.AtualizarCombateAsync(42, dto);
        Assert.True(saved.Sucesso, saved.MensagemErro);
        Assert.Contains("danoAreaPorResultado", Assert.Single(version.Modulos).ConfiguracaoJson);
        var read = await service.ObterCombateAsync(42, true);
        Assert.Equal(10, read.Dados!.DanoAreaPorResultado[0].Percentual);
        Assert.Equal(150, read.Dados.DanoAreaPorResultado[1].Percentual);
        repository.Verify(row => row.SaveChangesAsync(), Times.Once);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(10001)]
    public async Task DanoAreaRejeitaPercentualInvalidoSemPersistir(int percent)
    {
        var repository = new Mock<ISistemaRpgRepository>();
        repository.Setup(row => row.GetVersionAsync(42, true, true)).ReturnsAsync(NovaVersao(SistemaVersaoStatus.Rascunho));
        var dto = AreaConfig(); dto.DanoAreaPorResultado[0].Percentual = percent;
        var result = await NovoService(repository).AtualizarCombateAsync(42, dto);
        Assert.False(result.Sucesso);
        Assert.Contains("percentuais", result.MensagemErro);
        repository.Verify(row => row.SaveChangesAsync(), Times.Never);
    }

    [Theory]
    [InlineData("ERRO")]
    [InlineData("NAO_EXISTE")]
    public async Task DanoAreaRejeitaResultadoDuplicadoOuForaDoSistema(string code)
    {
        var repository = new Mock<ISistemaRpgRepository>();
        repository.Setup(row => row.GetVersionAsync(42, true, true)).ReturnsAsync(NovaVersao(SistemaVersaoStatus.Rascunho));
        var dto = AreaConfig(); dto.DanoAreaPorResultado[1].CodigoResultado = code;
        Assert.False((await NovoService(repository).AtualizarCombateAsync(42, dto)).Sucesso);
        repository.Verify(row => row.SaveChangesAsync(), Times.Never);
    }

    private static SistemaCombateConfigDto AreaConfig() => new() {
        ResultadosDado = [NovoResultado(1, 10, "ERRO"), NovoResultado(11, 20, "ACERTO")],
        DanoAreaPorResultado = [new() { CodigoResultado = "ERRO", Percentual = 10 }, new() { CodigoResultado = "ACERTO", Percentual = 150 }],
    };
}
