using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaRpgItemCatalogServiceTests
{
    [Theory]
    [InlineData(SistemaVersaoStatus.Publicado)]
    [InlineData(SistemaVersaoStatus.Arquivado)]
    public async Task AtualizarAsync_BloqueiaCatalogoDeVersaoImutavel(SistemaVersaoStatus status)
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetVersionAsync(42, true, true))
            .ReturnsAsync(NovaVersao(status));
        SistemaRpgItemCatalogService service = new(repository.Object);

        SistemaOperacaoResultado<SistemaItensConfigDto> resultado = await service.AtualizarAsync(
            42,
            CatalogoValido());

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Conflito, resultado.TipoErro);
        repository.Verify(item => item.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task AtualizarAsync_RejeitaFaixaQueReferenciaCampoInexistente()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetVersionAsync(42, true, true))
            .ReturnsAsync(NovaVersao(SistemaVersaoStatus.Rascunho));
        SistemaItensConfigDto dto = CatalogoValido();
        dto.Tipos[0].Filhos[0].Faixas[0].CodigoCampo = "CAMPO_INEXISTENTE";
        SistemaRpgItemCatalogService service = new(repository.Object);

        SistemaOperacaoResultado<SistemaItensConfigDto> resultado = await service.AtualizarAsync(42, dto);

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Validacao, resultado.TipoErro);
        Assert.Contains("inexistente", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
        repository.Verify(item => item.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task AtualizarAsync_RejeitaReferenciaForaDaFaixa()
    {
        Mock<ISistemaRpgRepository> repository = new();
        repository.Setup(item => item.GetVersionAsync(42, true, true))
            .ReturnsAsync(NovaVersao(SistemaVersaoStatus.Rascunho));
        SistemaItensConfigDto dto = CatalogoValido();
        dto.Tipos[0].Filhos[0].Faixas[0].ValorReferencia = 500;
        SistemaRpgItemCatalogService service = new(repository.Object);

        SistemaOperacaoResultado<SistemaItensConfigDto> resultado = await service.AtualizarAsync(42, dto);

        Assert.False(resultado.Sucesso);
        Assert.Contains("dentro da faixa", resultado.MensagemErro, StringComparison.OrdinalIgnoreCase);
        repository.Verify(item => item.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task AtualizarAsync_SubstituiCatalogoSomenteNoRascunho()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = NovaVersao(SistemaVersaoStatus.Rascunho);
        versao.ItemEscopos.Add(new SistemaItemEscopo
        {
            IdSistemaItemEscopo = 99,
            IdSistemaVersao = 42,
            Nivel = SistemaItemEscopoNivel.Tipo,
            Codigo = "ANTIGO",
            CodigoCaminho = "ANTIGO",
            Nome = "Antigo",
        });
        repository.Setup(item => item.GetVersionAsync(42, true, true)).ReturnsAsync(versao);
        SistemaRpgItemCatalogService service = new(repository.Object);

        SistemaOperacaoResultado<SistemaItensConfigDto> resultado = await service.AtualizarAsync(
            42,
            CatalogoValido());

        Assert.True(resultado.Sucesso);
        Assert.Contains(versao.ItemEscopos, item => item.Codigo == "ARMA");
        repository.Verify(item => item.RemoveRange(It.Is<IEnumerable<object>>(items =>
            items.Cast<SistemaItemEscopo>().Any(scope => scope.Codigo == "ANTIGO"))), Times.Once);
        repository.Verify(item => item.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ObterAsync_OcultaRascunhoNoAcessoPublicoEMantemInativosNoAdmin()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao rascunho = NovaVersao(SistemaVersaoStatus.Rascunho);
        rascunho.ItemEscopos.Add(new SistemaItemEscopo
        {
            IdSistemaItemEscopo = 1,
            IdSistemaVersao = 42,
            Nivel = SistemaItemEscopoNivel.Tipo,
            Codigo = "INATIVO",
            CodigoCaminho = "INATIVO",
            Nome = "Inativo",
            Ativo = false,
        });
        repository.Setup(item => item.GetVersionAsync(42, true, false)).ReturnsAsync(rascunho);
        SistemaRpgItemCatalogService service = new(repository.Object);

        SistemaOperacaoResultado<SistemaItensConfigDto> publico = await service.ObterAsync(42);
        SistemaOperacaoResultado<SistemaItensConfigDto> admin = await service.ObterAsync(
            42,
            incluirRascunhos: true);

        Assert.False(publico.Sucesso);
        Assert.True(admin.Sucesso);
        Assert.Contains(admin.Dados!.Tipos, item => item.Codigo == "INATIVO" && !item.Ativo);
    }

    [Fact]
    public async Task ObterAsync_NaoExpoeEscoposInativosNoCatalogoPublico()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao publicada = NovaVersao(SistemaVersaoStatus.Publicado);
        publicada.ItemEscopos.Add(new SistemaItemEscopo
        {
            IdSistemaItemEscopo = 1,
            IdSistemaVersao = 42,
            Nivel = SistemaItemEscopoNivel.Tipo,
            Codigo = "INATIVO",
            CodigoCaminho = "INATIVO",
            Nome = "Inativo",
            Ativo = false,
        });
        repository.Setup(item => item.GetVersionAsync(42, true, false)).ReturnsAsync(publicada);
        SistemaRpgItemCatalogService service = new(repository.Object);

        SistemaOperacaoResultado<SistemaItensConfigDto> resultado = await service.ObterAsync(42);

        Assert.True(resultado.Sucesso);
        Assert.Empty(resultado.Dados!.Tipos);
    }

    private static SistemaVersao NovaVersao(SistemaVersaoStatus status)
    {
        SistemaRpg sistema = new()
        {
            IdSistemaRpg = 1,
            Codigo = "ODISSEIA",
            Nome = "Odisseia",
            Ativo = true,
        };
        return new SistemaVersao
        {
            IdSistemaVersao = 42,
            IdSistemaRpg = 1,
            NumeroVersao = "1.1",
            Status = status,
            SistemaRpg = sistema,
        };
    }

    private static SistemaItensConfigDto CatalogoValido() => new()
    {
        Tipos = new List<SistemaItemEscopoDto>
        {
            new()
            {
                Nivel = SistemaItemEscopoNivel.Tipo,
                Codigo = "ARMA",
                Nome = "Arma",
                Ativo = true,
                Campos = new List<SistemaItemCampoDto>
                {
                    new()
                    {
                        Codigo = "DANO",
                        Nome = "Dano",
                        Tipo = SistemaItemCampoTipo.Inteiro,
                    },
                },
                Filhos = new List<SistemaItemEscopoDto>
                {
                    new()
                    {
                        Nivel = SistemaItemEscopoNivel.Categoria,
                        Codigo = "ARMA_FOGO",
                        Nome = "Arma de fogo",
                        Ativo = true,
                        Faixas = new List<SistemaItemFaixaDto>
                        {
                            new()
                            {
                                CodigoCampo = "DANO",
                                Nome = "Dano conhecido",
                                ValorMinimo = 0,
                                ValorMaximo = 250,
                                ValorReferencia = 200,
                            },
                        },
                    },
                },
            },
        },
    };
}
