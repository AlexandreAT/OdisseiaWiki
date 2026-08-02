import {
  ConfiguracaoCombateSistema,
  ConfiguracaoCriacaoSistema,
  ConfiguracaoExploracaoSistema,
  ConfiguracaoGeralSistema,
  ConfiguracaoPoderesSistema,
  ConfiguracaoProgressaoSistema,
  ConfiguracaoSobrevivenciaSistema,
  CriarSistemaRpgPayload,
  CriarSistemaVersaoPayload,
  SistemaModuloConfigMap,
  SistemaModuloKey,
} from '../../../models/SistemaRpg';

export type SistemaValidationErrors = Record<string, string>;

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;
const SYSTEM_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,49}$/;
const VERSION_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;

const addRequired = (
  errors: SistemaValidationErrors,
  path: string,
  value: string | null | undefined,
  label: string,
) => {
  if (!value?.trim()) errors[path] = `${label} é obrigatório.`;
};

const addNonNegative = (
  errors: SistemaValidationErrors,
  path: string,
  value: number | null | undefined,
  label: string,
) => {
  if (value === null || value === undefined) return;
  if (!Number.isFinite(value) || value < 0) errors[path] = `${label} não pode ser negativo.`;
};

const addPositive = (
  errors: SistemaValidationErrors,
  path: string,
  value: number,
  label: string,
) => {
  if (!Number.isFinite(value) || value <= 0) errors[path] = `${label} deve ser maior que zero.`;
};

const addCode = (
  errors: SistemaValidationErrors,
  path: string,
  value: string | null | undefined,
  label = 'Código',
) => {
  addRequired(errors, path, value, label);
  if (value?.trim() && !CODE_PATTERN.test(value.trim().toUpperCase())) {
    errors[path] = `${label} aceita apenas letras, números, _ e -.`;
  }
};

const addDuplicateErrors = <T>(
  errors: SistemaValidationErrors,
  rows: T[],
  basePath: string,
  field: keyof T,
  label: string,
) => {
  const indexesByValue = new Map<string, number[]>();
  rows.forEach((row, index) => {
    const raw = row[field];
    const normalized = String(raw ?? '').trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return;
    indexesByValue.set(normalized, [...(indexesByValue.get(normalized) ?? []), index]);
  });

  indexesByValue.forEach((indexes) => {
    if (indexes.length < 2) return;
    indexes.forEach((index) => {
      errors[`${basePath}.${index}.${String(field)}`] = `${label} duplicado.`;
    });
  });
};

export const validateSistemaRpg = (
  payload: CriarSistemaRpgPayload,
  editing: boolean,
): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  addRequired(errors, 'nome', payload.nome, 'Nome');
  if (!editing) {
    addRequired(errors, 'codigo', payload.codigo, 'Código do sistema');
    if (payload.codigo.trim() && !SYSTEM_CODE_PATTERN.test(payload.codigo.trim().toUpperCase())) {
      errors.codigo = 'Use de 3 a 50 caracteres: comece por letra e utilize somente letras, números ou _.';
    }
  }
  if (payload.nome.trim().length > 150) errors.nome = 'O nome deve ter no máximo 150 caracteres.';
  return errors;
};

export const validateSistemaVersao = (
  payload: CriarSistemaVersaoPayload,
): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  addRequired(errors, 'numeroVersao', payload.numeroVersao, 'Número da versão');
  if (payload.numeroVersao.trim() && !VERSION_PATTERN.test(payload.numeroVersao.trim())) {
    errors.numeroVersao = 'Use uma versão semântica como 1.0, 1.1.0 ou 2.0.';
  }
  if (payload.changelog && payload.changelog.length > 4000) {
    errors.changelog = 'O changelog deve ter no máximo 4000 caracteres.';
  }
  return errors;
};

