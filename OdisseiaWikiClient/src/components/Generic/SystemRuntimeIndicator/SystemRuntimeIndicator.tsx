import { BiErrorCircle, BiInfoCircle } from 'react-icons/bi';
import { SistemaRuntimeContexto, SistemaRuntimeOrigem } from '../../../models/SistemaRpg';
import {
  RuntimeIdentity,
  RuntimeIndicator,
  RuntimeMeta,
  RuntimeName,
  RuntimeActions,
  RuntimeMessageList,
  RuntimeMessagePanel,
  RuntimeUpdateButton,
  RuntimeWarning,
  RuntimeWarningGroup,
} from './SystemRuntimeIndicator.style';

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
  const warningMessages = contexto?.warnings?.map((warning) => warning.mensagem).filter(Boolean) ?? [];
  const fallbackMessages = contexto?.fallbacks?.map((fallback) => fallback.motivo).filter(Boolean) ?? [];
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
          <RuntimeName>Resolvendo Sistema...</RuntimeName>
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

  return (
    <RuntimeIndicator $hasWarnings={hasWarnings} aria-live="polite">
      <RuntimeIdentity>
        <RuntimeName>{systemName}</RuntimeName>
        <RuntimeMeta>v{version} · {origin}</RuntimeMeta>
      </RuntimeIdentity>
      <RuntimeActions>
        {isOutdated ? (
          <RuntimeWarningGroup>
            <RuntimeWarning type="button" aria-label="Exibir detalhes do Sistema" $outdated>
              <BiErrorCircle />
              Sistema desatualizado
            </RuntimeWarning>
            {displayedMessages.length > 0 && (
              <RuntimeMessagePanel role="tooltip">
                <RuntimeMessageList>
                  {displayedMessages.map((message) => <li key={message}>{message}</li>)}
                </RuntimeMessageList>
              </RuntimeMessagePanel>
            )}
          </RuntimeWarningGroup>
        ) : hasWarnings && (
          <RuntimeWarningGroup>
            <RuntimeWarning type="button" aria-label="Exibir avisos do Sistema">
              <BiInfoCircle />
              {hasCompatibilityData
                ? `Dados de compatibilidade${messages.length > 1 ? ` (${messages.length})` : ''}`
                : `${messages.length || 1} ${messages.length === 1 ? 'aviso' : 'avisos'}`}
            </RuntimeWarning>
            {displayedMessages.length > 0 && (
              <RuntimeMessagePanel role="tooltip">
                <RuntimeMessageList>
                  {displayedMessages.map((message) => <li key={message}>{message}</li>)}
                </RuntimeMessageList>
              </RuntimeMessagePanel>
            )}
          </RuntimeWarningGroup>
        )}
        {contexto?.atualizacaoDisponivel && onUpdate && (
          <RuntimeUpdateButton type="button" onClick={onUpdate} disabled={updating}>
            {updating
              ? 'Atualizando...'
              : `Atualizar para v${contexto.numeroVersaoDisponivel ?? ''}`}
          </RuntimeUpdateButton>
        )}
      </RuntimeActions>
    </RuntimeIndicator>
  );
};
