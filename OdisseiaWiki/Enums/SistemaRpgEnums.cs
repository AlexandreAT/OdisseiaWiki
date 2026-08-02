namespace OdisseiaWiki.Enums;

public enum SistemaVersaoStatus
{
    Rascunho,
    Publicado,
    Arquivado,
}

public enum SistemaModuloTipo
{
    RegrasBase,
    CriacaoPersonagem,
    Progressao,
    Atributos,
    Recursos,
    Movimento,
    PontosAcao,
    Combate,
    Furtividade,
    Equipamentos,
    Defesas,
    Danos,
    Magias,
    Skills,
    Condicoes,
    Descanso,
    Exploracao,
    Morte,
    Poderes,
    Sobrevivencia,
}

public enum SistemaAtributoGrupo
{
    Principal,
    Secundario,
    Defesa,
    Outro,
}

public enum SistemaRecuperacaoTipo
{
    ValorFixo,
    Percentual,
    Formula,
}

public enum SistemaUnidadeDuracao
{
    Turno,
    Minuto,
    Hora,
    Descanso,
    Sessao,
    Permanente,
}
