using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Interfaces;

public interface ISistemaRpgItemCatalogService
{
    Task<SistemaOperacaoResultado<SistemaItensConfigDto>> ObterAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false);

    Task<SistemaOperacaoResultado<SistemaItensConfigDto>> AtualizarAsync(
        int idSistemaVersao,
        SistemaItensConfigDto dto);
}
