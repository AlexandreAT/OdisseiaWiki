using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services;

/// <summary>
/// Resolve a Wiki efetiva de uma Mesa. O serviço é a única camada que combina
/// conteúdo oficial compatível com conteúdo pertencente ao escopo da Mesa.
/// </summary>
public sealed class WikiMesaService : IWikiMesaService
{
    private readonly IMesaService _mesaService;
    private readonly IWikiEscopoService _wikiEscopoService;
    private readonly ISistemaRpgResolver _sistemaResolver;
    private readonly IPageService _pageService;
    private readonly ICidadeService _cidadeService;
    private readonly IRacaService _racaService;
    private readonly IPersonagemService _personagemService;
    private readonly IItemService _itemService;
    private readonly IWikiGraphService _wikiGraphService;

    public WikiMesaService(
        IMesaService mesaService,
        IWikiEscopoService wikiEscopoService,
        ISistemaRpgResolver sistemaResolver,
        IPageService pageService,
        ICidadeService cidadeService,
        IRacaService racaService,
        IPersonagemService personagemService,
        IItemService itemService,
        IWikiGraphService wikiGraphService)
    {
        _mesaService = mesaService;
        _wikiEscopoService = wikiEscopoService;
        _sistemaResolver = sistemaResolver;
        _pageService = pageService;
        _cidadeService = cidadeService;
        _racaService = racaService;
        _personagemService = personagemService;
        _itemService = itemService;
        _wikiGraphService = wikiGraphService;
    }

    public async Task<WikiMesaOperacaoResultado<WikiMesaResumoDto>> GetResumoAsync(
        int idMesa,
        int idUsuario,
        bool admin)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<WikiMesaResumoDto>(contexto);

        Contexto value = contexto.Dados!;
        bool? visibilidadeResumo = value.Admin ? null : true;
        List<PageDto> paginas = await ObterPaginasEfetivasAsync(value, false, visibilidadeResumo);
        List<CidadeDto> cidades = await ObterCidadesEfetivasAsync(value, false, visibilidadeResumo);
        List<RacaDto> racas = await ObterRacasEfetivasAsync(value, false, visibilidadeResumo);
        List<Personagen> personagens = await ObterPersonagensEfetivosAsync(value, false, visibilidadeResumo);
        List<ItemDto> itens = await ObterItensEfetivosAsync(value, false, visibilidadeResumo);

