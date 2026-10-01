using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class MesaPersonagemService : IMesaPersonagemService
{
    private readonly IMesaRepository _mesaRepository;
    private readonly IPersonagemJogadorService _personagemService;
    private readonly IMesaService _mesaService;
    private readonly IPersonagemJogadorRepository? _personagemRepository;
    private readonly IPersonagemService? _npcService;
    private readonly IWikiMesaService? _wikiMesaService;
    private readonly IMesaRealtimeNotifier _realtime;

    public MesaPersonagemService(
        IMesaRepository mesaRepository,
        IPersonagemJogadorService personagemService,
        IMesaService mesaService,
        IPersonagemJogadorRepository? personagemRepository = null,
        IPersonagemService? npcService = null,
        IWikiMesaService? wikiMesaService = null,
        IMesaRealtimeNotifier? realtime = null)
    {
        _mesaRepository = mesaRepository;
        _personagemService = personagemService;
        _mesaService = mesaService;
        _personagemRepository = personagemRepository;
        _npcService = npcService;
        _wikiMesaService = wikiMesaService;
        _realtime = realtime ?? new NullMesaRealtimeNotifier();
    }

    public async Task<MesaOperacaoResultado<MesaPersonagensGerenciamentoDto>> GetManagementAsync(
        int idMesa,
        int idUsuario,
        bool admin)
    {
        Mesa? mesa = await _mesaRepository.GetByIdAsync(idMesa);
        if (mesa is null || mesa.PadraoSistema)
            return MesaOperacaoResultado<MesaPersonagensGerenciamentoDto>.Falha(
                MesaOperacaoErro.NaoEncontrado,
                "Mesa não encontrada.");
        if (!admin && mesa.IdusuarioCriacao != idUsuario)
            return MesaOperacaoResultado<MesaPersonagensGerenciamentoDto>.Falha(
                MesaOperacaoErro.Proibido,
                "Somente o mestre pode consultar todos os personagens da Mesa.");

        HashSet<int> participantes = await _mesaRepository.GetParticipantUserIdsAsync(idMesa);
        List<PersonagemJogadorDto> personagens = (await _personagemService.GetByMesaIdAsync(idMesa))
            .Where(personagem => !personagem.InstanciaNpcMesa && participantes.Contains(personagem.Idusuario))
            .ToList();
        MesaOperacaoResultado<MesaResumoDto> mesaResumo =
            await _mesaService.GetPublicPageAsync(idMesa, idUsuario);
        if (!mesaResumo.Sucesso || mesaResumo.Dados is null)
            return MesaOperacaoResultado<MesaPersonagensGerenciamentoDto>.Falha(
                MesaOperacaoErro.NaoEncontrado,
                "Mesa não encontrada.");

        return MesaOperacaoResultado<MesaPersonagensGerenciamentoDto>.Ok(
            new MesaPersonagensGerenciamentoDto
            {
                Mesa = mesaResumo.Dados,
                Personagens = personagens.Select(personagem => MapPersonagem(personagem, idUsuario)).ToList(),
            });
    }

    public async Task<MesaOperacaoResultado<MesaAoVivoSnapshotDto>> GetLiveAsync(
        int idMesa,
        int idUsuario,
        bool admin)
    {
        Mesa? mesa = await _mesaRepository.GetByIdAsync(idMesa);
        if (mesa is null || mesa.PadraoSistema)
            return MesaOperacaoResultado<MesaAoVivoSnapshotDto>.Falha(
                MesaOperacaoErro.NaoEncontrado,
                "Mesa não encontrada.");
        bool podeAcessar = admin || await _mesaRepository.UsuarioPodeAcessarMesaSocialAsync(idMesa, idUsuario);
        if (!podeAcessar)
            return MesaOperacaoResultado<MesaAoVivoSnapshotDto>.Falha(
                MesaOperacaoErro.Proibido,
                "Somente participantes podem acessar a Mesa em jogo.");

        HashSet<int> participantes = await _mesaRepository.GetParticipantUserIdsAsync(idMesa);
        List<MesaPersonagemResumoDto> personagens = new();
        List<MesaPersonagemResumoDto> personagensCena = new();
        foreach (PersonagemJogadorDto personagem in await _personagemService.GetByMesaIdAsync(idMesa))
        {
            if (personagem.InstanciaNpcMesa)
            {
                bool mestreOuAdminNpc = admin || mesa.IdusuarioCriacao == idUsuario;
                if (personagem.Visivel || mestreOuAdminNpc)
                {
                    if (!mestreOuAdminNpc)
                        PersonagemVisibilidadeProjection.ApplyForExternalViewer(personagem);
                    MesaPersonagemResumoDto mapped = MapPersonagem(personagem, idUsuario);
                    mapped.PodeAtualizarFichaOriginal = await PodeAtualizarFichaOriginalAsync(
                        idMesa,
                        idUsuario,
                        admin,
                        personagem);
                    personagensCena.Add(mapped);
                }
                continue;
            }

            if (!participantes.Contains(personagem.Idusuario) ||
                (!personagem.Visivel && personagem.Idusuario != idUsuario)) continue;

            bool proprio = personagem.Idusuario == idUsuario;
            // Na Mesa em jogo, o administrador só tem visão integral pela área de
            // gerenciamento. A visualização compartilhada respeita a privacidade
            // de todos os demais jogadores, inclusive quando o observador é admin.
            if (!proprio)
                PersonagemVisibilidadeProjection.ApplyForExternalViewer(personagem);
            personagens.Add(MapPersonagem(personagem, idUsuario));
        }

        MesaOperacaoResultado<MesaResumoDto> mesaResumo =
            await _mesaService.GetPublicPageAsync(idMesa, idUsuario);
        if (!mesaResumo.Sucesso || mesaResumo.Dados is null)
            return MesaOperacaoResultado<MesaAoVivoSnapshotDto>.Falha(
                MesaOperacaoErro.NaoEncontrado,
                "Mesa não encontrada.");

        bool mestreOuAdmin = admin || mesa.IdusuarioCriacao == idUsuario;
        // Fora da sessao cada jogador ainda pode consultar a propria ficha para
        // testes sem persistencia, sem expor os personagens dos demais.
        IReadOnlyCollection<MesaPersonagemResumoDto> personagensVisiveis = mesa.AoVivo || mestreOuAdmin
            ? personagens
            : personagens.Where(item => item.IdUsuarioDono == idUsuario).ToList();

        return MesaOperacaoResultado<MesaAoVivoSnapshotDto>.Ok(new MesaAoVivoSnapshotDto
        {
            Mesa = mesaResumo.Dados,
            Personagens = personagensVisiveis,
            PersonagensCena = mesa.AoVivo || mestreOuAdmin
                ? personagensCena
                : Array.Empty<MesaPersonagemResumoDto>(),
            Participantes = participantes.Count,
            JogadoresOnline = 0,
            TurnoAtual = "Mestre",
            AtualizadoEm = DateTime.UtcNow,
        });
    }

    public async Task<MesaOperacaoResultado<IReadOnlyCollection<MesaNpcCatalogoDto>>> SearchNpcCatalogAsync(
        int idMesa, int idUsuario, bool admin, string? term)
    {
        MesaOperacaoResultado<Mesa> access = await GetManageableMesaAsync(idMesa, idUsuario, admin);
        if (!access.Sucesso) return ConvertFailure<Mesa, IReadOnlyCollection<MesaNpcCatalogoDto>>(access);
        if (_wikiMesaService is null)
            return MesaOperacaoResultado<IReadOnlyCollection<MesaNpcCatalogoDto>>.Falha(
                MesaOperacaoErro.Conflito, "O catálogo de NPCs não está disponível.");

        WikiMesaOperacaoResultado<List<Personagen>> result = await _wikiMesaService.GetPersonagensAsync(
            idMesa, idUsuario, admin, somenteProprios: false, visivel: true);
        if (!result.Sucesso || result.Dados is null)
            return MesaOperacaoResultado<IReadOnlyCollection<MesaNpcCatalogoDto>>.Falha(
                MesaOperacaoErro.Conflito, result.MensagemErro ?? "Não foi possível consultar os NPCs.");

        string normalized = term?.Trim() ?? string.Empty;
        IReadOnlyCollection<MesaNpcCatalogoDto> items = result.Dados
            .Select(item => new MesaNpcCatalogoDto
            {
                IdPersonagem = item.Idpersonagem,
                // O nome oculto continua sem ser pesquisável ou retornado; o
                // mestre recebe apenas um rótulo neutro para poder selecionar a ficha.
                Nome = string.IsNullOrWhiteSpace(item.Nome) ? "Personagem sem nome visível" : item.Nome,
                Imagem = item.Imagem,
                Generico = ReadIsGeneric(item.StatusJson),
                Variantes = ReadVariants(item.StatusJson),
            })
            .Where(item => normalized.Length == 0 || item.Nome.Contains(normalized, StringComparison.OrdinalIgnoreCase) ||
                item.Variantes.Any(variant => variant.Nome.Contains(normalized, StringComparison.OrdinalIgnoreCase)))
            .OrderBy(item => item.Nome)
            .Take(40)
            .ToArray();
        return MesaOperacaoResultado<IReadOnlyCollection<MesaNpcCatalogoDto>>.Ok(items);
    }

    public async Task<MesaOperacaoResultado<MesaPersonagemResumoDto>> AddNpcInstanceAsync(
        int idMesa, int idUsuario, bool admin, MesaNpcAdicionarDto dto)
    {
        MesaOperacaoResultado<Mesa> access = await GetManageableMesaAsync(idMesa, idUsuario, admin);
        if (!access.Sucesso) return ConvertFailure<Mesa, MesaPersonagemResumoDto>(access);
        if (_personagemRepository is null || _wikiMesaService is null)
            return MesaOperacaoResultado<MesaPersonagemResumoDto>.Falha(
                MesaOperacaoErro.Conflito, "Não foi possível criar a cópia do NPC.");

        WikiMesaOperacaoResultado<Personagen> sourceResult = await _wikiMesaService.GetPersonagemAsync(
            idMesa, idUsuario, admin, dto.IdPersonagemOrigem);
        if (!sourceResult.Sucesso || sourceResult.Dados is null)
            return MesaOperacaoResultado<MesaPersonagemResumoDto>.Falha(
                MesaOperacaoErro.NaoEncontrado, "NPC não encontrado no catálogo desta Mesa.");

        Personagen source = sourceResult.Dados;
        Personagen sheetSource = source;
        if (!admin && source.IdWikiEscopo == WikiEscopo.IdOficial)
        {
            if (!source.Visibilidade.Raca || source.Idraca <= 0)
                return MesaOperacaoResultado<MesaPersonagemResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "Este NPC oficial precisa ter uma raça visível para ser copiado.");

            // O mestre da Mesa não é o administrador da Wiki oficial. Projetar
            // uma cópia evita tanto o vazamento de campos ocultos quanto a
            // alteração acidental da entidade original rastreada pelo EF.
            sheetSource = new Personagen
            {
                Idpersonagem = source.Idpersonagem,
                IdWikiEscopo = source.IdWikiEscopo,
                Nome = source.Nome,
                Idraca = source.Idraca,
                Idcidade = source.Idcidade,
                StatusJson = source.StatusJson,
                InventarioJson = source.InventarioJson,
                Skills = source.Skills,
                Magia = source.Magia,
                Alinhamento = source.Alinhamento,
                Tracos = source.Tracos,
                Costumes = source.Costumes,
                Imagem = source.Imagem,
                GaleriaImagem = source.GaleriaImagem,
                Historia = source.Historia,
                PersonagemsVinculados = source.PersonagemsVinculados,
                Nanites = source.Nanites,
                Implantes = source.Implantes,
                Idpassiva = source.Idpassiva,
                Ultimate = source.Ultimate,
                Visibilidade = source.Visibilidade,
            };
            PersonagemVisibilidadeProjection.ApplyForExternalViewer(sheetSource);
        }

        NpcSheetSnapshot? sheet = BuildNpcSheetSnapshot(sheetSource, dto.IdVarianteOrigem);
        if (sheet is null)
            return MesaOperacaoResultado<MesaPersonagemResumoDto>.Falha(
                MesaOperacaoErro.Validacao, "Selecione uma variante válida para este NPC.");

        int copyNumber = (await _personagemService.GetByMesaIdAsync(idMesa)).Count(item =>
            item.IdPersonagemOrigem == source.Idpersonagem &&
            string.Equals(item.IdVarianteOrigem, sheet.VariantId, StringComparison.Ordinal));
        // Nunca use o nome da entidade original depois da projeção: ela ainda
        // pode conter o valor real embora o campo esteja oculto para este mestre.
        bool sourceNameVisible = admin || source.IdWikiEscopo != WikiEscopo.IdOficial || source.Visibilidade.Nome;
        string visibleName = sourceNameVisible && !string.IsNullOrWhiteSpace(sheetSource.Nome)
            ? sheetSource.Nome
            : "NPC da Mesa";
        string baseName = sourceNameVisible && !string.IsNullOrWhiteSpace(sheet.VariantName)
            ? $"{visibleName} — {sheet.VariantName}"
            : visibleName;
        string name = copyNumber == 0 ? baseName : $"{baseName} {copyNumber + 1}";
        if (name.Length > 100) name = name[..100];

        PersonagemJogador created = await _personagemRepository.CreateAsync(new PersonagemJogador
        {
            Nome = name,
            Idraca = sheetSource.Idraca,
            Idcidade = sheetSource.Idcidade,
            Idmesa = idMesa,
            Idusuario = access.Dados!.IdusuarioCriacao ?? idUsuario,
            IdSistemaVersao = access.Dados.IdSistemaVersao,
            IdPersonagemOrigem = source.Idpersonagem,
            IdVarianteOrigem = sheet.VariantId,
            Visivel = false,
            StatusJson = sheet.StatusJson,
            InventarioJson = sheet.InventoryJson,
            Skills = sheet.SkillsJson,
            Magia = sheet.MagicJson,
            Alinhamento = sheetSource.Alinhamento,
            Tracos = sheetSource.Tracos,
            Costumes = sheetSource.Costumes,
            Imagem = sheetSource.Imagem,
            GaleriaImagem = sheetSource.GaleriaImagem,
            Historia = sheetSource.Historia,
            PersonagemsVinculados = sheetSource.PersonagemsVinculados,
            Nanites = sheetSource.Nanites,
            Implantes = sheetSource.Implantes,
            Idpassiva = sheetSource.Idpassiva,
            Ultimate = sheetSource.Ultimate,
            DataCriacao = DateTime.UtcNow,
        });
        await _realtime.NotificarPersonagemAlteradoAsync(idMesa, created.IdpersonagemJogador);
        PersonagemJogadorDto? detailed = await _personagemService.GetByIdAsync(created.IdpersonagemJogador);
        return detailed is null
            ? MesaOperacaoResultado<MesaPersonagemResumoDto>.Falha(MesaOperacaoErro.Conflito, "A cópia foi criada, mas não pôde ser carregada.")
            : MesaOperacaoResultado<MesaPersonagemResumoDto>.Ok(
                await MapPersonagemComPermissoesAsync(idMesa, idUsuario, admin, detailed));
    }

    public async Task<MesaOperacaoResultado<bool>> SetNpcVisibilityAsync(
        int idMesa, int idPersonagemJogador, int idUsuario, bool admin, bool visivel)
    {
        MesaOperacaoResultado<Mesa> access = await GetManageableMesaAsync(idMesa, idUsuario, admin);
        if (!access.Sucesso) return ConvertFailure<Mesa, bool>(access);
        PersonagemJogadorDto? npc = await _personagemService.GetByIdAsync(idPersonagemJogador);
        if (npc is null || npc.Idmesa != idMesa || !npc.InstanciaNpcMesa)
            return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "NPC da Mesa não encontrado.");
        bool? updated = await _personagemService.AtualizarVisivelAsync(idPersonagemJogador, visivel);
        return updated.HasValue
            ? MesaOperacaoResultado<bool>.Ok(updated.Value)
            : MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "NPC da Mesa não encontrado.");
    }

    public async Task<MesaOperacaoResultado<bool>> RemoveNpcInstanceAsync(
        int idMesa, int idPersonagemJogador, int idUsuario, bool admin)
    {
        MesaOperacaoResultado<Mesa> access = await GetManageableMesaAsync(idMesa, idUsuario, admin);
        if (!access.Sucesso) return ConvertFailure<Mesa, bool>(access);
        PersonagemJogadorDto? npc = await _personagemService.GetByIdAsync(idPersonagemJogador);
        if (npc is null || npc.Idmesa != idMesa || !npc.InstanciaNpcMesa)
            return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "NPC da Mesa não encontrado.");
        return await _personagemService.DeleteAsync(idPersonagemJogador)
            ? MesaOperacaoResultado<bool>.Ok(true)
            : MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Conflito, "Não foi possível remover o NPC da Mesa.");
    }

    public async Task<MesaOperacaoResultado<bool>> PublishNpcInstanceAsync(
        int idMesa, int idPersonagemJogador, int idUsuario, bool admin)
    {
        MesaOperacaoResultado<Mesa> access = await GetManageableMesaAsync(idMesa, idUsuario, admin);
        if (!access.Sucesso) return ConvertFailure<Mesa, bool>(access);
        if (_npcService is null || _wikiMesaService is null)
            return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Conflito, "A publicação do NPC não está disponível.");

        PersonagemJogadorDto? instance = await _personagemService.GetByIdAsync(idPersonagemJogador);
        if (instance is null || instance.Idmesa != idMesa || !instance.IdPersonagemOrigem.HasValue)
            return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "NPC da Mesa não encontrado.");
        WikiMesaOperacaoResultado<Personagen> sourceResult = await _wikiMesaService.GetPersonagemAsync(
            idMesa, idUsuario, admin, instance.IdPersonagemOrigem.Value);
        if (!sourceResult.Sucesso || sourceResult.Dados is null)
            return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "A ficha original não está mais disponível.");

        Personagen source = sourceResult.Dados;
        if (!admin && source.IdWikiEscopo == WikiEscopo.IdOficial)
            return MesaOperacaoResultado<bool>.Falha(
                MesaOperacaoErro.Proibido,
                "Somente o administrador do site pode atualizar NPCs da Wiki oficial.");
        PersonagemDto update = BuildPublishedNpc(source, instance);
        ResultPersonagem result;
        if (source.IdWikiEscopo == WikiEscopo.IdOficial)
        {
            result = await _npcService.UpdateAsync(source.Idpersonagem, update);
        }
        else
        {
            WikiMesaOperacaoResultado<ResultPersonagem> scoped = await _wikiMesaService.AtualizarPersonagemAsync(
                idMesa, idUsuario, admin, source.Idpersonagem, update);
            if (!scoped.Sucesso || scoped.Dados is null)
                return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Validacao, scoped.MensagemErro ?? "Não foi possível atualizar a ficha original.");
            result = scoped.Dados;
        }
        return result.Sucesso
            ? MesaOperacaoResultado<bool>.Ok(true)
            : MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Validacao, result.MensagemErro ?? "Não foi possível atualizar a ficha original.");
    }

    private async Task<MesaOperacaoResultado<Mesa>> GetManageableMesaAsync(
        int idMesa,
        int idUsuario,
        bool admin)
    {
        Mesa? mesa = await _mesaRepository.GetByIdAsync(idMesa);
        if (mesa is null || mesa.PadraoSistema)
            return MesaOperacaoResultado<Mesa>.Falha(MesaOperacaoErro.NaoEncontrado, "Mesa não encontrada.");
        if (!admin && mesa.IdusuarioCriacao != idUsuario)
            return MesaOperacaoResultado<Mesa>.Falha(
                MesaOperacaoErro.Proibido,
                "Somente o mestre pode gerenciar os NPCs da Mesa.");
        return MesaOperacaoResultado<Mesa>.Ok(mesa);
    }

    private static MesaOperacaoResultado<TDestino> ConvertFailure<TOrigem, TDestino>(
        MesaOperacaoResultado<TOrigem> result)
        => MesaOperacaoResultado<TDestino>.Falha(
            result.Erro,
            result.Mensagem ?? "Não foi possível concluir a operação.");

    private static bool ReadIsGeneric(string? statusJson)
        => DeserializeJson<PersonagemStatus>(statusJson)?.generico == true;

    private static IReadOnlyCollection<MesaNpcVarianteDto> ReadVariants(string? statusJson)
        => DeserializeJson<PersonagemStatus>(statusJson)?.variantes
            .Select((item, index) => new { Item = item, Index = index })
            .Where(entry => !string.IsNullOrWhiteSpace(entry.Item.id))
            .Select(entry => new MesaNpcVarianteDto
            {
                Id = entry.Item.id,
                // Nome pode ter sido removido pela projeção de visibilidade.
                // Mantenha a variante selecionável sem devolver seu nome secreto.
                Nome = string.IsNullOrWhiteSpace(entry.Item.nome)
                    ? $"Variante {entry.Index + 1}"
                    : entry.Item.nome,
            })
            .ToArray()
            ?? Array.Empty<MesaNpcVarianteDto>();

    private static NpcSheetSnapshot? BuildNpcSheetSnapshot(Personagen source, string? variantId)
    {
        PersonagemStatus? root = DeserializeJson<PersonagemStatus>(source.StatusJson);
        if (root is null) return null;

        PersonagemFichaStatus sheet = root;
        string? selectedVariantId = null;
        string? selectedVariantName = null;
        List<OdisseiaWiki.Dtos.Item> inventory = DeserializeJson<List<OdisseiaWiki.Dtos.Item>>(source.InventarioJson) ?? new();
        List<Skills> skills = DeserializeJson<List<Skills>>(source.Skills) ?? new();
        List<Magia> magic = DeserializeJson<List<Magia>>(source.Magia) ?? new();

        if (root.generico)
        {
            PersonagemVariante? variant = root.variantes.FirstOrDefault(item =>
                string.Equals(item.id, variantId, StringComparison.Ordinal));
            if (variant is null) return null;
            sheet = variant.statusJson;
            selectedVariantId = variant.id;
            selectedVariantName = variant.nome;
            inventory = variant.inventarioJson;
            skills = variant.skills;
            magic = variant.magia;
        }

        // Campos ocultos foram removidos pela projeção de visibilidade. Recrie
        // apenas a estrutura obrigatória com valores neutros, para não propagar
        // os valores da origem nem deixar a ficha da Mesa estruturalmente inválida.
        sheet.status ??= new StatusBase();
        sheet.atributos ??= new Atributos();
        sheet.atributos.principais ??= new Principais();
        sheet.atributos.secundarios ??= new Secundarios();
        sheet.defesas ??= new Defesas();

        return new NpcSheetSnapshot(
            JsonSerializer.Serialize(sheet),
            JsonSerializer.Serialize(inventory),
            JsonSerializer.Serialize(skills),
            JsonSerializer.Serialize(magic),
            selectedVariantId,
            selectedVariantName);
    }

    private static PersonagemDto BuildPublishedNpc(Personagen source, PersonagemJogadorDto instance)
    {
        PersonagemStatus original = DeserializeJson<PersonagemStatus>(source.StatusJson) ?? new PersonagemStatus();
        PersonagemFichaStatus current = DeserializeObject<PersonagemFichaStatus>(instance.StatusJson) ?? original;
        List<OdisseiaWiki.Dtos.Item> inventory = DeserializeObject<List<OdisseiaWiki.Dtos.Item>>(instance.InventarioJson) ?? new();
        List<Skills> skills = DeserializeObject<List<Skills>>(instance.Skills) ?? new();
        List<Magia> magic = DeserializeObject<List<Magia>>(instance.Magia) ?? new();

        if (original.generico && !string.IsNullOrWhiteSpace(instance.IdVarianteOrigem))
        {
            PersonagemVariante? variant = original.variantes.FirstOrDefault(item =>
                string.Equals(item.id, instance.IdVarianteOrigem, StringComparison.Ordinal));
            if (variant is not null)
            {
                variant.statusJson = current;
                variant.inventarioJson = inventory;
                variant.skills = skills;
                variant.magia = magic;
            }
        }
        else
        {
            original.status = current.status;
            original.atributos = current.atributos;
            original.nivel = current.nivel;
            original.xp = current.xp;
            original.pontos = current.pontos;
            original.pontosAtributo = current.pontosAtributo;
            original.pontosSkill = current.pontosSkill;
            original.pontosUltimate = current.pontosUltimate;
            original.condicioes = current.condicioes;
            original.defesas = current.defesas;
        }

        return new PersonagemDto
        {
            Nome = source.Nome,
            Idraca = instance.Idraca,
            Idcidade = instance.Idcidade,
            Historia = ReadJsonElement(source.Historia),
            Imagem = instance.Imagem ?? source.Imagem,
            GaleriaImagem = DeserializeJson<List<ImagemGaleriaDto>>(source.GaleriaImagem),
            Costumes = instance.Costumes ?? DeserializeJson<List<string>>(source.Costumes),
            Alinhamento = instance.Alinhamento ?? source.Alinhamento,
            Tracos = instance.Tracos ?? DeserializeJson<List<string>>(source.Tracos),
            Nanites = int.TryParse(source.Nanites, out int nanites) ? nanites : null,
            Tags = DeserializeJson<List<string>>(source.Tags),
            Implantes = DeserializeJson<List<int>>(source.Implantes),
            Idpassiva = instance.Idpassiva ?? source.Idpassiva,
            Visivel = source.Visivel,
            Destaque = source.Destaque,
            IdSistemaRpg = source.IdSistemaRpg,
            IdSistemaVersao = source.IdSistemaVersao,
            AcompanharPublicacaoAtual = source.AcompanharPublicacaoAtual,
            Ultimate = DeserializeObject<Ultimate>(instance.Ultimate) ?? DeserializeJson<Ultimate>(source.Ultimate),
            StatusJson = original,
            InventarioJson = original.generico ? DeserializeJson<List<OdisseiaWiki.Dtos.Item>>(source.InventarioJson) : inventory,
            Skills = original.generico ? DeserializeJson<List<Skills>>(source.Skills) : skills,
            Magia = original.generico ? DeserializeJson<List<Magia>>(source.Magia) : magic,
            PersonagemsVinculados = DeserializeJson<List<int>>(source.PersonagemsVinculados),
        };
    }

    private static T? DeserializeObject<T>(object? source)
    {
        if (source is null) return default;
        try
        {
            if (source is JsonElement element) return element.Deserialize<T>(JsonOptions);
            if (source is JsonNode node) return node.Deserialize<T>(JsonOptions);
            if (source is string text) return DeserializeJson<T>(text);
            return JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(source), JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static T? DeserializeJson<T>(string? source)
    {
        if (string.IsNullOrWhiteSpace(source)) return default;
        try
        {
            return JsonSerializer.Deserialize<T>(source, JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static JsonElement? ReadJsonElement(string? source)
    {
        if (string.IsNullOrWhiteSpace(source)) return null;
        try
        {
            return JsonSerializer.Deserialize<JsonElement>(source);
        }
        catch (JsonException)
        {
            return JsonSerializer.SerializeToElement(source);
        }
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed record NpcSheetSnapshot(
        string StatusJson,
        string InventoryJson,
        string SkillsJson,
        string MagicJson,
        string? VariantId,
        string? VariantName);

    private static MesaPersonagemResumoDto MapPersonagem(
        PersonagemJogadorDto personagem,
        int idUsuario)
    {
        StatusBaseDto status = new();
        status.vida = GetStatusNumber(personagem.StatusJson, "vida");
        status.vidaMaxima = GetStatusNumber(personagem.StatusJson, "vidaMaxima");
        status.estamina = GetStatusNumber(personagem.StatusJson, "estamina");
        status.estaminaMaxima = GetStatusNumber(personagem.StatusJson, "estaminaMaxima");
        status.mana = GetStatusNumber(personagem.StatusJson, "mana");
        status.manaMaxima = GetStatusNumber(personagem.StatusJson, "manaMaxima");
        status.capacidadeCarga = GetStatusNumber(personagem.StatusJson, "capacidadeCarga");
        int nivel = GetRootNumber(personagem.StatusJson, "nivel");
        int xp = GetRootNumber(personagem.StatusJson, "xp");
        return new MesaPersonagemResumoDto
        {
            Personagem = personagem,
            Status = status,
            Nivel = nivel,
            Xp = xp,
            IdUsuarioDono = personagem.Idusuario,
            DonoNome = personagem.AutorNome ?? string.Empty,
            DonoImagem = personagem.AutorImagem,
            Online = false,
            Morto = status.vida <= 0,
            InstanciaNpcMesa = personagem.InstanciaNpcMesa,
            IdPersonagemOrigem = personagem.IdPersonagemOrigem,
            IdVarianteOrigem = personagem.IdVarianteOrigem,
        };
    }

    private async Task<MesaPersonagemResumoDto> MapPersonagemComPermissoesAsync(
        int idMesa,
        int idUsuario,
        bool admin,
        PersonagemJogadorDto personagem)
    {
        MesaPersonagemResumoDto mapped = MapPersonagem(personagem, idUsuario);
        mapped.PodeAtualizarFichaOriginal = await PodeAtualizarFichaOriginalAsync(
            idMesa,
            idUsuario,
            admin,
            personagem);
        return mapped;
    }

    private async Task<bool> PodeAtualizarFichaOriginalAsync(
        int idMesa,
        int idUsuario,
        bool admin,
        PersonagemJogadorDto personagem)
    {
        if (!personagem.InstanciaNpcMesa || !personagem.IdPersonagemOrigem.HasValue)
            return false;
        if (admin)
            return true;
        if (_wikiMesaService is null)
            return false;

        WikiMesaOperacaoResultado<Personagen> source = await _wikiMesaService.GetPersonagemAsync(
            idMesa,
            idUsuario,
            admin: false,
            personagem.IdPersonagemOrigem.Value);
        return source.Sucesso
            && source.Dados is not null
            && source.Dados.IdWikiEscopo != WikiEscopo.IdOficial;
    }

    private static int GetStatusNumber(object? source, string property)
        => TryGetStatusNumber(source, property, out int value) ? value : 0;

    private static bool TryGetStatusNumber(object? source, string property, out int value)
    {
        value = 0;
        JsonObject? root = ToObject(source);
        JsonObject? status = FindProperty(root, "status") as JsonObject ?? root;
        return TryReadInt(FindProperty(status, property), out value);
    }

    private static int GetRootNumber(object? source, string property)
    {
        JsonObject? root = ToObject(source);
        return TryReadInt(FindProperty(root, property), out int value) ? value : 0;
    }

    private static JsonObject? ToObject(object? source)
    {
        if (source is null)
            return null;

        try
        {
            if (source is JsonObject jsonObject)
                return jsonObject;

            string raw = source switch
            {
                string value => value,
                JsonNode node => node.ToJsonString(),
                JsonElement element => element.GetRawText(),
                _ => JsonSerializer.Serialize(source),
            };

            // Fichas antigas e cópias de NPC podem trazer o JSON encapsulado
            // como string mais de uma vez. Aceitamos os formatos persistidos
            // antes de extrair os recursos usados pelo card da Mesa.
            for (int attempt = 0; attempt < 5; attempt++)
            {
                JsonNode? node = JsonNode.Parse(raw);
                if (node is JsonObject objectNode)
                    return objectNode;

                if (node is JsonValue jsonValue
                    && jsonValue.TryGetValue(out string? nested)
                    && !string.IsNullOrWhiteSpace(nested))
                {
                    raw = nested;
                    continue;
                }

                return null;
            }

            return null;
        }
        catch (Exception exception) when (exception is JsonException or NotSupportedException)
        {
            return null;
        }
    }

    private static JsonNode? FindProperty(JsonObject? source, string property)
        => source?.FirstOrDefault(item =>
            item.Key.Equals(property, StringComparison.OrdinalIgnoreCase)).Value;

    private static bool TryReadInt(JsonNode? node, out int value)
    {
        value = 0;
        if (node is not JsonValue jsonValue)
            return false;
        if (jsonValue.TryGetValue(out int integer))
        {
            value = integer;
            return true;
        }
        if (jsonValue.TryGetValue(out double number))
        {
            value = (int)Math.Round(number);
            return true;
        }
        return jsonValue.TryGetValue(out string? text) && int.TryParse(text, out value);
    }
}
