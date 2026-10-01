using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class MesaNpcSnapshotVisibilityTests
{
    [Fact]
    public async Task MesaAoVivo_ProjetaNpcParaJogadorEMantemFichaCompletaParaMestre()
    {
        const int idMesa = 3;
        const int idMestre = 12;
        const int idJogador = 21;
        Mesa mesa = new() { Idmesa = idMesa, IdusuarioCriacao = idMestre, Nome = "Mesa", AoVivo = true };
        Mock<IMesaRepository> mesas = new();
        mesas.Setup(item => item.GetByIdAsync(idMesa)).ReturnsAsync(mesa);
        mesas.Setup(item => item.UsuarioPodeAcessarMesaSocialAsync(idMesa, It.IsAny<int>())).ReturnsAsync(true);
        mesas.Setup(item => item.GetParticipantUserIdsAsync(idMesa))
            .ReturnsAsync(new HashSet<int> { idMestre, idJogador });
        Mock<IMesaService> mesaService = new();
        mesaService.Setup(item => item.GetPublicPageAsync(idMesa, It.IsAny<int>()))
            .ReturnsAsync(MesaOperacaoResultado<MesaResumoDto>.Ok(new MesaResumoDto { IdMesa = idMesa }));
        Mock<IPersonagemJogadorService> fichas = new();
        fichas.Setup(item => item.GetByMesaIdAsync(idMesa)).ReturnsAsync(() => new List<PersonagemJogadorDto>
        {
            new()
            {
                IdpersonagemJogador = 55,
                Idmesa = idMesa,
                Idusuario = idMestre,
                IdPersonagemOrigem = 19,
                Nome = "Maga de Fogo",
                Visivel = true,
                Idpassiva = 8,
                Passiva = new PersonagemPassivaResumoDto { Idpassiva = 8, Nome = "Passiva secreta" },
                Ultimate = "ultimate secreta",
                PersonagemsVinculados = new List<string> { "15" },
                Visibilidade = PersonagemVisibilidadeDefaults.Npc(),
            },
        });
        MesaPersonagemService service = new(mesas.Object, fichas.Object, mesaService.Object);

        MesaOperacaoResultado<MesaAoVivoSnapshotDto> jogador = await service.GetLiveAsync(idMesa, idJogador, false);
        MesaOperacaoResultado<MesaAoVivoSnapshotDto> mestre = await service.GetLiveAsync(idMesa, idMestre, false);

        PersonagemJogadorDto fichaJogador = Assert.Single(jogador.Dados!.PersonagensCena).Personagem;
        PersonagemJogadorDto fichaMestre = Assert.Single(mestre.Dados!.PersonagensCena).Personagem;
        Assert.True(fichaJogador.VisibilidadeProjetada);
        Assert.Null(fichaJogador.Idpassiva);
        Assert.Null(fichaJogador.Passiva);
        Assert.Null(fichaJogador.Ultimate);
        Assert.False(fichaMestre.VisibilidadeProjetada);
        Assert.Equal(8, fichaMestre.Idpassiva);
        Assert.NotNull(fichaMestre.Passiva);
        Assert.NotNull(fichaMestre.Ultimate);
    }

    [Theory]
    [InlineData(false, true, false)]
    [InlineData(true, true, true)]
    [InlineData(false, false, true)]
    public async Task AdicionarNpc_RespeitaVisibilidadeDaWikiOficialSemAlterarFonte(
        bool adminSite, bool wikiOficial, bool esperaDadosPrivados)
    {
        const int idMesa = 3;
        const int idMestre = 12;
        const int idOrigem = 19;
        PersonagemVisibilidadeDto visibilidade = PersonagemVisibilidadeDefaults.Npc();
        visibilidade.PersonagensRelacionados = false;
        Personagen origem = new()
        {
            Idpersonagem = idOrigem,
            IdWikiEscopo = wikiOficial ? WikiEscopo.IdOficial : 7,
            Nome = "Maga de Fogo",
            Idraca = 2,
            StatusJson = "{\"status\":{\"vida\":20},\"nivel\":4,\"xp\":12}",
            Historia = "História secreta",
            PersonagemsVinculados = "[15]",
            Idpassiva = 8,
            Ultimate = "{\"nome\":\"Chamas\"}",
            Skills = "[{\"nome\":\"Fogo\"}]",
            Visibilidade = visibilidade,
        };
        Mock<IMesaRepository> mesas = new();
        mesas.Setup(item => item.GetByIdAsync(idMesa)).ReturnsAsync(new Mesa
        {
            Idmesa = idMesa,
            IdusuarioCriacao = idMestre,
            Nome = "Mesa",
        });
        Mock<IPersonagemJogadorService> fichas = new();
        fichas.Setup(item => item.GetByMesaIdAsync(idMesa))
            .ReturnsAsync(new List<PersonagemJogadorDto>());
        fichas.Setup(item => item.GetByIdAsync(It.IsAny<int>()))
            .ReturnsAsync(new PersonagemJogadorDto { IdpersonagemJogador = 55, Nome = "Cópia" });
        Mock<IWikiMesaService> wiki = new();
        wiki.Setup(item => item.GetPersonagemAsync(idMesa, idMestre, adminSite, idOrigem))
            .ReturnsAsync(WikiMesaOperacaoResultado<Personagen>.Ok(origem));
        PersonagemJogador? salvo = null;
        Mock<IPersonagemJogadorRepository> repositorio = new();
        repositorio.Setup(item => item.CreateAsync(It.IsAny<PersonagemJogador>()))
            .ReturnsAsync((PersonagemJogador item) =>
            {
                salvo = item;
                item.IdpersonagemJogador = 55;
                return item;
            });

        MesaPersonagemService service = new(
            mesas.Object,
            fichas.Object,
            Mock.Of<IMesaService>(),
            repositorio.Object,
            wikiMesaService: wiki.Object);

        MesaOperacaoResultado<MesaPersonagemResumoDto> result = await service.AddNpcInstanceAsync(
            idMesa, idMestre, adminSite, new MesaNpcAdicionarDto { IdPersonagemOrigem = idOrigem });

        Assert.True(result.Sucesso);
        Assert.NotNull(salvo);
        Assert.Equal(esperaDadosPrivados ? 8 : null, salvo.Idpassiva);
        Assert.Equal(esperaDadosPrivados ? origem.Ultimate : null, salvo.Ultimate);
        Assert.Equal(esperaDadosPrivados ? origem.PersonagemsVinculados : null, salvo.PersonagemsVinculados);
        Assert.Equal(esperaDadosPrivados ? origem.Historia : null, salvo.Historia);
        Assert.Equal(8, origem.Idpassiva);
        Assert.NotNull(origem.Ultimate);
        Assert.NotNull(origem.PersonagemsVinculados);
    }
}
