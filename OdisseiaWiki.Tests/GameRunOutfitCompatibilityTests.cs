using System.Text.Json;
using System.Text.Json.Nodes;
using Moq;
using Microsoft.Extensions.Logging.Abstractions;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameRunOutfitCompatibilityTests
{
    internal static string Path(string code) => $"TRAJE/PROTECOES/{code}";
    internal static SistemaItensConfigDto Catalog() => new() { Tipos = [new() { Nivel = SistemaItemEscopoNivel.Tipo,
        Codigo = "TRAJE", Nome = "Traje", Ativo = true, Filhos = [new() { Nivel = SistemaItemEscopoNivel.Categoria,
            Codigo = "PROTECOES", Nome = "Proteções", Ativo = true, Filhos = [
                Archetype("COLETE", [Path("OUTROS")]), Archetype("TRAJE", []), Archetype("OUTROS", [Path("COLETE")]),
            ] }] }] };
    private static SistemaItemEscopoDto Archetype(string code, List<string>? allowed) => new() {
        Codigo = code, Nome = code, Nivel = SistemaItemEscopoNivel.Arquetipo, Ativo = true, ArquetiposCompativeis = allowed };

    internal static List<SistemaItemEscopo> Entities(SistemaItensConfigDto? catalog = null)
    {
        List<SistemaItemEscopo> result = [];
        void Walk(SistemaItemEscopoDto dto, SistemaItemEscopo? parent)
        {
            var entity = new SistemaItemEscopo { IdSistemaItemEscopo = result.Count + 1, Nivel = dto.Nivel,
                Codigo = dto.Codigo, Nome = dto.Nome, Ativo = dto.Ativo, IdEscopoPai = parent?.IdSistemaItemEscopo,
                CodigoCaminho = parent is null ? dto.Codigo : $"{parent.CodigoCaminho}/{dto.Codigo}",
                CompatibilidadeTrajeJson = dto.ArquetiposCompativeis is null ? null : JsonSerializer.Serialize(dto.ArquetiposCompativeis) };
            result.Add(entity); parent?.Filhos.Add(entity);
            foreach (var child in dto.Filhos) Walk(child, entity);
        }
        foreach (var type in (catalog ?? Catalog()).Tipos) Walk(type, null);
        return result;
    }
    internal static JsonObject Item(string id, string code, bool equipped = true) => new() {
        ["id"] = id, ["nome"] = id, ["tipo"] = "traje", ["atributos"] = new JsonObject {
            ["tipoTraje"] = code, ["protecaoBase"] = 100,
            ["__vistaExplodida"] = new JsonObject { ["equippedSlot"] = equipped ? "run-defense" : null } } };
    private static string Snapshot(params JsonObject[] items) => new JsonObject { ["inventario"] = new JsonArray(items.Select(item => (JsonNode)item).ToArray()) }.ToJsonString();

    [Theory]
    [InlineData("COLETE", "OUTROS", true)] [InlineData("OUTROS", "COLETE", true)]
    [InlineData("COLETE", "COLETE", false)] [InlineData("COLETE", "TRAJE", false)]
    [InlineData("TRAJE", "COLETE", false)] [InlineData("TRAJE", "OUTROS", false)]
    [InlineData("TRAJE", "TRAJE", false)]
    public void UsaRegraReciprocaEmQualquerOrdem(string first, string second, bool allowed)
    {
        string snapshot = Snapshot(Item("Primeiro", first), Item("Segundo", second));
        var error = Record.Exception(() => GameRunOutfitCompatibility.Validate(snapshot, Catalog()));
        if (allowed) Assert.Null(error);
        else { Assert.IsType<OutfitCompatibilityException>(error); Assert.Contains("Primeiro e Segundo", error!.Message); }
    }

    [Fact]
    public void PermiteRepetirSomenteQuandoProprioArquetipoEstaMarcadoEExigeAmbasAsPontas()
    {
        var catalog = Catalog(); var vest = catalog.Tipos[0].Filhos[0].Filhos[0];
        vest.ArquetiposCompativeis!.Add(Path("COLETE"));
        GameRunOutfitCompatibility.Validate(Snapshot(Item("a", "colete"), Item("b", "COLETE")), catalog);
        catalog.Tipos[0].Filhos[0].Filhos[2].ArquetiposCompativeis = [];
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(Snapshot(Item("a", "colete"), Item("b", "OUTROS")), catalog));
    }

    [Fact]
    public void AliasDeCopiaAntigaFuncionaSemSobreporArquetipoPersonalizado()
    {
        var catalog = Catalog(); var vest = Item("Colete antigo", "vest");
        vest["atributos"]!["codigoArquetipo"] = "";
        GameRunOutfitCompatibility.Validate(Snapshot(vest, Item("Óculos", "OUTROS")), catalog);
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(
            Snapshot(Item("Colete antigo", "vest"), Item("Traje antigo", "traje_completo")), catalog));
        catalog.Tipos[0].Filhos[0].Filhos.Add(Archetype("VEST", []));
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(
            Snapshot(Item("Colete novo", "vest"), Item("Óculos", "OUTROS")), catalog));
    }

    [Fact]
    public void IgnoraItensNaoEquipadosEProtesesSemAlterarSnapshot()
    {
        var implant = Item("Pulmão", "TRAJE"); implant["tipo"] = "implante";
        string snapshot = Snapshot(Item("Colete", "COLETE"), Item("Traje guardado", "TRAJE", false), implant);
        GameRunOutfitCompatibility.Validate(snapshot, Catalog());
        Assert.Contains("Traje guardado", snapshot);
        var invalid = Snapshot(Item("a", "COLETE"), Item("b", "TRAJE"));
        GameRunOutfitCompatibility.Validate(invalid, Catalog(), "prosthesis");
    }

    [Theory]
    [InlineData(true)] [InlineData(false)]
    public void SemRegraLegadaPreservaUsoAnteriorMasListaVaziaRestringe(bool serialized)
    {
        var catalog = Catalog(); foreach (var archetype in catalog.Tipos[0].Filhos[0].Filhos) archetype.ArquetiposCompativeis = null;
        var a = Item("a", "COLETE"); var b = Item("b", "COLETE");
        if (serialized) { a["atributos"] = a["atributos"]!.ToJsonString(); b["atributos"] = b["atributos"]!.ToJsonString(); }
        string snapshot = Snapshot(a, b);
        GameRunOutfitCompatibility.Validate(snapshot, catalog);
        catalog.Tipos[0].Filhos[0].Filhos[0].ArquetiposCompativeis = [];
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(snapshot, catalog));
    }

    [Fact]
    public async Task RegrasNaoDesaparecemQuandoArquetipoCategoriaOuTipoFicaInativo()
    {
        foreach (string inactive in new[] { "arquetipos", "categoria", "tipo" })
        {
            var catalog = Catalog();
            if (inactive == "tipo") catalog.Tipos[0].Ativo = false;
            else if (inactive == "categoria") catalog.Tipos[0].Filhos[0].Ativo = false;
            else foreach (var scope in catalog.Tipos[0].Filhos[0].Filhos) scope.Ativo = false;
            var runtime = await PublicCatalog(catalog);
            Assert.True(runtime.RegrasTrajeConfiguradas);
            Assert.Contains(Path("COLETE"), runtime.ArquetiposTrajeConhecidos);
            Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(
                Snapshot(Item("Colete desativado", "COLETE")), runtime));
            GameRunOutfitCompatibility.Validate(Snapshot(Item("Guardado", "COLETE", false)), runtime);
        }
    }

    [Fact]
    public async Task CodigoPersonalizadoInativoNaoViraAliasLegadoNoCatalogoPublico()
    {
        var catalog = Catalog();
        var inactive = Archetype("VEST", []); inactive.Ativo = false;
        catalog.Tipos[0].Filhos[0].Filhos.Add(inactive);
        var runtime = await PublicCatalog(catalog);
        Assert.DoesNotContain(runtime.Tipos[0].Filhos[0].Filhos, item => item.Codigo == "VEST");
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(
            Snapshot(Item("Vest personalizado", "VEST")), runtime));
        GameRunOutfitCompatibility.Validate(Snapshot(Item("Colete válido", "COLETE")), runtime);
    }

    private static async Task<SistemaItensConfigDto> PublicCatalog(SistemaItensConfigDto catalog)
    {
        var repository = new Mock<ISistemaRpgRepository>();
        repository.Setup(repo => repo.GetVersionAsync(42, true, false)).ReturnsAsync(new SistemaVersao {
            IdSistemaVersao = 42, Status = SistemaVersaoStatus.Publicado, ItemEscopos = Entities(catalog) });
        var result = await new SistemaRpgItemCatalogService(repository.Object).ObterAsync(42);
        Assert.True(result.Sucesso, result.MensagemErro);
        return result.Dados!;
    }

    [Fact]
    public void SubcategoriaDesconhecidaInativaOuAmbiguaNaoContornaRegra()
    {
        var catalog = Catalog();
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(Snapshot(Item("invalido", "NOVA")), catalog));
        catalog.Tipos[0].Filhos[0].Filhos[0].Ativo = false;
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(Snapshot(Item("inativo", "COLETE")), catalog));
        catalog.Tipos[0].Filhos[0].Filhos[0].Ativo = true;
        catalog.Tipos[0].Filhos.Add(new() { Codigo = "ROUPAS", Ativo = true, Filhos = [Archetype("COLETE", [])] });
        Assert.Throws<OutfitCompatibilityException>(() => GameRunOutfitCompatibility.Validate(Snapshot(Item("ambiguo", "COLETE")), catalog));
        var item = Item("explicito", "COLETE"); item["atributos"]!["codigoCategoria"] = "PROTECOES";
        GameRunOutfitCompatibility.Validate(Snapshot(item), catalog);
    }

    [Fact]
    public async Task CatalogoValidaDestinosEVersaoClonadaPreservaListaVaziaENula()
    {
        var catalog = Catalog();
        var version = new SistemaVersao { IdSistemaVersao = 42, IdSistemaRpg = 1,
            NumeroVersao = "1.0", Status = SistemaVersaoStatus.Rascunho, ItemEscopos = Entities(catalog) };
        var repository = new Mock<ISistemaRpgRepository>();
        repository.Setup(repo => repo.GetVersionAsync(42, true, true)).ReturnsAsync(version);
        repository.Setup(repo => repo.GetVersionAsync(42, true, false)).ReturnsAsync(version);
        repository.Setup(repo => repo.SaveChangesAsync()).Callback(() => {
            int id = 0; foreach (var item in version.ItemEscopos) item.IdSistemaItemEscopo = ++id;
            foreach (var item in version.ItemEscopos) item.IdEscopoPai = item.EscopoPai?.IdSistemaItemEscopo;
        }).Returns(Task.CompletedTask);
        var service = new SistemaRpgItemCatalogService(repository.Object);
        var saved = await service.AtualizarAsync(42, catalog);
        Assert.True(saved.Sucesso, saved.MensagemErro);
        Assert.Equal(Path("OUTROS"), Assert.Single(saved.Dados!.Tipos[0].Filhos[0].Filhos[0].ArquetiposCompativeis!));
        SistemaVersao? copy = null;
        repository.Setup(repo => repo.AddVersionAsync(It.IsAny<SistemaVersao>()))
            .Callback<SistemaVersao>(item => copy = item).Returns(Task.CompletedTask);
        var duplicated = await new SistemaRpgService(repository.Object, Mock.Of<ISistemaRpgResolver>(),
            NullLogger<SistemaRpgService>.Instance).DuplicarVersaoAsync(42, new() { NumeroVersao = "1.1" });
        Assert.True(duplicated.Sucesso, duplicated.MensagemErro);
        var cloned = copy!.ItemEscopos;
        Assert.Equal("[]", cloned.Single(item => item.Codigo == "TRAJE" && item.Nivel == SistemaItemEscopoNivel.Arquetipo).CompatibilidadeTrajeJson);
        Assert.Null(cloned.Single(item => item.Nivel == SistemaItemEscopoNivel.Tipo).CompatibilidadeTrajeJson);
        Assert.Equal(version.ItemEscopos.Single(item => item.Codigo == "COLETE").CompatibilidadeTrajeJson, cloned.Single(item => item.Codigo == "COLETE").CompatibilidadeTrajeJson);
        repository.Invocations.Clear();
        catalog.Tipos[0].Filhos[0].Filhos[0].ArquetiposCompativeis = ["ARMA/ESPADAS/ESPADA"];
        var invalid = await service.AtualizarAsync(42, catalog);
        Assert.False(invalid.Sucesso); Assert.Contains("não existe", invalid.MensagemErro);
        catalog.Tipos[0].ArquetiposCompativeis = [];
        invalid = await service.AtualizarAsync(42, catalog);
        Assert.False(invalid.Sucesso); Assert.Contains("arquétipos de traje", invalid.MensagemErro);
        repository.Verify(repo => repo.SaveChangesAsync(), Times.Never);
    }

    [Theory]
    [InlineData(SistemaVersaoStatus.Publicado)] [InlineData(SistemaVersaoStatus.Arquivado)]
    public async Task NaoAlteraCompatibilidadeDeVersaoImutavel(SistemaVersaoStatus status)
    {
        var version = new SistemaVersao { IdSistemaVersao = 42, Status = status, ItemEscopos = Entities() };
        var repository = new Mock<ISistemaRpgRepository>();
        repository.Setup(repo => repo.GetVersionAsync(42, true, true)).ReturnsAsync(version);
        var result = await new SistemaRpgItemCatalogService(repository.Object).AtualizarAsync(42, Catalog());
        Assert.False(result.Sucesso); repository.Verify(repo => repo.SaveChangesAsync(), Times.Never);
    }
}
