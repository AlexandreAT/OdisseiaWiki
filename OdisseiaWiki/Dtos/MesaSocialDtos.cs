using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Dtos;

public sealed class PaginacaoResultadoDto<T>
{
    public IReadOnlyCollection<T> Itens { get; init; } = Array.Empty<T>();
    public int Pagina { get; init; }
    public int TamanhoPagina { get; init; }
    public int TotalItens { get; init; }
    public int TotalPaginas => TamanhoPagina <= 0
        ? 0
        : (int)Math.Ceiling(TotalItens / (double)TamanhoPagina);
}

public sealed class MesaPessoaResumoDto
{
    public int Idusuario { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
}

public sealed class MesaResumoDto
{
    public int IdMesa { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
    public string? Descricao { get; init; }
    public IReadOnlyCollection<string> Tags { get; init; } = Array.Empty<string>();
    public int? IdUsuarioCriacao { get; init; }
    public string MestreNome { get; init; } = string.Empty;
    public string? MestreImagem { get; init; }
    public int? IdSistemaRpg { get; init; }
    public string SistemaNome { get; init; } = string.Empty;
    public int? IdSistemaVersao { get; init; }
    public string? NumeroVersao { get; init; }
    public int JogadoresAtuais { get; init; }
    public int LimiteJogadores { get; init; }
    public int VagasDisponiveis => Math.Max(0, LimiteJogadores - JogadoresAtuais);
    public int SolicitacoesPendentes { get; init; }
    public string PapelUsuario { get; init; } = "Visitante";
    public bool PodeSolicitarEntrada { get; init; }
    public bool SolicitacaoPendente { get; init; }
    public bool Lotada => VagasDisponiveis == 0;
    public bool WikiDisponivel { get; init; }
    public bool AoVivo { get; init; }
    public DateTime DataCriacao { get; init; }
    public DateTime DataAtualizacao { get; init; }
}

public sealed class MesaHubDto
{
    public PaginacaoResultadoDto<MesaResumoDto> Criadas { get; init; } = new();
    public PaginacaoResultadoDto<MesaResumoDto> Participando { get; init; } = new();
}

public sealed class MesaCriarDto
{
    [Required, MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descricao { get; set; }

    [MaxLength(255)]
    public string? Imagem { get; set; }

    [Range(1, 50)]
    public int LimiteJogadores { get; set; } = 4;

    [Range(1, int.MaxValue)]
    public int IdSistemaVersao { get; set; }

    public int? IdSistemaRpg { get; set; }

    public bool AcompanharVersaoAtual { get; set; }

    public List<string> Tags { get; set; } = new();
}

public sealed class MesaAtualizarDto
{
    [Required, MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descricao { get; set; }

    [MaxLength(255)]
    public string? Imagem { get; set; }

    [Range(1, 50)]
    public int LimiteJogadores { get; set; }

    [Range(1, int.MaxValue)]
    public int IdSistemaVersao { get; set; }

    public bool AcompanharVersaoAtual { get; set; }

    public List<string> Tags { get; set; } = new();
}

public sealed class MesaAtualizarAoVivoDto
{
    public bool AoVivo { get; set; }
}

public sealed class MesaSolicitacaoCriarDto
{
    [MaxLength(200)]
    public string? Mensagem { get; set; }
}

public sealed class MesaSolicitacaoDto
{
    public int IdSolicitacao { get; init; }
    public int IdMesa { get; init; }
    public int IdUsuario { get; init; }
    public string UsuarioNome { get; init; } = string.Empty;
    public string? UsuarioImagem { get; init; }
    public string? Mensagem { get; init; }
    public DateTime DataSolicitacao { get; init; }
    public DateTime? DataCadastroUsuario { get; init; }
}

public sealed class MesaJogadorDto
{
    public int IdUsuario { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string? Imagem { get; init; }
    public DateTime? DataEntrada { get; init; }
    public int Personagens { get; init; }
    public bool Online { get; init; }
}

public sealed class MesaExpulsarDto
{
    [Required, MinLength(1), MaxLength(500)]
    public string Motivo { get; set; } = string.Empty;
}

public sealed class MesaExpulsaoDto
{
    public int IdMesa { get; init; }
    public string MesaNome { get; init; } = string.Empty;
    public string Motivo { get; init; } = string.Empty;
    public DateTime DataExpulsao { get; init; }
}

public sealed class MesaPersonagemResumoDto
{
    public PersonagemJogadorDto Personagem { get; init; } = new();
    public StatusBaseDto Status { get; init; } = new();
    public int Nivel { get; init; }
    public int Xp { get; init; }
    public int? IdUsuarioDono { get; init; }
    public string DonoNome { get; init; } = string.Empty;
    public string? DonoImagem { get; init; }
    public bool Online { get; init; }
    public bool Morto { get; init; }
}

public class MesaPersonagensGerenciamentoDto
{
    public MesaResumoDto Mesa { get; init; } = new();
    public IReadOnlyCollection<MesaPersonagemResumoDto> Personagens { get; init; } =
        Array.Empty<MesaPersonagemResumoDto>();
}

public sealed class MesaAoVivoSnapshotDto : MesaPersonagensGerenciamentoDto
{
    public int JogadoresOnline { get; init; }
    public int Participantes { get; init; }
    public string TurnoAtual { get; init; } = "Mestre";
    public DateTime AtualizadoEm { get; init; } = DateTime.UtcNow;
}

public enum MesaOperacaoErro
{
    Nenhum,
    Validacao,
    NaoEncontrado,
    Proibido,
    Conflito,
}

public sealed class MesaOperacaoResultado<T>
{
    public bool Sucesso { get; init; }
    public MesaOperacaoErro Erro { get; init; }
    public string? Mensagem { get; init; }
    public T? Dados { get; init; }

    public static MesaOperacaoResultado<T> Ok(T dados, string? mensagem = null) => new()
    {
        Sucesso = true,
        Dados = dados,
        Mensagem = mensagem,
    };

    public static MesaOperacaoResultado<T> Falha(
        MesaOperacaoErro erro,
        string mensagem) => new()
    {
        Erro = erro,
        Mensagem = mensagem,
    };
}