const validateGeneral = (config: ConfiguracaoGeralSistema): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  addRequired(errors, 'dadoTesteGeral', config.dadoTesteGeral, 'Dado do teste geral');
  addPositive(errors, 'criticoNatural', config.criticoNatural, 'Crítico natural');
  addPositive(errors, 'falhaCriticaNatural', config.falhaCriticaNatural, 'Falha crítica natural');
  const diceMaximum = getDiceMaximum(config.dadoTesteGeral);
  if (!diceMaximum) errors.dadoTesteGeral = 'Use um dado como D6, D8 ou D20.';
  else {
    if (config.criticoNatural > diceMaximum) errors.criticoNatural = `O crítico ultrapassa ${config.dadoTesteGeral.toUpperCase()}.`;
    if (config.falhaCriticaNatural > diceMaximum) errors.falhaCriticaNatural = `A falha ultrapassa ${config.dadoTesteGeral.toUpperCase()}.`;
  }
  if (config.criticoNatural === config.falhaCriticaNatural) {
    errors.falhaCriticaNatural = 'Crítico e falha crítica não podem ter o mesmo resultado.';
  }
  addRequired(errors, 'regraArredondamento', config.regraArredondamento, 'Regra de arredondamento');
  if (config.modulos.length === 0) errors.modulos = 'Adicione ao menos um módulo à versão.';
  config.modulos.forEach((row, index) => {
    addCode(errors, `modulos.${index}.tipoModulo`, row.tipoModulo, 'Tipo do módulo');
    if (row.schemaVersion !== 1) {
      errors[`modulos.${index}.schemaVersion`] = 'Esta API aceita somente o schema 1.';
    }
    addNonNegative(errors, `modulos.${index}.ordem`, row.ordem, 'Ordem');
  });
  addDuplicateErrors(errors, config.modulos, 'modulos', 'tipoModulo', 'Tipo do módulo');
  return errors;
};

const validateCreation = (config: ConfiguracaoCriacaoSistema): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  addPositive(errors, 'nivelInicial', config.nivelInicial, 'Nível inicial');
  [
    ['pontosIniciais', config.pontosIniciais, 'Pontos iniciais'],
    ['pontosAtributoIniciais', config.pontosAtributoIniciais, 'Pontos de atributo'],
    ['pontosSkillIniciais', config.pontosSkillIniciais, 'Pontos de skill'],
    ['maximoSkillsIniciais', config.maximoSkillsIniciais, 'Máximo de skills'],
    ['maximoMagiasIniciais', config.maximoMagiasIniciais, 'Máximo de magias'],
    ['maximoUltimatesIniciais', config.maximoUltimatesIniciais, 'Máximo de ultimates'],
  ].forEach(([path, value, label]) => addNonNegative(
    errors,
    String(path),
    Number(value),
    String(label),
  ));

  config.atributos.forEach((row, index) => {
    addCode(errors, `atributos.${index}.codigo`, row.codigo);
    addRequired(errors, `atributos.${index}.nome`, row.nome, 'Nome');
    addRequired(errors, `atributos.${index}.grupo`, row.grupo, 'Grupo');
    if (row.valorMaximoNatural < row.valorMinimo) {
      errors[`atributos.${index}.valorMaximoNatural`] = 'O máximo natural deve alcançar o mínimo.';
    }
    if (row.valorComum < row.valorMinimo || row.valorComum > row.valorMaximoNatural) {
      errors[`atributos.${index}.valorComum`] = 'O valor comum deve ficar entre o mínimo e o máximo natural.';
    }
    if (row.valorMaximoAbsoluto !== null && row.valorMaximoAbsoluto < row.valorMaximoNatural) {
      errors[`atributos.${index}.valorMaximoAbsoluto`] = 'O máximo absoluto deve alcançar o máximo natural.';
    }
  });
  addDuplicateErrors(errors, config.atributos, 'atributos', 'codigo', 'Código');

  config.recursos.forEach((row, index) => {
    addCode(errors, `recursos.${index}.codigo`, row.codigo);
    addRequired(errors, `recursos.${index}.nome`, row.nome, 'Nome');
    if (!row.permiteValorNegativo && row.valorMinimo < 0) {
      errors[`recursos.${index}.valorMinimo`] = 'Ative valores negativos ou informe um mínimo igual ou maior que zero.';
    }
    if (row.valorPadrao < row.valorMinimo) {
      errors[`recursos.${index}.valorPadrao`] = 'O padrão deve alcançar o valor mínimo.';
    }
    if (row.valorMaximo !== null && row.valorMaximo !== undefined && row.valorMaximo < row.valorMinimo) {
      errors[`recursos.${index}.valorMaximo`] = 'O máximo deve alcançar o mínimo.';
    }
    if (row.valorMaximo !== null && row.valorMaximo !== undefined && row.valorPadrao > row.valorMaximo) {
      errors[`recursos.${index}.valorPadrao`] = 'O padrão não pode ultrapassar o valor máximo.';
    }
  });
  addDuplicateErrors(errors, config.recursos, 'recursos', 'codigo', 'Código');

  config.racas.forEach((row, index) => {
    if (!row.nomeRaca?.trim()) {
      errors[`racas.${index}.idRaca`] = 'Informe uma raça existente.';
    }
    addPositive(errors, `racas.${index}.nivelDesbloqueio`, row.nivelDesbloqueio, 'Nível de desbloqueio');
    [row.vidaBase, row.estaminaBase, row.manaBase, row.capacidadeCargaBase].forEach((value, valueIndex) => {
      const keys = ['vidaBase', 'estaminaBase', 'manaBase', 'capacidadeCargaBase'];
      addNonNegative(errors, `racas.${index}.${keys[valueIndex]}`, value, keys[valueIndex]);
    });
  });
  addDuplicateErrors(errors, config.racas, 'racas', 'idRaca', 'Raça');
  return errors;
};

