using System.ComponentModel.DataAnnotations;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public sealed class SistemaRpgCreateDto
{
    [Required, MaxLength(50)]
    public string Codigo { get; set; } = null!;
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; } = true;
}

public sealed class SistemaRpgUpdateDto
{
    [Required, MaxLength(150)]
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; } = true;
}

public class SistemaRpgResumoDto
{
    public int IdSistemaRpg { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; }
    public int? IdVersaoPublicada { get; set; }
    public string? NumeroVersaoPublicada { get; set; }
    public int QuantidadeVersoes { get; set; }
    public int QuantidadeMesas { get; set; }
    public DateTime DataCriacao { get; set; }
    public DateTime DataAtualizacao { get; set; }
}

public sealed class SistemaRpgDetalheDto : SistemaRpgResumoDto
{
    public List<SistemaVersaoResumoDto> Versoes { get; set; } = new();
}

public sealed class SistemaVersaoCreateDto
{
    [Required, MaxLength(20)]
    public string NumeroVersao { get; set; } = null!;
    public int? IdVersaoBase { get; set; }
    public string? Changelog { get; set; }
}

public sealed class SistemaVersaoDuplicarDto
{
    [Required, MaxLength(20)]
    public string NumeroVersao { get; set; } = null!;
    public string? Changelog { get; set; }
}

public class SistemaVersaoResumoDto
{
    public int IdSistemaVersao { get; set; }
    public int IdSistemaRpg { get; set; }
    public string NumeroVersao { get; set; } = null!;
    public SistemaVersaoStatus Status { get; set; }
    public int? IdVersaoBase { get; set; }
    public string? Changelog { get; set; }
    public DateTime DataCriacao { get; set; }
    public DateTime DataAtualizacao { get; set; }
    public DateTime? DataPublicacao { get; set; }
    public DateTime? DataArquivamento { get; set; }
    public int QuantidadeMesas { get; set; }
}

public sealed class SistemaVersaoDetalheDto : SistemaVersaoResumoDto
{
    public string CodigoSistema { get; set; } = null!;
    public string NomeSistema { get; set; } = null!;
    public SistemaConfiguracaoGeralDto ConfiguracaoGeral { get; set; } = new();
    public SistemaCriacaoConfigDto Criacao { get; set; } = new();
    public SistemaProgressaoConfigDto Progressao { get; set; } = new();
    public SistemaExploracaoConfigDto Exploracao { get; set; } = new();
    public SistemaCombateConfigDto Combate { get; set; } = new();
    public SistemaPoderesConfigDto Poderes { get; set; } = new();
    public SistemaSobrevivenciaConfigDto Sobrevivencia { get; set; } = new();
}

public sealed class SistemaResolvidoDto
{
    public int? IdSistemaRpg { get; set; }
    public int? IdSistemaVersao { get; set; }
    public string CodigoSistema { get; set; } = "ODISSEIA";
    public string NumeroVersao { get; set; } = "LEGACY";
    public string Origem { get; set; } = "FallbackLegado";
    public bool UsaFallbackLegado { get; set; }
}

public sealed class MesaMigrarSistemaDto
{
    [Range(1, int.MaxValue)]
    public int IdSistemaVersao { get; set; }
}

public enum SistemaOperacaoErro
{
    Nenhum,
    Validacao,
    NaoEncontrado,
    Conflito,
}

public sealed class SistemaOperacaoResultado<T>
{
    public bool Sucesso { get; init; }
    public T? Dados { get; init; }
    public string? MensagemErro { get; init; }
    public SistemaOperacaoErro TipoErro { get; init; }

    public static SistemaOperacaoResultado<T> Ok(T dados) => new()
    {
        Sucesso = true,
        Dados = dados,
    };

    public static SistemaOperacaoResultado<T> Falha(
        string mensagem,
        SistemaOperacaoErro tipo = SistemaOperacaoErro.Validacao) => new()
    {
        Sucesso = false,
        MensagemErro = mensagem,
        TipoErro = tipo,
    };
}
