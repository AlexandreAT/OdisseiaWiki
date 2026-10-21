import type { SistemaCondicao } from '../models/SistemaRpg';

export interface EditableConditionEffect {
  index: number;
  label: string;
  value: number;
  signed: boolean;
  percentage: boolean;
  minimum?: number;
  maximum?: number;
}

interface RawEffect { operacao?: string; recurso?: string; valor?: number }

/** Uses the same ordering as SistemaCondicaoEfeitos.Read on the server. */
export function editableConditionEffects(rule?: SistemaCondicao): EditableConditionEffect[] {
  if (!rule) return [];
  const effects: RawEffect[] = [];
  if (rule.operacaoEfeito && rule.codigoRecurso) effects.push({
    operacao: rule.operacaoEfeito, recurso: rule.codigoRecurso,
    valor: rule.valorPadrao ?? rule.valorEfeito ?? 0,
  });
  try {
    const configuration = JSON.parse(rule.configuracaoPadraoJson || '{}') as { efeitos?: RawEffect[] };
    if (Array.isArray(configuration.efeitos)) effects.push(...configuration.efeitos);
  } catch { /* Invalid old draft: the server will reject execution. */ }
  return effects.flatMap((effect, index) => {
    const operation = effect.operacao?.toUpperCase() ?? '';
    if (['VANTAGEM', 'DESVANTAGEM', 'BLOQUEAR_RECUPERACAO'].includes(operation)) return [];
    const signed = ['MODIFICAR_ROLAGEM', 'MODIFICAR_ATRIBUTO', 'MODIFICAR_DANO',
      'MODIFICAR_DEFESA', 'MODIFICAR_LIMITE_PERCENTUAL'].includes(operation);
    return [{ index, label: `${effect.recurso || 'Efeito'} · ${operation.replace(/_/g, ' ').toLowerCase()}`,
      value: Number(effect.valor) || 0, signed,
      minimum: operation === 'PERDER_TURNOS' ? 1 : undefined,
      maximum: operation === 'PERDER_TURNOS' ? 100 : undefined,
      percentage: ['REDUZIR_LIMITE_PERCENTUAL', 'MODIFICAR_LIMITE_PERCENTUAL'].includes(operation) }];
  });
}