const validateProgression = (config: ConfiguracaoProgressaoSistema): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  addPositive(errors, 'nivelMaximo', config.nivelMaximo, 'Nível máximo');

  config.niveis.forEach((row, index) => {
    addPositive(errors, `niveis.${index}.nivel`, row.nivel, 'Nível');
    addNonNegative(errors, `niveis.${index}.xpParaProximoNivel`, row.xpParaProximoNivel, 'XP');
    addNonNegative(errors, `niveis.${index}.pontosNivel`, row.pontosNivel, 'Pontos gerais');
    addNonNegative(errors, `niveis.${index}.pontosAtributo`, row.pontosAtributo, 'Pontos de atributo');
    addNonNegative(errors, `niveis.${index}.pontosSkill`, row.pontosSkill, 'Pontos de skill');
    addNonNegative(errors, `niveis.${index}.pontosUltimate`, row.pontosUltimate, 'Pontos de ultimate');
    if (row.nivel > config.nivelMaximo) {
      errors[`niveis.${index}.nivel`] = 'O nível ultrapassa o máximo configurado.';
    }
  });
  addDuplicateErrors(errors, config.niveis, 'niveis', 'nivel', 'Nível');

  if (config.niveis.length > 0) {
    const levels = new Set(config.niveis.map((row) => row.nivel));
    for (let level = 1; level <= config.nivelMaximo; level += 1) {
      if (!levels.has(level)) errors.niveis = `A curva possui uma lacuna no nível ${level}.`;
    }
  }

  config.marcos.forEach((row, index) => {
    addPositive(errors, `marcos.${index}.nivel`, row.nivel, 'Nível');
    addCode(errors, `marcos.${index}.codigo`, row.codigo);
    addRequired(errors, `marcos.${index}.nome`, row.nome, 'Nome');
    addRequired(errors, `marcos.${index}.tipoRecompensa`, row.tipoRecompensa, 'Tipo da recompensa');
    if (row.nivel > config.nivelMaximo) errors[`marcos.${index}.nivel`] = 'Marco acima do nível máximo.';
  });
  addDuplicateErrors(errors, config.marcos, 'marcos', 'codigo', 'Código');

  config.fontesExperiencia.forEach((row, index) => {
    addCode(errors, `fontesExperiencia.${index}.codigo`, row.codigo);
    addRequired(errors, `fontesExperiencia.${index}.nome`, row.nome, 'Nome');
    if (
      row.valorMaximo !== null
      && row.valorMinimo !== null
      && row.valorMaximo < row.valorMinimo
    ) {
      errors[`fontesExperiencia.${index}.valorMaximo`] = 'O máximo deve alcançar o mínimo.';
    }
  });
  addDuplicateErrors(errors, config.fontesExperiencia, 'fontesExperiencia', 'codigo', 'Código');
  return errors;
};

