import { useId, useState } from 'react';
import { BiErrorCircle, BiInfoCircle } from 'react-icons/bi';
import { LoadingIndicator } from '../LoadingIndicator';
import { SistemaRuntimeContexto, SistemaRuntimeOrigem } from '../../../models/SistemaRpg';
import {
  RuntimeIdentity,
  RuntimeIndicator,
  RuntimeMeta,
  RuntimeName,
  RuntimeActions,
  RuntimeActionControls,
  RuntimeMessageList,
  RuntimeMessagePanel,
  RuntimeUpdateButton,
  RuntimeWarning,
} from './SystemRuntimeIndicator.style';
import { getRuntimeFallbackMessage, getRuntimeWarningMessage } from './SystemRuntimeIndicator.utils';

interface SystemRuntimeIndicatorProps {
  contexto?: SistemaRuntimeContexto | null;
  loading?: boolean;
  error?: string | null;
  onUpdate?: () => void;
  updating?: boolean;
}

const ORIGIN_LABELS: Record<SistemaRuntimeOrigem, string> = {
  Mesa: 'herdado da Mesa',
  VersaoFixadaPersonagemJogador: 'versão fixada na ficha',
  VersaoFixadaEntidade: 'versão fixada na entidade',
  PublicacaoAtualEntidade: 'publicação atual da entidade',
  SistemaPadrao: 'Sistema padrão',
  FallbackLegado: 'compatibilidade legada',
};

export const SystemRuntimeIndicator = ({
  contexto,
  loading = false,
  error,
  onUpdate,
  updating = false,
}: SystemRuntimeIndicatorProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const detailsId = useId();
  const warningMessages = contexto?.warnings?.map(getRuntimeWarningMessage).filter(Boolean) ?? [];
  const fallbackMessages = contexto?.fallbacks?.map(getRuntimeFallbackMessage).filter(Boolean) ?? [];
  const messages = Array.from(new Map(
    [...warningMessages, ...fallbackMessages, ...(error ? [error] : [])]
      .map((message) => message.trim())
      .filter(Boolean)
      .map((message) => [message.toLocaleLowerCase('pt-BR'), message]),
  ).values());
  const hasResolvedVersion = Boolean(contexto?.idSistemaVersao)
    && contexto?.numeroVersao !== 'LEGACY';
  const isOutdated = !contexto
    || Boolean(error)
    || !hasResolvedVersion;
  const outdatedReason = error
    ?? (!contexto
      ? 'Não foi possível identificar o Sistema e a versão usados por este conteúdo.'
      : !hasResolvedVersion
        ? 'Não foi possível resolver uma versão válida do Sistema para este conteúdo.'
        : undefined);
  const hasWarnings = messages.length > 0 || isOutdated;
  const hasCompatibilityData = !isOutdated
    && (contexto?.usaFallbackLegado === true || fallbackMessages.length > 0);

  if (loading) {
    return (
      <RuntimeIndicator $hasWarnings={false} aria-live="polite">
        <RuntimeIdentity>
          <RuntimeName><LoadingIndicator compact label="Resolvendo Sistema" /></RuntimeName>
          <RuntimeMeta>Carregando regras da Mesa</RuntimeMeta>
        </RuntimeIdentity>
      </RuntimeIndicator>
    );
  }

  const systemName = contexto?.nomeSistema?.trim() || contexto?.codigoSistema || 'Regras legadas';
  const version = contexto?.numeroVersao || 'LEGACY';
  const origin = contexto ? ORIGIN_LABELS[contexto.origem] : 'fallback local';
  const displayedMessages = messages.length > 0
    ? messages
    : outdatedReason
      ? [outdatedReason]
      : [];
  const hasDetails = displayedMessages.length > 0;
  const warningLabel = isOutdated
    ? 'Sistema desatualizado'
    : hasCompatibilityData
      ? `Dados de compatibilidade${messages.length > 1 ? ` (${messages.length})` : ''}`
      : `${messages.length || 1} ${messages.length === 1 ? 'aviso' : 'avisos'}`;

  return (
    <RuntimeIndicator $hasWarnings={hasWarnings} aria-live="polite">
      <RuntimeIdentity>
        <RuntimeName>{systemName}</RuntimeName>
        <RuntimeMeta>v{version} · {origin}</RuntimeMeta>
      </RuntimeIdentity>
      <RuntimeActions>
        <RuntimeActionControls>
          {(isOutdated || hasWarnings) && (
            <RuntimeWarning
              type="button"
              aria-expanded={isDetailsOpen}
              aria-controls={hasDetails ? detailsId : undefined}
              aria-label={isDetailsOpen ? 'Ocultar avisos do Sistema' : 'Exibir avisos do Sistema'}
              $outdated={isOutdated}
              onClick={() => hasDetails && setIsDetailsOpen((current) => !current)}
              disabled={!hasDetails}
            >
              {isOutdated ? <BiErrorCircle /> : <BiInfoCircle />}
              {warningLabel}
            </RuntimeWarning>
          )}
          {contexto?.atualizacaoDisponivel && onUpdate && (
            <RuntimeUpdateButton type="button" onClick={onUpdate} disabled={updating}>
              {updating
                ? 'Atualizando...'
                : `Atualizar para v${contexto.numeroVersaoDisponivel ?? ''}`}
            </RuntimeUpdateButton>
          )}
        </RuntimeActionControls>
        {isDetailsOpen && hasDetails && (
          <RuntimeMessagePanel id={detailsId} aria-label="Avisos do Sistema">
            <RuntimeMessageList>
              {displayedMessages.map((message) => <li key={message}>{message}</li>)}
            </RuntimeMessageList>
          </RuntimeMessagePanel>
        )}
      </RuntimeActions>
    </RuntimeIndicator>
  );
};
