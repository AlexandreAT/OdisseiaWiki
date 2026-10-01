using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public enum WikiMesaOperacaoErro
{
    Nenhum,
    NaoEncontrado,
    Proibido,
    Validacao,
}

public sealed class WikiMesaOperacaoResultado<T>
{
    public bool Sucesso { get; init; }
    public T? Dados { get; init; }
    public string? MensagemErro { get; init; }
    public WikiMesaOperacaoErro Erro { get; init; }

    public static WikiMesaOperacaoResultado<T> Ok(T dados) => new()
    {
        Sucesso = true,
        Dados = dados,
        Erro = WikiMesaOperacaoErro.Nenhum,
    };

    public static WikiMesaOperacaoResultado<T> Falha(WikiMesaOperacaoErro erro, string mensagem) => new()
    {
        Sucesso = false,
        Erro = erro,
        MensagemErro = mensagem,
    };
}

public sealed class WikiMesaContextoDto
{
    public int IdMesa { get; init; }
    public int IdWikiEscopo { get; init; }
    public int? IdSistemaRpg { get; init; }
    public int? IdSistemaVersao { get; init; }
    public bool PodeGerenciar { get; init; }
}

public sealed class WikiMesaResumoDto
{
    public WikiMesaContextoDto Contexto { get; init; } = null!;
    public int QuantidadePaginas { get; init; }
    public int QuantidadeCidades { get; init; }
    public int QuantidadeRacas { get; init; }
    public int QuantidadePersonagens { get; init; }
    public int QuantidadeItens { get; init; }
}

public sealed class WikiMesaBuscaItemDto
{
    public int? Id { get; init; }
    public string? IdString { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
    public bool Visivel { get; init; }
    public bool Destaque { get; init; }
    public string? Slug { get; init; }
    public string TipoEntidade { get; init; } = string.Empty;
}

public sealed class WikiMesaBuscaDto
{
    public List<WikiMesaBuscaItemDto> Cidades { get; init; } = new();
    public List<WikiMesaBuscaItemDto> Personagens { get; init; } = new();
    public List<WikiMesaBuscaItemDto> Itens { get; init; } = new();
    public List<WikiMesaBuscaItemDto> InfoLores { get; init; } = new();
    public List<WikiMesaBuscaItemDto> Racas { get; init; } = new();
    public List<WikiMesaBuscaItemDto> Pages { get; init; } = new();
    public int TotalResultados => Cidades.Count + Personagens.Count + Itens.Count + Racas.Count + Pages.Count;
}
