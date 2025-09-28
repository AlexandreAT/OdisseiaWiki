using System;
using System.Collections.Generic;

namespace OdisseiaWiki.Models;

public partial class Usuario
{
    public int Idusuario { get; set; }

    public string Nome { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Celular { get; set; }

    public string Senha { get; set; } = null!;

    public string Nickname { get; set; } = null!;

    public string? ImagemUrl { get; set; }

    public DateOnly DataRegistro { get; set; }

    public virtual ICollection<PersonagemJogador> PersonagensJogadores { get; set; } = new List<PersonagemJogador>();

    public virtual ICollection<Mesa> Mesas { get; set; } = new List<Mesa>();

    public virtual ICollection<Mesausuario> Mesausuarios { get; set; } = new List<Mesausuario>();
}
