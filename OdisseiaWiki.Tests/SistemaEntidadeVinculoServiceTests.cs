using Moq;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaEntidadeVinculoServiceTests
{
    [Fact]
    public async Task ValidarAsync_SemIdsMantemCompatibilidadeComSistemaPadrao()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(null, null, acompanharPublicacaoAtual: true);

        Assert.True(resultado.Sucesso);
        Assert.True(resultado.AcompanharPublicacaoAtual);
        Assert.Null(resultado.IdSistemaRpg);
        Assert.Null(resultado.IdSistemaVersao);
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ValidarAsync_PublicacaoAtualExigeSistemaAtivoEPublicado()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetByIdAsync(2, false)).ReturnsAsync(new SistemaRpg
        {
            IdSistemaRpg = 2,
            Codigo = "CUSTOM",
            Nome = "Custom",
            Ativo = true,
            IdVersaoPublicada = 20,
        });
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(2, null, acompanharPublicacaoAtual: true);

        Assert.True(resultado.Sucesso);
        Assert.Equal(2, resultado.IdSistemaRpg);
        Assert.Null(resultado.IdSistemaVersao);
        Assert.True(resultado.AcompanharPublicacaoAtual);
    }

    [Fact]
    public async Task ValidarAsync_VersaoFixadaRejeitaRascunho()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetVersionAsync(20, false, false))
            .ReturnsAsync(NovaVersao(20, SistemaVersaoStatus.Rascunho));
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(2, 20, acompanharPublicacaoAtual: false);

        Assert.False(resultado.Sucesso);
        Assert.Contains("publicada", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ValidarAsync_PreservaVersaoArquivadaQueJaEstavaVinculada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetVersionAsync(20, false, false))
            .ReturnsAsync(NovaVersao(20, SistemaVersaoStatus.Arquivado));
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(
            2,
            20,
            acompanharPublicacaoAtual: false,
            new SistemaEntidadeVinculoExistente(2, 20, AcompanharPublicacaoAtual: false));

        Assert.True(resultado.Sucesso);
        Assert.Equal(2, resultado.IdSistemaRpg);
        Assert.Equal(20, resultado.IdSistemaVersao);
        Assert.False(resultado.AcompanharPublicacaoAtual);
    }

    [Fact]
    public async Task ValidarAsync_NaoPermiteNovoVinculoComVersaoArquivada()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetVersionAsync(20, false, false))
            .ReturnsAsync(NovaVersao(20, SistemaVersaoStatus.Arquivado));
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(2, 20, acompanharPublicacaoAtual: false);

        Assert.False(resultado.Sucesso);
        Assert.Contains("publicada", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ValidarAsync_PreservaVersaoFixadaQuandoSistemaFoiInativado()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(20, SistemaVersaoStatus.Publicado);
        versao.SistemaRpg.Ativo = false;
        repository.Setup(item => item.GetVersionAsync(20, false, false)).ReturnsAsync(versao);
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(
            2,
            20,
            acompanharPublicacaoAtual: false,
            new SistemaEntidadeVinculoExistente(2, 20, AcompanharPublicacaoAtual: false));

        Assert.True(resultado.Sucesso);
        Assert.Equal(2, resultado.IdSistemaRpg);
        Assert.Equal(20, resultado.IdSistemaVersao);
    }

    [Fact]
    public async Task ValidarAsync_RejeitaNovoVinculoComSistemaInativo()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(20, SistemaVersaoStatus.Publicado);
        versao.SistemaRpg.Ativo = false;
        repository.Setup(item => item.GetVersionAsync(20, false, false)).ReturnsAsync(versao);
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(2, 20, acompanharPublicacaoAtual: false);

        Assert.False(resultado.Sucesso);
        Assert.Contains("inativo", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ValidarAsync_PreservaPublicacaoAtualQuandoSistemaFoiInativado()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetByIdAsync(2, false)).ReturnsAsync(new SistemaRpg
        {
            IdSistemaRpg = 2,
            Codigo = "CUSTOM",
            Nome = "Custom",
            Ativo = false,
            IdVersaoPublicada = 20,
        });
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(
            2,
            null,
            acompanharPublicacaoAtual: true,
            new SistemaEntidadeVinculoExistente(2, null, AcompanharPublicacaoAtual: true));

        Assert.True(resultado.Sucesso);
        Assert.Equal(2, resultado.IdSistemaRpg);
        Assert.True(resultado.AcompanharPublicacaoAtual);
    }

    [Fact]
    public async Task ValidarAsync_RejeitaTrocaParaPublicacaoAtualDeSistemaInativo()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetByIdAsync(2, false)).ReturnsAsync(new SistemaRpg
        {
            IdSistemaRpg = 2,
            Codigo = "CUSTOM",
            Nome = "Custom",
            Ativo = false,
            IdVersaoPublicada = 20,
        });
        SistemaEntidadeVinculoService service = new(repository.Object);

        var resultado = await service.ValidarAsync(
            2,
            null,
            acompanharPublicacaoAtual: true,
            new SistemaEntidadeVinculoExistente(3, null, AcompanharPublicacaoAtual: true));

        Assert.False(resultado.Sucesso);
        Assert.Contains("ativo", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
    }

    private static SistemaVersao NovaVersao(int id, SistemaVersaoStatus status)
    {
        SistemaRpg sistema = new()
        {
            IdSistemaRpg = 2,
            Codigo = "CUSTOM",
            Nome = "Custom",
            Ativo = true,
        };
        return new SistemaVersao
        {
            IdSistemaVersao = id,
            IdSistemaRpg = sistema.IdSistemaRpg,
            NumeroVersao = "1.0",
            Status = status,
            SistemaRpg = sistema,
        };
    }
}
