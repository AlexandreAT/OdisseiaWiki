using OdisseiaWiki.Models;

namespace OdisseiaWiki.Dtos;

public sealed class UsuarioExclusaoDados
{
    public string? ImagemPerfil { get; init; }
    public IReadOnlyList<PersonagemJogador> Personagens { get; init; } = Array.Empty<PersonagemJogador>();
    public IReadOnlyList<int> MesasAfetadas { get; init; } = Array.Empty<int>();
}