        return WikiMesaOperacaoResultado<WikiMesaResumoDto>.Ok(new WikiMesaResumoDto
        {
            Contexto = value.Dto,
            QuantidadePaginas = paginas.Count,
            QuantidadeCidades = cidades.Count,
            QuantidadeRacas = racas.Count,
            QuantidadePersonagens = personagens.Count,
            QuantidadeItens = itens.Count,
        });
    }

    public async Task<WikiMesaOperacaoResultado<bool>> PodeGerenciarAsync(int idMesa, int idUsuario, bool admin)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        return !contexto.Sucesso
            ? Falha<bool>(contexto)
            : WikiMesaOperacaoResultado<bool>.Ok(contexto.Dados!.PodeGerenciar);
    }

    public async Task<WikiMesaOperacaoResultado<WikiMesaBuscaDto>> BuscarAsync(
        int idMesa,
        int idUsuario,
        bool admin,
        string termo)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<WikiMesaBuscaDto>(contexto);

        string normalizado = termo?.Trim() ?? string.Empty;
        if (normalizado.Length < 2)
            return Validacao<WikiMesaBuscaDto>("Informe pelo menos dois caracteres para buscar.");

        Contexto value = contexto.Dados!;
        bool? visivel = value.PodeGerenciar ? null : true;
        bool Contem(string? nome) => !string.IsNullOrWhiteSpace(nome) && nome.Contains(normalizado, StringComparison.OrdinalIgnoreCase);
        List<PageDto> paginas = (await ObterPaginasEfetivasAsync(value, false, visivel)).Where(page => Contem(page.Titulo)).ToList();
        List<CidadeDto> cidades = (await ObterCidadesEfetivasAsync(value, false, visivel)).Where(cidade => Contem(cidade.Nome)).ToList();
        List<RacaDto> racas = (await ObterRacasEfetivasAsync(value, false, visivel)).Where(raca => Contem(raca.Nome)).ToList();
        List<Personagen> personagens = await ObterPersonagensEfetivosAsync(value, false, visivel);
        foreach (Personagen personagem in personagens)
            AplicarVisibilidadePersonagem(value, personagem);
        personagens = personagens.Where(personagem => Contem(personagem.Nome)).ToList();
        List<ItemDto> itens = (await ObterItensEfetivosAsync(value, false, visivel)).Where(item => Contem(item.Nome)).ToList();

        return WikiMesaOperacaoResultado<WikiMesaBuscaDto>.Ok(new WikiMesaBuscaDto
        {
            Cidades = cidades.Select(cidade => Busca(cidade.Idcidade, null, cidade.Nome, cidade.Imagem, cidade.Visivel, cidade.Destaque, null, "Cidade")).ToList(),
            Personagens = personagens.Select(personagem => Busca(personagem.Idpersonagem, null, personagem.Nome, personagem.Imagem, personagem.Visivel, personagem.Destaque, null, "Personagem")).ToList(),
            Itens = itens.Select(item => Busca(null, item.Iditem, item.Nome, item.Imagem, item.Visivel, item.Destaque, null, "Item")).ToList(),
            Racas = racas.Select(raca => Busca(raca.Idraca, null, raca.Nome, raca.Imagem, raca.Visivel, raca.Destaque, null, "Raca")).ToList(),
            Pages = paginas.Select(page => Busca(page.IdPage, null, page.Titulo, page.CoverImage, page.Visivel, page.Destaque, page.Slug, "Page")).ToList(),
        });
    }

    public async Task<WikiMesaOperacaoResultado<WikiGraphDto>> GetGraphAsync(
        int idMesa,
        int idUsuario,
        bool admin,
        bool incluirWikiGeral = false,
        CancellationToken cancellationToken = default)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<WikiGraphDto>(contexto);

        Contexto value = contexto.Dados!;
        WikiGraphDto graph = await _wikiGraphService.GetComContextoAsync(
            value.Admin,
            incluirWikiGeral
                ? new[] { WikiEscopo.IdOficial, value.IdWikiEscopo }
                : new[] { value.IdWikiEscopo },
            $"/mesa/{value.IdMesa}/wiki",
            idWikiEscopoMesa: value.IdWikiEscopo,
            idSistemaRpg: value.IdSistemaRpg,
            idSistemaVersao: value.IdSistemaVersao,
            permitirOcultosDaMesa: value.PodeGerenciar,
            cancellationToken: cancellationToken);
        return WikiMesaOperacaoResultado<WikiGraphDto>.Ok(graph);
    }

    public async Task<WikiMesaOperacaoResultado<List<PageDto>>> GetPaginasAsync(
        int idMesa, int idUsuario, bool admin, bool somenteProprias, bool? visivel)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<List<PageDto>>(contexto);

        Contexto value = contexto.Dados!;
        List<PageDto> paginas = await ObterPaginasEfetivasAsync(value, somenteProprias, visivel);
        foreach (PageDto pagina in paginas)
            await SanitizarPaginaParaParticipanteAsync(value, pagina);

        return WikiMesaOperacaoResultado<List<PageDto>>.Ok(
            paginas);
    }

    public async Task<WikiMesaOperacaoResultado<PageDto>> GetPaginaPorIdAsync(
        int idMesa, int idUsuario, bool admin, int idPagina)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<PageDto>(contexto);

        Contexto value = contexto.Dados!;
        PageDto? propria = await _pageService.GetByIdAsync(idPagina, false, value.IdWikiEscopo);
        if (propria is not null)
            return value.PodeGerenciar || propria.Visivel
                ? WikiMesaOperacaoResultado<PageDto>.Ok(
                    await SanitizarPaginaParaParticipanteAsync(value, propria))
                : NaoEncontrado<PageDto>();

        PageDto? oficial = await _pageService.GetByIdAsync(idPagina, false, WikiEscopo.IdOficial);
        return oficial is not null && (value.Admin || oficial.Visivel) &&
            Compativel(oficial.IdSistemaRpg, null, true, value)
            ? WikiMesaOperacaoResultado<PageDto>.Ok(
                await SanitizarPaginaParaParticipanteAsync(value, oficial))
            : NaoEncontrado<PageDto>();
    }

    public async Task<WikiMesaOperacaoResultado<PageDto>> GetPaginaPorSlugAsync(
        int idMesa, int idUsuario, bool admin, string slug)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<PageDto>(contexto);

        Contexto value = contexto.Dados!;
        PageDto? propria = await _pageService.GetBySlugAsync(slug, false, value.IdWikiEscopo);
        // O conteúdo da própria Mesa tem precedência sobre o catálogo oficial.
        // Assim, uma página privada da Mesa não revela uma página oficial de mesmo slug.
        if (propria is not null)
            return value.PodeGerenciar || propria.Visivel
                ? WikiMesaOperacaoResultado<PageDto>.Ok(
                    await SanitizarPaginaParaParticipanteAsync(value, propria))
                : NaoEncontrado<PageDto>();

        PageDto? oficial = await _pageService.GetBySlugAsync(slug, false, WikiEscopo.IdOficial);
        if (oficial is null || (!value.Admin && !oficial.Visivel) || !Compativel(oficial.IdSistemaRpg, null, true, value))
            return NaoEncontrado<PageDto>();

        return WikiMesaOperacaoResultado<PageDto>.Ok(
            await SanitizarPaginaParaParticipanteAsync(value, oficial));
    }

    public async Task<WikiMesaOperacaoResultado<List<PageDto>>> GetPaginasReferenciandoAsync(
        int idMesa,
        int idUsuario,
        bool admin,
        string tipoEntidade,
        string idEntidade,
        bool? visivel)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<List<PageDto>>(contexto);

        Contexto value = contexto.Dados!;
        if (!value.Admin && !await ReferenciaVisivelNoCatalogoAsync(value, tipoEntidade, idEntidade))
            return WikiMesaOperacaoResultado<List<PageDto>>.Ok(new List<PageDto>());

        List<PageDto> proprias = await _pageService.GetReferencingAsync(
            tipoEntidade,
            idEntidade,
            VisibilidadePropria(value, visivel),
            false,
            value.IdWikiEscopo);
        List<PageDto> oficiais = (await _pageService.GetReferencingAsync(
                tipoEntidade,
                idEntidade,
                VisibilidadeOficial(value, visivel),
                false,
                WikiEscopo.IdOficial))
            .Where(page => Compativel(page.IdSistemaRpg, null, true, value))
            .ToList();
        List<PageDto> relacionadas = SobrescreverPorChave(oficiais, proprias, page => page.Slug);
        foreach (PageDto pagina in relacionadas)
            await SanitizarPaginaParaParticipanteAsync(value, pagina);

        return WikiMesaOperacaoResultado<List<PageDto>>.Ok(relacionadas);
    }

    public async Task<WikiMesaOperacaoResultado<ResultPage>> CriarPaginaAsync(
        int idMesa, int idUsuario, bool admin, CreatePageWithBlocksDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultPage>(contexto);

        string? erro = await ValidarReferenciasPaginaAsync(contexto.Dados!, dto.Blocks);
        if (erro is not null)
            return Validacao<ResultPage>(erro);

        try
        {
            ResultPage resultado = await _pageService.CreateAsync(dto, contexto.Dados!.IdWikiEscopo, contexto.Dados.IdSistemaRpg);
            return resultado.Sucesso
                ? WikiMesaOperacaoResultado<ResultPage>.Ok(resultado)
                : Validacao<ResultPage>(resultado.MensagemErro ?? "Não foi possível criar a página.");
        }
        catch (InvalidOperationException exception)
        {
            return Validacao<ResultPage>(exception.Message);
        }
    }

    public async Task<WikiMesaOperacaoResultado<ResultPage>> AtualizarPaginaAsync(
        int idMesa, int idUsuario, bool admin, int idPagina, CreatePageWithBlocksDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultPage>(contexto);

        if (await _pageService.GetByIdAsync(idPagina, false, contexto.Dados!.IdWikiEscopo) is null)
            return NaoEncontrado<ResultPage>();

        string? erro = await ValidarReferenciasPaginaAsync(contexto.Dados, dto.Blocks);
        if (erro is not null)
            return Validacao<ResultPage>(erro);

        try
        {
            PageDto pagina = await _pageService.UpdateAsync(idPagina, dto, contexto.Dados.IdWikiEscopo);
            return WikiMesaOperacaoResultado<ResultPage>.Ok(ResultPage.Ok(pagina));
        }
        catch (InvalidOperationException exception)
        {
            return Validacao<ResultPage>(exception.Message);
        }
    }

    public async Task<WikiMesaOperacaoResultado<bool>> ExcluirPaginaAsync(
        int idMesa, int idUsuario, bool admin, int idPagina)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<bool>(contexto);

        return await _pageService.DeleteAsync(idPagina, contexto.Dados!.IdWikiEscopo)
            ? WikiMesaOperacaoResultado<bool>.Ok(true)
            : NaoEncontrado<bool>();
    }

    public async Task<WikiMesaOperacaoResultado<List<CidadeDto>>> GetCidadesAsync(
        int idMesa, int idUsuario, bool admin, bool somenteProprias, bool? visivel)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<List<CidadeDto>>(contexto);

        return WikiMesaOperacaoResultado<List<CidadeDto>>.Ok(
            await ObterCidadesEfetivasAsync(contexto.Dados!, somenteProprias, visivel));
    }

    public async Task<WikiMesaOperacaoResultado<CidadeDto>> GetCidadeAsync(
        int idMesa, int idUsuario, bool admin, int idCidade)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<CidadeDto>(contexto);

        CidadeDto? cidade = await EncontrarCidadeEfetivaAsync(contexto.Dados!, idCidade);
        return cidade is null
            ? NaoEncontrado<CidadeDto>()
            : WikiMesaOperacaoResultado<CidadeDto>.Ok(cidade);
    }

    public async Task<WikiMesaOperacaoResultado<ResultCidade>> CriarCidadeAsync(
        int idMesa, int idUsuario, bool admin, CidadeDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultCidade>(contexto);

        dto.IdSistemaRpg = contexto.Dados!.IdSistemaRpg;
        ResultCidade resultado = await _cidadeService.CreateAsync(dto, contexto.Dados.IdWikiEscopo, contexto.Dados.IdSistemaRpg);
        return resultado.Sucesso
            ? WikiMesaOperacaoResultado<ResultCidade>.Ok(resultado)
            : Validacao<ResultCidade>(resultado.MensagemErro ?? "Não foi possível criar a cidade.");
    }

    public async Task<WikiMesaOperacaoResultado<ResultCidade>> AtualizarCidadeAsync(
        int idMesa, int idUsuario, bool admin, int idCidade, CidadeDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultCidade>(contexto);

        if (await _cidadeService.GetByIdAsync(idCidade, contexto.Dados!.IdWikiEscopo) is null)
            return NaoEncontrado<ResultCidade>();

        ResultCidade resultado = await _cidadeService.UpdateAsync(idCidade, dto, contexto.Dados.IdWikiEscopo);
        return resultado.Sucesso
            ? WikiMesaOperacaoResultado<ResultCidade>.Ok(resultado)
            : Validacao<ResultCidade>(resultado.MensagemErro ?? "Não foi possível atualizar a cidade.");
    }

    public async Task<WikiMesaOperacaoResultado<bool>> ExcluirCidadeAsync(int idMesa, int idUsuario, bool admin, int idCidade)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<bool>(contexto);

        return await _cidadeService.DeleteAsync(idCidade, contexto.Dados!.IdWikiEscopo)
            ? WikiMesaOperacaoResultado<bool>.Ok(true)
            : NaoEncontrado<bool>();
    }

    public async Task<WikiMesaOperacaoResultado<List<RacaDto>>> GetRacasAsync(
        int idMesa, int idUsuario, bool admin, bool somenteProprias, bool? visivel)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<List<RacaDto>>(contexto);

        return WikiMesaOperacaoResultado<List<RacaDto>>.Ok(
            await ObterRacasEfetivasAsync(contexto.Dados!, somenteProprias, visivel));
    }

    public async Task<WikiMesaOperacaoResultado<RacaDto>> GetRacaAsync(
        int idMesa, int idUsuario, bool admin, int idRaca)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<RacaDto>(contexto);

        RacaDto? raca = await EncontrarRacaEfetivaAsync(contexto.Dados!, idRaca);
        return raca is null
            ? NaoEncontrado<RacaDto>()
            : WikiMesaOperacaoResultado<RacaDto>.Ok(raca);
    }

    public async Task<WikiMesaOperacaoResultado<ResultRaca>> CriarRacaAsync(
        int idMesa, int idUsuario, bool admin, RacaDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultRaca>(contexto);

        AplicarVinculoDaMesa(dto, contexto.Dados!);
        ResultRaca resultado = await _racaService.CreateAsync(dto, contexto.Dados!.IdWikiEscopo);
        return resultado.Sucesso
            ? WikiMesaOperacaoResultado<ResultRaca>.Ok(resultado)
            : Validacao<ResultRaca>(resultado.MensagemErro ?? "Não foi possível criar a raça.");
    }

    public async Task<WikiMesaOperacaoResultado<ResultRaca>> AtualizarRacaAsync(
        int idMesa, int idUsuario, bool admin, int idRaca, RacaDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultRaca>(contexto);

        if (await _racaService.GetByIdAsync(idRaca, null, contexto.Dados!.IdWikiEscopo) is null)
            return NaoEncontrado<ResultRaca>();

        dto.IdSistemaRpg = null;
        dto.IdSistemaVersao = null;
        dto.AcompanharPublicacaoAtual = null;
        ResultRaca resultado = await _racaService.UpdateAsync(idRaca, dto, contexto.Dados.IdWikiEscopo);
        return resultado.Sucesso
            ? WikiMesaOperacaoResultado<ResultRaca>.Ok(resultado)
            : Validacao<ResultRaca>(resultado.MensagemErro ?? "Não foi possível atualizar a raça.");
    }

    public async Task<WikiMesaOperacaoResultado<bool>> ExcluirRacaAsync(int idMesa, int idUsuario, bool admin, int idRaca)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<bool>(contexto);

        return await _racaService.DeleteAsync(idRaca, contexto.Dados!.IdWikiEscopo)
            ? WikiMesaOperacaoResultado<bool>.Ok(true)
            : NaoEncontrado<bool>();
    }

    public async Task<WikiMesaOperacaoResultado<List<Personagen>>> GetPersonagensAsync(
        int idMesa, int idUsuario, bool admin, bool somenteProprios, bool? visivel)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<List<Personagen>>(contexto);

        Contexto value = contexto.Dados!;
        List<Personagen> personagens = await ObterPersonagensEfetivosAsync(value, somenteProprios, visivel);
        foreach (Personagen personagem in personagens)
            await SanitizarPersonagemParaParticipanteAsync(value, personagem);

        return WikiMesaOperacaoResultado<List<Personagen>>.Ok(
            personagens);
    }

    public async Task<WikiMesaOperacaoResultado<Personagen>> GetPersonagemAsync(
        int idMesa, int idUsuario, bool admin, int idPersonagem)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<Personagen>(contexto);

        Contexto value = contexto.Dados!;
        Personagen? personagem = await EncontrarPersonagemEfetivoAsync(value, idPersonagem);
        if (personagem is not null)
            await SanitizarPersonagemParaParticipanteAsync(value, personagem);
        return personagem is null
            ? NaoEncontrado<Personagen>()
            : WikiMesaOperacaoResultado<Personagen>.Ok(personagem);
    }

    public async Task<WikiMesaOperacaoResultado<ResultPersonagem>> CriarPersonagemAsync(
        int idMesa, int idUsuario, bool admin, PersonagemDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultPersonagem>(contexto);

        string? erro = await ValidarReferenciasPersonagemAsync(contexto.Dados!, dto);
        if (erro is not null)
            return Validacao<ResultPersonagem>(erro);

        AplicarVinculoDaMesa(dto, contexto.Dados!);
        ResultPersonagem resultado = await _personagemService.CreateAsync(dto, contexto.Dados!.IdWikiEscopo);
        return resultado.Sucesso
            ? WikiMesaOperacaoResultado<ResultPersonagem>.Ok(resultado)
            : Validacao<ResultPersonagem>(resultado.MensagemErro ?? "Não foi possível criar o personagem.");
    }

    public async Task<WikiMesaOperacaoResultado<ResultPersonagem>> AtualizarPersonagemAsync(
        int idMesa, int idUsuario, bool admin, int idPersonagem, PersonagemDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ResultPersonagem>(contexto);

        if (await _personagemService.GetByIdAsync(idPersonagem, contexto.Dados!.IdWikiEscopo) is null)
            return NaoEncontrado<ResultPersonagem>();

        string? erro = await ValidarReferenciasPersonagemAsync(contexto.Dados, dto);
        if (erro is not null)
            return Validacao<ResultPersonagem>(erro);

        dto.IdSistemaRpg = null;
        dto.IdSistemaVersao = null;
        dto.AcompanharPublicacaoAtual = null;
        ResultPersonagem resultado = await _personagemService.UpdateAsync(idPersonagem, dto, contexto.Dados.IdWikiEscopo);
        return resultado.Sucesso
            ? WikiMesaOperacaoResultado<ResultPersonagem>.Ok(resultado)
            : Validacao<ResultPersonagem>(resultado.MensagemErro ?? "Não foi possível atualizar o personagem.");
    }

    public async Task<WikiMesaOperacaoResultado<bool>> ExcluirPersonagemAsync(
        int idMesa, int idUsuario, bool admin, int idPersonagem)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<bool>(contexto);

        return await _personagemService.DeleteAsync(idPersonagem, contexto.Dados!.IdWikiEscopo)
            ? WikiMesaOperacaoResultado<bool>.Ok(true)
            : NaoEncontrado<bool>();
    }

    public async Task<WikiMesaOperacaoResultado<List<ItemDto>>> GetItensAsync(
        int idMesa, int idUsuario, bool admin, bool somenteProprios, bool? visivel)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<List<ItemDto>>(contexto);

        Contexto value = contexto.Dados!;
        List<ItemDto> itens = await ObterItensEfetivosAsync(value, somenteProprios, visivel);
        foreach (ItemDto item in itens)
            await SanitizarItemParaParticipanteAsync(value, item);

        return WikiMesaOperacaoResultado<List<ItemDto>>.Ok(
            itens);
    }

    public async Task<WikiMesaOperacaoResultado<ItemDto>> GetItemAsync(
        int idMesa, int idUsuario, bool admin, string idItem)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ItemDto>(contexto);

        Contexto value = contexto.Dados!;
        ItemDto? item = await EncontrarItemEfetivoAsync(value, idItem);
        if (item is not null)
            await SanitizarItemParaParticipanteAsync(value, item);
        return item is null
            ? NaoEncontrado<ItemDto>()
            : WikiMesaOperacaoResultado<ItemDto>.Ok(item);
    }

    public async Task<WikiMesaOperacaoResultado<ItemSaveResultDto>> CriarItemAsync(
        int idMesa, int idUsuario, bool admin, ItemCreateDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ItemSaveResultDto>(contexto);

        string? erro = await ValidarReferenciasItemAsync(contexto.Dados!, dto.Idpersonagem, dto.IditemBase);
        if (erro is not null)
            return Validacao<ItemSaveResultDto>(erro);

        AplicarVinculoDaMesa(dto, contexto.Dados!);
        try
        {
            return WikiMesaOperacaoResultado<ItemSaveResultDto>.Ok(
                await _itemService.CreateWithRuntimeAsync(dto, contexto.Dados!.IdWikiEscopo));
        }
        catch (InvalidOperationException exception)
        {
            return Validacao<ItemSaveResultDto>(exception.Message);
        }
    }

    public async Task<WikiMesaOperacaoResultado<ItemSaveResultDto>> AtualizarItemAsync(
        int idMesa, int idUsuario, bool admin, string idItem, ItemUpdateDto dto)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<ItemSaveResultDto>(contexto);

        if (await _itemService.GetByIdAsync(idItem, contexto.Dados!.IdWikiEscopo) is null)
            return NaoEncontrado<ItemSaveResultDto>();

        string? erro = await ValidarReferenciasItemAsync(contexto.Dados, dto.Idpersonagem, dto.IditemBase);
        if (erro is not null)
            return Validacao<ItemSaveResultDto>(erro);

        dto.Iditem = idItem;
        dto.IdSistemaRpg = null;
        dto.IdSistemaVersao = null;
        dto.AcompanharPublicacaoAtual = null;
        try
        {
            ItemSaveResultDto? resultado = await _itemService.UpdateWithRuntimeAsync(dto, contexto.Dados.IdWikiEscopo);
            return resultado is null
                ? NaoEncontrado<ItemSaveResultDto>()
                : WikiMesaOperacaoResultado<ItemSaveResultDto>.Ok(resultado);
        }
        catch (InvalidOperationException exception)
        {
            return Validacao<ItemSaveResultDto>(exception.Message);
        }
    }

    public async Task<WikiMesaOperacaoResultado<bool>> ExcluirItemAsync(
        int idMesa, int idUsuario, bool admin, string idItem)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoGerenciavelAsync(idMesa, idUsuario, admin);
        if (!contexto.Sucesso)
            return Falha<bool>(contexto);

        return await _itemService.DeleteAsync(idItem, contexto.Dados!.IdWikiEscopo)
            ? WikiMesaOperacaoResultado<bool>.Ok(true)
            : NaoEncontrado<bool>();
    }

    private async Task<WikiMesaOperacaoResultado<Contexto>> ObterContextoAsync(int idMesa, int idUsuario, bool admin)
    {
        if (await _mesaService.GetByIdAsync(idMesa) is null)
            return WikiMesaOperacaoResultado<Contexto>.Falha(WikiMesaOperacaoErro.NaoEncontrado, "Mesa não encontrada.");

        bool podeGerenciar = admin || await _mesaService.IsOwnerAsync(idMesa, idUsuario);
        if (!podeGerenciar && !await _mesaService.CanUseAsync(idMesa, idUsuario))
            return WikiMesaOperacaoResultado<Contexto>.Falha(WikiMesaOperacaoErro.Proibido, "Você não possui acesso a esta Mesa.");

        WikiEscopo escopo = await _wikiEscopoService.EnsureMesaAsync(idMesa);
        SistemaResolvidoDto sistema = await _sistemaResolver.ResolverAsync(idMesa);
        return WikiMesaOperacaoResultado<Contexto>.Ok(new Contexto(
            idMesa,
            escopo.IdWikiEscopo,
            sistema.IdSistemaRpg,
            sistema.IdSistemaVersao,
            podeGerenciar,
            admin));
    }

    private async Task<WikiMesaOperacaoResultado<Contexto>> ObterContextoGerenciavelAsync(int idMesa, int idUsuario, bool admin)
    {
        WikiMesaOperacaoResultado<Contexto> contexto = await ObterContextoAsync(idMesa, idUsuario, admin);
        return !contexto.Sucesso || contexto.Dados!.PodeGerenciar
            ? contexto
            : WikiMesaOperacaoResultado<Contexto>.Falha(WikiMesaOperacaoErro.Proibido, "Somente o mestre pode editar a Wiki desta Mesa.");
    }

    private async Task<List<PageDto>> ObterPaginasEfetivasAsync(Contexto contexto, bool somenteProprias, bool? visivel)
    {
        List<PageDto> proprias = await _pageService.GetAllAsync(VisibilidadePropria(contexto, visivel), contexto.IdWikiEscopo);
        if (somenteProprias)
            return proprias.OrderBy(page => page.Titulo).ToList();

        List<PageDto> oficiais = (await _pageService.GetAllAsync(VisibilidadeOficial(contexto, visivel), WikiEscopo.IdOficial))
            .Where(page => Compativel(page.IdSistemaRpg, null, true, contexto))
            .ToList();
        return SobrescreverPorChave(oficiais, proprias, page => page.Slug);
    }

    private async Task<List<CidadeDto>> ObterCidadesEfetivasAsync(Contexto contexto, bool somenteProprias, bool? visivel)
    {
        List<CidadeDto> proprias = (await _cidadeService.GetAllAsync(VisibilidadePropria(contexto, visivel), contexto.IdWikiEscopo)).Cidades ?? new();
        if (somenteProprias)
            return proprias.OrderBy(cidade => cidade.Nome).ToList();

        List<CidadeDto> oficiais = ((await _cidadeService.GetAllAsync(VisibilidadeOficial(contexto, visivel), WikiEscopo.IdOficial)).Cidades ?? new())
            .Where(cidade => Compativel(cidade.IdSistemaRpg, null, true, contexto))
            .ToList();
        return UnirPorId(oficiais, proprias, cidade => cidade.Idcidade);
    }

    private async Task<List<RacaDto>> ObterRacasEfetivasAsync(Contexto contexto, bool somenteProprias, bool? visivel)
    {
        List<RacaDto> proprias = (await _racaService.GetAllAsync(VisibilidadePropria(contexto, visivel), contexto.IdMesa, contexto.IdWikiEscopo)).Racas ?? new();
        if (somenteProprias)
            return proprias.OrderBy(raca => raca.Nome).ToList();

        List<RacaDto> oficiais = ((await _racaService.GetAllAsync(VisibilidadeOficial(contexto, visivel), contexto.IdMesa, WikiEscopo.IdOficial)).Racas ?? new())
            .Where(raca => Compativel(raca.IdSistemaRpg, raca.IdSistemaVersao, raca.AcompanharPublicacaoAtual ?? true, contexto))
            .ToList();
        return UnirPorId(oficiais, proprias, raca => raca.Idraca);
    }

    private async Task<List<Personagen>> ObterPersonagensEfetivosAsync(Contexto contexto, bool somenteProprios, bool? visivel)
    {
        List<Personagen> proprios = await _personagemService.GetAllAsync(VisibilidadePropria(contexto, visivel), contexto.IdWikiEscopo);
        if (somenteProprios)
            return proprios.OrderBy(personagem => personagem.Nome).ToList();

        List<Personagen> oficiais = (await _personagemService.GetAllAsync(VisibilidadeOficial(contexto, visivel), WikiEscopo.IdOficial))
            .Where(personagem => Compativel(personagem.IdSistemaRpg, personagem.IdSistemaVersao, personagem.AcompanharPublicacaoAtual, contexto))
            .ToList();
        return UnirPorId(oficiais, proprios, personagem => personagem.Idpersonagem);
    }

    private async Task<List<ItemDto>> ObterItensEfetivosAsync(Contexto contexto, bool somenteProprios, bool? visivel)
    {
        List<ItemDto> proprios = (await _itemService.GetAllAsync(VisibilidadePropria(contexto, visivel), contexto.IdWikiEscopo)).ToList();
        if (somenteProprios)
            return proprios.OrderBy(item => item.Nome).ToList();

        List<ItemDto> oficiais = (await _itemService.GetAllAsync(VisibilidadeOficial(contexto, visivel), WikiEscopo.IdOficial))
            .Where(item => Compativel(item.IdSistemaRpg, item.IdSistemaVersao, item.AcompanharPublicacaoAtual, contexto))
            .ToList();
        return UnirPorId(oficiais, proprios, item => item.Iditem);
    }

    private async Task<CidadeDto?> EncontrarCidadeEfetivaAsync(Contexto contexto, int idCidade)
    {
        CidadeDto? propria = await _cidadeService.GetByIdAsync(idCidade, contexto.IdWikiEscopo);
        if (propria is not null)
            return contexto.Admin || contexto.PodeGerenciar || propria.Visivel ? propria : null;

        CidadeDto? oficial = await _cidadeService.GetByIdAsync(idCidade, WikiEscopo.IdOficial);
        return oficial is not null
            && (contexto.Admin || oficial.Visivel)
            && Compativel(oficial.IdSistemaRpg, null, true, contexto)
            ? oficial
            : null;
    }

    private async Task<RacaDto?> EncontrarRacaEfetivaAsync(Contexto contexto, int idRaca)
    {
        RacaDto? propria = await _racaService.GetByIdAsync(idRaca, contexto.IdMesa, contexto.IdWikiEscopo);
        if (propria is not null)
            return contexto.Admin || contexto.PodeGerenciar || propria.Visivel ? propria : null;

        RacaDto? oficial = await _racaService.GetByIdAsync(idRaca, contexto.IdMesa, WikiEscopo.IdOficial);
        return oficial is not null
            && (contexto.Admin || oficial.Visivel)
            && Compativel(oficial.IdSistemaRpg, oficial.IdSistemaVersao, oficial.AcompanharPublicacaoAtual ?? true, contexto)
            ? oficial
            : null;
    }

    private async Task<Personagen?> EncontrarPersonagemEfetivoAsync(Contexto contexto, int idPersonagem)
    {
        Personagen? proprio = await _personagemService.GetByIdAsync(idPersonagem, contexto.IdWikiEscopo);
        if (proprio is not null)
        {
            if (!contexto.Admin && !contexto.PodeGerenciar && !proprio.Visivel)
                return null;
            return proprio;
        }

        Personagen? oficial = await _personagemService.GetByIdAsync(idPersonagem, WikiEscopo.IdOficial);
        if (oficial is null || (!contexto.Admin && !oficial.Visivel) ||
            !Compativel(oficial.IdSistemaRpg, oficial.IdSistemaVersao, oficial.AcompanharPublicacaoAtual, contexto))
            return null;

        return oficial;
    }

    private static void AplicarVisibilidadePersonagem(Contexto contexto, Personagen personagem)
    {
        if (!contexto.Admin && !(contexto.PodeGerenciar && personagem.IdWikiEscopo == contexto.IdWikiEscopo))
            PersonagemVisibilidadeProjection.ApplyForExternalViewer(personagem);
    }

    private async Task SanitizarPersonagemParaParticipanteAsync(Contexto contexto, Personagen personagem)
    {
        if (contexto.Admin || (contexto.PodeGerenciar && personagem.IdWikiEscopo == contexto.IdWikiEscopo))
            return;

        AplicarVisibilidadePersonagem(contexto, personagem);
        await PersonagemVisibilidadeProjection.FilterInvisibleReferencesAsync(
            personagem,
            async id => await EncontrarRacaEfetivaAsync(contexto, id) is not null,
            async id => await EncontrarCidadeEfetivaAsync(contexto, id) is not null,
            async id => await EncontrarPersonagemEfetivoAsync(contexto, id) is { } alvo &&
                ((contexto.PodeGerenciar && alvo.IdWikiEscopo == contexto.IdWikiEscopo) ||
                 alvo.Visibilidade.Nome));
    }

    private async Task<ItemDto?> EncontrarItemEfetivoAsync(Contexto contexto, string idItem)
    {
        ItemDto? proprio = await _itemService.GetByIdAsync(idItem, contexto.IdWikiEscopo);
        if (proprio is not null)
            return contexto.Admin || contexto.PodeGerenciar || proprio.Visivel ? proprio : null;

        ItemDto? oficial = await _itemService.GetByIdAsync(idItem, WikiEscopo.IdOficial);
        return oficial is not null
            && (contexto.Admin || oficial.Visivel)
            && Compativel(oficial.IdSistemaRpg, oficial.IdSistemaVersao, oficial.AcompanharPublicacaoAtual, contexto)
            ? oficial
            : null;
    }

    private async Task SanitizarItemParaParticipanteAsync(Contexto contexto, ItemDto item)
    {
        if (contexto.Admin)
            return;

        if (!string.IsNullOrWhiteSpace(item.IditemBase) &&
            await EncontrarItemEfetivoAsync(contexto, item.IditemBase) is null)
        {
            item.IditemBase = null;
            item.SistemaRuntime = null;
        }

        if (item.Idpersonagem.HasValue &&
            (await EncontrarPersonagemEfetivoAsync(contexto, item.Idpersonagem.Value) is not { } alvo ||
             !(contexto.PodeGerenciar && alvo.IdWikiEscopo == contexto.IdWikiEscopo) && !alvo.Visibilidade.Nome))
        {
            item.Idpersonagem = null;
            item.SistemaRuntime = null;
        }
    }

    private async Task<string?> ValidarReferenciasPersonagemAsync(Contexto contexto, PersonagemDto dto)
    {
        RacaDto? raca = await EncontrarRacaEfetivaAsync(contexto, dto.Idraca);
        if (raca is null)
            return "A raça selecionada não pertence ao catálogo desta Mesa.";

        if (dto.Idcidade.HasValue && !contexto.Admin && await EncontrarCidadeEfetivaAsync(contexto, dto.Idcidade.Value) is null)
            return "A cidade selecionada não pertence ao catálogo desta Mesa.";

        if (dto.PersonagemsVinculados is not null)
        {
            foreach (int idPersonagem in dto.PersonagemsVinculados.Distinct())
            {
                if (!contexto.Admin && await EncontrarPersonagemEfetivoAsync(contexto, idPersonagem) is null)
                    return "Um personagem relacionado não pertence ao catálogo desta Mesa.";
            }
        }

        return null;
    }

    private async Task<string?> ValidarReferenciasItemAsync(Contexto contexto, int? idPersonagem, string? idItemBase)
    {
        if (idPersonagem.HasValue && await _personagemService.GetByIdAsync(idPersonagem.Value, contexto.IdWikiEscopo) is null)
            return "O personagem associado deve pertencer à Wiki desta Mesa.";

        if (!string.IsNullOrWhiteSpace(idItemBase) && !contexto.Admin && await EncontrarItemEfetivoAsync(contexto, idItemBase) is null)
            return "O item base selecionado não pertence ao catálogo desta Mesa.";

        return null;
    }

    private async Task<PageDto> SanitizarPaginaParaParticipanteAsync(Contexto contexto, PageDto pagina)
    {
        if (contexto.Admin || pagina.Blocks.Count == 0)
            return pagina;

        foreach (PageBlockDto bloco in pagina.Blocks.Where(block => block.Tipo == PageBlockType.Relation))
        {
            JsonElement raiz = bloco.Conteudo is JsonElement elemento
                ? elemento
                : JsonSerializer.SerializeToElement(bloco.Conteudo);
            IEnumerable<JsonElement> entradas = raiz.ValueKind == JsonValueKind.Array
                ? raiz.EnumerateArray().ToArray()
                : new[] { raiz };
            List<JsonElement> visiveis = new();

            foreach (JsonElement entrada in entradas)
            {
                if (entrada.ValueKind != JsonValueKind.Object ||
                    !TryGetProperty(entrada, "tipoEntidade", out JsonElement tipo) ||
                    !TryGetProperty(entrada, "idEntidade", out JsonElement id) ||
                    tipo.ValueKind != JsonValueKind.String)
                {
                    visiveis.Add(CriarReferenciaOculta());
                    continue;
                }

                string tipoEntidade = tipo.GetString()?.Trim() ?? string.Empty;
                string idEntidade = id.ValueKind == JsonValueKind.String
                    ? id.GetString()?.Trim() ?? string.Empty
                    : id.GetRawText();
                if (await ReferenciaPodeSerExibidaAsync(contexto, tipoEntidade, idEntidade))
                    visiveis.Add(JsonSerializer.SerializeToElement(new
                    {
                        tipoEntidade,
                        idEntidade,
                    }));
                else
                    visiveis.Add(CriarReferenciaOculta());
            }

            // Relações sempre são serializadas como lista no editor atual. Manter esse
            // formato também quando a versão antiga possuir uma única relação evita
            // expor referências que deixaram de ser elegíveis para a Mesa.
            bloco.Conteudo = JsonSerializer.SerializeToElement(visiveis);
        }

        return pagina;
    }

    private static JsonElement CriarReferenciaOculta() => JsonSerializer.SerializeToElement(new
    {
        tipoEntidade = "Oculto",
        idEntidade = Guid.NewGuid().ToString("N"),
        oculto = true,
    });

    private async Task<bool> ReferenciaPodeSerExibidaAsync(Contexto contexto, string tipo, string id)
    {
        if (!await ReferenciaVisivelNoCatalogoAsync(contexto, tipo, id))
            return false;

        if (!string.Equals(tipo, "personagem", StringComparison.OrdinalIgnoreCase) ||
            !int.TryParse(id, out int idPersonagem))
            return true;

        Personagen? personagem = await EncontrarPersonagemEfetivoAsync(contexto, idPersonagem);
        return personagem is not null &&
            ((contexto.PodeGerenciar && personagem.IdWikiEscopo == contexto.IdWikiEscopo) ||
             (personagem.Visibilidade.Nome && personagem.Visibilidade.PersonagensRelacionados));
    }

    private async Task<bool> ReferenciaVisivelNoCatalogoAsync(Contexto contexto, string tipo, string id)
    {
        return tipo.ToLowerInvariant() switch
        {
            "cidade" when int.TryParse(id, out int cidade) => await EncontrarCidadeEfetivaAsync(contexto, cidade) is not null,
            "raca" when int.TryParse(id, out int raca) => await EncontrarRacaEfetivaAsync(contexto, raca) is not null,
            "personagem" when int.TryParse(id, out int personagem) => await EncontrarPersonagemEfetivoAsync(contexto, personagem) is not null,
            "item" => await EncontrarItemEfetivoAsync(contexto, id) is not null,
            "page" or "pagina" or "página" when int.TryParse(id, out int pagina) =>
                await PaginaReferenciavelAsync(contexto, pagina),
            _ => false,
        };
    }

    private async Task<bool> PaginaReferenciavelAsync(Contexto contexto, int idPagina)
    {
        PageDto? propria = await _pageService.GetByIdAsync(idPagina, false, contexto.IdWikiEscopo);
        if (propria is not null)
            return contexto.Admin || contexto.PodeGerenciar || propria.Visivel;

        PageDto? oficial = await _pageService.GetByIdAsync(idPagina, false, WikiEscopo.IdOficial);
        return oficial is not null && (contexto.Admin || oficial.Visivel) &&
            Compativel(oficial.IdSistemaRpg, null, true, contexto);
    }

    private async Task<string?> ValidarReferenciasPaginaAsync(Contexto contexto, IEnumerable<PageBlockDto> blocks)
    {
        if (blocks.Any(block => block.Tipo == PageBlockType.Infolore))
            return "Páginas da Wiki da Mesa não podem referenciar InfoLore global.";

        foreach ((string tipo, string id) in ExtrairReferencias(blocks))
        {
            bool existe = await ReferenciaVisivelNoCatalogoAsync(contexto, tipo, id);

            if (!existe)
                return $"A referência {tipo} ({id}) não pertence ao catálogo visível desta Mesa.";
        }

        return null;
    }

    private static IEnumerable<(string Tipo, string Id)> ExtrairReferencias(IEnumerable<PageBlockDto> blocks)
    {
        foreach (PageBlockDto block in blocks.Where(block => block.Tipo == PageBlockType.Relation))
        {
            JsonElement raiz = block.Conteudo is JsonElement elemento
                ? elemento
                : JsonSerializer.SerializeToElement(block.Conteudo);
            IEnumerable<JsonElement> entradas = raiz.ValueKind == JsonValueKind.Array
                ? raiz.EnumerateArray().ToArray()
                : new[] { raiz };

            foreach (JsonElement entrada in entradas)
            {
                if (entrada.ValueKind != JsonValueKind.Object ||
                    !TryGetProperty(entrada, "tipoEntidade", out JsonElement tipo) ||
                    !TryGetProperty(entrada, "idEntidade", out JsonElement id) ||
                    tipo.ValueKind != JsonValueKind.String)
                    continue;

                string valorTipo = tipo.GetString()?.Trim() ?? string.Empty;
                string valorId = id.ValueKind == JsonValueKind.String
                    ? id.GetString()?.Trim() ?? string.Empty
                    : id.GetRawText();
                if (!string.IsNullOrWhiteSpace(valorTipo) && !string.IsNullOrWhiteSpace(valorId))
                    yield return (valorTipo, valorId);
            }
        }
    }

    private static bool TryGetProperty(JsonElement element, string nome, out JsonElement valor)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, nome, StringComparison.OrdinalIgnoreCase))
            {
                valor = property.Value;
                return true;
            }
        }

        valor = default;
        return false;
    }

    private static bool Compativel(int? idSistemaRpg, int? idSistemaVersao, bool acompanharAtual, Contexto contexto)
    {
        if (!idSistemaRpg.HasValue)
            return true;
        if (!contexto.IdSistemaRpg.HasValue || idSistemaRpg != contexto.IdSistemaRpg)
            return false;
        return acompanharAtual || !idSistemaVersao.HasValue || idSistemaVersao == contexto.IdSistemaVersao;
    }

    private static WikiMesaBuscaItemDto Busca(int? id, string? idString, string nome, string? imagem, bool visivel, bool destaque, string? slug, string tipo) => new()
    {
        Id = id,
        IdString = idString,
        Nome = nome,
        Imagem = imagem,
        Visivel = visivel,
        Destaque = destaque,
        Slug = slug,
        TipoEntidade = tipo,
    };

    private static void AplicarVinculoDaMesa(RacaDto dto, Contexto contexto)
    {
        dto.IdSistemaRpg = contexto.IdSistemaRpg;
        dto.IdSistemaVersao = contexto.IdSistemaVersao;
        dto.AcompanharPublicacaoAtual = false;
    }

    private static void AplicarVinculoDaMesa(PersonagemDto dto, Contexto contexto)
    {
        dto.IdSistemaRpg = contexto.IdSistemaRpg;
        dto.IdSistemaVersao = contexto.IdSistemaVersao;
        dto.AcompanharPublicacaoAtual = false;
    }

    private static void AplicarVinculoDaMesa(ItemCreateDto dto, Contexto contexto)
    {
        dto.IdSistemaRpg = contexto.IdSistemaRpg;
        dto.IdSistemaVersao = contexto.IdSistemaVersao;
        dto.AcompanharPublicacaoAtual = false;
    }

    private static bool? VisibilidadePropria(Contexto contexto, bool? solicitada) =>
        contexto.PodeGerenciar ? solicitada : true;

    private static bool? VisibilidadeOficial(Contexto contexto, bool? solicitada) =>
        contexto.Admin ? solicitada : true;

    private static List<T> UnirPorId<T, TKey>(IEnumerable<T> oficiais, IEnumerable<T> proprios, Func<T, TKey> chave)
        where TKey : notnull => oficiais
        .Concat(proprios)
        .GroupBy(chave)
        .Select(grupo => grupo.Last())
        .ToList();

    private static List<T> SobrescreverPorChave<T>(IEnumerable<T> oficiais, IEnumerable<T> proprios, Func<T, string> chave) => oficiais
        .Concat(proprios)
        .GroupBy(chave, StringComparer.OrdinalIgnoreCase)
        .Select(grupo => grupo.Last())
        .OrderBy(item => chave(item))
        .ToList();

    private static WikiMesaOperacaoResultado<T> Falha<T>(WikiMesaOperacaoResultado<Contexto> origem) =>
        WikiMesaOperacaoResultado<T>.Falha(origem.Erro, origem.MensagemErro ?? "Não foi possível acessar a Wiki da Mesa.");

    private static WikiMesaOperacaoResultado<T> Validacao<T>(string mensagem) =>
        WikiMesaOperacaoResultado<T>.Falha(WikiMesaOperacaoErro.Validacao, mensagem);

    private static WikiMesaOperacaoResultado<T> NaoEncontrado<T>() =>
        WikiMesaOperacaoResultado<T>.Falha(WikiMesaOperacaoErro.NaoEncontrado, "Conteúdo não encontrado nesta Wiki.");

    private sealed record Contexto(
        int IdMesa,
        int IdWikiEscopo,
        int? IdSistemaRpg,
        int? IdSistemaVersao,
        bool PodeGerenciar,
        bool Admin)
    {
        public WikiMesaContextoDto Dto => new()
        {
            IdMesa = IdMesa,
            IdWikiEscopo = IdWikiEscopo,
            IdSistemaRpg = IdSistemaRpg,
            IdSistemaVersao = IdSistemaVersao,
            PodeGerenciar = PodeGerenciar,
        };
    }
}
