export type SistemaVersaoStatus =
  | 'Rascunho'
  | 'Publicado'
  | 'Arquivado'
  | 'Draft'
  | 'Published'
  | 'Archived';

export type SistemaModuloKey =
  | 'geral'
  | 'criacao'
  | 'progressao'
  | 'exploracao'
  | 'combate'
  | 'poderes'
  | 'sobrevivencia';

export type SistemaModuloEndpoint =
  | 'configuracao-geral'
  | 'criacao'
  | 'progressao'
  | 'exploracao'
  | 'combate'
  | 'poderes'
  | 'sobrevivencia';

export interface SistemaRpgResumo {
  idSistemaRpg: number;
  codigo: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  idVersaoPublicada?: number | null;
  numeroVersaoPublicada?: string | null;
  quantidadeVersoes: number;
  quantidadeMesas: number;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface SistemaRpg extends SistemaRpgResumo {
  versoes?: SistemaVersaoResumo[];
}

export interface CriarSistemaRpgPayload {
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface AtualizarSistemaRpgPayload {
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface SistemaVersaoResumo {
  idSistemaVersao: number;
  idSistemaRpg: number;
  numeroVersao: string;
  status: SistemaVersaoStatus;
  idVersaoBase?: number | null;
  changelog?: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
  dataPublicacao?: string | null;
  dataArquivamento?: string | null;
  quantidadeMesas: number;
}

export interface CriarSistemaVersaoPayload {
  numeroVersao: string;
  idVersaoBase?: number | null;
  changelog?: string;
}

export interface DuplicarSistemaVersaoPayload {
  numeroVersao: string;
  changelog?: string;
}

export interface SistemaModulo {
  idSistemaModulo?: number;
  tipoModulo:
    | 'RegrasBase'
    | 'CriacaoPersonagem'
    | 'Progressao'
    | 'Atributos'
    | 'Recursos'
    | 'Movimento'
    | 'PontosAcao'
    | 'Combate'
    | 'Furtividade'
    | 'Equipamentos'
    | 'Defesas'
    | 'Danos'
    | 'Magias'
    | 'Skills'
    | 'Condicoes'
    | 'Descanso'
    | 'Exploracao'
    | 'Morte'
    | 'Poderes'
    | 'Sobrevivencia';
  habilitado: boolean;
  schemaVersion: number;
  ordem: number;
}

export interface ConfiguracaoGeralSistema {
  dadoTesteGeral: string;
  usaVantagem: boolean;
  usaDesvantagem: boolean;
  criticoNatural: number;
  falhaCriticaNatural: number;
  regraArredondamento: string;
  regraEspecificaPrevalece: boolean;
  autoridadeMestre: boolean;
  observacoesRegrasFundamentais?: string;
  modulos: SistemaModulo[];
}

export type GrupoAtributo = 'Principal' | 'Secundario' | 'Defesa' | 'Outro';

export interface SistemaAtributoConfig {
  idSistemaAtributo?: number;
  codigo: string;
  nome: string;
  grupo: GrupoAtributo | string;
  valorMinimo: number;
  valorMaximoNatural: number;
  valorMaximoAbsoluto: number | null;
  valorComum: number;
  formulaTeste?: string;
  limiteUso?: number | null;
  tipoLimiteUso?: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

export interface SistemaRecursoConfig {
  idSistemaRecurso?: number;
  codigo: string;
  nome: string;
  valorMinimo: number;
  valorPadrao: number;
  valorMaximo?: number | null;
  permiteValorNegativo: boolean;
  recuperacaoPadrao: number;
  recuperacaoDescansoSimples: number;
  recuperacaoDescansoNormal: number;
  recuperacaoDescansoLongo: number;
  condicaoAoZerar?: string;
  formulaValorInicial?: string;
  formulaValorMaximo?: string;
  formula?: string;
  ordem: number;
  ativo: boolean;
}

export interface SistemaRacaConfig {
  idSistemaRacaConfig?: number;
  idRaca?: number | null;
  codigoRaca?: string;
  nomeRaca?: string;
  jogavel: boolean;
  vidaBase: number;
  estaminaBase: number;
  manaBase: number;
  capacidadeCargaBase: number;
  codigoAtributoInicial?: string;
  passivas?: string;
  variantes?: string;
  nivelDesbloqueio: number;
  observacoes?: string;
  ordem: number;
  passivasVinculadas: SistemaRacaPassiva[];
}

export interface SistemaRacaPassiva {
  idSistemaRacaPassiva?: number;
  idPassiva?: number | null;
  codigoPassiva: string;
  nomeExibicao: string;
  variante?: string;
  ordem: number;
  nivelDesbloqueio: number;
}

export interface ConfiguracaoCriacaoSistema {
  nivelInicial: number;
  pontosIniciais: number;
  pontosAtributoIniciais: number;
  pontosSkillIniciais: number;
  maximoSkillsIniciais: number;
  maximoMagiasIniciais: number;
  maximoUltimatesIniciais: number;
  racas: SistemaRacaConfig[];
  atributos: SistemaAtributoConfig[];
  recursos: SistemaRecursoConfig[];
}

export interface SistemaNivelProgressao {
  idSistemaNivel?: number;
  nivel: number;
  xpParaProximoNivel: number;
  pontosNivel: number;
  pontosAtributo: number;
  pontosSkill: number;
  pontosUltimate: number;
  permiteNovaMagia: boolean;
  permiteNovaSkill: boolean;
  observacao?: string;
  ordem: number;
}

export interface SistemaMarcoProgressao {
  idSistemaMarcoNivel?: number;
  nivel: number;
  codigo: string;
  nome: string;
  descricao?: string;
  tipoRecompensa: string;
  configuracaoJson?: string;
  ordem: number;
}

export interface SistemaFonteExperiencia {
  idSistemaFonteExperiencia?: number;
  codigo: string;
  nome: string;
  tipoTeste?: string;
  formula?: string;
  valorMinimo: number | null;
  valorMaximo: number | null;
  usaVantagem: boolean;
  descricao?: string;
  ordem: number;
}

export interface ConfiguracaoProgressaoSistema {
  nivelMaximo: number;
  permiteXpExcedente: boolean;
  niveis: SistemaNivelProgressao[];
  marcos: SistemaMarcoProgressao[];
  fontesExperiencia: SistemaFonteExperiencia[];
}

export interface SistemaMovimentoConfig {
  idSistemaMovimentoConfig?: number;
  usaGrid: boolean;
  metrosPorQuadrado: number;
  movimentoGratuito: number;
  custoEstaminaPorQuadrado: number;
  maximoQuadradosTurno: number | null;
  permiteMoverAposAtaque: boolean;
  observacoes?: string;
}

export interface SistemaPontosAcaoConfig {
  idSistemaPontosAcaoConfig?: number;
  habilitado: boolean;
  pontosPorTurno: number;
  segundosPorPonto: number;
  permiteAcumular: boolean;
  limiteAcumulado: number;
}

export interface SistemaAcaoConfig {
  idSistemaAcaoConfig?: number;
  codigo: string;
  nome: string;
  tipo: string;
  custoPontosAcao: number;
  custoEstamina: number;
  custoMana: number;
  encerraTurno: boolean;
  permiteCombo: boolean;
  exigeAlvo: boolean;
  formula?: string;
  descricao?: string;
  ordem: number;
}

export interface ConfiguracaoExploracaoSistema {
  movimento?: SistemaMovimentoConfig | null;
  pontosAcao?: SistemaPontosAcaoConfig | null;
  acoes: SistemaAcaoConfig[];
  cargaUsaLimite: boolean;
  penalidadeExcessoCarga?: string;
  furtividadeObservacoes?: string;
}

export interface SistemaResultadoDado {
  idSistemaResultadoDado?: number;
  codigoTeste: string;
  nomeTeste: string;
  dado: string;
  quantidadeDados: number;
  resultadoMinimo: number;
  resultadoMaximo: number;
  exigeNatural: boolean;
  codigoResultado: string;
  nomeResultado: string;
  descricao?: string;
  ordem: number;
}

export interface SistemaTipoDano {
  idSistemaTipoDano?: number;
  codigo: string;
  nome: string;
  descricao?: string;
  ignoraArmadura: boolean;
  ignoraProtecao: boolean;
  ignoraEscudo: boolean;
  periodico: boolean;
  area: boolean;
  ordem: number;
}

export interface SistemaTipoDefesa {
  idSistemaTipoDefesa?: number;
  codigo: string;
  nome: string;
  descricao?: string;
  ordemAplicacao: number;
  tipoComportamento: string;
  formula?: string;
  ordem: number;
}

export interface ConfiguracaoCombateSistema {
  usaIniciativa: boolean;
  formulaIniciativa?: string;
  segundosPorTurno: number;
  regraDeclaracaoAcoes?: string;
  resultadosDado: SistemaResultadoDado[];
  tiposDano: SistemaTipoDano[];
  tiposDefesa: SistemaTipoDefesa[];
}

export interface SistemaTipoMagia {
  idSistemaTipoMagia?: number;
  codigo: string;
  nome: string;
  descricao?: string;
  cor?: string;
  afinidade?: string;
  custoBase: number;
  ordem: number;
}

export interface SistemaSkillConfig {
  idSistemaSkillConfig?: number;
  maximoSkills: number;
  nivelMaximoSkill: number;
  maximoUltimates: number;
  nivelDesbloqueioUltimate: number;
  maximoMagias?: number | null;
  usaCooldown: boolean;
  permiteArtesEtericas: boolean;
  observacoes?: string;
}

export interface ConfiguracaoPoderesSistema {
  limiteMagias: number;
  permiteMagiasCompostas: boolean;
  regraAprendizadoMagia?: string;
  tiposMagia: SistemaTipoMagia[];
  skillConfig?: SistemaSkillConfig | null;
}

export interface SistemaCondicao {
  idSistemaCondicao?: number;
  codigo: string;
  nome: string;
  descricao?: string;
  tipo: string;
  duracaoPadrao: number | null;
  unidadeDuracao: 'Turno' | 'Minuto' | 'Hora' | 'Descanso' | 'Sessao' | 'Permanente';
  empilhavel: boolean;
  remocaoAutomatica: boolean;
  permiteSobrescrever: boolean;
  valorPadrao?: number | null;
  ordem: number;
}

export interface SistemaDescansoConfig {
  idSistemaDescansoConfig?: number;
  tipo: string;
  nome: string;
  duracaoMinimaMinutos: number | null;
  duracaoMaximaMinutos: number | null;
  recuperacaoVida: number;
  recuperacaoMana: number;
  recuperacaoEstamina: number;
  tipoRecuperacao: 'ValorFixo' | 'Percentual' | 'Formula';
  exigeGuarda: boolean;
  intervaloTesteGuardaMinutos: number | null;
  permiteAtividades: boolean;
  ordem: number;
}

export interface SistemaMorteConfig {
  idSistemaMorteConfig?: number;
  limiteBeiraDaMorte: number;
  quantidadeTestesCombate: number;
  quantidadeTestesForaCombate: number;
  sucessosNecessarios: number;
  dadoSobrevivencia: string;
  resultadoMinimoSucesso: number;
  limiteVidaDesmembramento: number;
  multiplicadorDanoDesmembramento: number;
  limiteVidaInstaKill: number;
  multiplicadorDanoInstaKill: number;
  permiteEstabilizacaoManual: boolean;
  observacoes?: string;
}

export interface ConfiguracaoSobrevivenciaSistema {
  condicoes: SistemaCondicao[];
  descansos: SistemaDescansoConfig[];
  morte?: SistemaMorteConfig | null;
  regraLoot?: string;
  regraRefeicoes?: string;
}

export interface SistemaModuloConfigMap {
  geral: ConfiguracaoGeralSistema;
  criacao: ConfiguracaoCriacaoSistema;
  progressao: ConfiguracaoProgressaoSistema;
  exploracao: ConfiguracaoExploracaoSistema;
  combate: ConfiguracaoCombateSistema;
  poderes: ConfiguracaoPoderesSistema;
  sobrevivencia: ConfiguracaoSobrevivenciaSistema;
}

export interface SistemaResolverResult {
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  codigoSistema: string;
  numeroVersao: string;
  origem: 'MesaExplicita' | 'SistemaPadrao' | 'FallbackLegado';
  usaFallbackLegado: boolean;
}

export type SistemaRuntimeOrigem =
  | 'Mesa'
  | 'VersaoFixadaPersonagemJogador'
  | 'VersaoFixadaEntidade'
  | 'PublicacaoAtualEntidade'
  | 'SistemaPadrao'
  | 'FallbackLegado';

export type SistemaEntidadeGlobalTipo = 'Npc' | 'Raca' | 'Item';

export type SistemaValorProveniencia =
  | 'Sistema'
  | 'OverrideMesa'
  | 'ValorExplicitoEntidade'
  | 'FallbackLegado';

export interface SistemaRuntimeConsulta {
  idMesa?: number;
  idPersonagemJogador?: number;
  tipoEntidade?: SistemaEntidadeGlobalTipo;
  idEntidade?: string;
  idRaca?: number;
  codigoTipoItem?: string;
  codigoCategoriaItem?: string;
  codigoArquetipoItem?: string;
}

export interface SistemaRuntimeVinculoEntidade {
  tipoEntidade: SistemaEntidadeGlobalTipo;
  idEntidade: string;
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  acompanharPublicacaoAtual: boolean;
}

export interface SistemaRuntimeProveniencia {
  caminho: string;
  origem: SistemaValorProveniencia;
  detalhe?: string | null;
}

export interface SistemaRuntimeWarning {
  codigo: string;
  mensagem: string;
  caminho?: string | null;
  valorInformado?: number | null;
  valorMinimoReferencia?: number | null;
  valorMaximoReferencia?: number | null;
  referencia?: string | null;
}

export interface SistemaRuntimeFallback {
  caminho: string;
  motivo: string;
  origem: SistemaValorProveniencia;
}

export interface SistemaItemCampoRuntime {
  idSistemaItemCampo: number;
  codigo: string;
  nome: string;
  tipo: 'Texto' | 'Inteiro' | 'Decimal' | 'Booleano' | 'Codigo' | 'Lista' | string;
  unidade?: string | null;
  obrigatorio: boolean;
  descricao?: string | null;
  ordem: number;
  codigoCaminhoOrigem?: string | null;
}

export interface SistemaItemFaixaRuntime {
  idSistemaItemFaixa: number;
  codigoCampo: string;
  nome: string;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  valorReferencia?: number | null;
  unidade?: string | null;
  descricao?: string | null;
  ordem: number;
  codigoCaminhoOrigem?: string | null;
}

export interface SistemaItemReferenciaRuntime {
  idSistemaItemReferencia: number;
  tipo: string;
  codigo: string;
  nome: string;
  valor?: string | null;
  descricao?: string | null;
  ordem: number;
  codigoCaminhoOrigem?: string | null;
}

export interface SistemaItemEscopoRuntime {
  idSistemaItemEscopo: number;
  idEscopoPai?: number | null;
  nivel: 'Tipo' | 'Categoria' | 'Arquetipo' | string;
  codigo: string;
  codigoCaminho: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  campos: SistemaItemCampoRuntime[];
  faixas: SistemaItemFaixaRuntime[];
  referencias: SistemaItemReferenciaRuntime[];
  filhos: SistemaItemEscopoRuntime[];
}

/** Catálogo mecânico versionado de itens usado tanto no runtime quanto no editor administrativo. */
export interface SistemaItensConfig {
  tipos: SistemaItemEscopoRuntime[];
}

export interface SistemaItemReferenciaEfetivaRuntime {
  codigoTipo?: string | null;
  codigoCategoria?: string | null;
  codigoArquetipo?: string | null;
  codigoCaminho?: string | null;
  completa: boolean;
  campos: SistemaItemCampoRuntime[];
  faixas: SistemaItemFaixaRuntime[];
  referencias: SistemaItemReferenciaRuntime[];
}

export interface SistemaRuntimeContexto {
  idSistemaRpg?: number | null;
  idSistemaVersao?: number | null;
  codigoSistema: string;
  nomeSistema?: string | null;
  numeroVersao: string;
  statusVersao?: SistemaVersaoStatus | null;
  origem: SistemaRuntimeOrigem;
  idMesa?: number | null;
  idPersonagemJogador?: number | null;
  entidade?: SistemaRuntimeVinculoEntidade | null;
  acompanhaPublicacaoAtual: boolean;
  idVersaoFixada?: number | null;
  atualizacaoDisponivel?: boolean;
  idVersaoDisponivel?: number | null;
  numeroVersaoDisponivel?: string | null;
  usaFallbackLegado: boolean;
  configuracaoGeral?: ConfiguracaoGeralSistema | null;
  criacao?: ConfiguracaoCriacaoSistema | null;
  progressao?: ConfiguracaoProgressaoSistema | null;
  exploracao?: ConfiguracaoExploracaoSistema | null;
  combate?: ConfiguracaoCombateSistema | null;
  poderes?: ConfiguracaoPoderesSistema | null;
  sobrevivencia?: ConfiguracaoSobrevivenciaSistema | null;
  configuracaoRacial?: SistemaRacaConfig | null;
  itens: SistemaItensConfig;
  referenciaItem?: SistemaItemReferenciaEfetivaRuntime | null;
  proveniencias: SistemaRuntimeProveniencia[];
  warnings: SistemaRuntimeWarning[];
  fallbacks: SistemaRuntimeFallback[];
}

export type SistemaPatchAlteracaoTipo = 'Adicionado' | 'Removido' | 'Alterado';
export type SistemaPatchImpacto = 'Baixo' | 'Medio' | 'Alto' | 'Critico';
export type SistemaMigracaoAvisoNivel = 'Informacao' | 'Atencao' | 'Bloqueio';

export interface SistemaPatchAlteracao {
  modulo: string;
  entidade: string;
  identidade?: string | null;
  campo: string;
  valorAnterior?: unknown;
  valorNovo?: unknown;
  tipo: SistemaPatchAlteracaoTipo;
  impacto: SistemaPatchImpacto;
  descricao: string;
}

export interface SistemaPatchGrupo {
  modulo: string;
  titulo: string;
  impacto: SistemaPatchImpacto;
  alteracoes: SistemaPatchAlteracao[];
}

export interface SistemaPatchNote {
  idSistemaPatchNote: number;
  idSistemaRpg: number;
  codigoSistema: string;
  nomeSistema: string;
  idVersaoAnterior?: number | null;
  numeroVersaoAnterior?: string | null;
  idSistemaVersao: number;
  numeroVersaoNova: string;
  dataGeracao: string;
  titulo: string;
  resumo: string;
  versaoInicial: boolean;
  grupos: SistemaPatchGrupo[];
}

export interface SistemaMigracaoAviso {
  codigo: string;
  nivel: SistemaMigracaoAvisoNivel;
  categoria: string;
  mensagem: string;
  entidade?: string | null;
  identidade?: string | null;
  quantidade: number;
}

export interface SistemaMigracaoResumoMesa {
  quantidadePersonagens: number;
  quantidadeOverrides: number;
  quantidadeItensInventario: number;
  quantidadeAvisos: number;
  quantidadeBloqueios: number;
}

export interface MesaMigracaoPreview {
  idMesa: number;
  nomeMesa: string;
  idSistemaVersaoOrigem?: number | null;
  numeroVersaoOrigem: string;
  idSistemaVersaoDestino: number;
  numeroVersaoDestino: string;
  requerConfirmacaoExplicita: boolean;
  alteraSomenteVersaoDaMesa: boolean;
  valoresPreservados: string[];
  comparacao: SistemaPatchNote;
  avisos: SistemaMigracaoAviso[];
  resumoMesa: SistemaMigracaoResumoMesa;
}

export const SISTEMA_MODULO_ENDPOINTS: Record<SistemaModuloKey, SistemaModuloEndpoint> = {
  geral: 'configuracao-geral',
  criacao: 'criacao',
  progressao: 'progressao',
  exploracao: 'exploracao',
  combate: 'combate',
  poderes: 'poderes',
  sobrevivencia: 'sobrevivencia',
};

export const SISTEMA_MODULO_LABELS: Record<SistemaModuloKey, string> = {
  geral: 'Visão geral',
  criacao: 'Criação',
  progressao: 'Progressão',
  exploracao: 'Exploração',
  combate: 'Combate',
  poderes: 'Poderes',
  sobrevivencia: 'Sobrevivência',
};

export const isSistemaVersaoRascunho = (status: SistemaVersaoStatus): boolean => (
  status === 'Rascunho' || status === 'Draft'
);

export const getSistemaVersaoStatusLabel = (status: SistemaVersaoStatus): string => {
  if (status === 'Rascunho' || status === 'Draft') return 'Rascunho';
  if (status === 'Publicado' || status === 'Published') return 'Publicado';
  return 'Arquivado';
};
