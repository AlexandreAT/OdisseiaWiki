using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces;

public interface IGameRunSnapshotFactory
{
    GameRunCharacterSnapshotDto Create(
        PersonagemJogador personagem,
        SistemaRuntimeContextoDto sistema,
        IReadOnlyCollection<Proficiencia> proficiencias);
}
