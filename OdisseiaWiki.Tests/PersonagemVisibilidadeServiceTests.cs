using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class PersonagemVisibilidadeServiceTests
{
    [Fact]
    public async Task GetNpcAsync_SemConfiguracaoUsaOsOitoDefaultsOcultos()
    {
        Mock<IPersonagemVisibilidadeRepository> repository = new();
        repository.Setup(item => item.NpcExistsAsync(7)).ReturnsAsync(true);
        repository.Setup(item => item.GetByPersonagemIdAsync(7))
            .ReturnsAsync((PersonagemVisibilidade?)null);
        PersonagemVisibilidadeService service = new(repository.Object);

        ResultPersonagemVisibilidade result = await service.GetNpcAsync(7);

        PersonagemVisibilidadeDto visibility = Assert.IsType<PersonagemVisibilidadeDto>(result.Visibilidade);
        Assert.True(result.Sucesso);
        Assert.False(visibility.Nivel);
        Assert.False(visibility.Xp);
        Assert.False(visibility.Historia);
        Assert.False(visibility.Inventario);
        Assert.False(visibility.Magias);
        Assert.False(visibility.Skills);
        Assert.False(visibility.Passivas);
        Assert.False(visibility.Ultimate);
        Assert.Equal(16, BooleanFields(visibility).Count(value => value));
        Assert.True(visibility.Vida);
        Assert.True(visibility.Proteses);
        Assert.True(visibility.Galeria);
    }

    [Fact]
    public async Task GetPersonagemJogadorAsync_SemConfiguracaoUsaTodosOsDefaultsVisiveis()
    {
        Mock<IPersonagemVisibilidadeRepository> repository = new();
        repository.Setup(item => item.GetPersonagemJogadorOwnerIdAsync(9)).ReturnsAsync(3);
        repository.Setup(item => item.GetByPersonagemJogadorIdAsync(9))
            .ReturnsAsync((PersonagemVisibilidade?)null);
        PersonagemVisibilidadeService service = new(repository.Object);

        ResultPersonagemVisibilidade result = await service.GetPersonagemJogadorAsync(
            9,
            idUsuarioSolicitante: 3,
            isAdmin: false);

        PersonagemVisibilidadeDto visibility = Assert.IsType<PersonagemVisibilidadeDto>(result.Visibilidade);
        Assert.True(result.Sucesso);
        Assert.All(BooleanFields(visibility), Assert.True);
    }

    [Fact]
    public async Task SavePersonagemJogadorAsync_RecusaUsuarioQueNaoEDonoNemAdmin()
    {
        Mock<IPersonagemVisibilidadeRepository> repository = new();
        repository.Setup(item => item.GetPersonagemJogadorOwnerIdAsync(9)).ReturnsAsync(3);
        PersonagemVisibilidadeService service = new(repository.Object);

        ResultPersonagemVisibilidade result = await service.SavePersonagemJogadorAsync(
            9,
            PersonagemVisibilidadeDefaults.Jogador(),
            idUsuarioSolicitante: 4,
            isAdmin: false);

        Assert.False(result.Sucesso);
        Assert.True(result.SemPermissao);
        repository.Verify(item => item.GetByPersonagemJogadorIdAsync(It.IsAny<int>()), Times.Never);
        repository.Verify(item => item.CreateAsync(It.IsAny<PersonagemVisibilidade>()), Times.Never);
    }

    private static IEnumerable<bool> BooleanFields(PersonagemVisibilidadeDto value)
    {
        yield return value.Vida;
        yield return value.Estamina;
        yield return value.Mana;
        yield return value.CapacidadeCarga;
        yield return value.AtributosPrincipais;
        yield return value.AtributosSecundarios;
        yield return value.Defesas;
        yield return value.Imagem;
        yield return value.Historia;
        yield return value.Raca;
        yield return value.Cidade;
        yield return value.Nome;
        yield return value.Alinhamento;
        yield return value.TracosPersonalidade;
        yield return value.PersonagensRelacionados;
        yield return value.Inventario;
        yield return value.Proteses;
        yield return value.Passivas;
        yield return value.Ultimate;
        yield return value.Skills;
        yield return value.Magias;
        yield return value.Galeria;
        yield return value.Xp;
        yield return value.Nivel;
    }
}
