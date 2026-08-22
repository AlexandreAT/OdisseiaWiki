namespace OdisseiaWiki.Models;

public sealed class PersonagemComparacaoRegistro
{
    public int Id { get; set; }
    public bool Jogador { get; set; }
    public bool Visivel { get; set; } = true;
    public int? Idusuario { get; set; }
    public string Nome { get; set; } = null!;
    public string? Imagem { get; set; }
    public int IdRaca { get; set; }
    public int? IdMesa { get; set; }
    public string? MesaNome { get; set; }
    public string StatusJson { get; set; } = null!;
    public string? SkillsJson { get; set; }
    public PersonagemVisibilidade? ConfiguracaoVisibilidade { get; set; }
}