const validateExploration = (config: ConfiguracaoExploracaoSistema): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  if (config.movimento) {
    addNonNegative(errors, 'movimento.metrosPorQuadrado', config.movimento.metrosPorQuadrado, 'Metros por quadrado');
    addNonNegative(errors, 'movimento.movimentoGratuito', config.movimento.movimentoGratuito, 'Movimento gratuito');
    addNonNegative(errors, 'movimento.custoEstaminaPorQuadrado', config.movimento.custoEstaminaPorQuadrado, 'Custo de estamina');
    addNonNegative(errors, 'movimento.maximoQuadradosTurno', config.movimento.maximoQuadradosTurno, 'Máximo por turno');
  }
  if (config.pontosAcao?.habilitado) {
    addNonNegative(errors, 'pontosAcao.pontosPorTurno', config.pontosAcao.pontosPorTurno, 'Pontos por turno');
    addNonNegative(errors, 'pontosAcao.segundosPorPonto', config.pontosAcao.segundosPorPonto, 'Segundos por ponto');
    addNonNegative(errors, 'pontosAcao.limiteAcumulado', config.pontosAcao.limiteAcumulado, 'Limite acumulado');
    if (
      config.pontosAcao.permiteAcumular
      && config.pontosAcao.limiteAcumulado < config.pontosAcao.pontosPorTurno
    ) {
      errors['pontosAcao.limiteAcumulado'] = 'O limite precisa alcançar os pontos recebidos por turno.';
    }
  }
  config.acoes.forEach((row, index) => {
    addCode(errors, `acoes.${index}.codigo`, row.codigo);
    addRequired(errors, `acoes.${index}.nome`, row.nome, 'Nome');
    addRequired(errors, `acoes.${index}.tipo`, row.tipo, 'Tipo');
    addNonNegative(errors, `acoes.${index}.custoPontosAcao`, row.custoPontosAcao, 'Custo de ação');
    addNonNegative(errors, `acoes.${index}.custoEstamina`, row.custoEstamina, 'Custo de estamina');
    addNonNegative(errors, `acoes.${index}.custoMana`, row.custoMana, 'Custo de mana');
  });
  addDuplicateErrors(errors, config.acoes, 'acoes', 'codigo', 'Código');
  return errors;
};

const getDiceMaximum = (dice: string): number | null => {
  const match = /^D(\d+)$/i.exec(dice.trim());
  return match ? Number(match[1]) : null;
};

