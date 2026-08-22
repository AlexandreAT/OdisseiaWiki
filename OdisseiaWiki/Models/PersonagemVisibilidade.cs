using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public class PersonagemVisibilidade
{
    [Key]
    public int IdpersonagemVisibilidade { get; set; }

    public int? Idpersonagem { get; set; }
    public int? IdpersonagemJogador { get; set; }

    public bool Vida { get; set; }
    public bool Estamina { get; set; }
    public bool Mana { get; set; }
    public bool CapacidadeCarga { get; set; }
    public bool AtributosPrincipais { get; set; }
    public bool AtributosSecundarios { get; set; }
    public bool Defesas { get; set; }
    public bool Imagem { get; set; }
    public bool Historia { get; set; }
    public bool Raca { get; set; }
    public bool Cidade { get; set; }
    public bool Nome { get; set; }
    public bool Alinhamento { get; set; }
    public bool TracosPersonalidade { get; set; }
    public bool PersonagensRelacionados { get; set; }
    public bool Inventario { get; set; }
    public bool Proteses { get; set; }
    public bool Passivas { get; set; }
    public bool Ultimate { get; set; }
    public bool Skills { get; set; }
    public bool Magias { get; set; }
    public bool Galeria { get; set; }
    public bool Xp { get; set; }
    public bool Nivel { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;

    public virtual Personagen? Personagem { get; set; }
    public virtual PersonagemJogador? PersonagemJogador { get; set; }
}
