using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class WikiEscopo
{
    /// <summary>
    /// O escopo oficial é criado pela migration com este identificador para que o
    /// conteúdo legado e os fluxos oficiais continuem determinísticos.
    /// </summary>
    public const int IdOficial = 1;
    public const string ChaveOficial = "OFICIAL";

    [Key]
    public int IdWikiEscopo { get; set; }

    public WikiEscopoTipo Tipo { get; set; }

    [Required, MaxLength(80)]
    public string Chave { get; set; } = null!;

    public int? IdMesa { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public virtual Mesa? Mesa { get; set; }
    [JsonIgnore]
    public virtual ICollection<Page> Pages { get; set; } = new List<Page>();
    [JsonIgnore]
    public virtual ICollection<Cidade> Cidades { get; set; } = new List<Cidade>();
    [JsonIgnore]
    public virtual ICollection<Raca> Racas { get; set; } = new List<Raca>();
    [JsonIgnore]
    public virtual ICollection<Personagen> Personagens { get; set; } = new List<Personagen>();
    [JsonIgnore]
    public virtual ICollection<Item> Itens { get; set; } = new List<Item>();
    [JsonIgnore]
    public virtual ICollection<Passiva> Passivas { get; set; } = new List<Passiva>();
}
