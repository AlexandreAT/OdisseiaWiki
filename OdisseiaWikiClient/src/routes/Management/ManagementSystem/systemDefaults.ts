import {
  ConfiguracaoCombateSistema,
  ConfiguracaoCriacaoSistema,
  ConfiguracaoExploracaoSistema,
  ConfiguracaoGeralSistema,
  ConfiguracaoPoderesSistema,
  ConfiguracaoProgressaoSistema,
  ConfiguracaoSobrevivenciaSistema,
  SistemaModuloConfigMap,
  SistemaModuloKey,
} from '../../../models/SistemaRpg';

const createGeneralConfig = (): ConfiguracaoGeralSistema => ({
  dadoTesteGeral: 'D6',
  usaVantagem: true,
  usaDesvantagem: true,
  criticoNatural: 6,
  falhaCriticaNatural: 1,
  regraArredondamento: 'Arredondar para baixo.',
  regraEspecificaPrevalece: true,
  autoridadeMestre: true,
  observacoesRegrasFundamentais: '',
  modulos: [
    { tipoModulo: 'RegrasBase', habilitado: true, schemaVersion: 1, ordem: 1 },
    { tipoModulo: 'CriacaoPersonagem', habilitado: true, schemaVersion: 1, ordem: 2 },
    { tipoModulo: 'Progressao', habilitado: true, schemaVersion: 1, ordem: 3 },
    { tipoModulo: 'Exploracao', habilitado: true, schemaVersion: 1, ordem: 4 },
    { tipoModulo: 'Combate', habilitado: true, schemaVersion: 1, ordem: 5 },
    { tipoModulo: 'Poderes', habilitado: true, schemaVersion: 1, ordem: 6 },
    { tipoModulo: 'Sobrevivencia', habilitado: true, schemaVersion: 1, ordem: 7 },
  ],
});

const createCreationConfig = (): ConfiguracaoCriacaoSistema => ({
  nivelInicial: 1,
  pontosIniciais: 0,
  pontosAtributoIniciais: 0,
  pontosSkillIniciais: 0,
  maximoSkillsIniciais: 0,
  maximoMagiasIniciais: 0,
  maximoUltimatesIniciais: 0,
  racas: [],
  atributos: [],
  recursos: [],
});

const createProgressionConfig = (): ConfiguracaoProgressaoSistema => ({
  nivelMaximo: 20,
  permiteXpExcedente: true,
  niveis: [],
  marcos: [],
  fontesExperiencia: [],
});

const createExplorationConfig = (): ConfiguracaoExploracaoSistema => ({
  movimento: {
    usaGrid: true,
    metrosPorQuadrado: 2,
    movimentoGratuito: 0,
    custoEstaminaPorQuadrado: 0,
    maximoQuadradosTurno: 0,
    permiteMoverAposAtaque: true,
    observacoes: '',
  },
  pontosAcao: {
    habilitado: false,
    pontosPorTurno: 0,
    segundosPorPonto: 0,
    permiteAcumular: false,
    limiteAcumulado: 0,
  },
  acoes: [],
  cargaUsaLimite: true,
  penalidadeExcessoCarga: '',
  furtividadeObservacoes: '',
});

const createCombatConfig = (): ConfiguracaoCombateSistema => ({
  usaIniciativa: true,
  formulaIniciativa: '',
  segundosPorTurno: 6,
  regraDeclaracaoAcoes: '',
  resultadosDado: [],
  tiposDano: [],
  tiposDefesa: [],
});

const createPowersConfig = (): ConfiguracaoPoderesSistema => ({
  limiteMagias: 0,
  permiteMagiasCompostas: true,
  regraAprendizadoMagia: '',
  tiposMagia: [],
  skillConfig: {
    maximoSkills: 0,
    nivelMaximoSkill: 0,
    maximoUltimates: 0,
    nivelDesbloqueioUltimate: 0,
    maximoMagias: 0,
    usaCooldown: true,
    permiteArtesEtericas: true,
    observacoes: '',
  },
});

const createSurvivalConfig = (): ConfiguracaoSobrevivenciaSistema => ({
  condicoes: [],
  descansos: [],
  morte: null,
  regraLoot: '',
  regraRefeicoes: '',
});

