namespace OdisseiaWiki.Enums;

public enum MesaSessaoStatus
{
    Ativa,
    Encerrada,
}

public enum MesaComandoStatus
{
    Concluido,
}

public enum GameplayEventOrigin
{
    Automatica,
    Manual,
    Administrativa,
}

public enum GameplayEventVisibility
{
    PublicaMesa,
    MestreEAutor,
    SomenteMestre,
}

public enum GameplayRollMode
{
    Normal,
    Vantagem,
    Desvantagem,
}

public enum MesaCombateStatus
{
    Preparacao,
    Ativo,
    Encerrado,
}

public enum MesaCombateParticipanteTipo
{
    PersonagemJogador,
    Npc,
}

public enum MesaCombateParticipanteStatus
{
    AguardandoIniciativa,
    Pronto,
    Ativo,
    ABeiraDaMorte,
    Estabilizado,
    Morto,
    Removido,
}

public enum MesaCondicaoStatus
{
    Ativa,
    Removida,
    Expirada,
}

public enum MesaCooldownStatus
{
    Ativo,
    Encerrado,
}
