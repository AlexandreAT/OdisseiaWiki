using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class WikiGraphRepository : IWikiGraphRepository
{
    private readonly OdisseiaContext _context;

    public WikiGraphRepository(OdisseiaContext context)
    {
        _context = context;
    }

    public Task<WikiGraphSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default) =>
        GetSnapshotAsync(null, cancellationToken);

    public async Task<WikiGraphSnapshot> GetSnapshotAsync(IReadOnlyCollection<int>? idWikiEscopos, CancellationToken cancellationToken = default)
    {
        int[] escopos = (idWikiEscopos is { Count: > 0 } ? idWikiEscopos : new[] { WikiEscopo.IdOficial }).Distinct().ToArray();
        List<WikiGraphCityRecord> cities = await _context.Cidades
            .AsNoTracking()
            .Where(city => escopos.Contains(city.IdWikiEscopo))
            .Select(city => new WikiGraphCityRecord(
                city.Idcidade,
                city.Nome,
                city.Imagem,
                city.Visivel,
                city.IdWikiEscopo,
                city.IdSistemaRpg))
            .ToListAsync(cancellationToken);

        List<WikiGraphPageRecord> pages = await _context.Pages
            .AsNoTracking()
            .Where(page => escopos.Contains(page.IdWikiEscopo))
            .Select(page => new WikiGraphPageRecord(
                page.IdPage,
                page.Titulo,
                page.Slug,
                page.CoverImage,
                page.Visivel,
                page.IdWikiEscopo,
                page.IdSistemaRpg))
            .ToListAsync(cancellationToken);

        List<WikiGraphCharacterRecord> characters = await _context.Personagens
            .AsNoTracking()
            .Where(character => escopos.Contains(character.IdWikiEscopo))
            .Select(character => new WikiGraphCharacterRecord(
                character.Idpersonagem,
                character.Nome,
                character.Imagem,
                character.Visivel,
                character.Idraca,
                character.Idcidade,
                character.PersonagemsVinculados,
                character.ConfiguracaoVisibilidade == null || character.ConfiguracaoVisibilidade.Nome,
                character.ConfiguracaoVisibilidade == null || character.ConfiguracaoVisibilidade.Imagem,
                character.ConfiguracaoVisibilidade == null || character.ConfiguracaoVisibilidade.Raca,
                character.ConfiguracaoVisibilidade == null || character.ConfiguracaoVisibilidade.Cidade,
                character.ConfiguracaoVisibilidade == null ||
                    character.ConfiguracaoVisibilidade.PersonagensRelacionados,
                character.IdWikiEscopo,
                character.IdSistemaRpg,
                character.IdSistemaVersao,
                character.AcompanharPublicacaoAtual))
            .ToListAsync(cancellationToken);

        List<WikiGraphRaceRecord> races = await _context.Racas
            .AsNoTracking()
            .Where(race => escopos.Contains(race.IdWikiEscopo))
            .Select(race => new WikiGraphRaceRecord(
                race.Idraca,
                race.Nome,
                race.Imagem,
                race.Visivel,
                race.IdWikiEscopo,
                race.IdSistemaRpg,
                race.IdSistemaVersao,
                race.AcompanharPublicacaoAtual))
            .ToListAsync(cancellationToken);

        List<WikiGraphPageRelationRecord> pageRelations = await _context.PageBlocks
            .AsNoTracking()
            .Where(block => escopos.Contains(block.Page.IdWikiEscopo))
            .Where(block => block.Tipo == PageBlockType.Relation)
            .Select(block => new WikiGraphPageRelationRecord(
                block.IdPage,
                block.Conteudo,
                block.Page.IdWikiEscopo,
                block.Page.IdSistemaRpg))
            .ToListAsync(cancellationToken);

        return new WikiGraphSnapshot
        {
            Cities = cities,
            Pages = pages,
            Characters = characters,
            Races = races,
            PageRelations = pageRelations
        };
    }
}
