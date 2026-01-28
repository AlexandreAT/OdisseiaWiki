using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    [MaxLength(255, ErrorMessage = "O caminho da imagem deve ter no máximo 255 caracteres.")]
    public string? Imagem { get; set; }

    public string? GaleriaImagem { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Mesaracaconfig> Mesaracaconfigs { get; set; } = new List<Mesaracaconfig>();

    public virtual ICollection<Personagen> Personagens { get; set; } = new List<Personagen>();
}
