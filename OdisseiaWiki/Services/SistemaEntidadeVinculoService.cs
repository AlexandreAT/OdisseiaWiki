using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class SistemaEntidadeVinculoService : ISistemaEntidadeVinculoService
{
    private readonly ISistemaRpgRepository _repository;

    public SistemaEntidadeVinculoService(ISistemaRpgRepository repository)
    {
        _repository = repository;
    }

    public async Task<SistemaEntidadeVinculoResultado> ValidarAsync(
        int? idSistemaRpg,
        int? idSistemaVersao,
        bool acompanharPublicacaoAtual,
        SistemaEntidadeVinculoExistente? vinculoExistente = null)
    {
        if (acompanharPublicacaoAtual)
        {
            if (idSistemaVersao.HasValue)
            {
                return SistemaEntidadeVinculoResultado.Falha(
                    "Uma entidade que acompanha a publicação atual não pode manter uma versão fixada.");
            }

            // IDs nulos representam o vínculo compatível com ODISSEIA/publicação atual.
            if (!idSistemaRpg.HasValue)
                return new(true, null, null, true);

            SistemaRpg? sistema = await _repository.GetByIdAsync(idSistemaRpg.Value);
            bool preservaAcompanhamentoExistente = vinculoExistente is
            {
                AcompanharPublicacaoAtual: true,
                IdSistemaVersao: null,
            } && vinculoExistente.IdSistemaRpg == idSistemaRpg;
            if ((sistema is not { Ativo: true } || sistema.IdVersaoPublicada is null) &&
                !preservaAcompanhamentoExistente)
            {
                return SistemaEntidadeVinculoResultado.Falha(
                    "O Sistema selecionado precisa estar ativo e possuir uma versão publicada.");
            }

            if (sistema is null)
                return SistemaEntidadeVinculoResultado.Falha("O Sistema selecionado não foi encontrado.");

            return new(true, sistema.IdSistemaRpg, null, true);
        }

        if (!idSistemaVersao.HasValue)
        {
            return SistemaEntidadeVinculoResultado.Falha(
                "Selecione uma versão publicada ao desativar o acompanhamento automático.");
        }

        SistemaVersao? versao = await _repository.GetVersionAsync(idSistemaVersao.Value);
        if (versao is null)
            return SistemaEntidadeVinculoResultado.Falha("A versão selecionada não foi encontrada.");

        bool preservaVinculoExistente = vinculoExistente is
        {
            AcompanharPublicacaoAtual: false,
        } &&
            vinculoExistente.IdSistemaRpg == versao.IdSistemaRpg &&
            vinculoExistente.IdSistemaVersao == versao.IdSistemaVersao &&
            (!idSistemaRpg.HasValue || idSistemaRpg.Value == vinculoExistente.IdSistemaRpg);
        bool arquivadaJaVinculada = versao.Status == SistemaVersaoStatus.Arquivado &&
            preservaVinculoExistente;
        if (versao.Status != SistemaVersaoStatus.Publicado && !arquivadaJaVinculada)
        {
            return SistemaEntidadeVinculoResultado.Falha(
                "Somente uma versão publicada pode ser fixada em uma entidade.");
        }

        if (!versao.SistemaRpg.Ativo && !preservaVinculoExistente)
            return SistemaEntidadeVinculoResultado.Falha("O Sistema da versão selecionada está inativo.");

        if (idSistemaRpg.HasValue && idSistemaRpg.Value != versao.IdSistemaRpg)
        {
            return SistemaEntidadeVinculoResultado.Falha(
                "A versão selecionada não pertence ao Sistema informado.");
        }

        return new(true, versao.IdSistemaRpg, versao.IdSistemaVersao, false);
    }
}
