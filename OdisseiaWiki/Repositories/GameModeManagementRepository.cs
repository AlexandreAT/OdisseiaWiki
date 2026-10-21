using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class GameModeManagementRepository : IGameModeManagementRepository
{
    private readonly OdisseiaContext _context;
    public GameModeManagementRepository(OdisseiaContext context) => _context = context;

    public async Task<IReadOnlyList<Item>> GetLootItemsAsync(CancellationToken cancellationToken) =>
        await _context.Itens.AsNoTracking()
            .Where(item => item.IdWikiEscopo == WikiEscopo.IdOficial && item.Visivel)
            .OrderBy(item => item.Nome).ToListAsync(cancellationToken);

    private async Task<(int ScopeId, int SystemId)?> GetScopeAsync(
        int idMesa, int idSistemaVersao, CancellationToken token)
    {
        var mesa = await _context.Mesas.AsNoTracking()
            .Where(entry => entry.Idmesa == idMesa)
            .Select(entry => new { entry.CodigoSistema, entry.IdSistemaVersao })
            .SingleOrDefaultAsync(token);
        var version = await _context.SistemaVersoes.AsNoTracking()
            .Where(entry => entry.IdSistemaVersao == idSistemaVersao)
            .Select(entry => new { entry.IdSistemaRpg, entry.SistemaRpg.Codigo }).SingleOrDefaultAsync(token);
        if (mesa is null || version is null) return null;
        int? mesaSystemId = mesa.IdSistemaVersao is int mesaVersionId
            ? await _context.SistemaVersoes.AsNoTracking()
                .Where(entry => entry.IdSistemaVersao == mesaVersionId)
                .Select(entry => (int?)entry.IdSistemaRpg).FirstOrDefaultAsync(token)
            : null;
        if (mesaSystemId != version.IdSistemaRpg && mesa.CodigoSistema != version.Codigo) return null;
        int? scope = await _context.WikiEscopos.AsNoTracking()
            .Where(entry => entry.IdMesa == idMesa).Select(entry => (int?)entry.IdWikiEscopo)
            .SingleOrDefaultAsync(token);
        return scope is int id ? (id, version.IdSistemaRpg) : null;
    }

    public async Task<IReadOnlyList<Item>> GetLootItemsAsync(
        int? idMesa, int idSistemaVersao, CancellationToken token)
    {
        if (idMesa is null) return await GetLootItemsAsync(token);
        var scope = await GetScopeAsync(idMesa.Value, idSistemaVersao, token);
        if (scope is null) return [];
        string[] replaced = await _context.Itens.AsNoTracking()
            .Where(item => item.IdWikiEscopo == scope.Value.ScopeId && item.IdOrigemGlobal != null)
            .Select(item => item.IdOrigemGlobal!).ToArrayAsync(token);
        return await _context.Itens.AsNoTracking()
            .Where(item => item.Visivel &&
                (item.IdWikiEscopo == scope.Value.ScopeId || item.IdWikiEscopo == WikiEscopo.IdOficial) &&
                (item.IdWikiEscopo != WikiEscopo.IdOficial || !replaced.Contains(item.Iditem)) &&
                (item.IdSistemaRpg == null || item.IdSistemaRpg == scope.Value.SystemId) &&
                (item.AcompanharPublicacaoAtual || item.IdSistemaVersao == null ||
                    item.IdSistemaVersao == idSistemaVersao))
            .OrderBy(item => item.Nome).ToListAsync(token);
    }

    public Task<int?> GetCurrentSystemVersionIdAsync(CancellationToken cancellationToken) =>
        _context.SistemasRpg.AsNoTracking()
            .Where(item => item.Codigo == "ODISSEIA" && item.Ativo)
            .Select(item => item.IdVersaoPublicada)
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<GameModeSystemVersionDto>> GetSystemVersionsAsync(CancellationToken cancellationToken)
    {
        int? current = await GetCurrentSystemVersionIdAsync(cancellationToken);
        var versions = await _context.SistemaVersoes.AsNoTracking()
            .Where(item => item.SistemaRpg.Codigo == "ODISSEIA" && item.SistemaRpg.Ativo &&
                item.Status != SistemaVersaoStatus.Rascunho)
            .OrderByDescending(item => item.DataPublicacao)
            .Select(item => new { item.IdSistemaVersao, item.NumeroVersao, item.Status })
            .ToListAsync(cancellationToken);
        return versions.Select(item => new GameModeSystemVersionDto(item.IdSistemaVersao,
            item.NumeroVersao, item.Status.ToString(), item.IdSistemaVersao == current)).ToArray();
    }

    public Task<GameModeVersion?> GetDraftByIdAsync(int id, CancellationToken cancellationToken) =>
        _context.GameModeVersions.FirstOrDefaultAsync(item => item.IdGameModeVersion == id &&
            item.Status == GameModeVersionStatus.Rascunho &&
            item.SistemaVersao.SistemaRpg.Ativo, cancellationToken);

    public async Task<IReadOnlyList<string>> GetAttackOutcomeCodesAsync(
        int idSistemaVersao, CancellationToken cancellationToken)
    {
        var rows = await _context.SistemaResultadosDado.AsNoTracking()
            .Where(item => item.IdSistemaVersao == idSistemaVersao && item.CodigoTeste == "ATAQUE_COMUM")
            .OrderBy(item => item.Ordem)
            .Select(item => new { item.CodigoResultado, item.Dado, item.QuantidadeDados })
            .ToListAsync(cancellationToken);
        return rows.Count == 0 || rows.Any(item => item.QuantidadeDados != 1 ||
            !string.Equals(item.Dado, "D20", StringComparison.OrdinalIgnoreCase))
            ? [] : rows.Select(item => item.CodigoResultado)
                .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    public async Task<string> GetDraftTemplateJsonAsync(CancellationToken cancellationToken) =>
        await _context.GameModeVersions.AsNoTracking()
            .Where(item => item.Codigo == "ROGUELIKE_MVP" &&
                item.Status == GameModeVersionStatus.Publicado)
            .OrderByDescending(item => item.PublicadaEmUtc)
            .ThenByDescending(item => item.IdGameModeVersion)
            .Select(item => item.ConfiguracaoJson)
            .FirstOrDefaultAsync(cancellationToken)
        ?? GameRunRepository.CreateBaseConfigurationForDraft();

    public async Task<IReadOnlyList<Personagen>> GetNpcCandidatesAsync(CancellationToken cancellationToken) =>
        await _context.Personagens.AsNoTracking()
            .Where(item => item.IdWikiEscopo == WikiEscopo.IdOficial && item.Visivel)
            .OrderBy(item => item.Nome)
            .Select(item => new Personagen
            {
                Idpersonagem = item.Idpersonagem, Nome = item.Nome, Visivel = item.Visivel,
                Idraca = item.Idraca, StatusJson = item.StatusJson, Imagem = item.Imagem,
                InventarioJson = item.InventarioJson, Implantes = item.Implantes,
                Skills = item.Skills, Magia = item.Magia,
            }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Personagen>> GetNpcCandidatesAsync(
        int? idMesa, int idSistemaVersao, CancellationToken token)
    {
        if (idMesa is null) return await GetNpcCandidatesAsync(token);
        var scope = await GetScopeAsync(idMesa.Value, idSistemaVersao, token);
        if (scope is null) return [];
        int[] replaced = await _context.Personagens.AsNoTracking()
            .Where(item => item.IdWikiEscopo == scope.Value.ScopeId && item.IdOrigemGlobal != null)
            .Select(item => item.IdOrigemGlobal!.Value).ToArrayAsync(token);
        return await _context.Personagens.AsNoTracking()
            .Where(item => item.Visivel &&
                (item.IdWikiEscopo == scope.Value.ScopeId || item.IdWikiEscopo == WikiEscopo.IdOficial) &&
                (item.IdWikiEscopo != WikiEscopo.IdOficial || !replaced.Contains(item.Idpersonagem)) &&
                (item.IdSistemaRpg == null || item.IdSistemaRpg == scope.Value.SystemId) &&
                (item.AcompanharPublicacaoAtual || item.IdSistemaVersao == null ||
                    item.IdSistemaVersao == idSistemaVersao))
            .OrderBy(item => item.Nome).Select(item => new Personagen
            {
                Idpersonagem = item.Idpersonagem, Nome = item.Nome, Visivel = item.Visivel,
                Idraca = item.Idraca, StatusJson = item.StatusJson, Imagem = item.Imagem,
                InventarioJson = item.InventarioJson, Implantes = item.Implantes,
                Skills = item.Skills, Magia = item.Magia,
            }).ToListAsync(token);
    }

    public Task<Personagen?> GetNpcAsync(int id, CancellationToken cancellationToken) =>
        _context.Personagens.AsNoTracking().FirstOrDefaultAsync(item =>
            item.Idpersonagem == id && item.IdWikiEscopo == WikiEscopo.IdOficial && item.Visivel,
            cancellationToken);

    public async Task<Personagen?> GetNpcAsync(int id, int? idMesa, int idSistemaVersao, CancellationToken token)
    {
        if (idMesa is null) return await GetNpcAsync(id, token);
        var scope = await GetScopeAsync(idMesa.Value, idSistemaVersao, token);
        if (scope is null) return null;
        int? replacement = await _context.Personagens.AsNoTracking()
            .Where(item => item.IdWikiEscopo == scope.Value.ScopeId && item.IdOrigemGlobal == id)
            .Select(item => (int?)item.Idpersonagem).FirstOrDefaultAsync(token);
        if (replacement is not null) return null;
        return await _context.Personagens.AsNoTracking().FirstOrDefaultAsync(item =>
            item.Idpersonagem == id && item.Visivel &&
            (item.IdWikiEscopo == scope.Value.ScopeId || item.IdWikiEscopo == WikiEscopo.IdOficial) &&
            (item.IdSistemaRpg == null || item.IdSistemaRpg == scope.Value.SystemId) &&
            (item.AcompanharPublicacaoAtual || item.IdSistemaVersao == null ||
                item.IdSistemaVersao == idSistemaVersao), token);
    }

    public Task<GameModeVersion?> GetLatestModeAsync(int idSistemaVersao, CancellationToken cancellationToken) =>
        _context.GameModeVersions.AsNoTracking()
            .Where(item => item.IdSistemaVersao == idSistemaVersao && item.Codigo == "ROGUELIKE_MVP" &&
                (item.Status == GameModeVersionStatus.Publicado || item.Status == GameModeVersionStatus.Rascunho))
            .OrderByDescending(item => item.Status == GameModeVersionStatus.Publicado)
            .ThenByDescending(item => item.PublicadaEmUtc)
            .ThenByDescending(item => item.IdGameModeVersion)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<GameModeVersion?> GetDraftAsync(int idSistemaVersao, CancellationToken cancellationToken) =>
        _context.GameModeVersions.FirstOrDefaultAsync(item =>
            item.IdSistemaVersao == idSistemaVersao && item.Codigo == "ROGUELIKE_MVP" &&
            item.Status == GameModeVersionStatus.Rascunho, cancellationToken);

    public async Task<int> GetNextRevisionAsync(int idSistemaVersao, CancellationToken cancellationToken)
    {
        string[] numbers = await _context.GameModeVersions.AsNoTracking()
            .Where(item => item.IdSistemaVersao == idSistemaVersao && item.Codigo == "ROGUELIKE_MVP")
            .Select(item => item.NumeroVersao).ToArrayAsync(cancellationToken);
        return numbers.Select(number => number.StartsWith("0.4.", StringComparison.Ordinal) &&
            int.TryParse(number.AsSpan(4), out int revision) ? revision : -1).DefaultIfEmpty(-1).Max() + 1;
    }

    public Task AddAsync(GameModeVersion mode, CancellationToken cancellationToken) =>
        _context.GameModeVersions.AddAsync(mode, cancellationToken).AsTask();

    public Task SaveAsync(CancellationToken cancellationToken) => _context.SaveChangesAsync(cancellationToken);
}
