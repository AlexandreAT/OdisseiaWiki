using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public sealed class SistemaConfiguracaoGeralDto
{
    public string DadoTesteGeral { get; set; } = "D6";
    public bool UsaVantagem { get; set; } = true;
    public bool UsaDesvantagem { get; set; } = true;
    public int CriticoNatural { get; set; } = 6;
    public int FalhaCriticaNatural { get; set; } = 1;
    public string RegraArredondamento { get; set; } = "Arredondar para baixo.";
    public bool RegraEspecificaPrevalece { get; set; } = true;
    public bool AutoridadeMestre { get; set; } = true;
    public string? ObservacoesRegrasFundamentais { get; set; }
    public List<SistemaModuloDto> Modulos { get; set; } = new();
}

public sealed class SistemaCriacaoConfigDto
{
    public int NivelInicial { get; set; } = 1;
    public int PontosIniciais { get; set; }
    public int PontosAtributoIniciais { get; set; }
    public int PontosSkillIniciais { get; set; }
    public int MaximoSkillsIniciais { get; set; }
    public int MaximoMagiasIniciais { get; set; }
    public int MaximoUltimatesIniciais { get; set; }
    public List<SistemaRacaConfigDto> Racas { get; set; } = new();
    public List<SistemaAtributoConfigDto> Atributos { get; set; } = new();
    public List<SistemaRecursoConfigDto> Recursos { get; set; } = new();
}

public sealed class SistemaProgressaoConfigDto
{
    public int NivelMaximo { get; set; } = 20;
    public bool PermiteXpExcedente { get; set; }
    public List<SistemaNivelDto> Niveis { get; set; } = new();
    public List<SistemaMarcoNivelDto> Marcos { get; set; } = new();
    public List<SistemaFonteExperienciaDto> FontesExperiencia { get; set; } = new();
}

public sealed class SistemaExploracaoConfigDto
{
    public SistemaMovimentoConfigDto? Movimento { get; set; }
    public SistemaPontosAcaoConfigDto? PontosAcao { get; set; }
    public List<SistemaAcaoConfigDto> Acoes { get; set; } = new();
    public bool CargaUsaLimite { get; set; } = true;
    public string? PenalidadeExcessoCarga { get; set; }
    public string? FurtividadeObservacoes { get; set; }
}

public sealed class SistemaCombateConfigDto
{
    public bool UsaIniciativa { get; set; } = true;
    public string? FormulaIniciativa { get; set; }
    public int SegundosPorTurno { get; set; } = 6;
    public string? RegraDeclaracaoAcoes { get; set; }
    public List<SistemaResultadoDadoDto> ResultadosDado { get; set; } = new();
    public List<SistemaTipoDanoDto> TiposDano { get; set; } = new();
    public List<SistemaTipoDefesaDto> TiposDefesa { get; set; } = new();
}

public sealed class SistemaPoderesConfigDto
{
    public int LimiteMagias { get; set; }
    public bool PermiteMagiasCompostas { get; set; }
    public string? RegraAprendizadoMagia { get; set; }
    public List<SistemaTipoMagiaDto> TiposMagia { get; set; } = new();
    public SistemaSkillConfigDto? SkillConfig { get; set; }
}

public sealed class SistemaSobrevivenciaConfigDto
{
    public List<SistemaCondicaoDto> Condicoes { get; set; } = new();
    public List<SistemaDescansoConfigDto> Descansos { get; set; } = new();
    public SistemaMorteConfigDto? Morte { get; set; }
    public string? RegraLoot { get; set; }
    public string? RegraRefeicoes { get; set; }
}

public sealed class SistemaModuloDto
{
    public int IdSistemaModulo { get; set; }
    public SistemaModuloTipo TipoModulo { get; set; }
    public bool Habilitado { get; set; } = true;
    public int SchemaVersion { get; set; } = 1;
    public int Ordem { get; set; }
}

