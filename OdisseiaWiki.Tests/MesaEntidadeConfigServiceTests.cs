using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class MesaEntidadeConfigServiceTests
{
    [Fact]
    public async Task SaveAsync_RejeitaCampoForaDoSchemaDaEntidade()
    {
        Mock<IMesaEntidadeConfigRepository> configs = new();
        Mock<IMesaRepository> mesas = new();
        MesaEntidadeConfigService service = new(configs.Object, mesas.Object);

        ResultMesaEntidadeConfig result = await service.SaveAsync(NovoDto(
            MesaEntidadeTipo.Raca,
            "{\"campoArbitrario\":10}"));

        Assert.False(result.Sucesso);
        Assert.Contains("schema", result.MensagemErro, StringComparison.OrdinalIgnoreCase);
        mesas.VerifyNoOtherCalls();
        configs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SaveAsync_AdminPodeCriarDeltaSemSerDonoDaMesa()
    {
        Mock<IMesaEntidadeConfigRepository> configs = new();
        Mock<IMesaRepository> mesas = new();
        mesas.Setup(repository => repository.GetByIdAsync(10))
            .ReturnsAsync(new Mesa { Idmesa = 10, Nome = "Mesa" });
        mesas.Setup(repository => repository.GetByCodigoSistemaAsync(It.IsAny<string>()))
            .ReturnsAsync((Mesa?)null);
        configs.Setup(repository => repository.EntityExistsAsync(MesaEntidadeTipo.Raca, "raca-1"))
            .ReturnsAsync(true);
        configs.Setup(repository => repository.GetAsync(10, MesaEntidadeTipo.Raca, "raca-1"))
            .ReturnsAsync((MesaEntidadeConfig?)null);
        configs.Setup(repository => repository.CreateAsync(It.IsAny<MesaEntidadeConfig>()))
            .ReturnsAsync((MesaEntidadeConfig config) => config);
        MesaEntidadeConfigService service = new(configs.Object, mesas.Object);

        ResultMesaEntidadeConfig result = await service.SaveAsync(
            NovoDto(MesaEntidadeTipo.Raca, "{\"vidaBase\":1200}"),
            isAdmin: true);

        Assert.True(result.Sucesso);
        mesas.Verify(repository => repository.IsOwnerAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        configs.Verify(repository => repository.CreateAsync(It.Is<MesaEntidadeConfig>(config =>
            config.ConfigJson.Contains("vidaBase", StringComparison.Ordinal))), Times.Once);
    }

    [Fact]
    public async Task SaveAsync_RejeitaValorRacialNegativo()
    {
        Mock<IMesaEntidadeConfigRepository> configs = new();
        Mock<IMesaRepository> mesas = new();
        MesaEntidadeConfigService service = new(configs.Object, mesas.Object);

        ResultMesaEntidadeConfig result = await service.SaveAsync(NovoDto(
            MesaEntidadeTipo.Raca,
            "{\"vidaBase\":-1}"));

        Assert.False(result.Sucesso);
        Assert.Contains("maior ou igual a zero", result.MensagemErro, StringComparison.OrdinalIgnoreCase);
    }

    private static MesaEntidadeConfigDto NovoDto(MesaEntidadeTipo tipo, string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        return new MesaEntidadeConfigDto
        {
            Idmesa = 10,
            Idusuario = 20,
            TipoEntidade = tipo,
            Identidade = "raca-1",
            ConfigJson = document.RootElement.Clone(),
        };
    }
}
