using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Models;

public partial class Mesa
{
    [Key]
    public int Idmesa { get; set; }

    public int? IdusuarioCriacao { get; set; }

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = null!;

    [MaxLength(255, ErrorMessage = "O caminho da imagem deve ter no máximo 255 caracteres.")]
    public string? Imagem { get; set; }

    [MaxLength(500, ErrorMessage = "A descrição deve ter no máximo 500 caracteres.")]
    public string? Descricao { get; set; }

    public string? Tags { get; set; }

    [Range(1, 50, ErrorMessage = "O limite de jogadores deve estar entre 1 e 50.")]
    public int LimiteJogadores { get; set; } = 4;

    [MaxLength(50)]
    public string? CodigoSistema { get; set; }

    public bool PadraoSistema { get; set; }

    /// <summary>
    /// Indica se a experiência compartilhada desta mesa está em andamento.
    /// A presença SignalR é registrada somente enquanto este estado estiver ativo.
    /// </summary>
    public bool AoVivo { get; set; }

    public long? IdMesaSessaoAtiva { get; set; }

    public long RevisaoRuntime { get; set; }

    public int? IdSistemaVersao { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;

    public virtual Usuario? IdusuarioCriacaoNavigation { get; set; }

    public virtual ICollection<PersonagemJogador> PersonagensJogadores { get; set; } = new List<PersonagemJogador>();

    public virtual ICollection<MesaEntidadeConfig> MesaEntidadeConfigs { get; set; } = new List<MesaEntidadeConfig>();

    [JsonIgnore]
    public virtual SistemaVersao? SistemaVersao { get; set; }

    public virtual ICollection<Mesausuario> Mesausuarios { get; set; } = new List<Mesausuario>();

    public virtual ICollection<MesaSolicitacaoEntrada> SolicitacoesEntrada { get; set; } = new List<MesaSolicitacaoEntrada>();

    public virtual ICollection<MesaExpulsaoRegistro> Expulsoes { get; set; } = new List<MesaExpulsaoRegistro>();

    [JsonIgnore]
    public virtual MesaSessao? SessaoAtiva { get; set; }

    [JsonIgnore]
    public virtual ICollection<MesaSessao> Sessoes { get; set; } = new List<MesaSessao>();

    [JsonIgnore]
    public virtual ICollection<MesaComando> ComandosGameplay { get; set; } = new List<MesaComando>();
}
