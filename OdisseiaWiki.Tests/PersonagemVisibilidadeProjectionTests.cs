using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using OdisseiaWiki.Controllers;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class PersonagemVisibilidadeProjectionTests
{
    [Fact]
    public void ApplyForExternalViewer_NpcNaoMantemValoresDosCamposOcultos()
    {
        PersonagemVisibilidadeDto visibility = PersonagemVisibilidadeDefaults.Npc();
        visibility.Vida = false;
        visibility.TracosPersonalidade = false;
        Personagen personagem = new()
        {
            Nome = "Nome secreto",
            Idraca = 10,
            Historia = "historia secreta",
            Tracos = "[\"traco secreto\"]",
            Costumes = "[\"costume secreto\"]",
            InventarioJson = """
                [
                  {"nome":"item secreto","tipo":"arma"},
                  {"nome":"implante visivel","tipo":"implante"}
                ]
                """,
            Skills = "[{\"nome\":\"skill secreta\"}]",
            Magia = "[{\"nome\":\"magia secreta\"}]",
            Ultimate = "ultimate secreta",
            Idpassiva = 42,
            StatusJson = """
                {"status":{"vida":10,"vidaMaxima":20},"nivel":8,"xp":999}
                """,
            Visibilidade = visibility,
        };

        PersonagemVisibilidadeProjection.ApplyForExternalViewer(personagem);

        Assert.Null(personagem.Historia);
        Assert.Null(personagem.Tracos);
        Assert.Null(personagem.Costumes);
        using JsonDocument inventario = JsonDocument.Parse(personagem.InventarioJson!);
        Assert.Equal(1, inventario.RootElement.GetArrayLength());
        Assert.Equal("implante visivel", inventario.RootElement[0].GetProperty("nome").GetString());
        Assert.Equal("implante", inventario.RootElement[0].GetProperty("tipo").GetString());
        Assert.Null(personagem.Skills);
        Assert.Null(personagem.Magia);
        Assert.Null(personagem.Ultimate);
        Assert.Null(personagem.Idpassiva);
        using JsonDocument status = JsonDocument.Parse(personagem.StatusJson);
        Assert.False(status.RootElement.TryGetProperty("nivel", out _));
        Assert.False(status.RootElement.TryGetProperty("xp", out _));
        Assert.False(status.RootElement.GetProperty("status").TryGetProperty("vida", out _));
        Assert.False(personagem.Visibilidade.Nivel);
        Assert.False(personagem.Visibilidade.Historia);
    }

    [Fact]
    public void ApplyForExternalViewer_JogadorOcultaTodoConteudoDeTracosEMantemSomenteProteses()
    {
        PersonagemVisibilidadeDto visibility = PersonagemVisibilidadeDefaults.Jogador();
        visibility.TracosPersonalidade = false;
        visibility.Inventario = false;
        visibility.Proteses = true;
        PersonagemJogadorDto personagem = new()
        {
            Tracos = new List<string> { "traco secreto" },
            Costumes = new List<string> { "costume secreto" },
            InfoSecundariasJson = "informacao secundaria secreta",
            InventarioJson = JsonSerializer.Deserialize<object>("""
                [
                  {"nome":"item secreto","tipo":"arma"},
                  {"nome":"implante visivel","tipo":4}
                ]
                """),
            Implantes = new List<string> { "implante legado visivel" },
            Visibilidade = visibility,
        };

        PersonagemVisibilidadeProjection.ApplyForExternalViewer(personagem);

        Assert.Null(personagem.Tracos);
        Assert.Null(personagem.Costumes);
        Assert.Null(personagem.InfoSecundariasJson);
        Assert.NotNull(personagem.Implantes);
        Assert.Single(personagem.Implantes!);

        using JsonDocument inventario = JsonDocument.Parse(JsonSerializer.Serialize(personagem.InventarioJson));
        Assert.Equal(1, inventario.RootElement.GetArrayLength());
        Assert.Equal("implante visivel", inventario.RootElement[0].GetProperty("nome").GetString());
        Assert.Equal(4, inventario.RootElement[0].GetProperty("tipo").GetInt32());
    }

    [Fact]
    public void ApplyForExternalViewer_NaoVazaProtesesPeloInventarioQuandoElasEstaoOcultas()
    {
        PersonagemVisibilidadeDto visibility = PersonagemVisibilidadeDefaults.Jogador();
        visibility.Inventario = true;
        visibility.Proteses = false;
        PersonagemJogadorDto personagem = new()
        {
            InventarioJson = JsonSerializer.Deserialize<object>("""
                [
                  {"nome":"item visivel","tipo":"arma"},
                  {"nome":"implante secreto","tipo":"implante"}
                ]
                """),
            Implantes = new List<string> { "implante legado secreto" },
            Visibilidade = visibility,
        };

        PersonagemVisibilidadeProjection.ApplyForExternalViewer(personagem);

        Assert.Null(personagem.Implantes);
        using JsonDocument inventario = JsonDocument.Parse(JsonSerializer.Serialize(personagem.InventarioJson));
        Assert.Equal(1, inventario.RootElement.GetArrayLength());
        Assert.Equal("item visivel", inventario.RootElement[0].GetProperty("nome").GetString());
        Assert.DoesNotContain("implante secreto", JsonSerializer.Serialize(personagem.InventarioJson));
    }

    [Fact]
    public void ApplyForExternalViewer_JogadorOcultaProficienciasComSkills()
    {
        PersonagemVisibilidadeDto visibility = PersonagemVisibilidadeDefaults.Jogador();
        visibility.Skills = false;
        PersonagemJogadorDto personagem = new()
        {
            Skills = JsonSerializer.Deserialize<object>("[{\"nome\":\"skill secreta\"}]"),
            Proficiencias = new List<ProficienciaResumoDto>
            {
                new() { Idproficiencia = 7, Nome = "proficiencia secreta", Descricao = "segredo" },
            },
            Visibilidade = visibility,
        };

        PersonagemVisibilidadeProjection.ApplyForExternalViewer(personagem);

        Assert.Null(personagem.Skills);
        Assert.Empty(personagem.Proficiencias);
    }

    [Fact]
    public async Task GetById_AnonimoRecebePerfilVisivelProjetadoEOcultoRetorna404()
    {
        Mock<IPersonagemJogadorService> service = new();
        PersonagemVisibilidadeDto visibility = PersonagemVisibilidadeDefaults.Jogador();
        visibility.Historia = false;
        visibility.Xp = false;
        PersonagemJogadorDto visible = new()
        {
            IdpersonagemJogador = 5,
            Idusuario = 8,
            Nome = "Perfil publico",
            Visivel = true,
            Historia = JsonDocument.Parse("{\"texto\":\"segredo\"}").RootElement.Clone(),
            StatusJson = JsonSerializer.Deserialize<object>("{\"xp\":50,\"nivel\":3}"),
            Visibilidade = visibility,
        };
        service.Setup(item => item.GetByIdAsync(5)).ReturnsAsync(visible);
        service.Setup(item => item.GetByIdAsync(6)).ReturnsAsync(new PersonagemJogadorDto
        {
            IdpersonagemJogador = 6,
            Idusuario = 8,
            Nome = "Perfil privado",
            Visivel = false,
        });
        PersonagemJogadorController controller = new(service.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult visibleResult = await controller.GetById(5);
        IActionResult hiddenResult = await controller.GetById(6);

        PersonagemJogadorDto projected = Assert.IsType<PersonagemJogadorDto>(
            Assert.IsType<OkObjectResult>(visibleResult).Value);
        Assert.Null(projected.Historia);
        Assert.False(JsonSerializer.Serialize(projected.StatusJson).Contains("xp", StringComparison.OrdinalIgnoreCase));
        Assert.IsType<NotFoundObjectResult>(hiddenResult);
    }
}
