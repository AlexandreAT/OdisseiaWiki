using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Dtos;

public sealed class RacaVariacaoDto
{
    [MaxLength(100)]
    public string? Nome { get; set; }

    [MaxLength(500)]
    public string? Descricao { get; set; }

    [MaxLength(500)]
    public string? Efeito { get; set; }

    [MaxLength(2048)]
    public string? Imagem { get; set; }
}
