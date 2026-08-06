namespace OdisseiaWiki.Services.Interfaces;

public interface ISistemaEntidadeVinculoService
{
    Task<SistemaEntidadeVinculoResultado> ValidarAsync(
        int? idSistemaRpg,
        int? idSistemaVersao,
        bool acompanharPublicacaoAtual,
        SistemaEntidadeVinculoExistente? vinculoExistente = null);
}

public sealed record SistemaEntidadeVinculoExistente(
    int? IdSistemaRpg,
    int? IdSistemaVersao,
    bool AcompanharPublicacaoAtual);

public sealed record SistemaEntidadeVinculoResultado(
    bool Sucesso,
    int? IdSistemaRpg,
    int? IdSistemaVersao,
    bool AcompanharPublicacaoAtual,
    string? MensagemErro = null)
{
    public static SistemaEntidadeVinculoResultado Falha(string mensagem) =>
        new(false, null, null, true, mensagem);
}
