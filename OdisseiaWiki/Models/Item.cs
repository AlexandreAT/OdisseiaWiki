using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

public partial class Item
{
    [Key]
    public string Iditem { get; set; }

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = null!;

    [Required(ErrorMessage = "O tipo é obrigatório.")]
    public ItemTipo Tipo { get; set; }

    [Column(TypeName = "longtext")]
    public string? Descricao { get; set; }

    public decimal? Peso { get; set; }

    public int Discricao { get; set; } = 0;

    public int Quantidade { get; set; } = 1;

    [MaxLength(100)]
    public string? Efeito { get; set; }

    [MaxLength(255)]
    public string? Imagem { get; set; }

    public string? AtributosJson { get; set; }

    [MaxLength(50)]
    public string? IditemBase { get; set; }

    public string? Tags { get; set; }

    public bool Visivel { get; set; } = true;
    public bool Destaque { get; set; } = false;

    public int? IdSistemaRpg { get; set; }

    public int? IdSistemaVersao { get; set; }

    public bool AcompanharPublicacaoAtual { get; set; } = true;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public int? Idpersonagem { get; set; }
    public virtual Personagen? Personagem { get; set; }

    [JsonIgnore]
    public virtual SistemaRpg? SistemaRpg { get; set; }

    [JsonIgnore]
    public virtual SistemaVersao? SistemaVersao { get; set; }
}
