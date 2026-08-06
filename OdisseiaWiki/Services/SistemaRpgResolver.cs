using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgResolver : ISistemaRpgResolver
{
    private readonly ISistemaRpgRepository _repository;

    public SistemaRpgResolver(ISistemaRpgRepository repository) => _repository = repository;

    public async Task<SistemaResolvidoDto> ResolverAsync(int? idMesa = null)
    {
        Mesa? mesa = null;
        if (idMesa.HasValue)
        {
            mesa = await _repository.GetMesaAsync(idMesa.Value);
            if (mesa is not null && MesaAcompanhaPublicacaoPadrao(mesa))
            {
                SistemaRpg? sistemaAtual = await _repository.GetByCodeAsync(
                    SistemaRpgConfiguration.CodigoPadrao);
                if (sistemaAtual is { Ativo: true, VersaoPublicada: not null })
                    return Mapear(sistemaAtual.VersaoPublicada, "SistemaPadrao", sistemaAtual.Codigo);
            }

            if (mesa?.SistemaVersao is { Status: not SistemaVersaoStatus.Rascunho } versaoMesa)
                return Mapear(versaoMesa, "MesaExplicita");
        }

        SistemaRpg? sistemaPadrao = await _repository.GetByCodeAsync(SistemaRpgConfiguration.CodigoPadrao);
        if (sistemaPadrao is { Ativo: true })
        {
            // Mesas antigas sem vínculo devem continuar reproduzindo as regras 1.0,
            // mesmo depois que uma nova versão passar a ser a publicada atual.
            if (mesa is not null && mesa.IdSistemaVersao is null)
            {
                SistemaVersao? versaoLegada = await _repository.GetVersionByNumberAsync(
                    sistemaPadrao.IdSistemaRpg,
                    SistemaRpgConfiguration.VersaoPadrao);
                if (versaoLegada is { Status: not SistemaVersaoStatus.Rascunho })
                {
                    versaoLegada.SistemaRpg = sistemaPadrao;
                    return Mapear(versaoLegada, "SistemaPadrao", sistemaPadrao.Codigo);
                }
            }

            // Novas mesas e chamadas sem mesa sempre usam a publicação atual.
            if (sistemaPadrao.VersaoPublicada is not null)
                return Mapear(sistemaPadrao.VersaoPublicada, "SistemaPadrao", sistemaPadrao.Codigo);
        }

        return new SistemaResolvidoDto
        {
            IdSistemaRpg = null,
            IdSistemaVersao = null,
            CodigoSistema = SistemaRpgConfiguration.CodigoPadrao,
            NumeroVersao = "LEGACY",
            Origem = "FallbackLegado",
            UsaFallbackLegado = true,
        };
    }

    private static SistemaResolvidoDto Mapear(
        SistemaVersao versao,
        string origem,
        string? codigoSistema = null) => new()
    {
        IdSistemaRpg = versao.IdSistemaRpg,
        IdSistemaVersao = versao.IdSistemaVersao,
        CodigoSistema = codigoSistema ?? versao.SistemaRpg.Codigo,
        NumeroVersao = versao.NumeroVersao,
        Origem = origem,
        UsaFallbackLegado = false,
    };

    private static bool MesaAcompanhaPublicacaoPadrao(Mesa mesa) =>
        string.Equals(
            mesa.CodigoSistema,
            SystemMesaConstants.CodigoMesaPadrao,
            StringComparison.OrdinalIgnoreCase) ||
        (mesa.PadraoSistema && SystemMesaConstants.NomeRepresentaMesaPadrao(mesa.Nome));
}
