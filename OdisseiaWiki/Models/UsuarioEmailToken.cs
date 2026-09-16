using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Models;

public class UsuarioEmailToken
{
    public int IdusuarioEmailToken { get; set; }

    public int Idusuario { get; set; }

    public UsuarioEmailTokenTipo Tipo { get; set; }

    public string HashToken { get; set; } = string.Empty;

    public DateTime DataCriacao { get; set; }

    public DateTime DataExpiracao { get; set; }

    public DateTime? DataUso { get; set; }

    public DateTime? DataInvalidacao { get; set; }

    public virtual Usuario Usuario { get; set; } = null!;
}
