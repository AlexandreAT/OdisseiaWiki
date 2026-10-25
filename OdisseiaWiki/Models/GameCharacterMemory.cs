namespace OdisseiaWiki.Models;

/// <summary>Roguelike-only milestones, separate from character sheet/runtime and run snapshots.</summary>
public sealed class GameCharacterMemory
{
    public int IdPersonagemJogador { get; set; }
    public string EstadoJson { get; set; } = "{}";
    public DateTime AtualizadaEmUtc { get; set; } = DateTime.UtcNow;
    public PersonagemJogador Personagem { get; set; } = null!;
}
