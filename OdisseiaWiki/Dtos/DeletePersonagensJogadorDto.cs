using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Dtos;

public sealed class DeletePersonagensJogadorDto
{
    [Required]
    [MinLength(1)]
    [MaxLength(100)]
    public List<int> Ids { get; init; } = new();
}

public sealed class DeletePersonagensJogadorResultDto
{
    public int Excluidos { get; init; }
}
