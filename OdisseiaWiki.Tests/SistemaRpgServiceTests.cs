using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaRpgServiceTests
{
    [Fact]
    public async Task ObterCriacaoAsync_SistemaPadraoEspelhaTodasAsRacasDaWiki()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(SistemaVersaoStatus.Publicado);
        repository.Setup(r => r.GetVersionAsync(42, true, false)).ReturnsAsync(versao);
        repository.Setup(r => r.GetRacesAsync()).ReturnsAsync(
        [
            new Raca
            {
                Idraca = 9,
                Nome = "New Warforged",
                StatusJson = "{\"status\":{\"vidaMaxima\":1250,\"estaminaMaxima\":80,\"manaMaxima\":10,\"capacidadeCarga\":15},\"atributoInicial\":\"Resistência\"}",
            },
        ]);
        SistemaRpgService service = NovoService(repository);

        SistemaOperacaoResultado<SistemaCriacaoConfigDto> resultado =
            await service.ObterCriacaoAsync(42, incluirRascunhos: true);

        SistemaRacaConfigDto raca = Assert.Single(resultado.Dados!.Racas);
        Assert.Equal(9, raca.IdRaca);
        Assert.Equal(1_250, raca.VidaBase);
        Assert.Equal("RESISTENCIA", raca.CodigoAtributoInicial);
    }

    [Fact]
    public async Task AtualizarCriacaoAsync_SistemaPadraoIgnoraValoresRaciaisDivergentes()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(SistemaVersaoStatus.Rascunho);
        repository.Setup(r => r.GetVersionAsync(42, true, true)).ReturnsAsync(versao);
        repository.Setup(r => r.GetRacesAsync()).ReturnsAsync(
        [
            new Raca
            {
                Idraca = 9,
                Nome = "New Warforged",
                StatusJson = "{\"status\":{\"vidaMaxima\":1250,\"estaminaMaxima\":80,\"manaMaxima\":10,\"capacidadeCarga\":15},\"atributoInicial\":\"Resistência\"}",
            },
        ]);
        repository.Setup(r => r.GetPassivasAsync()).ReturnsAsync([]);
        SistemaRpgService service = NovoService(repository);

        SistemaCriacaoConfigDto entrada = new()
        {
            NivelInicial = 1,
            Racas =
            [
                new SistemaRacaConfigDto
                {
                    IdRaca = 9,
                    NomeRaca = "New Warforged",
                    VidaBase = 99_999,
                    NivelDesbloqueio = 1,
                },
            ],
        };
        SistemaOperacaoResultado<SistemaCriacaoConfigDto> resultado =
            await service.AtualizarCriacaoAsync(42, entrada);

        Assert.True(resultado.Sucesso, resultado.MensagemErro);
        Assert.Equal(1_250, Assert.Single(versao.Racas).VidaBase);
        repository.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Theory]
    [InlineData(SistemaVersaoStatus.Publicado)]
    [InlineData(SistemaVersaoStatus.Arquivado)]
    public async Task AtualizarProgressaoAsync_BloqueiaVersaoImutavel(SistemaVersaoStatus status)
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(status);
        repository.Setup(r => r.GetVersionAsync(42, true, true)).ReturnsAsync(versao);
        SistemaRpgService service = NovoService(repository);

        var resultado = await service.AtualizarProgressaoAsync(
            42,
            new SistemaProgressaoConfigDto { NivelMaximo = 20 });

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Conflito, resultado.TipoErro);
        Assert.Contains("imut", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task AtualizarCombateAsync_RejeitaIntervalosSobrepostos()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(r => r.GetVersionAsync(42, true, true))
            .ReturnsAsync(NovaVersao(SistemaVersaoStatus.Rascunho));
        SistemaRpgService service = NovoService(repository);
        SistemaCombateConfigDto dto = new()
        {
            ResultadosDado =
            {
                NovoResultado(1, 10, "ERRO"),
                NovoResultado(10, 20, "ACERTO"),
            },
        };

        var resultado = await service.AtualizarCombateAsync(42, dto);

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Validacao, resultado.TipoErro);
        Assert.Contains("sobrepostos", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task MigrarMesaAsync_RejeitaVersaoQueNaoEstaPublicada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(r => r.GetMesaAsync(5, true)).ReturnsAsync(new Mesa { Idmesa = 5 });
        repository.Setup(r => r.GetVersionAsync(99, false, false))
            .ReturnsAsync(NovaVersao(SistemaVersaoStatus.Rascunho));
        SistemaRpgService service = NovoService(repository);

        var resultado = await service.MigrarMesaAsync(5, 99, confirmarPreservacaoValores: true);

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Validacao, resultado.TipoErro);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ArquivarVersaoAsync_ArquivaAtualESoltaPonteiroPublicadoSemAlterarMesas()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(SistemaVersaoStatus.Publicado);
        versao.SistemaRpg.Codigo = "SISTEMA_TESTE";
        versao.SistemaRpg.IdVersaoPublicada = versao.IdSistemaVersao;
        versao.SistemaRpg.VersaoPublicada = versao;
        repository.Setup(r => r.GetVersionAsync(42, false, true)).ReturnsAsync(versao);
        repository
            .Setup(r => r.ExecuteInTransactionAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(operacao => operacao());
        repository.Setup(r => r.CountMesasByVersionAsync(42)).ReturnsAsync(2);
        SistemaRpgService service = NovoService(repository);

        var resultado = await service.ArquivarVersaoAsync(42);

        Assert.True(resultado.Sucesso);
        Assert.Equal(SistemaVersaoStatus.Arquivado, versao.Status);
        Assert.Null(versao.SistemaRpg.IdVersaoPublicada);
        Assert.Null(versao.SistemaRpg.VersaoPublicada);
        Assert.Equal(2, resultado.Dados?.QuantidadeMesas);
        repository.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ArquivarVersaoAsync_BloqueiaPublicacaoAtualDoSistemaBase()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(SistemaVersaoStatus.Publicado);
        versao.SistemaRpg.IdVersaoPublicada = versao.IdSistemaVersao;
        versao.SistemaRpg.VersaoPublicada = versao;
        repository.Setup(r => r.GetVersionAsync(42, false, true)).ReturnsAsync(versao);
        SistemaRpgService service = NovoService(repository);

        var resultado = await service.ArquivarVersaoAsync(42);

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Conflito, resultado.TipoErro);
        Assert.Equal(SistemaVersaoStatus.Publicado, versao.Status);
        repository.Verify(r => r.ExecuteInTransactionAsync(It.IsAny<Func<Task>>()), Times.Never);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task AtualizarAsync_NaoPermiteDesativarSistemaBase()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(SistemaVersaoStatus.Publicado);
        repository.Setup(r => r.GetByIdAsync(1, true)).ReturnsAsync(versao.SistemaRpg);
        SistemaRpgService service = NovoService(repository);

        var resultado = await service.AtualizarAsync(1, new SistemaRpgUpdateDto
        {
            Nome = "Odisseia",
            Ativo = false,
        });

        Assert.False(resultado.Sucesso);
        Assert.True(versao.SistemaRpg.Ativo);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ExcluirAsync_NaoPermiteExcluirSistemaBase()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(SistemaVersaoStatus.Publicado);
        repository.Setup(r => r.GetByIdAsync(1, true)).ReturnsAsync(versao.SistemaRpg);
        SistemaRpgService service = NovoService(repository);

        var resultado = await service.ExcluirAsync(1);

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Conflito, resultado.TipoErro);
        repository.Verify(r => r.RemoveSystem(It.IsAny<SistemaRpg>()), Times.Never);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    private static SistemaRpgService NovoService(Mock<ISistemaRpgRepository> repository)
    {
        Mock<ISistemaRpgResolver> resolver = new();
        return new SistemaRpgService(
            repository.Object,
            resolver.Object,
            NullLogger<SistemaRpgService>.Instance);
    }

    private static SistemaVersao NovaVersao(SistemaVersaoStatus status)
    {
        SistemaRpg sistema = new()
        {
            IdSistemaRpg = 1,
            Codigo = "ODISSEIA",
            Nome = "Odisseia - Insurgência",
            Ativo = true,
        };
        return new SistemaVersao
        {
            IdSistemaVersao = 42,
            IdSistemaRpg = sistema.IdSistemaRpg,
            NumeroVersao = "1.0",
            Status = status,
            SistemaRpg = sistema,
        };
    }

    private static SistemaResultadoDadoDto NovoResultado(
        int minimo,
        int maximo,
        string codigo) => new()
    {
        CodigoTeste = "ATAQUE",
        NomeTeste = "Ataque",
        Dado = "D20",
        QuantidadeDados = 1,
        ResultadoMinimo = minimo,
        ResultadoMaximo = maximo,
        CodigoResultado = codigo,
        NomeResultado = codigo,
    };
}
