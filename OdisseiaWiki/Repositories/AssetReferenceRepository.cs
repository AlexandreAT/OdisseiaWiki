using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public sealed class AssetReferenceRepository : IAssetReferenceRepository
{
    private readonly OdisseiaContext _context;

    public AssetReferenceRepository(OdisseiaContext context)
    {
        _context = context;
    }

    public async Task<bool> IsReferencedAsync(
        string assetUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(assetUrl))
            return false;

        // Comparações exatas permanecem no banco. As buscas dentro de JSON/texto são
        // feitas após a projeção: o Pomelo traduzia string.Contains em colunas JSON
        // para CAST_AS_JSON e tentava interpretar a URL como um documento JSON.
        if (await _context.Cidades.AsNoTracking()
                .AnyAsync(entity => entity.Imagem == assetUrl, cancellationToken))
            return true;

        var cidades = await _context.Cidades.AsNoTracking()
            .Select(entity => new
            {
                entity.GaleriaImagem,
                entity.PontosDeInteresse,
                entity.Descricao,
            })
            .ToListAsync(cancellationToken);
        if (cidades.Any(entity => ContainsAsset(
                assetUrl,
                entity.GaleriaImagem,
                entity.PontosDeInteresse,
                entity.Descricao)))
            return true;

        if (await _context.Racas.AsNoTracking()
                .AnyAsync(entity => entity.Imagem == assetUrl, cancellationToken))
            return true;

        var racas = await _context.Racas.AsNoTracking()
            .Select(entity => entity.GaleriaImagem)
            .ToListAsync(cancellationToken);
        if (racas.Any(value => ContainsAsset(assetUrl, value)))
            return true;

        if (await _context.Personagens.AsNoTracking()
                .AnyAsync(entity => entity.Imagem == assetUrl, cancellationToken))
            return true;

        var personagens = await _context.Personagens.AsNoTracking()
            .Select(entity => new
            {
                entity.GaleriaImagem,
                entity.InventarioJson,
                entity.Skills,
                entity.Magia,
                entity.Historia,
                entity.Implantes,
            })
            .ToListAsync(cancellationToken);
        if (personagens.Any(entity => ContainsAsset(
                assetUrl,
                entity.GaleriaImagem,
                entity.InventarioJson,
                entity.Skills,
                entity.Magia,
                entity.Historia,
                entity.Implantes)))
            return true;

        if (await _context.PersonagemJogadores.AsNoTracking()
                .AnyAsync(entity => entity.Imagem == assetUrl, cancellationToken))
            return true;

        var personagensJogadores = await _context.PersonagemJogadores.AsNoTracking()
            .Select(entity => new
            {
                entity.GaleriaImagem,
                entity.InventarioJson,
                entity.Skills,
                entity.Magia,
                entity.Historia,
                entity.Implantes,
            })
            .ToListAsync(cancellationToken);
        if (personagensJogadores.Any(entity => ContainsAsset(
                assetUrl,
                entity.GaleriaImagem,
                entity.InventarioJson,
                entity.Skills,
                entity.Magia,
                entity.Historia,
                entity.Implantes)))
            return true;

        if (await _context.Itens.AsNoTracking()
                .AnyAsync(entity => entity.Imagem == assetUrl, cancellationToken))
            return true;

        var itens = await _context.Itens.AsNoTracking()
            .Select(entity => new { entity.Descricao, entity.AtributosJson })
            .ToListAsync(cancellationToken);
        if (itens.Any(entity => ContainsAsset(
                assetUrl,
                entity.Descricao,
                entity.AtributosJson)))
            return true;

        if (await _context.Infolores.AsNoTracking()
                .AnyAsync(entity => entity.Imagem == assetUrl, cancellationToken))
            return true;

        var infolores = await _context.Infolores.AsNoTracking()
            .Select(entity => entity.Conteudo)
            .ToListAsync(cancellationToken);
        if (infolores.Any(value => ContainsAsset(assetUrl, value)))
            return true;

        if (await _context.Pages.AsNoTracking()
                .AnyAsync(entity => entity.CoverImage == assetUrl, cancellationToken))
            return true;

        var pages = await _context.Pages.AsNoTracking()
            .Select(entity => entity.Descricao)
            .ToListAsync(cancellationToken);
        if (pages.Any(value => ContainsAsset(assetUrl, value)))
            return true;

        var pageBlocks = await _context.PageBlocks.AsNoTracking()
            .Select(entity => entity.Conteudo)
            .ToListAsync(cancellationToken);
        if (pageBlocks.Any(value => ContainsAsset(assetUrl, value)))
            return true;

        if (await _context.Mesas.AsNoTracking()
                .AnyAsync(entity => entity.Imagem == assetUrl, cancellationToken) ||
            await _context.Usuarios.AsNoTracking()
                .AnyAsync(entity => entity.ImagemUrl == assetUrl, cancellationToken))
            return true;

        var mesaConfigs = await _context.MesaEntidadeConfigs.AsNoTracking()
            .Select(entity => entity.ConfigJson)
            .ToListAsync(cancellationToken);
        return mesaConfigs.Any(value => ContainsAsset(assetUrl, value));
    }

    private static bool ContainsAsset(string assetUrl, params string?[] values)
        => values.Any(value =>
            !string.IsNullOrEmpty(value) &&
            value.Contains(assetUrl, StringComparison.Ordinal));
}
