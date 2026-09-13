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

public sealed class ItemWeaponAccessoriesTests
{
    [Theory]
    [InlineData(ItemTipo.Arma)]
    [InlineData(ItemTipo.Acessorio)]
    public async Task CriarEditarLer_PreservaModificadoresAssinadosESnapshots(ItemTipo tipo)
    {
        Mock<IItemRepository> repository = new();
        GlobalItem? persisted = null;
        repository.Setup(repo => repo.AddAsync(It.IsAny<GlobalItem>()))
            .Callback<GlobalItem>(item => persisted = item).Returns(Task.CompletedTask);
        repository.Setup(repo => repo.UpdateAsync(It.IsAny<GlobalItem>()))
            .Callback<GlobalItem>(item => persisted = item).Returns(Task.CompletedTask);
        repository.Setup(repo => repo.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(() => persisted);
        Mock<ISistemaEntidadeVinculoService> link = new();
        link.Setup(service => service.ValidarAsync(It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<bool>(), It.IsAny<SistemaEntidadeVinculoExistente?>()))
            .ReturnsAsync(new SistemaEntidadeVinculoResultado(true, null, null, true));
        ItemService service = new(repository.Object, Mock.Of<IAssetService>(), Mock.Of<ISistemaRpgResolver>(), link.Object);
        object attributes = Attributes();

        ItemSaveResultDto created = await service.CreateWithRuntimeAsync(new ItemCreateDto
        {
            Nome = "Espada de teste", Tipo = tipo, Quantidade = 1, AtributosJson = attributes,
        });
        AssertAttributes(created.Item.AtributosJson);
        AssertAttributes(JsonSerializer.Deserialize<object>(persisted!.AtributosJson!));

        // Salvar a resposta não pode substituir os valores base por totais calculados.
        ItemSaveResultDto? updated = await service.UpdateWithRuntimeAsync(new ItemUpdateDto
        {
            Iditem = created.Id, Nome = "Editada", Tipo = tipo, Quantidade = 1,
            AtributosJson = created.Item.AtributosJson,
        });
        AssertAttributes(updated!.Item.AtributosJson);
        AssertAttributes((await service.GetByIdAsync(created.Id))!.AtributosJson);

        // Remover todos os anexos persiste uma lista vazia, sem restaurar o catálogo.
        JsonElement raw = JsonSerializer.SerializeToElement(attributes);
        Dictionary<string, JsonElement> removed = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(raw)!;
        removed["acessorios"] = JsonSerializer.SerializeToElement(Array.Empty<object>());
        await service.UpdateWithRuntimeAsync(new ItemUpdateDto
        {
            Iditem = created.Id, Nome = "Sem anexo", Tipo = tipo, Quantidade = 1, AtributosJson = removed,
        });
        JsonElement reopened = JsonSerializer.SerializeToElement((await service.GetByIdAsync(created.Id))!.AtributosJson);
        Assert.Equal(0, reopened.GetProperty("acessorios").GetArrayLength());
        Assert.Equal(120, reopened.GetProperty("danoBase").GetInt32());
        Assert.Equal(1, reopened.GetProperty("modificadores").GetProperty("ataque").GetInt32());
    }

    [Fact]
    public void InventarioNpc_SerializacaoPreservaAnexosEBase()
    {
        List<OdisseiaWiki.Dtos.Item> inventory = new()
        {
            new() { id = "local", idItemBase = "sword", nome = "Espada", tipo = "arma", quantidade = 1, atributos = Attributes() },
        };
        List<OdisseiaWiki.Dtos.Item> restored = JsonSerializer.Deserialize<List<OdisseiaWiki.Dtos.Item>>(JsonSerializer.Serialize(inventory))!;
        AssertAttributes(Assert.Single(restored).atributos);
    }

    private static object Attributes() => new
    {
        tipoArma = "arma_branca_comum", danoBase = 120, gastoEstaminaPorAtaque = 6,
        modificadores = new { ataque = 1, revidar = -1 },
        compatibilidade = "corpo_a_corpo",
        bonus = new[] { "Texto legado" },
        __explodedView = new { gridPosition = 2 },
        acessorios = new[]
        {
            new
            {
                idItemBase = "grip", nome = "Empunhadura",
                atributos = new
                {
                    compatibilidade = "corpo_a_corpo",
                    modificadores = new { ataque = 2, dano = 100, estamina = -2, efeitos = new[] { "Paralisante" } },
                },
            },
        },
    };

    private static void AssertAttributes(object? attributes)
    {
        JsonElement raw = JsonSerializer.SerializeToElement(attributes);
        Assert.Equal(120, raw.GetProperty("danoBase").GetInt32());
        Assert.Equal(1, raw.GetProperty("modificadores").GetProperty("ataque").GetInt32());
        Assert.Equal(-1, raw.GetProperty("modificadores").GetProperty("revidar").GetInt32());
        Assert.Equal(2, raw.GetProperty("__explodedView").GetProperty("gridPosition").GetInt32());
        Assert.Equal("Texto legado", raw.GetProperty("bonus")[0].GetString());
        JsonElement attachment = raw.GetProperty("acessorios")[0];
        Assert.Equal("grip", attachment.GetProperty("idItemBase").GetString());
        JsonElement modifiers = attachment.GetProperty("atributos").GetProperty("modificadores");
        Assert.Equal(2, modifiers.GetProperty("ataque").GetInt32());
        Assert.Equal(100, modifiers.GetProperty("dano").GetInt32());
        Assert.Equal(-2, modifiers.GetProperty("estamina").GetInt32());
        Assert.Equal("Paralisante", modifiers.GetProperty("efeitos")[0].GetString());
    }
}
