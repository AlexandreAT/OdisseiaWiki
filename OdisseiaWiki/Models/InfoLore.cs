using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public partial class Infolore
{
    [Key]
    public int IdinfoLore { get; set; }

    [Required(ErrorMessage = "O título é obrigatório.")]
    public string Titulo { get; set; } = null!;

    public string? Descricao { get; set; }

    public string? Imagem { get; set; }

    public int? Ordem { get; set; }

    public string? Tags { get; set; }

    public bool Visivel { get; set; } = true;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}
