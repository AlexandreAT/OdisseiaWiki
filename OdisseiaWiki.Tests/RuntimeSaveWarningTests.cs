using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;
using GlobalItem = global::Item;

namespace OdisseiaWiki.Tests;

public sealed class RuntimeSaveWarningTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SaveItem_PreservaExtrapolacaoERetornaWarningSemNovaLeitura(bool atualizar)
    {
        Mock<IItemRepository> repository = new();
        Mock<ISistemaRpgResolver> resolver = NovoResolverComWarning(
            SistemaEntidadeGlobalTipo.Item,
            snapshot =>
            {
                Assert.Contains("500", snapshot.EstadoJson);
                return "entidade.atributosJson.danoCurto";
            });
        Mock<ISistemaEntidadeVinculoService> vinculo = NovoVinculoValido();
        GlobalItem? persistido = null;

        repository.Setup(item => item.AddAsync(It.IsAny<GlobalItem>()))
            .Callback<GlobalItem>(item => persistido = item)
            .Returns(Task.CompletedTask);
        repository.Setup(item => item.UpdateAsync(It.IsAny<GlobalItem>()))
            .Callback<GlobalItem>(item => persistido = item)
            .Returns(Task.CompletedTask);

        ItemService service = new(
            repository.Object,
            Mock.Of<IAssetService>(),
            resolver.Object,
            vinculo.Object);

        ItemSaveResultDto resultado;
        if (atualizar)
        {
            GlobalItem existente = NovoItem("item-1", 100);
            repository.Setup(item => item.GetByIdAsync("item-1")).ReturnsAsync(existente);
            resultado = (await service.UpdateWithRuntimeAsync(new ItemUpdateDto
            {
                Iditem = "item-1",
                Nome = "Pistola excepcional",
                Tipo = ItemTipo.Arma,
                Quantidade = 1,
                AtributosJson = new { tipoArma = "PISTOLA", danoCurto = 500 },
                Visivel = true,
            }))!;
        }
        else
        {
            resultado = await service.CreateWithRuntimeAsync(new ItemCreateDto
            {
                Nome = "Pistola excepcional",
                Tipo = ItemTipo.Arma,
                Quantidade = 1,
                AtributosJson = new { tipoArma = "PISTOLA", danoCurto = 500 },
                Visivel = true,
            });
        }

        Assert.NotNull(persistido);
        Assert.Contains("500", persistido!.AtributosJson);
        SistemaRuntimeWarningDto warning = Assert.Single(resultado.Warnings);
        Assert.Equal(SistemaRuntimeWarningCodigo.ValorForaReferencia, warning.Codigo);
        Assert.Equal(500, warning.ValorInformado);
        Assert.Same(resultado.SistemaRuntime, resultado.Item.SistemaRuntime);
        resolver.Verify(item => item.ResolverContextoAsync(
            It.IsAny<SistemaRuntimeConsultaDto>(),
            It.IsAny<SistemaEntidadeGlobalVinculoSnapshot>()), Times.Once);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SaveNpc_PreservaNivelExcepcionalERetornaWarningSemNovaLeitura(bool atualizar)
    {
        Mock<IPersonagemRepository> repository = new();
        Mock<ISistemaRpgResolver> resolver = NovoResolverComWarning(
            SistemaEntidadeGlobalTipo.Npc,
            snapshot =>
            {
                Assert.Contains("\"nivel\":25", snapshot.EstadoJson);
                return "entidade.statusJson.nivel";
            });
        Mock<ISistemaEntidadeVinculoService> vinculo = NovoVinculoValido();
        Personagen? persistido = null;

        repository.Setup(item => item.CreateAsync(It.IsAny<Personagen>()))
            .ReturnsAsync((Personagen personagem) =>
            {
                personagem.Idpersonagem = 8;
                persistido = personagem;
                return personagem;
            });
        repository.Setup(item => item.UpdateAsync(It.IsAny<Personagen>()))
            .ReturnsAsync((Personagen personagem) =>
            {
                persistido = personagem;
                return personagem;
            });

        PersonagemService service = new(
            repository.Object,
            Mock.Of<IAssetService>(),
            resolver.Object,
            vinculo.Object);
        PersonagemDto dto = NovoNpcDto(nivel: 25);

        ResultPersonagem resultado;
        if (atualizar)
        {
            Personagen existente = new()
            {
                Idpersonagem = 8,
                Nome = "NPC",
                Idraca = 1,
                StatusJson = JsonSerializer.Serialize(NovoNpcDto(1).StatusJson),
                AcompanharPublicacaoAtual = true,
            };
            repository.Setup(item => item.GetByIdAsync(8)).ReturnsAsync(existente);
            resultado = await service.UpdateAsync(8, dto);
        }
        else
        {
            resultado = await service.CreateAsync(dto);
        }

        Assert.True(resultado.Sucesso);
        Assert.NotNull(persistido);
        Assert.Contains("\"nivel\":25", persistido!.StatusJson);
        SistemaRuntimeWarningDto warning = Assert.Single(resultado.Warnings);
        Assert.Equal(SistemaRuntimeWarningCodigo.ValorForaReferencia, warning.Codigo);
        Assert.Equal(25, warning.ValorInformado);
        Assert.Same(resultado.SistemaRuntime, resultado.Personagem!.SistemaRuntime);
        resolver.Verify(item => item.ResolverContextoAsync(
            It.IsAny<SistemaRuntimeConsultaDto>(),
            It.IsAny<SistemaEntidadeGlobalVinculoSnapshot>()), Times.Once);
    }

    private static Mock<ISistemaRpgResolver> NovoResolverComWarning(
        SistemaEntidadeGlobalTipo tipo,
        Func<SistemaEntidadeGlobalVinculoSnapshot, string> validarSnapshot)
    {
        Mock<ISistemaRpgResolver> resolver = new();
        resolver.Setup(item => item.ResolverContextoAsync(
                It.Is<SistemaRuntimeConsultaDto>(consulta => consulta.TipoEntidade == tipo),
                It.IsAny<SistemaEntidadeGlobalVinculoSnapshot>()))
            .ReturnsAsync((SistemaRuntimeConsultaDto _, SistemaEntidadeGlobalVinculoSnapshot snapshot) =>
            {
                string caminho = validarSnapshot(snapshot);
                return new SistemaRuntimeContextoDto
                {
                    IdSistemaRpg = 1,
                    IdSistemaVersao = 10,
                    CodigoSistema = "ODISSEIA",
                    NumeroVersao = "1.0",
                    Warnings = new List<SistemaRuntimeWarningDto>
                    {
                        new()
                        {
                            Codigo = SistemaRuntimeWarningCodigo.ValorForaReferencia,
                            Caminho = caminho,
                            Mensagem = "Valor excepcional preservado.",
                            ValorInformado = tipo == SistemaEntidadeGlobalTipo.Item ? 500 : 25,
                            ValorMaximoReferencia = tipo == SistemaEntidadeGlobalTipo.Item ? 250 : 20,
                        },
                    },
                };
            });
        return resolver;
    }

    private static Mock<ISistemaEntidadeVinculoService> NovoVinculoValido()
    {
        Mock<ISistemaEntidadeVinculoService> vinculo = new();
        vinculo.Setup(item => item.ValidarAsync(
                It.IsAny<int?>(),
                It.IsAny<int?>(),
                It.IsAny<bool>(),
                It.IsAny<SistemaEntidadeVinculoExistente?>()))
            .ReturnsAsync((int? idSistema, int? idVersao, bool acompanhar, SistemaEntidadeVinculoExistente? _) =>
                new SistemaEntidadeVinculoResultado(true, idSistema, idVersao, acompanhar));
        return vinculo;
    }

    private static GlobalItem NovoItem(string id, int dano) => new()
    {
        Iditem = id,
        Nome = "Pistola",
        Tipo = ItemTipo.Arma,
        Quantidade = 1,
        AtributosJson = JsonSerializer.Serialize(new { tipoArma = "PISTOLA", danoCurto = dano }),
        AcompanharPublicacaoAtual = true,
    };

    private static PersonagemDto NovoNpcDto(int nivel) => new()
    {
        Nome = "NPC excepcional",
        Idraca = 1,
        Visivel = true,
        StatusJson = new PersonagemStatus
        {
            nivel = nivel,
            xp = 0,
            pontos = 0,
            condicioes = new List<string>(),
            status = new StatusBase
            {
                vida = 1_000,
                vidaMaxima = 1_000,
                estamina = 100,
                estaminaMaxima = 100,
                mana = 100,
                manaMaxima = 100,
                capacidadeCarga = 20,
            },
            atributos = new Atributos
            {
                principais = new Principais(),
                secundarios = new Secundarios(),
            },
            defesas = new Defesas(),
        },
    };
}
