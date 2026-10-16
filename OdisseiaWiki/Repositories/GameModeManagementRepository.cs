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
            item.Codigo == "ROGUELIKE_MVP" && item.Status == GameModeVersionStatus.Rascunho &&
            item.SistemaVersao.SistemaRpg.Codigo == "ODISSEIA" &&
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

    public Task<Personagen?> GetNpcAsync(int id, CancellationToken cancellationToken) =>
        _context.Personagens.AsNoTracking().FirstOrDefaultAsync(item =>
            item.Idpersonagem == id && item.IdWikiEscopo == WikiEscopo.IdOficial && item.Visivel,
            cancellationToken);

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
