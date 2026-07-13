using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace OdisseiaWiki.Models;

public partial class Infolore
{
    [Key]
    public int IdinfoLore { get; set; }

    [Required]
    public string Titulo { get; set; } = null!;

    public string? Conteudo { get; set; }

    public string? Imagem { get; set; }

    public string? Tags { get; set; }

    public bool Visivel { get; set; } = true;
    public bool Destaque { get; set; } = false;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}