export const createDefaultModuleConfig = <K extends SistemaModuloKey>(
  moduleKey: K,
): SistemaModuloConfigMap[K] => {
  const defaults: SistemaModuloConfigMap = {
    geral: createGeneralConfig(),
    criacao: createCreationConfig(),
    progressao: createProgressionConfig(),
    exploracao: createExplorationConfig(),
    combate: createCombatConfig(),
    poderes: createPowersConfig(),
    sobrevivencia: createSurvivalConfig(),
  };

  return defaults[moduleKey];
};

export const normalizeModuleConfig = <K extends SistemaModuloKey>(
  moduleKey: K,
  value: SistemaModuloConfigMap[K] | null | undefined,
): SistemaModuloConfigMap[K] => {
  const fallback = createDefaultModuleConfig(moduleKey);
  if (!value) return fallback;

  switch (moduleKey) {
    case 'geral': {
      const source = value as ConfiguracaoGeralSistema;
      return {
        ...fallback,
        ...source,
        modulos: Array.isArray(source.modulos) ? source.modulos : [],
      } as SistemaModuloConfigMap[K];
    }
    case 'criacao': {
      const source = value as ConfiguracaoCriacaoSistema;
      return {
        ...fallback,
        ...source,
        racas: Array.isArray(source.racas)
          ? source.racas.map((race) => ({
            ...race,
            passivasVinculadas: Array.isArray(race.passivasVinculadas)
              ? race.passivasVinculadas
              : [],
          }))
          : [],
        atributos: Array.isArray(source.atributos) ? source.atributos : [],
        recursos: Array.isArray(source.recursos) ? source.recursos : [],
      } as SistemaModuloConfigMap[K];
    }
    case 'progressao': {
      const source = value as ConfiguracaoProgressaoSistema;
      return {
        ...fallback,
        ...source,
        niveis: Array.isArray(source.niveis) ? source.niveis : [],
        marcos: Array.isArray(source.marcos) ? source.marcos : [],
        fontesExperiencia: Array.isArray(source.fontesExperiencia) ? source.fontesExperiencia : [],
      } as SistemaModuloConfigMap[K];
    }
    case 'exploracao': {
      const source = value as ConfiguracaoExploracaoSistema;
      const explorationFallback = fallback as ConfiguracaoExploracaoSistema;
      return {
        ...explorationFallback,
        ...source,
        movimento: source.movimento
          ? { ...explorationFallback.movimento, ...source.movimento }
          : explorationFallback.movimento,
        pontosAcao: source.pontosAcao
          ? { ...explorationFallback.pontosAcao, ...source.pontosAcao }
          : explorationFallback.pontosAcao,
        acoes: Array.isArray(source.acoes) ? source.acoes : [],
      } as SistemaModuloConfigMap[K];
    }
    case 'combate': {
      const source = value as ConfiguracaoCombateSistema;
      return {
        ...fallback,
        ...source,
        resultadosDado: Array.isArray(source.resultadosDado) ? source.resultadosDado : [],
        tiposDano: Array.isArray(source.tiposDano) ? source.tiposDano : [],
        tiposDefesa: Array.isArray(source.tiposDefesa) ? source.tiposDefesa : [],
      } as SistemaModuloConfigMap[K];
    }
    case 'poderes': {
      const source = value as ConfiguracaoPoderesSistema;
      const powersFallback = fallback as ConfiguracaoPoderesSistema;
      return {
        ...powersFallback,
        ...source,
        tiposMagia: Array.isArray(source.tiposMagia) ? source.tiposMagia : [],
        skillConfig: source.skillConfig
          ? { ...powersFallback.skillConfig, ...source.skillConfig }
          : powersFallback.skillConfig,
      } as SistemaModuloConfigMap[K];
    }
    case 'sobrevivencia': {
      const source = value as ConfiguracaoSobrevivenciaSistema;
      const survivalFallback = fallback as ConfiguracaoSobrevivenciaSistema;
      return {
        ...survivalFallback,
        ...source,
        condicoes: Array.isArray(source.condicoes) ? source.condicoes : [],
        descansos: Array.isArray(source.descansos) ? source.descansos : [],
        morte: source.morte
          ? { ...source.morte }
          : null,
      } as SistemaModuloConfigMap[K];
    }
  }

  return fallback;
};