public sealed class SistemaNivelDto
{
    public int IdSistemaNivel { get; set; }
    public int Nivel { get; set; }
    public int XpParaProximoNivel { get; set; }
    public int PontosNivel { get; set; }
    public int PontosAtributo { get; set; }
    public int PontosSkill { get; set; }
    public int PontosUltimate { get; set; }
    public bool PermiteNovaMagia { get; set; }
    public bool PermiteNovaSkill { get; set; }
    public string? Observacao { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaMarcoNivelDto
{
    public int IdSistemaMarcoNivel { get; set; }
    public int Nivel { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public string TipoRecompensa { get; set; } = null!;
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaFonteExperienciaDto
{
    public int IdSistemaFonteExperiencia { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? TipoTeste { get; set; }
    public string? Formula { get; set; }
    public int? ValorMinimo { get; set; }
    public int? ValorMaximo { get; set; }
    public bool UsaVantagem { get; set; }
    public string? Descricao { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaRacaConfigDto
{
    public int IdSistemaRacaConfig { get; set; }
    public int? IdRaca { get; set; }
    public string? CodigoRaca { get; set; }
    public string? NomeRaca { get; set; }
    public bool Jogavel { get; set; } = true;
    public int VidaBase { get; set; }
    public int EstaminaBase { get; set; }
    public int ManaBase { get; set; }
    public int CapacidadeCargaBase { get; set; }
    public string? CodigoAtributoInicial { get; set; }
    public string? Passivas { get; set; }
    public string? Variantes { get; set; }
    public int NivelDesbloqueio { get; set; }
    public string? Observacoes { get; set; }
    public int Ordem { get; set; }
    public List<SistemaRacaPassivaDto> PassivasVinculadas { get; set; } = new();
}

public sealed class SistemaRacaPassivaDto
{
    public int IdSistemaRacaPassiva { get; set; }
    public int? IdPassiva { get; set; }
    public string CodigoPassiva { get; set; } = null!;
    public string NomeExibicao { get; set; } = null!;
    public string? Variante { get; set; }
    public int Ordem { get; set; }
    public int NivelDesbloqueio { get; set; }
}

public sealed class SistemaAtributoConfigDto
{
    public int IdSistemaAtributo { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public SistemaAtributoGrupo Grupo { get; set; }
    public int ValorMinimo { get; set; }
    public int ValorMaximoNatural { get; set; }
    public int? ValorMaximoAbsoluto { get; set; }
    public int ValorComum { get; set; }
    public string? FormulaTeste { get; set; }
    public int? LimiteUso { get; set; }
    public string? TipoLimiteUso { get; set; }
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public bool Ativo { get; set; } = true;
}

public sealed class SistemaRecursoConfigDto
{
    public int IdSistemaRecurso { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public decimal ValorMinimo { get; set; }
    public decimal ValorPadrao { get; set; }
    public decimal? ValorMaximo { get; set; }
    public bool PermiteValorNegativo { get; set; }
    public decimal RecuperacaoPadrao { get; set; }
    public decimal RecuperacaoDescansoSimples { get; set; }
    public decimal RecuperacaoDescansoNormal { get; set; }
    public decimal RecuperacaoDescansoLongo { get; set; }
    public string? CondicaoAoZerar { get; set; }
    public string? FormulaValorInicial { get; set; }
    public string? FormulaValorMaximo { get; set; }
    public string? Formula { get; set; }
    public int Ordem { get; set; }
    public bool Ativo { get; set; } = true;
}

public sealed class SistemaMovimentoConfigDto
{
    public int IdSistemaMovimentoConfig { get; set; }
    public bool UsaGrid { get; set; }
    public decimal MetrosPorQuadrado { get; set; }
    public int MovimentoGratuito { get; set; }
    public decimal CustoEstaminaPorQuadrado { get; set; }
    public int? MaximoQuadradosTurno { get; set; }
    public bool PermiteMoverAposAtaque { get; set; }
    public string? Observacoes { get; set; }
}

public sealed class SistemaPontosAcaoConfigDto
{
    public int IdSistemaPontosAcaoConfig { get; set; }
    public bool Habilitado { get; set; }
    public int PontosPorTurno { get; set; }
    public int SegundosPorPonto { get; set; }
    public bool PermiteAcumular { get; set; }
    public int LimiteAcumulado { get; set; }
}

public sealed class SistemaAcaoConfigDto
{
    public int IdSistemaAcaoConfig { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string Tipo { get; set; } = null!;
    public decimal CustoPontosAcao { get; set; }
    public decimal CustoEstamina { get; set; }
    public decimal CustoMana { get; set; }
    public bool EncerraTurno { get; set; }
    public bool PermiteCombo { get; set; }
    public bool ExigeAlvo { get; set; }
    public string? Formula { get; set; }
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public string? ConfiguracaoJson { get; set; }
}

public sealed class SistemaResultadoDadoDto
{
    public int IdSistemaResultadoDado { get; set; }
    public string CodigoTeste { get; set; } = null!;
    public string NomeTeste { get; set; } = null!;
    public string Dado { get; set; } = null!;
    public int QuantidadeDados { get; set; } = 1;
    public int ResultadoMinimo { get; set; }
    public int ResultadoMaximo { get; set; }
    public bool ExigeNatural { get; set; }
    public string CodigoResultado { get; set; } = null!;
    public string NomeResultado { get; set; } = null!;
    public string? Descricao { get; set; }
    public string? EfeitoJson { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaTipoDanoDto
{
    public int IdSistemaTipoDano { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public bool IgnoraArmadura { get; set; }
    public bool IgnoraProtecao { get; set; }
    public bool IgnoraEscudo { get; set; }
    public bool Periodico { get; set; }
    public bool Area { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaTipoDefesaDto
{
    public int IdSistemaTipoDefesa { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public int OrdemAplicacao { get; set; }
    public string TipoComportamento { get; set; } = null!;
    public string? Formula { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaTipoMagiaDto
{
    public int IdSistemaTipoMagia { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public string? Cor { get; set; }
    public string? Afinidade { get; set; }
    public decimal CustoBase { get; set; }
    public int Ordem { get; set; }
    public string? ConfiguracaoJson { get; set; }
}

public sealed class SistemaSkillConfigDto
{
    public int IdSistemaSkillConfig { get; set; }
    public int MaximoSkills { get; set; }
    public int NivelMaximoSkill { get; set; }
    public int MaximoUltimates { get; set; }
    public int NivelDesbloqueioUltimate { get; set; }
    public int? MaximoMagias { get; set; }
    public bool UsaCooldown { get; set; }
    public bool PermiteArtesEtericas { get; set; }
    public string? Observacoes { get; set; }
}

public sealed class SistemaCondicaoDto
{
    public int IdSistemaCondicao { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public string Tipo { get; set; } = null!;
    public int? DuracaoPadrao { get; set; }
    public SistemaUnidadeDuracao UnidadeDuracao { get; set; }
    public bool Empilhavel { get; set; }
    public bool RemocaoAutomatica { get; set; }
    public bool PermiteSobrescrever { get; set; }
    public decimal? ValorPadrao { get; set; }
    public string? ConfiguracaoPadraoJson { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaDescansoConfigDto
{
    public int IdSistemaDescansoConfig { get; set; }
    public string Tipo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public int? DuracaoMinimaMinutos { get; set; }
    public int? DuracaoMaximaMinutos { get; set; }
    public decimal RecuperacaoVida { get; set; }
    public decimal RecuperacaoMana { get; set; }
    public decimal RecuperacaoEstamina { get; set; }
    public SistemaRecuperacaoTipo TipoRecuperacao { get; set; }
    public bool ExigeGuarda { get; set; }
    public int? IntervaloTesteGuardaMinutos { get; set; }
    public bool PermiteAtividades { get; set; }
    public string? ConfiguracaoJson { get; set; }
    public int Ordem { get; set; }
}

public sealed class SistemaMorteConfigDto
{
    public int IdSistemaMorteConfig { get; set; }
    public int LimiteBeiraDaMorte { get; set; }
    public int QuantidadeTestesCombate { get; set; }
    public int QuantidadeTestesForaCombate { get; set; }
    public int SucessosNecessarios { get; set; }
    public string DadoSobrevivencia { get; set; } = null!;
    public int ResultadoMinimoSucesso { get; set; }
    public int LimiteVidaDesmembramento { get; set; }
    public decimal MultiplicadorDanoDesmembramento { get; set; }
    public int LimiteVidaInstaKill { get; set; }
    public decimal MultiplicadorDanoInstaKill { get; set; }
    public bool PermiteEstabilizacaoManual { get; set; }
    public string? Observacoes { get; set; }
}
