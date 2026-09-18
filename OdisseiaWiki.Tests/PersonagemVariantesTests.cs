using System.Text.Json;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class PersonagemVariantesTests
{
    private static PersonagemDto Draft() => new()
    {
        Nome = "Guarda", Idraca = 1,
        StatusJson = new() { generico = true, variantes = new() { Variant("a", 20), Variant("b", 80) } },
    };

    private static PersonagemVariante Variant(string id, int health) => new()
    {
        id = id, nome = $"Variante {id}",
        statusJson = new()
        {
            status = new() { vida = health, vidaMaxima = health, capacidadeCarga = 40 },
            atributos = new() { principais = new() { forca = health }, secundarios = new() { sanidade = health } },
            defesas = new() { armadura = health }, nivel = 2, xp = health, pontosSkill = health,
        },
        inventarioJson = new() {
            new() { id = $"item-{id}", nome = "Arma", tipo = "arma", quantidade = 1, peso = 3,
                imagem = $"https://assets.example/{id}.png", atributos = new { modificadores = new { ataque = -2 } } },
            new() { id = $"implant-{id}", nome = "Prótese", tipo = "implante", quantidade = 1 },
        },
        skills = new() { new() { id = id, nome = "Skill", tipo = "ataque", imagem = $"https://assets.example/skill-{id}.png", efeito = "Bônus" } },
        magia = new() { new() { id = id, nome = "Magia", tipo = "suporte", imagem = $"https://assets.example/spell-{id}.png", efeito = "Proteção" } },
    };

    [Fact]
    public void LegadoSemVariantesContinuaUnico()
    {
        var dto = new PersonagemDto { Nome = "Único", StatusJson = new() { status = new() { vida = 10 } } };
        Assert.Null(PersonagemVariantesHelper.ValidateAndNormalize(dto));
        Assert.False(dto.StatusJson.generico);
        Assert.Equal(10, dto.StatusJson.status.vida);
        Assert.Empty(dto.StatusJson.variantes);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void RecusaNomeVazioMesmoEmVarianteInativa(string name)
    {
        var dto = Draft();
        dto.StatusJson!.variantes[1].nome = name;
        Assert.NotNull(PersonagemVariantesHelper.ValidateAndNormalize(dto));
    }

    [Fact]
    public void RecusaListaVaziaIdsRepetidosEFichaAusente()
    {
        var dto = Draft();
        dto.StatusJson!.variantes.Clear();
        Assert.NotNull(PersonagemVariantesHelper.ValidateAndNormalize(dto));
        dto = Draft();
        dto.StatusJson!.variantes[1].id = "a";
        Assert.NotNull(PersonagemVariantesHelper.ValidateAndNormalize(dto));
        dto = Draft();
        dto.StatusJson!.variantes[1].statusJson = null!;
        Assert.NotNull(PersonagemVariantesHelper.ValidateAndNormalize(dto));
    }

    [Fact]
    public async Task CriarEditarLer_PreservaFichasIndependentesEImagensInativas()
    {
        var repository = new Mock<IPersonagemRepository>();
        Personagen? persisted = null;
        repository.Setup(r => r.CreateAsync(It.IsAny<Personagen>())).ReturnsAsync((Personagen p) => persisted = p);
        repository.Setup(r => r.UpdateAsync(It.IsAny<Personagen>())).ReturnsAsync((Personagen p) => persisted = p);
        repository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(() => persisted);
        repository.Setup(r => r.GetProficienciasByPersonagemIdAsync(1)).ReturnsAsync(new List<ProficienciaResumoView>());
        var binding = new Mock<ISistemaEntidadeVinculoService>();
        binding.Setup(s => s.ValidarAsync(It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<bool>(), It.IsAny<SistemaEntidadeVinculoExistente?>()))
            .ReturnsAsync(new SistemaEntidadeVinculoResultado(true, null, null, true));
        var assets = new Mock<IAssetService>();
        var service = new PersonagemService(repository.Object, assets.Object, Mock.Of<ISistemaRpgResolver>(), binding.Object);
        var dto = Draft();

        Assert.True((await service.CreateAsync(dto)).Sucesso);
        var saved = JsonSerializer.Deserialize<PersonagemStatus>(persisted!.StatusJson!)!;
        Assert.Equal(20, saved.status.vida);
        Assert.Equal(80, saved.variantes[1].statusJson.status.vida);
        Assert.Equal(80, saved.variantes[1].statusJson.pontosSkill);
        Assert.Equal("https://assets.example/skill-b.png", saved.variantes[1].skills[0].imagem);
        Assert.Equal("Proteção", saved.variantes[1].magia[0].efeito);
        Assert.Equal(2, saved.variantes[1].inventarioJson.Count);

        saved.variantes[1].statusJson.status.vida = 60;
        dto.StatusJson = saved;
        Assert.True((await service.UpdateAsync(1, dto)).Sucesso);
        var read = await service.GetByIdAsync(1);
        var updated = JsonSerializer.Deserialize<PersonagemStatus>(read!.StatusJson!)!;
        Assert.Equal(20, updated.variantes[0].statusJson.status.vida);
        Assert.Equal(60, updated.variantes[1].statusJson.status.vida);
        Assert.Equal(20, updated.status.vida);
        Assert.Contains("a.png", read.InventarioJson!);
        assets.Verify(s => s.DeleteIfUnreferencedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.Contains("https://assets.example/b.png", AssetReferenceHelper.Extract(read.StatusJson));
    }

    [Fact]
    public void ContratoPreservaCamposDoSistemaPersonalizado()
    {
        var status = JsonSerializer.Deserialize<PersonagemFichaStatus>("""
            {"status":{"energia":12},"atributos":{"principais":{"destreza":7},"secundarios":{"sorte":3}},"defesas":{"bloqueio":9}}
            """)!;
        using var result = JsonDocument.Parse(JsonSerializer.Serialize(status));
        Assert.Equal(12, result.RootElement.GetProperty("status").GetProperty("energia").GetInt32());
        Assert.Equal(7, result.RootElement.GetProperty("atributos").GetProperty("principais").GetProperty("destreza").GetInt32());
        Assert.Equal(9, result.RootElement.GetProperty("defesas").GetProperty("bloqueio").GetInt32());
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(false, false)]
    public void VisibilidadeProtegeTodasAsVariantes(bool inventory, bool prostheses)
    {
        var dto = Draft();
        var visibility = PersonagemVisibilidadeDefaults.Npc();
        visibility.Nome = false;
        visibility.Vida = false;
        visibility.Inventario = inventory;
        visibility.Proteses = prostheses;
        visibility.Skills = false;
        visibility.Magias = false;
        var character = new Personagen { StatusJson = JsonSerializer.Serialize(dto.StatusJson), Visibilidade = visibility };
        PersonagemVisibilidadeProjection.ApplyForExternalViewer(character);
        using var json = JsonDocument.Parse(character.StatusJson!);
        foreach (var variant in json.RootElement.GetProperty("variantes").EnumerateArray())
        {
            Assert.False(variant.TryGetProperty("nome", out _));
            Assert.False(variant.TryGetProperty("skills", out _));
            Assert.False(variant.TryGetProperty("magia", out _));
            Assert.False(variant.GetProperty("statusJson").GetProperty("status").TryGetProperty("vida", out _));
            var items = variant.GetProperty("inventarioJson").EnumerateArray().ToArray();
            Assert.Equal(inventory || prostheses ? 1 : 0, items.Length);
            if (items.Length > 0) Assert.Equal(prostheses ? "implante" : "arma", items[0].GetProperty("tipo").GetString());
        }
    }
}
