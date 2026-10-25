import { describeSystemOptions } from '../../../../../content/systemOptionHelp';
import type { SystemReferenceCatalog, SystemReferenceOption } from './ModuleForm.types';

export interface EditableConditionEffect {
  operacao: string;
  recurso: string;
  valor: number | null;
  momento: string;
}

export const conditionOperationOptions = describeSystemOptions('conditionOperation', [
  { value: 'SUBTRAIR', label: 'Diminuir recurso' },
  { value: 'SOMAR', label: 'Recuperar recurso' },
  { value: 'DEFINIR', label: 'Definir valor do recurso' },
  { value: 'MODIFICAR_ATRIBUTO', label: 'Alterar valor do atributo (− ou +)' },
  { value: 'MODIFICAR_ROLAGEM', label: 'Alterar resultado do teste (− ou +)' },
  { value: 'REDUZIR_LIMITE_PERCENTUAL', label: 'Reduzir máximo (%) enquanto ativa' },
  { value: 'MODIFICAR_LIMITE_PERCENTUAL', label: 'Alterar máximo do recurso em % (− ou +)' },
  { value: 'BLOQUEAR_RECUPERACAO', label: 'Bloquear recuperação enquanto ativa' },
  { value: 'MODIFICAR_DANO', label: 'Alterar dano causado (− ou +)' },
  { value: 'MODIFICAR_DEFESA', label: 'Alterar armadura fixa (− ou +)' },
  { value: 'DESVANTAGEM', label: 'Impor desvantagem no teste' },
  { value: 'VANTAGEM', label: 'Conceder vantagem no teste' },
  { value: 'PERDER_TURNOS', label: 'Fazer perder turnos ao aplicar' },
]);

export const conditionMomentOptions = describeSystemOptions('conditionMoment', [
  { value: 'AO_APLICAR', label: 'Uma vez, quando ativar' },
  { value: 'INICIO_TURNO', label: 'No início de cada turno' },
  { value: 'FIM_TURNO', label: 'No fim de cada turno' },
  { value: 'ENQUANTO_ATIVA', label: 'Enquanto estiver ativa' },
]);

const continuousOperations = new Set(['MODIFICAR_ATRIBUTO', 'MODIFICAR_ROLAGEM', 'MODIFICAR_DANO',
  'MODIFICAR_DEFESA', 'MODIFICAR_LIMITE_PERCENTUAL', 'REDUZIR_LIMITE_PERCENTUAL',
  'BLOQUEAR_RECUPERACAO', 'DESVANTAGEM', 'VANTAGEM']);

export const conditionRequiredMoment = (operation: string) => continuousOperations.has(operation)
  ? 'ENQUANTO_ATIVA' : operation === 'PERDER_TURNOS' ? 'AO_APLICAR' : undefined;

export const conditionEffectHasValue = (operation: string) =>
  !['DESVANTAGEM', 'VANTAGEM', 'BLOQUEAR_RECUPERACAO'].includes(operation);

export const conditionEffectValueLimits = (operation: string) => {
  if (operation === 'PERDER_TURNOS') return { min: 1, max: 100 };
  if (operation === 'REDUZIR_LIMITE_PERCENTUAL') return { min: 0, max: 100 };
  if (operation === 'MODIFICAR_LIMITE_PERCENTUAL') return { min: -100, max: 1000 };
  return { min: operation.startsWith('MODIFICAR_') ? -1000000 : 0, max: 1000000 };
};

export const conditionEffectTargets = (operation: string, references?: SystemReferenceCatalog): SystemReferenceOption[] => {
  if (operation === 'MODIFICAR_ATRIBUTO') return references?.attributes ?? [];
  if (operation === 'MODIFICAR_ROLAGEM') return [...(references?.attributes ?? []),
    ...describeSystemOptions('conditionEffectTarget', [{ value: 'TODOS', label: 'Todos os testes' }])];
  if (operation === 'MODIFICAR_DANO') return describeSystemOptions('conditionEffectTarget', [{ value: 'TODOS', label: 'Todo dano causado' }]);
  if (operation === 'MODIFICAR_DEFESA') return describeSystemOptions('conditionEffectTarget', [{ value: 'ARMADURA', label: 'Armadura fixa' }]);
  if (operation === 'DESVANTAGEM' || operation === 'VANTAGEM') return describeSystemOptions('conditionEffectTarget', [{ value: 'TESTE', label: 'Teste' }]);
  if (operation === 'PERDER_TURNOS') return describeSystemOptions('conditionEffectTarget', [{ value: 'TURNO', label: 'Turno' }]);
  return references?.resources ?? [];
};

export const configureConditionOperation = (operation: string, previous: EditableConditionEffect,
  references?: SystemReferenceCatalog): EditableConditionEffect => {
  if (!operation) return { operacao: '', recurso: '', valor: null, momento: '' };
  const targets = conditionEffectTargets(operation, references);
  const limits = conditionEffectValueLimits(operation);
  return {
    operacao: operation,
    recurso: targets.some((target) => target.value === previous.recurso) ? previous.recurso : targets[0]?.value ?? '',
    valor: conditionEffectHasValue(operation)
      ? Math.min(limits.max, Math.max(limits.min, previous.valor ?? 1)) : 0,
    momento: conditionRequiredMoment(operation) ??
      (previous.momento && previous.momento !== 'ENQUANTO_ATIVA' ? previous.momento : 'AO_APLICAR'),
  };
};
