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

public enum SistemaRuntimeOrigem
{
    Mesa,
    VersaoFixadaPersonagemJogador,
    VersaoFixadaEntidade,
    PublicacaoAtualEntidade,
    SistemaPadrao,
    FallbackLegado,
}

public enum SistemaValorProveniencia
{
    Sistema,
    OverrideMesa,
    ValorExplicitoEntidade,
    FallbackLegado,
}

public enum SistemaEntidadeGlobalTipo
{
    Npc,
    Raca,
    Item,
}

public enum SistemaRuntimeWarningCodigo
{
    MesaNaoEncontrada,
    VersaoRascunhoIgnorada,
    EntidadeNaoEncontrada,
    VinculoInconsistente,
    SistemaNaoEncontrado,
    PublicacaoAtualIndisponivel,
    ConfiguracaoRacialAusente,
    OverrideMesaInvalido,
    CatalogoItemAusente,
    EscopoItemNaoEncontrado,
    ValorForaReferencia,
    FallbackLegadoUtilizado,
}

public enum SistemaItemEscopoNivel
{
    Tipo,
    Categoria,
    Arquetipo,
}

public enum SistemaItemCampoTipo
{
    Texto,
    Inteiro,
    Decimal,
    Booleano,
    Codigo,
    Lista,
}

public enum SistemaItemReferenciaTipo
{
    TipoDano,
    TipoDefesa,
    Alcance,
    Material,
    ParteCorpo,
    Lado,
    Modificacao,
    Lacrima,
    Outro,
}
