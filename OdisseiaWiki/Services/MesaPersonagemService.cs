using System.Text.Json;
using System.Text.Json.Nodes;
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

    public MesaPersonagemService(
        IMesaRepository mesaRepository,
        IPersonagemJogadorService personagemService,
        IMesaService mesaService)
    {
        _mesaRepository = mesaRepository;
        _personagemService = personagemService;
        _mesaService = mesaService;
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
            .Where(personagem => participantes.Contains(personagem.Idusuario))
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
        foreach (PersonagemJogadorDto personagem in await _personagemService.GetByMesaIdAsync(idMesa))
        {
            if (!participantes.Contains(personagem.Idusuario) || !personagem.Visivel)
                continue;

            bool morto = TryGetStatusNumber(personagem.StatusJson, "vida", out int vida) && vida <= 0;
            if (morto)
                continue;

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
        bool podeVerEstadoCompartilhado = mesa.AoVivo || mestreOuAdmin;

        return MesaOperacaoResultado<MesaAoVivoSnapshotDto>.Ok(new MesaAoVivoSnapshotDto
        {
            Mesa = mesaResumo.Dados,
            Personagens = podeVerEstadoCompartilhado ? personagens : Array.Empty<MesaPersonagemResumoDto>(),
            Participantes = participantes.Count,
            JogadoresOnline = 0,
            TurnoAtual = "Mestre",
            AtualizadoEm = DateTime.UtcNow,
        });
    }

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
        };
    }

    private static int GetStatusNumber(object? source, string property)
        => TryGetStatusNumber(source, property, out int value) ? value : 0;

    private static bool TryGetStatusNumber(object? source, string property, out int value)
    {
        value = 0;
        JsonObject? root = ToObject(source);
        JsonObject? status = FindProperty(root, "status") as JsonObject;
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
            return JsonSerializer.SerializeToNode(source) as JsonObject;
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
