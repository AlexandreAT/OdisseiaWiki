import type { SistemaRuntimeFallback, SistemaRuntimeWarning } from '../../../models/SistemaRpg';

const EXPECTED_CHARACTER_RESOURCE_DIFFERENCES = new Set(
  ['statusJson.status', 'entidade.statusJson.status'].flatMap((prefix) =>
    ['vida', 'vidaMaxima', 'mana', 'manaMaxima', 'estamina', 'estaminaMaxima']
      .map((field) => `${prefix}.${field}`)),
);

export const isDisplayableRuntimeWarning = (warning: SistemaRuntimeWarning) =>
  warning.codigo !== 'ValorForaReferencia'
  || !EXPECTED_CHARACTER_RESOURCE_DIFFERENCES.has(warning.caminho ?? '');

const RESOURCE_LABELS: Record<string, string> = {
  vidaMaxima: 'Vida máxima',
  estaminaMaxima: 'Estamina máxima',
  manaMaxima: 'Mana máxima',
  capacidadeCarga: 'Capacidade de carga',
};

const getValueReferenceMessage = (warning: SistemaRuntimeWarning) => {
  const path = warning.caminho ?? '';
  const resourceKey = Object.keys(RESOURCE_LABELS).find((key) => path.endsWith(key));

  if (resourceKey) {
    const label = RESOURCE_LABELS[resourceKey];
    const reference = warning.valorMaximoReferencia;

    if (reference !== null && reference !== undefined && warning.valorInformado !== null && warning.valorInformado !== undefined) {
      return warning.valorInformado > reference
        ? `${label} acima da referência racial.`
        : `${label} abaixo da referência racial.`;
    }

    return `${label} diferente da referência racial.`;
  }

  if (path.endsWith('nivel')) return 'Nível acima do máximo do Sistema.';
  if (path.endsWith('skills')) return 'Skills acima do limite do Sistema.';
  if (path.endsWith('magias')) return 'Magias acima do limite do Sistema.';

  const reference = warning.referencia?.trim();
  if (reference) return `${reference} fora da referência do Sistema.`;

  return 'Valor fora da referência do Sistema.';
};

const getFallbackMessage = (path?: string | null) => {
  switch (path) {
    case 'personagemJogador.idSistemaVersao':
      return 'Usando a versão atual da Mesa.';
    case 'configuracaoRacial':
      return 'Usando dados compatíveis da raça.';
    case 'sistema':
      return 'Nenhuma versão publicada disponível.';
    default:
      return 'Dados legados em modo de compatibilidade.';
  }
};

export const getRuntimeWarningMessage = (warning: SistemaRuntimeWarning) => {
  switch (warning.codigo) {
    case 'MesaNaoEncontrada':
      return 'Mesa não encontrada. Usando o Sistema padrão.';
    case 'VersaoRascunhoIgnorada':
      return 'A versão em rascunho foi ignorada.';
    case 'EntidadeNaoEncontrada':
      return 'Conteúdo não encontrado no Sistema.';
    case 'VinculoInconsistente':
      return 'O vínculo com o Sistema precisa ser revisado.';
    case 'SistemaNaoEncontrado':
      return 'Sistema vinculado não encontrado.';
    case 'PublicacaoAtualIndisponivel':
      return 'A versão publicada não está disponível.';
    case 'ConfiguracaoRacialAusente':
      return 'Esta raça não está configurada nesta versão.';
    case 'OverrideMesaInvalido':
      return 'A configuração da raça nesta Mesa foi ignorada.';
    case 'CatalogoItemAusente':
      return 'O catálogo de itens não está disponível nesta versão.';
    case 'EscopoItemNaoEncontrado':
      return 'A categoria deste item não existe nesta versão.';
    case 'ValorForaReferencia':
      return getValueReferenceMessage(warning);
    case 'FallbackLegadoUtilizado':
      return getFallbackMessage(warning.caminho);
    default:
      return warning.mensagem;
  }
};

export const getRuntimeFallbackMessage = (fallback: SistemaRuntimeFallback) =>
  getFallbackMessage(fallback.caminho);
