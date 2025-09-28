using System;
using System.Collections.Generic;

namespace OdisseiaWiki.Models;

public partial class Infolore
{
    public int IdinfoLore { get; set; }

    public string Titulo { get; set; } = null!;

    public string? Descricao { get; set; }

    public string? Imagem { get; set; }

    public int? Ordem { get; set; }

    public DateOnly DataCriacao { get; set; }
}
