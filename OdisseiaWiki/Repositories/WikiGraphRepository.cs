using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class WikiGraphRepository : IWikiGraphRepository
{
    private readonly OdisseiaContext _context;

    public WikiGraphRepository(OdisseiaContext context)
    {
        _context = context;
    }

    public async Task<WikiGraphSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default)
    {
        List<WikiGraphCityRecord> cities = await _context.Cidades
            .AsNoTracking()
            .Select(city => new WikiGraphCityRecord(
                city.Idcidade,
                city.Nome,
                city.Imagem,
                city.Visivel))
            .ToListAsync(cancellationToken);

        List<WikiGraphPageRecord> pages = await _context.Pages
            .AsNoTracking()
            .Select(page => new WikiGraphPageRecord(
                page.IdPage,
                page.Titulo,
                page.Slug,
                page.CoverImage,
                page.Visivel))
            .ToListAsync(cancellationToken);

        List<WikiGraphCharacterRecord> characters = await _context.Personagens
            .AsNoTracking()
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
                    character.ConfiguracaoVisibilidade.PersonagensRelacionados))
            .ToListAsync(cancellationToken);

        List<WikiGraphRaceRecord> races = await _context.Racas
            .AsNoTracking()
            .Select(race => new WikiGraphRaceRecord(
                race.Idraca,
                race.Nome,
                race.Imagem,
                race.Visivel))
            .ToListAsync(cancellationToken);

        List<WikiGraphPageRelationRecord> pageRelations = await _context.PageBlocks
            .AsNoTracking()
            .Where(block => block.Tipo == PageBlockType.Relation)
            .Select(block => new WikiGraphPageRelationRecord(block.IdPage, block.Conteudo))
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
