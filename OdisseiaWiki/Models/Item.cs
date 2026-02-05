using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public partial class Item
{
    [Key]
    public string Iditem { get; set; }

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = null!;

    [Required(ErrorMessage = "O tipo é obrigatório.")]
    public ItemTipo Tipo { get; set; }

    [MaxLength(200)]
    public string? Descricao { get; set; }

    public decimal? Peso { get; set; }

    public int Quantidade { get; set; } = 1;

    [MaxLength(100)]
    public string? Efeito { get; set; }

    [MaxLength(50)]
    public string? Imagem { get; set; }

    public string? AtributosJson { get; set; }

    [MaxLength(50)]
    public string? IditemBase { get; set; }

    public string? Tags { get; set; }

    public bool Visivel { get; set; } = true;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public int? Idpersonagem { get; set; }
    public virtual Personagen? Personagem { get; set; }
}
