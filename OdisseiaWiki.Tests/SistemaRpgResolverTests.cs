using Moq;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaRpgResolverTests
{
    [Fact]
    public async Task ResolverAsync_UsaVersaoExplicitaDaMesaInclusiveQuandoArquivada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaRpg sistema = NovoSistema();
        SistemaVersao versao = NovaVersao(sistema, 12, "1.0", SistemaVersaoStatus.Arquivado);
        Mesa mesa = new()
        {
            Idmesa = 7,
            IdSistemaVersao = versao.IdSistemaVersao,
            SistemaVersao = versao,
        };
        repository.Setup(r => r.GetMesaAsync(7, false)).ReturnsAsync(mesa);

        SistemaRpgResolver resolver = new(repository.Object);

        var resultado = await resolver.ResolverAsync(7);

        Assert.Equal(12, resultado.IdSistemaVersao);
        Assert.Equal("MesaExplicita", resultado.Origem);
        Assert.False(resultado.UsaFallbackLegado);
        repository.Verify(r => r.GetByCodeAsync(It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task ResolverAsync_UsaVersaoPadraoQuandoMesaLegadaNaoTemVinculo()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaRpg sistema = NovoSistema();
        SistemaVersao versao = NovaVersao(sistema, 21, "1.0", SistemaVersaoStatus.Publicado);
        repository.Setup(r => r.GetMesaAsync(8, false)).ReturnsAsync(new Mesa { Idmesa = 8 });
        repository.Setup(r => r.GetByCodeAsync("ODISSEIA", false)).ReturnsAsync(sistema);
        repository.Setup(r => r.GetVersionByNumberAsync(sistema.IdSistemaRpg, "1.0", false))
            .ReturnsAsync(versao);

        SistemaRpgResolver resolver = new(repository.Object);

        var resultado = await resolver.ResolverAsync(8);

        Assert.Equal(21, resultado.IdSistemaVersao);
        Assert.Equal("SistemaPadrao", resultado.Origem);
        Assert.False(resultado.UsaFallbackLegado);
    }

    [Fact]
    public async Task ResolverAsync_RetornaFallbackLegadoQuandoSistemaPadraoNaoExiste()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(r => r.GetByCodeAsync("ODISSEIA", false)).ReturnsAsync((SistemaRpg?)null);
        SistemaRpgResolver resolver = new(repository.Object);

        var resultado = await resolver.ResolverAsync();

        Assert.Null(resultado.IdSistemaRpg);
        Assert.Null(resultado.IdSistemaVersao);
        Assert.Equal("LEGACY", resultado.NumeroVersao);
        Assert.Equal("FallbackLegado", resultado.Origem);
        Assert.True(resultado.UsaFallbackLegado);
    }

    [Fact]
    public async Task ResolverAsync_SemMesaUsaPublicacaoAtualAntesDaVersaoBaseArquivada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaRpg sistema = NovoSistema();
        SistemaVersao versaoBase = NovaVersao(sistema, 10, "1.0", SistemaVersaoStatus.Arquivado);
        SistemaVersao versaoAtual = NovaVersao(sistema, 11, "1.1", SistemaVersaoStatus.Publicado);
        sistema.IdVersaoPublicada = versaoAtual.IdSistemaVersao;
        sistema.VersaoPublicada = versaoAtual;
        repository.Setup(r => r.GetByCodeAsync("ODISSEIA", false)).ReturnsAsync(sistema);
        repository.Setup(r => r.GetVersionByNumberAsync(sistema.IdSistemaRpg, "1.0", false))
            .ReturnsAsync(versaoBase);

        SistemaRpgResolver resolver = new(repository.Object);

        var resultado = await resolver.ResolverAsync();

        Assert.Equal(11, resultado.IdSistemaVersao);
        Assert.Equal("1.1", resultado.NumeroVersao);
        Assert.False(resultado.UsaFallbackLegado);
    }

    [Fact]
    public async Task ResolverAsync_PublicacaoAtualNaoDependeDaNavegacaoReversaMaterializada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaRpg sistema = NovoSistema();
        sistema.IdVersaoPublicada = 31;
        sistema.VersaoPublicada = new SistemaVersao
        {
            IdSistemaVersao = 31,
            IdSistemaRpg = sistema.IdSistemaRpg,
            NumeroVersao = "2.0",
            Status = SistemaVersaoStatus.Publicado,
        };
        repository.Setup(r => r.GetByCodeAsync("ODISSEIA", false)).ReturnsAsync(sistema);

        SistemaRpgResolver resolver = new(repository.Object);

        var resultado = await resolver.ResolverAsync();

        Assert.Equal(31, resultado.IdSistemaVersao);
        Assert.Equal("ODISSEIA", resultado.CodigoSistema);
        Assert.Equal("2.0", resultado.NumeroVersao);
    }

    [Fact]
    public async Task ResolverAsync_MesaLegadaSemVinculoPreservaVersaoBaseArquivada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaRpg sistema = NovoSistema();
        SistemaVersao versaoBase = NovaVersao(sistema, 10, "1.0", SistemaVersaoStatus.Arquivado);
        SistemaVersao versaoAtual = NovaVersao(sistema, 11, "1.1", SistemaVersaoStatus.Publicado);
        sistema.IdVersaoPublicada = versaoAtual.IdSistemaVersao;
        sistema.VersaoPublicada = versaoAtual;
        repository.Setup(r => r.GetMesaAsync(9, false)).ReturnsAsync(new Mesa { Idmesa = 9 });
        repository.Setup(r => r.GetByCodeAsync("ODISSEIA", false)).ReturnsAsync(sistema);
        repository.Setup(r => r.GetVersionByNumberAsync(sistema.IdSistemaRpg, "1.0", false))
            .ReturnsAsync(versaoBase);

        SistemaRpgResolver resolver = new(repository.Object);

        var resultado = await resolver.ResolverAsync(9);

        Assert.Equal(10, resultado.IdSistemaVersao);
        Assert.Equal("1.0", resultado.NumeroVersao);
        Assert.False(resultado.UsaFallbackLegado);
    }

    private static SistemaRpg NovoSistema() => new()
    {
        IdSistemaRpg = 3,
        Codigo = "ODISSEIA",
        Nome = "Odisseia - Insurgência",
        Ativo = true,
    };

    private static SistemaVersao NovaVersao(
        SistemaRpg sistema,
        int id,
        string numero,
        SistemaVersaoStatus status) => new()
    {
        IdSistemaVersao = id,
        IdSistemaRpg = sistema.IdSistemaRpg,
        NumeroVersao = numero,
        Status = status,
        SistemaRpg = sistema,
    };
}
