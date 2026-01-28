using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public virtual Usuario? IdusuarioCriacaoNavigation { get; set; }

    public virtual ICollection<PersonagemJogador> PersonagensJogadores { get; set; } = new List<PersonagemJogador>();

    public virtual ICollection<Mesaracaconfig> Mesaracaconfigs { get; set; } = new List<Mesaracaconfig>();

    public virtual ICollection<Mesausuario> Mesausuarios { get; set; } = new List<Mesausuario>();
}