const validateCombat = (config: ConfiguracaoCombateSistema): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  addPositive(errors, 'segundosPorTurno', config.segundosPorTurno, 'Duração do turno');

  config.resultadosDado.forEach((row, index) => {
    addCode(errors, `resultadosDado.${index}.codigoTeste`, row.codigoTeste, 'Código do teste');
    addRequired(errors, `resultadosDado.${index}.nomeTeste`, row.nomeTeste, 'Nome do teste');
    addRequired(errors, `resultadosDado.${index}.dado`, row.dado, 'Dado');
    addPositive(errors, `resultadosDado.${index}.quantidadeDados`, row.quantidadeDados, 'Quantidade de dados');
    addPositive(errors, `resultadosDado.${index}.resultadoMinimo`, row.resultadoMinimo, 'Resultado mínimo');
    addPositive(errors, `resultadosDado.${index}.resultadoMaximo`, row.resultadoMaximo, 'Resultado máximo');
    addCode(errors, `resultadosDado.${index}.codigoResultado`, row.codigoResultado, 'Código do resultado');
    addRequired(errors, `resultadosDado.${index}.nomeResultado`, row.nomeResultado, 'Nome do resultado');
    if (row.resultadoMaximo < row.resultadoMinimo) {
      errors[`resultadosDado.${index}.resultadoMaximo`] = 'O máximo deve alcançar o mínimo.';
    }
    const diceMaximum = getDiceMaximum(row.dado);
    if (!diceMaximum) errors[`resultadosDado.${index}.dado`] = 'Use um dado como D6, D8 ou D20.';
    else if (row.resultadoMaximo > diceMaximum * row.quantidadeDados) {
      errors[`resultadosDado.${index}.resultadoMaximo`] = `O resultado ultrapassa ${row.quantidadeDados}${row.dado.toUpperCase()}.`;
    } else if (row.resultadoMinimo < row.quantidadeDados) {
      errors[`resultadosDado.${index}.resultadoMinimo`] = `O mínimo possível com ${row.quantidadeDados} dado(s) é ${row.quantidadeDados}.`;
    }
  });

  const rangesByTest = new Map<string, Array<{ index: number; minimum: number; maximum: number }>>();
  config.resultadosDado.forEach((row, index) => {
    const key = `${row.codigoTeste.trim().toLowerCase()}|${row.dado.trim().toLowerCase()}|${row.quantidadeDados}`;
    rangesByTest.set(key, [
      ...(rangesByTest.get(key) ?? []),
      { index, minimum: row.resultadoMinimo, maximum: row.resultadoMaximo },
    ]);
  });
  rangesByTest.forEach((ranges) => {
    const sorted = [...ranges].sort((left, right) => left.minimum - right.minimum);
    sorted.forEach((range, index) => {
      const previous = sorted[index - 1];
      if (previous && range.minimum <= previous.maximum) {
        errors[`resultadosDado.${range.index}.resultadoMinimo`] = 'Este intervalo se sobrepõe ao anterior.';
      }
      if (previous && range.minimum > previous.maximum + 1) {
        errors.resultadosDado = `Existe uma lacuna antes do resultado ${range.minimum}.`;
      }
    });
    const firstRange = sorted[0];
    const source = config.resultadosDado[firstRange?.index];
    const faces = source ? getDiceMaximum(source.dado) : null;
    if (source && firstRange && firstRange.minimum !== source.quantidadeDados) {
      errors.resultadosDado = `As faixas de ${source.nomeTeste || source.codigoTeste} devem começar em ${source.quantidadeDados}.`;
    } else if (source && faces && sorted[sorted.length - 1]?.maximum !== faces * source.quantidadeDados) {
      errors.resultadosDado = `As faixas de ${source.nomeTeste || source.codigoTeste} devem cobrir até ${faces * source.quantidadeDados}.`;
    }
  });

  config.tiposDano.forEach((row, index) => {
    addCode(errors, `tiposDano.${index}.codigo`, row.codigo);
    addRequired(errors, `tiposDano.${index}.nome`, row.nome, 'Nome');
  });
  addDuplicateErrors(errors, config.tiposDano, 'tiposDano', 'codigo', 'Código');

  config.tiposDefesa.forEach((row, index) => {
    addCode(errors, `tiposDefesa.${index}.codigo`, row.codigo);
    addRequired(errors, `tiposDefesa.${index}.nome`, row.nome, 'Nome');
    addRequired(errors, `tiposDefesa.${index}.tipoComportamento`, row.tipoComportamento, 'Comportamento');
    addNonNegative(errors, `tiposDefesa.${index}.ordemAplicacao`, row.ordemAplicacao, 'Ordem de aplicação');
  });
  addDuplicateErrors(errors, config.tiposDefesa, 'tiposDefesa', 'codigo', 'Código');
  return errors;
};

const validatePowers = (config: ConfiguracaoPoderesSistema): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  addNonNegative(errors, 'limiteMagias', config.limiteMagias, 'Limite de magias');
  config.tiposMagia.forEach((row, index) => {
    addCode(errors, `tiposMagia.${index}.codigo`, row.codigo);
    addRequired(errors, `tiposMagia.${index}.nome`, row.nome, 'Nome');
    addNonNegative(errors, `tiposMagia.${index}.custoBase`, row.custoBase, 'Custo base');
  });
  addDuplicateErrors(errors, config.tiposMagia, 'tiposMagia', 'codigo', 'Código');
  if (config.skillConfig) {
    addNonNegative(errors, 'skillConfig.maximoSkills', config.skillConfig.maximoSkills, 'Máximo de skills');
    addNonNegative(errors, 'skillConfig.nivelMaximoSkill', config.skillConfig.nivelMaximoSkill, 'Nível máximo da skill');
    addNonNegative(errors, 'skillConfig.maximoUltimates', config.skillConfig.maximoUltimates, 'Máximo de ultimates');
    addNonNegative(errors, 'skillConfig.nivelDesbloqueioUltimate', config.skillConfig.nivelDesbloqueioUltimate, 'Nível de ultimate');
    addNonNegative(errors, 'skillConfig.maximoMagias', config.skillConfig.maximoMagias, 'Máximo de magias');
  }
  return errors;
};

