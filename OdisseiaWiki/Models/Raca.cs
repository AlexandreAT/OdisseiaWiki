using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Models;

public partial class Raca
{
    [Key]
    public int Idraca { get; set; }

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = null!;

    [Column(TypeName = "json")]
    public string? StatusJson { get; set; }

    public string? Descricao { get; set; }

    [MaxLength(255, ErrorMessage = "O caminho da imagem deve ter no máximo 255 caracteres.")]
    public string? Imagem { get; set; }

    public string? GaleriaImagem { get; set; }

    public string? Variacoes { get; set; }

    public string? Tags { get; set; }

    public bool Visivel { get; set; } = true;
    public bool Destaque { get; set; } = false;

    public int? IdSistemaRpg { get; set; }

    public int? IdSistemaVersao { get; set; }

    public bool AcompanharPublicacaoAtual { get; set; } = true;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public virtual SistemaRpg? SistemaRpg { get; set; }

    [JsonIgnore]
    public virtual SistemaVersao? SistemaVersao { get; set; }

    public virtual ICollection<Personagen> Personagens { get; set; } = new List<Personagen>();
}