const validateSurvival = (config: ConfiguracaoSobrevivenciaSistema): SistemaValidationErrors => {
  const errors: SistemaValidationErrors = {};
  config.condicoes.forEach((row, index) => {
    addCode(errors, `condicoes.${index}.codigo`, row.codigo);
    addRequired(errors, `condicoes.${index}.nome`, row.nome, 'Nome');
    addRequired(errors, `condicoes.${index}.tipo`, row.tipo, 'Tipo');
    addRequired(errors, `condicoes.${index}.unidadeDuracao`, row.unidadeDuracao, 'Unidade');
    addNonNegative(errors, `condicoes.${index}.duracaoPadrao`, row.duracaoPadrao, 'Duração');
  });
  addDuplicateErrors(errors, config.condicoes, 'condicoes', 'codigo', 'Código');

  config.descansos.forEach((row, index) => {
    addRequired(errors, `descansos.${index}.tipo`, row.tipo, 'Tipo');
    addRequired(errors, `descansos.${index}.nome`, row.nome, 'Nome');
    addNonNegative(errors, `descansos.${index}.duracaoMinimaMinutos`, row.duracaoMinimaMinutos, 'Duração mínima');
    addNonNegative(errors, `descansos.${index}.duracaoMaximaMinutos`, row.duracaoMaximaMinutos, 'Duração máxima');
    addNonNegative(errors, `descansos.${index}.recuperacaoVida`, row.recuperacaoVida, 'Recuperação de vida');
    addNonNegative(errors, `descansos.${index}.recuperacaoMana`, row.recuperacaoMana, 'Recuperação de mana');
    addNonNegative(errors, `descansos.${index}.recuperacaoEstamina`, row.recuperacaoEstamina, 'Recuperação de estamina');
    if (
      row.duracaoMaximaMinutos !== null
      && row.duracaoMinimaMinutos !== null
      && row.duracaoMaximaMinutos < row.duracaoMinimaMinutos
    ) {
      errors[`descansos.${index}.duracaoMaximaMinutos`] = 'A duração máxima deve alcançar a mínima.';
    }
  });

  if (config.morte) {
    addPositive(errors, 'morte.quantidadeTestesCombate', config.morte.quantidadeTestesCombate, 'Testes em combate');
    addPositive(errors, 'morte.quantidadeTestesForaCombate', config.morte.quantidadeTestesForaCombate, 'Testes fora de combate');
    addPositive(errors, 'morte.sucessosNecessarios', config.morte.sucessosNecessarios, 'Sucessos necessários');
    addRequired(errors, 'morte.dadoSobrevivencia', config.morte.dadoSobrevivencia, 'Dado de sobrevivência');
    const diceMaximum = getDiceMaximum(config.morte.dadoSobrevivencia);
    if (!diceMaximum) errors['morte.dadoSobrevivencia'] = 'Use um dado como D6, D8 ou D20.';
    else if (config.morte.resultadoMinimoSucesso < 1 || config.morte.resultadoMinimoSucesso > diceMaximum) {
      errors['morte.resultadoMinimoSucesso'] = 'O resultado mínimo ultrapassa o dado escolhido.';
    }
    addNonNegative(errors, 'morte.multiplicadorDanoDesmembramento', config.morte.multiplicadorDanoDesmembramento, 'Multiplicador de desmembramento');
    addNonNegative(errors, 'morte.multiplicadorDanoInstaKill', config.morte.multiplicadorDanoInstaKill, 'Multiplicador de insta kill');
  }
  return errors;
};

export const validateSistemaModule = <K extends SistemaModuloKey>(
  moduleKey: K,
  config: SistemaModuloConfigMap[K],
): SistemaValidationErrors => {
  switch (moduleKey) {
    case 'geral':
      return validateGeneral(config as ConfiguracaoGeralSistema);
    case 'criacao':
      return validateCreation(config as ConfiguracaoCriacaoSistema);
    case 'progressao':
      return validateProgression(config as ConfiguracaoProgressaoSistema);
    case 'exploracao':
      return validateExploration(config as ConfiguracaoExploracaoSistema);
    case 'combate':
      return validateCombat(config as ConfiguracaoCombateSistema);
    case 'poderes':
      return validatePowers(config as ConfiguracaoPoderesSistema);
    case 'sobrevivencia':
      return validateSurvival(config as ConfiguracaoSobrevivenciaSistema);
  }

  return {};
};
